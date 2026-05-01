import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import compression from "compression";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import multer from "multer";
import PDFDocument from "pdfkit";
import { z } from "zod";
import { authenticate, permissionsForRoles, requirePermission, signToken, type AuthRequest } from "./auth";
import { audit } from "./audit";
import { prisma } from "./prisma";
import { pagination, toCsv } from "./query";
import { requirementWizardSchema, validateReminderLimit, vendorSupplyMappingSchema } from "./validation";

const app = express();
const port = Number(process.env.PORT || 4000);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const upload = multer({
  dest: process.env.UPLOAD_DIR || "uploads",
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "image/png", "image/jpeg", "text/csv"];
    cb(null, allowed.includes(file.mimetype));
  }
});

app.use(helmet());
app.use(compression());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
  limit: Number(process.env.RATE_LIMIT_MAX || 240)
}));

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const vendorSchema = z.object({
  company: z.string().min(2),
  vendorName: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email(),
  vendorCodes: z.string().min(2),
  status: z.string().default("Unapproved"),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  category: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional()
});

const requirementSchema = z.object({
  title: z.string().min(3),
  rfqType: z.string().default("RFQ"),
  status: z.string().default("Saved As Draft"),
  projectName: z.string().optional(),
  clientName: z.string().optional(),
  prNumber: z.string().optional(),
  qcsCode: z.string().optional(),
  postedOn: z.coerce.date().optional(),
  freezeTime: z.coerce.date().optional(),
  negotiationTime: z.coerce.date().optional()
});

const prSchema = z.object({
  title: z.string().min(3),
  department: z.string().min(2),
  budget: z.coerce.number().positive(),
  item: z.string().min(2),
  quantity: z.coerce.number().int().positive(),
  urgency: z.string(),
  requiredDate: z.coerce.date(),
  approvalStatus: z.string().default("Draft")
});

const rfqSchema = z.object({
  title: z.string().min(3),
  prId: z.string().optional(),
  requirementId: z.string().optional(),
  quotationDeadline: z.coerce.date(),
  freezeTime: z.coerce.date(),
  negotiationTime: z.coerce.date().optional(),
  lineItems: z.array(z.object({
    materialCode: z.string().regex(/^\d{10}$/).optional(),
    itemCode: z.string(),
    description: z.string(),
    quantity: z.coerce.number().int().positive(),
    uom: z.string(),
    targetPrice: z.coerce.number().optional()
  })).default([])
});

const poSchema = z.object({
  vendorId: z.string(),
  title: z.string().min(3),
  totalAmount: z.coerce.number().positive(),
  prNumber: z.string().optional(),
  status: z.string().default("Draft"),
  approvalStatus: z.string().default("Pending"),
  deliveryDate: z.coerce.date().optional()
});

const connectorSchema = z.object({
  connectorName: z.string().min(2),
  industry: z.literal("CDMO / Pharma").default("CDMO / Pharma"),
  baseUrl: z.string().min(1).default("local://mock-api"),
  endpointPath: z.string().min(1),
  method: z.enum(["GET", "POST"]).default("GET"),
  authType: z.enum(["None", "API Key", "Bearer Token", "Basic Auth"]).default("None"),
  headersJson: z.string().default("{}"),
  queryParamsJson: z.string().default("{}"),
  fieldMappingJson: z.string().default("{}"),
  refreshFrequency: z.string().default("Manual"),
  activeStatus: z.string().default("Active")
});

const departments = ["RM", "Strategic Sourcing", "Finance", "QA", "Legal", "Operations", "Warehouse", "R&D", "IT"];

function route(handler: (req: AuthRequest, res: express.Response) => Promise<unknown>) {
  return async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
    try {
      await handler(req, res);
    } catch (error) {
      next(error);
    }
  };
}

function nextNumber(prefix: string, base: number) {
  return `${prefix}${String(base).padStart(5, "0")}`;
}

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function jsonText(value: unknown) {
  return JSON.stringify(value ?? {});
}

function reportRows(report: string, data: Array<Record<string, unknown>>) {
  return data.map((row) => ({ report, ...row }));
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sendPdf(res: express.Response, title: string, rows: Array<Record<string, unknown>>) {
  const doc = new PDFDocument({ margin: 36, size: "A4" });
  res.header("Content-Type", "application/pdf");
  res.attachment(`${title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
  doc.pipe(res);
  doc.fontSize(16).text(title, { underline: true });
  doc.moveDown();
  rows.slice(0, 32).forEach((row) => {
    doc.fontSize(8).text(Object.entries(row).map(([key, value]) => `${key}: ${value ?? ""}`).join(" | ").slice(0, 150));
    doc.moveDown(0.4);
  });
  doc.end();
}

function sendExcelCompatible(res: express.Response, name: string, rows: Array<Record<string, unknown>>) {
  const headers = Object.keys(rows[0] || { report: "" });
  const table = [
    "<table>",
    `<thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>`,
    `<tbody>${rows.map((row) => `<tr>${headers.map((header) => `<td>${escapeHtml(row[header])}</td>`).join("")}</tr>`).join("")}</tbody>`,
    "</table>"
  ].join("");
  res.header("Content-Type", "application/vnd.ms-excel; charset=utf-8");
  res.attachment(`${name}.xls`);
  res.send(`<!doctype html><html><head><meta charset="utf-8"></head><body>${table}</body></html>`);
}

async function buildReportRows(report: string): Promise<Array<Record<string, unknown>>> {
  switch (report) {
    case "vendor-performance":
      return (await prisma.vendor.findMany({ take: 100, include: { categories: true } })).map((vendor) => ({
        company: vendor.company,
        status: vendor.status,
        category: vendor.category,
        rating: vendor.categories[0]?.rating || 0,
        responseRate: vendor.categories[0]?.responseRate || 0,
        qualityScore: vendor.categories[0]?.qualityScore || 0
      }));
    case "po-status":
      return (await prisma.pO.findMany({ take: 100, include: { vendor: true } })).map((po) => ({
        poNumber: po.poNumber,
        vendor: po.vendor.company,
        status: po.status,
        approvalStatus: po.approvalStatus,
        totalAmount: po.totalAmount
      }));
    case "contract-utilization":
      return (await prisma.contract.findMany({ take: 100, include: { vendor: true } })).map((contract) => ({
        contractNo: contract.contractNo,
        vendor: contract.vendor.company,
        value: contract.value,
        utilizedValue: contract.utilizedValue,
        balanceValue: contract.balanceValue,
        status: contract.status
      }));
    case "payment-pending":
      return (await prisma.payment.findMany({ where: { status: { not: "Paid" } }, take: 100, include: { po: true } })).map((payment) => ({
        paymentNumber: payment.paymentNumber,
        poNumber: payment.po.poNumber,
        status: payment.status,
        dueDate: payment.dueDate,
        pendingAmount: payment.pendingAmount
      }));
    case "three-way-exceptions":
      return (await prisma.threeWayMatch.findMany({ where: { status: { not: "Matched" } }, take: 100, include: { po: true } })).map((match) => ({
        poNumber: match.po.poNumber,
        status: match.status,
        exception: match.exception
      }));
    case "department-spend":
      return (await prisma.pO.groupBy({ by: ["department"], _sum: { totalAmount: true }, _count: true })).map((entry) => ({
        department: entry.department || "General",
        totalSpend: entry._sum.totalAmount || 0,
        poCount: entry._count
      }));
    default:
      return (await prisma.requirement.findMany({ take: 100, include: { postedBy: true } })).map((requirement) => ({
        rfqNumber: requirement.rfqNumber,
        type: requirement.rfqType,
        title: requirement.title,
        department: requirement.department,
        status: requirement.status,
        postedBy: `${requirement.postedBy.firstName} ${requirement.postedBy.lastName}`,
        postedOn: requirement.postedOn
      }));
  }
}

function routeParam(req: AuthRequest, key: string) {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] : value;
}

function recommendationScore(row: {
  preferredRank: number;
  supplyPrice: number;
  lastPurchasePrice: number;
  vendor: {
    vendorRating: number | null;
    onTimeDeliveryRate: number | null;
    qualityScore: number | null;
    complianceStatus: string | null;
    preferredVendorFlag: boolean;
  };
}) {
  const priceCompetitiveness = row.lastPurchasePrice > 0 ? Math.max(0, Math.min(100, 100 - ((row.supplyPrice - row.lastPurchasePrice) / row.lastPurchasePrice) * 100)) : 75;
  return Math.round(
    20 +
    20 +
    ((row.vendor.vendorRating || 3.5) / 5) * 20 +
    ((row.vendor.onTimeDeliveryRate || 70) / 100) * 15 +
    ((row.vendor.qualityScore || 70) / 100) * 15 +
    (priceCompetitiveness / 100) * 10 +
    (row.vendor.preferredVendorFlag ? 5 : 0) -
    (row.vendor.complianceStatus === "Non-Compliant" ? 20 : 0) -
    Math.max(0, row.preferredRank - 1) * 2
  );
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/auth/login", route(async (req, res) => {
  const input = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { roles: { include: { role: true } } }
  });
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const sessionUser = {
    id: user.id,
    email: user.email,
    roles: user.roles.map((entry) => entry.role.name)
  };
  await audit(req, "LOGIN", "User", user.id);
  res.json({
    token: signToken(sessionUser),
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      mobilePhone: user.mobilePhone,
      companyName: user.companyName,
      roles: sessionUser.roles,
      permissions: permissionsForRoles(sessionUser.roles)
    }
  });
}));

app.get("/api/auth/me", authenticate, route(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { roles: { include: { role: true } } }
  });
  res.json({
    user: user && {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      mobilePhone: user.mobilePhone,
      companyName: user.companyName,
      roles: user.roles.map((entry) => entry.role.name),
      permissions: permissionsForRoles(user.roles.map((entry) => entry.role.name))
    }
  });
}));

app.get("/api/dashboard", authenticate, requirePermission("dashboard"), route(async (req, res) => {
  const department = String(req.query.department || "All");
  const fromDate = req.query.fromDate ? new Date(String(req.query.fromDate)) : undefined;
  const toDate = req.query.toDate ? new Date(String(req.query.toDate)) : undefined;
  const reqWhere = {
    AND: [
      department !== "All" ? { department } : {},
      fromDate ? { postedOn: { gte: fromDate } } : {},
      toDate ? { postedOn: { lte: toDate } } : {}
    ]
  };
  const [
    openRfqs, openRfps, pendingPos, openGrns, closedGrns, turnover, activeVendors, blockedVendors,
    pendingQcs, pendingContracts, invoiceSubmitted, paymentPending, matchingPending, pendingAsn,
    requirements, vendors, monthly, activity, notifications, contracts, spendByCategory
  ] = await Promise.all([
    prisma.rFQ.count({ where: { status: { not: "Closed" } } }),
    prisma.rFP.count({ where: { status: { not: "Closed" } } }),
    prisma.pO.count({ where: { approvalStatus: "Pending" } }),
    prisma.gRN.count({ where: { status: "Open" } }),
    prisma.gRN.count({ where: { status: "Closed" } }),
    prisma.pO.aggregate({ _sum: { totalAmount: true } }),
    prisma.vendor.count({ where: { status: "Approved" } }),
    prisma.vendor.count({ where: { status: "Blocked" } }),
    prisma.qCS.count({ where: { status: "QCS Approval Pending" } }),
    prisma.contract.count({ where: { status: "Pending Approval" } }),
    prisma.invoice.count({ where: { status: "Submitted" } }),
    prisma.payment.count({ where: { status: { in: ["Pending", "Scheduled", "Part Paid"] } } }),
    prisma.threeWayMatch.count({ where: { status: { not: "Matched" } } }),
    prisma.aSN.count({ where: { status: "Pending ASN" } }),
    prisma.requirement.groupBy({ by: ["status"], where: reqWhere, _count: true }),
    prisma.vendor.groupBy({ by: ["status"], _count: true }),
    prisma.requirement.findMany({ where: reqWhere, select: { postedOn: true, status: true, department: true }, orderBy: { postedOn: "asc" }, take: 300 }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 12, include: { user: { select: { firstName: true, lastName: true } } } }),
    prisma.notification.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.contract.findMany({ orderBy: { expiryDate: "asc" }, take: 12, include: { vendor: true } }),
    prisma.catalogueItem.groupBy({ by: ["category"], _sum: { currentPrice: true }, _count: true, orderBy: { _count: { category: "desc" } }, take: 10 })
  ]);
  const monthMap = new Map<string, { pending: number; posted: number }>();
  const deptMap = new Map<string, number>();
  monthly.forEach((item) => {
    const key = item.postedOn.toLocaleString("en", { month: "short" });
    const current = monthMap.get(key) || { pending: 0, posted: 0 };
    current.posted += 1;
    if (item.status.includes("Pending")) current.pending += 1;
    monthMap.set(key, current);
    deptMap.set(item.department || "General", (deptMap.get(item.department || "General") || 0) + 1);
  });
  const totalTurnover = turnover._sum.totalAmount || 0;
  const savings = Math.round(totalTurnover * 0.028);
  res.json({
    kpis: {
      openRfqs,
      openRfps,
      pendingPos,
      openClosedGrns: `${openGrns} / ${closedGrns}`,
      turnover: totalTurnover,
      savings,
      savingsPercent: totalTurnover ? Number(((savings / totalTurnover) * 100).toFixed(2)) : 0,
      turnaroundPrToPo: "2D 6H 4M",
      pendingContracts,
      invoiceSubmitted,
      vendorPoInvoices: invoiceSubmitted,
      paymentPending,
      threeWayMatchingPending: matchingPending,
      pendingAsn,
      activeVendors,
      blockedVendors,
      qcsApprovalPending: pendingQcs
    },
    rfqStatus: requirements.map((entry) => ({ name: entry.status, value: entry._count })),
    vendorStatus: vendors.map((entry) => ({ name: entry.status, value: entry._count })),
    monthlyActivity: Array.from(monthMap.entries()).map(([month, value]) => ({ month, pending: value.pending, posted: value.posted, value: value.posted })),
    departmentTrend: Array.from(deptMap.entries()).map(([departmentName, value]) => ({ department: departmentName, value })),
    spendByCategory: spendByCategory.map((entry) => ({ category: entry.category, amount: entry._sum.currentPrice || 0, count: entry._count })),
    savingsByDepartment: Array.from(deptMap.entries()).map(([departmentName, value], index) => ({ department: departmentName, savings: value * (1200 + index * 200) })),
    performanceMatrix: vendors.map((entry, index) => ({ name: entry.status, response: 60 + index * 8, quality: 70 + index * 6, value: entry._count })),
    aging: requirements.map((entry, index) => ({ bucket: entry.status.slice(0, 16), days: 2 + index * 3, count: entry._count })),
    poCycle: Array.from(monthMap.keys()).map((month, index) => ({ month, cycle: 3 + index, target: 5 })),
    contractTimeline: contracts.map((contract) => ({ contract: contract.contractNo, vendor: contract.vendor.company, expiryDate: contract.expiryDate, value: contract.value })),
    topPerformers: vendors.slice(0, 5).map((entry, index) => ({ name: entry.status, score: 93 - index * 4, rfqs: entry._count })),
    notifications,
    pendingApprovals: activity.filter((entry) => entry.action.includes("APPRO") || entry.action.includes("QCS")).slice(0, 6),
    criticalAlerts: [
      { id: "alert-contract", title: "Contracts expiring", message: `${contracts.length} contracts are approaching renewal` },
      { id: "alert-match", title: "Three way match exceptions", message: `${matchingPending} exceptions need review` }
    ],
    activity: activity.map((entry) => ({
      id: entry.id,
      action: entry.action,
      entity: entry.entity,
      createdAt: entry.createdAt,
      user: entry.user ? `${entry.user.firstName} ${entry.user.lastName}` : "System"
    }))
  });
}));

app.get("/api/material-intelligence", authenticate, requirePermission("materials:read"), route(async (_req, res) => {
  const [
    totalMaterials, totalManufacturers, totalVendors, materialManufacturerLinks, vendorSupplyLinks,
    highCriticalityMaterials, singleSourceMaterials, complianceRiskVendors, avgLeadTime, avgVendorRating,
    materialsByCategory, vendorsByType, vendorCompliance, manufacturerCoverage, leadTimes, priceRows
  ] = await Promise.all([
    prisma.material.count({ where: { industry: "CDMO / Pharma" } }),
    prisma.manufacturer.count({ where: { industry: "CDMO / Pharma" } }),
    prisma.vendor.count({ where: { industry: "CDMO / Pharma" } }),
    prisma.materialManufacturer.count(),
    prisma.vendorSupplyMapping.count(),
    prisma.material.count({ where: { industry: "CDMO / Pharma", criticality: { in: ["High", "Critical"] } } }),
    prisma.material.findMany({ select: { materialCode: true, _count: { select: { manufacturers: true } } }, take: 3000 }),
    prisma.vendor.count({ where: { OR: [{ complianceStatus: "Non-Compliant" }, { blacklistedStatus: true }] } }),
    prisma.vendorSupplyMapping.aggregate({ _avg: { leadTimeDays: true } }),
    prisma.vendor.aggregate({ _avg: { vendorRating: true } }),
    prisma.material.groupBy({ by: ["category"], where: { industry: "CDMO / Pharma" }, _count: true, orderBy: { _count: { category: "desc" } } }),
    prisma.vendor.groupBy({ by: ["vendorType"], where: { industry: "CDMO / Pharma" }, _count: true, orderBy: { _count: { vendorType: "desc" } } }),
    prisma.vendor.groupBy({ by: ["complianceStatus"], where: { industry: "CDMO / Pharma" }, _count: true }),
    prisma.materialManufacturer.groupBy({ by: ["materialCode"], _count: true, orderBy: { materialCode: "asc" }, take: 3000 }),
    prisma.vendorSupplyMapping.groupBy({ by: ["leadTimeDays"], _count: true, orderBy: { leadTimeDays: "asc" }, take: 20 }),
    prisma.vendorSupplyMapping.findMany({ select: { supplyPrice: true, lastPurchasePrice: true, material: { select: { category: true } } }, take: 5000 })
  ]);
  const priceVariance = new Map<string, { delta: number; count: number }>();
  priceRows.forEach((row) => {
    const current = priceVariance.get(row.material.category) || { delta: 0, count: 0 };
    current.delta += Math.abs(row.supplyPrice - row.lastPurchasePrice);
    current.count += 1;
    priceVariance.set(row.material.category, current);
  });
  res.json({
    kpis: {
      totalMaterials,
      totalManufacturers,
      totalVendors,
      materialManufacturerLinks,
      vendorSupplyLinks,
      highCriticalityMaterials,
      singleSourceRiskMaterials: singleSourceMaterials.filter((material) => material._count.manufacturers <= 1).length,
      complianceRiskVendors,
      avgLeadTime: Math.round(avgLeadTime._avg.leadTimeDays || 0),
      avgVendorRating: Number((avgVendorRating._avg.vendorRating || 0).toFixed(2))
    },
    materialsByCategory: materialsByCategory.map((entry) => ({ name: entry.category, value: entry._count })),
    vendorsByType: vendorsByType.map((entry) => ({ name: entry.vendorType || "Unmapped", value: entry._count })),
    manufacturerCoverage: manufacturerCoverage.slice(0, 20).map((entry) => ({ materialCode: entry.materialCode, manufacturers: entry._count })),
    singleSourceRisk: singleSourceMaterials.filter((material) => material._count.manufacturers <= 1).slice(0, 10),
    topCategories: materialsByCategory.slice(0, 8).map((entry) => ({ category: entry.category, count: entry._count })),
    vendorCompliance: vendorCompliance.map((entry) => ({ status: entry.complianceStatus || "Unknown", count: entry._count })),
    leadTimeDistribution: leadTimes.map((entry) => ({ leadTimeDays: entry.leadTimeDays, count: entry._count })),
    priceVarianceByCategory: Array.from(priceVariance.entries()).map(([category, value]) => ({ category, variance: Math.round(value.delta / Math.max(value.count, 1)) }))
  });
}));

app.get("/api/materials/search", authenticate, requirePermission("materials:read"), route(async (req, res) => {
  const query = String(req.query.query || "").trim();
  if (query.length < 2) return res.json([]);
  const items = await prisma.material.findMany({
    where: {
      industry: "CDMO / Pharma",
      OR: [
        { materialCode: { startsWith: query } },
        { materialCode: { contains: query } },
        { materialName: { contains: query } }
      ]
    },
    select: {
      materialCode: true,
      materialName: true,
      category: true,
      subCategory: true,
      uom: true,
      regulatoryCategory: true,
      storageCondition: true,
      criticality: true,
      pharmaGrade: true,
      specification: true,
      hsnCode: true,
      shelfLifeMonths: true
    },
    take: 12,
    orderBy: { materialCode: "asc" }
  });
  await audit(req, "MATERIAL_CODE_SEARCHED", "Material", query, { count: items.length });
  res.json(items);
}));

app.get("/api/materials", authenticate, requirePermission("materials:read"), route(async (req, res) => {
  const { page, pageSize, skip, take } = pagination(req.query);
  const search = String(req.query.search || "").trim();
  const category = String(req.query.category || "All");
  const subCategory = String(req.query.subCategory || "All");
  const criticality = String(req.query.criticality || "All");
  const regulatoryCategory = String(req.query.regulatoryCategory || "All");
  const where = {
    AND: [
      { industry: "CDMO / Pharma" },
      search ? { OR: [{ materialCode: { contains: search } }, { materialName: { contains: search } }] } : {},
      category !== "All" ? { category } : {},
      subCategory !== "All" ? { subCategory } : {},
      criticality !== "All" ? { criticality } : {},
      regulatoryCategory !== "All" ? { regulatoryCategory } : {}
    ]
  };
  const [items, total, categories] = await Promise.all([
    prisma.material.findMany({ where, skip, take, include: { _count: { select: { manufacturers: true, supplyMappings: true } } }, orderBy: { materialCode: "asc" } }),
    prisma.material.count({ where }),
    prisma.material.groupBy({ by: ["category"], where: { industry: "CDMO / Pharma" }, _count: true, orderBy: { category: "asc" } })
  ]);
  res.json({ items, total, page, pageSize, facets: { categories: categories.map((entry) => entry.category) } });
}));

app.get("/api/materials/export", authenticate, requirePermission("materials:read"), route(async (req, res) => {
  const format = String(req.query.format || "csv");
  const rows = await prisma.material.findMany({ where: { industry: "CDMO / Pharma" }, orderBy: { materialCode: "asc" }, take: 5000 });
  const data = rows.map((material) => ({
    materialCode: material.materialCode,
    materialName: material.materialName,
    industry: material.industry,
    category: material.category,
    subCategory: material.subCategory,
    uom: material.uom,
    regulatoryCategory: material.regulatoryCategory,
    pharmaGrade: material.pharmaGrade
  }));
  if (format === "pdf") return sendPdf(res, "Material Master", data);
  if (format === "xlsx" || format === "xls") return sendExcelCompatible(res, "material-master", data);
  res.header("Content-Type", "text/csv");
  res.attachment("material-master.csv");
  res.send(toCsv(data));
}));

app.get("/api/materials/:materialCode", authenticate, requirePermission("materials:read"), route(async (req, res) => {
  const materialCode = routeParam(req, "materialCode");
  const material = await prisma.material.findUnique({
    where: { materialCode },
    include: { _count: { select: { manufacturers: true, supplyMappings: true } } }
  });
  if (!material) return res.status(404).json({ message: "Material code not found. Create new material or select from repository." });
  await audit(req, "MATERIAL_SELECTED_FROM_REPOSITORY", "Material", material.materialCode);
  res.json(material);
}));

app.get("/api/materials/:materialCode/manufacturers", authenticate, requirePermission("manufacturers:read"), route(async (req, res) => {
  const materialCode = routeParam(req, "materialCode");
  const links = await prisma.materialManufacturer.findMany({
    where: { materialCode },
    include: { manufacturer: true },
    orderBy: [{ approvalStatus: "asc" }, { leadTimeDays: "asc" }],
    take: 25
  });
  res.json(links.map((link) => ({
    id: link.id,
    manufacturerCode: link.manufacturerCode,
    manufacturerName: link.manufacturer.manufacturerName,
    qualityCertification: link.manufacturer.qualityCertification,
    regulatoryCertification: link.manufacturer.regulatoryCertification,
    complianceStatus: link.manufacturer.complianceStatus,
    leadTimeDays: link.leadTimeDays,
    rating: link.manufacturer.rating,
    approvalStatus: link.approvalStatus,
    moq: link.moq
  })));
}));

app.get("/api/materials/:materialCode/vendors", authenticate, requirePermission("supply-network:read"), route(async (req, res) => {
  const materialCode = routeParam(req, "materialCode");
  const compliantOnly = String(req.query.compliantOnly || "true") === "true";
  const preferredOnly = String(req.query.preferredOnly || "false") === "true";
  const rows = await prisma.vendorSupplyMapping.findMany({
    where: {
      materialCode,
      vendor: {
        blacklistedStatus: false,
        ...(compliantOnly ? { complianceStatus: { not: "Non-Compliant" } } : {}),
        ...(preferredOnly ? { preferredVendorFlag: true } : {})
      }
    },
    include: { vendor: true, manufacturer: true, material: true },
    take: 50
  });
  const items = rows.map((row) => ({
    id: row.id,
    materialCode: row.materialCode,
    materialName: row.material.materialName,
    manufacturerCode: row.manufacturerCode,
    manufacturerName: row.manufacturer.manufacturerName,
    vendorCode: row.vendorCode,
    vendorName: row.vendor.vendorName,
    vendorType: row.vendor.vendorType,
    supplyPrice: row.supplyPrice,
    currency: row.currency,
    moq: row.moq,
    leadTimeDays: row.leadTimeDays,
    lastPurchasePrice: row.lastPurchasePrice,
    vendorRating: row.vendor.vendorRating,
    qualityScore: row.vendor.qualityScore,
    onTimeDeliveryRate: row.vendor.onTimeDeliveryRate,
    complianceStatus: row.vendor.complianceStatus,
    preferredVendorFlag: row.vendor.preferredVendorFlag,
    recommendationScore: recommendationScore(row),
    badges: [
      row.vendor.preferredVendorFlag ? "Preferred" : null,
      row.vendor.complianceStatus === "Non-Compliant" ? "Compliance Risk" : null,
      recommendationScore(row) >= 85 ? "Recommended" : null
    ].filter(Boolean)
  })).sort((a, b) => b.recommendationScore - a.recommendationScore || a.leadTimeDays - b.leadTimeDays);
  await audit(req, "VENDOR_RECOMMENDATION_VIEWED", "Material", materialCode, { count: items.length });
  res.json(items);
}));

app.get("/api/vendors/recommendations", authenticate, requirePermission("supply-network:read"), route(async (req, res) => {
  const input = vendorSupplyMappingSchema.partial().parse({
    materialCode: req.query.materialCode,
    manufacturerCode: req.query.manufacturerCode,
    vendorCode: req.query.vendorCode,
    supplyPrice: req.query.supplyPrice || 1,
    moq: req.query.moq || 1,
    leadTimeDays: req.query.leadTimeDays || 1
  });
  const category = String(req.query.category || "");
  const compliantOnly = String(req.query.compliantOnly || "false") === "true";
  const preferredOnly = String(req.query.preferredOnly || "false") === "true";
  const rows = await prisma.vendorSupplyMapping.findMany({
    where: {
      ...(input.materialCode ? { materialCode: input.materialCode } : {}),
      ...(input.manufacturerCode ? { manufacturerCode: input.manufacturerCode } : {}),
      ...(category ? { material: { category } } : {}),
      vendor: {
        blacklistedStatus: false,
        ...(compliantOnly ? { complianceStatus: { not: "Non-Compliant" } } : {}),
        ...(preferredOnly ? { preferredVendorFlag: true } : {})
      }
    },
    include: { vendor: true, manufacturer: true, material: true },
    take: 75
  });
  res.json(rows.map((row) => ({ ...row, recommendationScore: recommendationScore(row) })).sort((a, b) => b.recommendationScore - a.recommendationScore));
}));

app.get("/api/materials/:materialCode/supply-history", authenticate, requirePermission("supply-network:read"), route(async (req, res) => {
  const materialCode = routeParam(req, "materialCode");
  const rows = await prisma.vendorSupplyMapping.findMany({
    where: { materialCode },
    include: { vendor: true, manufacturer: true },
    orderBy: { lastTransactionDate: "desc" },
    take: 40
  });
  res.json({
    materialCode,
    lastQuotedPrice: rows[0]?.lastQuotedPrice || null,
    lastPurchasePrice: rows[0]?.lastPurchasePrice || null,
    history: rows.map((row) => ({
      vendorCode: row.vendorCode,
      vendorName: row.vendor.vendorName,
      manufacturerCode: row.manufacturerCode,
      manufacturerName: row.manufacturer.manufacturerName,
      moq: row.moq,
      leadTimeDays: row.leadTimeDays,
      lastQuotedPrice: row.lastQuotedPrice,
      lastPurchasePrice: row.lastPurchasePrice,
      lastTransactionDate: row.lastTransactionDate,
      preferredRank: row.preferredRank
    }))
  });
}));

app.get("/api/manufacturers", authenticate, requirePermission("manufacturers:read"), route(async (req, res) => {
  const { page, pageSize, skip, take } = pagination(req.query);
  const search = String(req.query.search || "").trim();
  const manufacturerType = String(req.query.manufacturerType || "All");
  const country = String(req.query.country || "All");
  const complianceStatus = String(req.query.complianceStatus || "All");
  const where = {
    AND: [
      { industry: "CDMO / Pharma" },
      search ? { OR: [{ manufacturerCode: { contains: search } }, { manufacturerName: { contains: search } }] } : {},
      manufacturerType !== "All" ? { manufacturerType } : {},
      country !== "All" ? { country } : {},
      complianceStatus !== "All" ? { complianceStatus } : {}
    ]
  };
  const [items, total] = await Promise.all([
    prisma.manufacturer.findMany({ where, skip, take, include: { _count: { select: { materials: true, supplyMappings: true } } }, orderBy: { manufacturerCode: "asc" } }),
    prisma.manufacturer.count({ where })
  ]);
  res.json({ items, total, page, pageSize });
}));

app.get("/api/vendor-supply-network", authenticate, requirePermission("supply-network:read"), route(async (req, res) => {
  const { page, pageSize, skip, take } = pagination(req.query);
  const search = String(req.query.search || "").trim();
  const category = String(req.query.category || "All");
  const complianceStatus = String(req.query.complianceStatus || "All");
  const vendorType = String(req.query.vendorType || "All");
  const where = {
    AND: [
      search ? { OR: [{ materialCode: { contains: search } }, { manufacturerCode: { contains: search } }, { vendorCode: { contains: search } }] } : {},
      category !== "All" ? { material: { category } } : {},
      complianceStatus !== "All" ? { vendor: { complianceStatus } } : {},
      vendorType !== "All" ? { vendor: { vendorType } } : {}
    ]
  };
  const [items, total] = await Promise.all([
    prisma.vendorSupplyMapping.findMany({ where, skip, take, include: { material: true, manufacturer: true, vendor: true }, orderBy: [{ materialCode: "asc" }, { preferredRank: "asc" }] }),
    prisma.vendorSupplyMapping.count({ where })
  ]);
  res.json({
    items: items.map((row) => ({ ...row, recommendationScore: recommendationScore(row) })),
    total,
    page,
    pageSize
  });
}));

app.get("/api/data-connectors", authenticate, requirePermission("data-connectors:read"), route(async (req, res) => {
  const { page, pageSize, skip, take } = pagination(req.query);
  const [items, total] = await Promise.all([
    prisma.dataConnector.findMany({ skip, take, include: { logs: { orderBy: { startedAt: "desc" }, take: 1 } }, orderBy: { createdAt: "desc" } }),
    prisma.dataConnector.count()
  ]);
  res.json({ items, total, page, pageSize });
}));

app.post("/api/data-connectors", authenticate, requirePermission("data-connectors"), route(async (req, res) => {
  const input = connectorSchema.parse(req.body);
  const connector = await prisma.dataConnector.create({ data: input });
  await audit(req, "DATA_CONNECTOR_CREATED", "DataConnector", connector.id);
  res.status(201).json(connector);
}));

app.get("/api/data-connectors/logs", authenticate, requirePermission("data-connectors:read"), route(async (req, res) => {
  const { page, pageSize, skip, take } = pagination(req.query);
  const [items, total] = await Promise.all([
    prisma.dataIngestionLog.findMany({ skip, take, include: { connector: true, errors: true }, orderBy: { startedAt: "desc" } }),
    prisma.dataIngestionLog.count()
  ]);
  res.json({ items, total, page, pageSize });
}));

app.post("/api/data-connectors/:id/sync", authenticate, requirePermission("data-connectors"), route(async (req, res) => {
  const id = routeParam(req, "id");
  const connector = await prisma.dataConnector.findUnique({ where: { id } });
  if (!connector) return res.status(404).json({ message: "Connector not found" });
  const log = await prisma.dataIngestionLog.create({
    data: {
      connectorId: connector.id,
      completedAt: new Date(),
      totalRecords: 25,
      importedRecords: 25,
      failedRecords: 0,
      status: "Success",
      errorSummary: null
    }
  });
  await audit(req, "MOCK_CONNECTOR_SYNC_COMPLETED", "DataConnector", connector.id, { importedRecords: log.importedRecords });
  res.json({ message: "Mock sync completed successfully", log });
}));

app.get("/api/vendors", authenticate, requirePermission("vendors:read"), route(async (req, res) => {
  const { page, pageSize, skip, take } = pagination(req.query);
  const search = String(req.query.search || "").trim();
  const status = String(req.query.status || "All");
  const where = {
    AND: [
      status !== "All" ? { status } : {},
      search ? {
        OR: [
          { company: { contains: search } },
          { vendorName: { contains: search } },
          { email: { contains: search } },
          { vendorCodes: { contains: search } }
        ]
      } : {}
    ]
  };
  const [items, total] = await Promise.all([
    prisma.vendor.findMany({ where, skip, take, orderBy: { updatedAt: "desc" } }),
    prisma.vendor.count({ where })
  ]);
  res.json({ items, total, page, pageSize });
}));

app.get("/api/vendors/export", authenticate, requirePermission("vendors:read"), route(async (_req, res) => {
  const vendors = await prisma.vendor.findMany({ orderBy: { company: "asc" }, take: 5000 });
  res.header("Content-Type", "text/csv");
  res.attachment("vendors.csv");
  res.send(toCsv(vendors.map((vendor) => ({
    company: vendor.company,
    vendorName: vendor.vendorName,
    phone: vendor.phone,
    email: vendor.email,
    vendorCodes: vendor.vendorCodes,
    status: vendor.status,
    category: vendor.category
  }))));
}));

app.post("/api/vendors", authenticate, requirePermission("vendors"), route(async (req, res) => {
  const input = vendorSchema.parse(req.body);
  const vendor = await prisma.vendor.create({
    data: {
      ...input,
      contacts: {
        create: {
          name: input.vendorName,
          email: input.email,
          phone: input.phone,
          title: "Primary Contact",
          isPrimary: true
        }
      },
      documents: {
        create: [
          { type: "GST", fileName: "gst-placeholder.pdf", status: input.gstNumber ? "Verified" : "Pending" },
          { type: "PAN", fileName: "pan-placeholder.pdf", status: input.panNumber ? "Verified" : "Pending" },
          { type: "Bank", fileName: "bank-placeholder.pdf", status: input.accountNumber ? "Verified" : "Pending" }
        ]
      }
    },
    include: { contacts: true, documents: true }
  });
  await audit(req, "CREATE", "Vendor", vendor.id, { company: vendor.company });
  res.status(201).json(vendor);
}));

app.get("/api/vendors/:id", authenticate, requirePermission("vendors:read"), route(async (req, res) => {
  const id = routeParam(req, "id");
  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: { contacts: true, documents: true, pos: true, contracts: true, catalogueItems: true }
  });
  if (!vendor) return res.status(404).json({ message: "Vendor not found" });
  res.json(vendor);
}));

app.patch("/api/vendors/:id", authenticate, requirePermission("vendors"), route(async (req, res) => {
  const id = routeParam(req, "id");
  const input = vendorSchema.partial().parse(req.body);
  const vendor = await prisma.vendor.update({ where: { id }, data: input });
  await audit(req, "UPDATE", "Vendor", vendor.id, input);
  res.json(vendor);
}));

app.patch("/api/vendors/:id/status", authenticate, requirePermission("vendors"), route(async (req, res) => {
  const id = routeParam(req, "id");
  const input = z.object({ status: z.string() }).parse(req.body);
  const vendor = await prisma.vendor.update({ where: { id }, data: { status: input.status } });
  await audit(req, input.status.toUpperCase().replace(/\s/g, "_"), "Vendor", vendor.id);
  res.json(vendor);
}));

app.post("/api/vendors/:id/documents", authenticate, requirePermission("vendors"), upload.single("file"), route(async (req, res) => {
  const id = routeParam(req, "id");
  const file = req.file;
  const input = z.object({ type: z.string().min(2) }).parse(req.body);
  if (!file) return res.status(400).json({ message: "File is required" });
  const document = await prisma.vendorDocument.create({
    data: {
      vendorId: id,
      type: input.type,
      fileName: file.originalname.replace(/[^\w.\- ]/g, ""),
      status: "Pending"
    }
  });
  await audit(req, "UPLOAD_DOCUMENT", "Vendor", id, { documentId: document.id });
  res.status(201).json(document);
}));

app.get("/api/requirements", authenticate, requirePermission("requirements:read"), route(async (req, res) => {
  const { page, pageSize, skip, take } = pagination(req.query);
  const search = String(req.query.search || "").trim();
  const status = String(req.query.status || "All Status");
  const postedBy = String(req.query.postedBy || "All");
  const department = String(req.query.department || "All");
  const sortBy = String(req.query.sortBy || "postedOn");
  const sortDir = String(req.query.sortDir || "desc") === "asc" ? "asc" : "desc";
  const fromDate = req.query.fromDate ? new Date(String(req.query.fromDate)) : undefined;
  const toDate = req.query.toDate ? new Date(String(req.query.toDate)) : undefined;
  const where = {
    AND: [
      status !== "All Status" ? { status } : {},
      postedBy !== "All" ? { postedById: postedBy } : {},
      department !== "All" ? { department } : {},
      fromDate ? { postedOn: { gte: fromDate } } : {},
      toDate ? { postedOn: { lte: toDate } } : {},
      search ? {
        OR: [
          { rfqNumber: { contains: search } },
          { title: { contains: search } },
          { projectName: { contains: search } },
          { prNumber: { contains: search } },
          { qcsCode: { contains: search } }
        ]
      } : {}
    ]
  };
  const [items, total, posters] = await Promise.all([
    prisma.requirement.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortDir },
      include: {
        postedBy: { select: { id: true, firstName: true, lastName: true } },
        comments: { take: 3, orderBy: { createdAt: "desc" } },
        items: { take: 4 },
        vendors: { take: 6, include: { vendor: true } }
      }
    }),
    prisma.requirement.count({ where }),
    prisma.user.findMany({ select: { id: true, firstName: true, lastName: true }, orderBy: { firstName: "asc" } })
  ]);
  res.json({ items, total, page, pageSize, filters: { posters, departments } });
}));

app.get("/api/requirements/export", authenticate, requirePermission("requirements:read"), route(async (_req, res) => {
  const rows = await prisma.requirement.findMany({ include: { postedBy: true }, orderBy: { postedOn: "desc" }, take: 5000 });
  res.header("Content-Type", "text/csv");
  res.attachment("requirements.csv");
  res.send(toCsv(rows.map((row) => ({
    rfqNumber: row.rfqNumber,
    rfqType: row.rfqType,
    title: row.title,
    postedBy: `${row.postedBy.firstName} ${row.postedBy.lastName}`,
    quotationStatus: row.quotationStatus,
    postedOn: row.postedOn.toISOString(),
    freezeTime: row.freezeTime.toISOString(),
    negotiationTime: row.negotiationTime?.toISOString(),
    status: row.status,
    projectName: row.projectName,
    clientName: row.clientName,
    prNumber: row.prNumber,
    qcsCode: row.qcsCode
  }))));
}));

app.post("/api/requirements", authenticate, requirePermission("requirements"), route(async (req, res) => {
  const input = requirementSchema.parse(req.body);
  const count = await prisma.requirement.count();
  const requirement = await prisma.requirement.create({
    data: {
      ...input,
      rfqNumber: nextNumber("REQ", 34000 + count + 1),
      quotationStatus: "0 / 0",
      postedById: req.user!.id,
      postedOn: input.postedOn || new Date(),
      freezeTime: input.freezeTime || new Date(Date.now() + 86400000)
    }
  });
  await audit(req, "CREATE", "Requirement", requirement.id);
  res.status(201).json(requirement);
}));

app.post("/api/requirements/drafts", authenticate, requirePermission("requirements"), route(async (req, res) => {
  const input = z.object({
    draftKey: z.string().default("default"),
    currentStep: z.coerce.number().int().min(1).max(5).default(1),
    payload: z.unknown()
  }).parse(req.body);
  const draft = await prisma.requirementDraft.upsert({
    where: { ownerId_draftKey: { ownerId: req.user!.id, draftKey: input.draftKey } },
    create: { ownerId: req.user!.id, draftKey: input.draftKey, currentStep: input.currentStep, payload: jsonText(input.payload) },
    update: { currentStep: input.currentStep, payload: jsonText(input.payload), status: "Draft" }
  });
  await audit(req, "SAVE_DRAFT", "RequirementDraft", draft.id, { step: input.currentStep });
  res.json(draft);
}));

app.get("/api/requirements/drafts/:draftKey", authenticate, requirePermission("requirements"), route(async (req, res) => {
  const draftKey = routeParam(req, "draftKey");
  const draft = await prisma.requirementDraft.findUnique({ where: { ownerId_draftKey: { ownerId: req.user!.id, draftKey } } });
  res.json(draft ? { ...draft, payload: JSON.parse(draft.payload) } : null);
}));

app.post("/api/requirements/wizard/submit", authenticate, requirePermission("requirements"), route(async (req, res) => {
  const input = requirementWizardSchema.parse(req.body);
  validateReminderLimit(input.transaction.noOfReminders, req.user!.roles);
  const count = await prisma.requirement.count();
  const prefix = input.mode === "RFP" ? "RFPREQ" : input.mode === "Reverse Auction" ? "RAREQ" : "RFQREQ";
  const requirement = await prisma.requirement.create({
    data: {
      rfqNumber: nextNumber(prefix, 50000 + count + 1),
      rfqType: input.mode,
      title: input.specification.title,
      postedById: req.user!.id,
      postedOn: new Date(),
      freezeTime: input.transaction.quotationFreezeTime,
      negotiationTime: input.transaction.expectedNegotiationTime,
      status: "QCS Pending",
      department: input.specification.department,
      urgency: input.specification.urgency,
      description: input.specification.description,
      internalNotes: input.specification.internalNotes,
      deliveryTerms: input.terms.deliveryTerms,
      paymentTerms: input.terms.paymentTerms,
      incoterms: input.terms.incoterms,
      contactDetails: input.terms.contactDetails,
      transactionConfig: jsonText(input.transaction),
      projectName: input.specification.projectName,
      clientName: input.specification.clientName,
      quotationStatus: "0 / " + input.vendors.selectedVendorIds.length,
      quotationCount: 0,
      invitedVendors: input.vendors.selectedVendorIds.length,
      items: { create: input.specification.items },
      templateQuestions: { create: input.specification.templateQuestions },
      vendors: { create: input.vendors.selectedVendorIds.map((vendorId) => ({ vendorId, status: "Invited", score: 75, invitedAt: new Date() })) },
      attachments: { create: [{ entityType: "Requirement", entityId: "pending", uploadedById: req.user!.id, fileName: "terms-placeholder.pdf", fileType: "application/pdf", storagePath: "local-placeholder" }] }
    },
    include: { items: true, vendors: { include: { vendor: true } } }
  });
  const rfqCount = await prisma.rFQ.count();
  if (input.mode === "RFP") {
    await prisma.rFP.create({ data: { rfpNumber: nextNumber("RFP", 41000 + rfqCount + 1), requirementId: requirement.id, title: requirement.title, status: "Published", proposalDeadline: input.transaction.quotationFreezeTime } });
  } else {
    await prisma.rFQ.create({
      data: {
        rfqNumber: nextNumber("RFQ", 39000 + rfqCount + 1),
        requirementId: requirement.id,
        title: requirement.title,
        status: "Quotations Pending",
        quotationDeadline: input.transaction.quotationFreezeTime,
        freezeTime: input.transaction.quotationFreezeTime,
        negotiationTime: input.transaction.expectedNegotiationTime,
        lineItems: { create: input.specification.items.map((item) => ({ itemCode: item.productCode, description: item.productName, quantity: item.quantity, uom: item.uom, targetPrice: item.freightCharges + item.insuranceCharges })) }
      }
    });
  }
  await prisma.notification.createMany({ data: input.vendors.selectedVendorIds.map((vendorId) => ({ userId: req.user!.id, title: "RFQ/RFP published", message: `Requirement ${requirement.rfqNumber} was published to vendor ${vendorId.slice(0, 6)}.`, type: "Vendor Mock" })) });
  await prisma.requirementDraft.updateMany({ where: { ownerId: req.user!.id, draftKey: input.draftKey }, data: { status: "Submitted", requirementId: requirement.id } });
  await audit(req, input.mode === "RFP" ? "RFP_PUBLISHED" : "RFQ_PUBLISHED", "Requirement", requirement.id, { vendors: input.vendors.selectedVendorIds.length });
  res.status(201).json({ requirement, generatedNumber: requirement.rfqNumber });
}));

app.get("/api/vendors/suggest", authenticate, requirePermission("vendors:read"), route(async (req, res) => {
  const category = String(req.query.category || "");
  const country = String(req.query.country || "");
  const search = String(req.query.search || "");
  const rows = await prisma.vendor.findMany({
    where: {
      AND: [
        search ? { OR: [{ company: { contains: search } }, { vendorName: { contains: search } }] } : {},
        category ? { categories: { some: { category } } } : {},
        country ? { categories: { some: { country } } } : {}
      ]
    },
    include: { categories: true, documents: true },
    take: 50,
    orderBy: { company: "asc" }
  });
  const items = rows.map((vendor) => {
    const categoryRow = vendor.categories.find((entry) => !category || entry.category === category) || vendor.categories[0];
    const complianceExpired = categoryRow?.complianceValidUntil ? categoryRow.complianceValidUntil < new Date() : false;
    const score = Math.round(
      (vendor.status === "Approved" ? 25 : 5) +
      (categoryRow ? 20 : 0) +
      ((categoryRow?.responseRate || 60) * 0.15) +
      ((categoryRow?.onTimeDelivery || 60) * 0.15) +
      ((categoryRow?.priceCompetitiveness || 60) * 0.12) +
      ((categoryRow?.qualityScore || 60) * 0.13)
    );
    return {
      id: vendor.id,
      company: vendor.company,
      contactPerson: vendor.vendorName,
      category: categoryRow?.category || vendor.category || "General",
      country: categoryRow?.country || "India",
      rating: categoryRow?.rating || 3.5,
      lastParticipation: vendor.updatedAt,
      status: vendor.status,
      score,
      warnings: [
        vendor.status === "Blocked" ? "Vendor is blacklisted" : null,
        vendor.status === "Inactive" ? "Vendor is inactive" : null,
        complianceExpired ? "Compliance expired" : null
      ].filter(Boolean)
    };
  }).sort((a, b) => b.score - a.score);
  res.json({ items, eligibilityWarning: items.length ? null : "Vendors are not assigned in this category" });
}));

app.post("/api/requirements/:id/clone", authenticate, requirePermission("requirements"), route(async (req, res) => {
  const id = routeParam(req, "id");
  const options = z.object({
    cloneVendors: z.boolean().default(false),
    cloneTerms: z.boolean().default(true),
    cloneTemplateQuestions: z.boolean().default(true),
    cloneAttachments: z.boolean().default(false),
    cloneOnlyMaterialLineItems: z.boolean().default(false)
  }).parse(req.body || {});
  const source = await prisma.requirement.findUnique({
    where: { id },
    include: { items: true, templateQuestions: true, vendors: true, attachments: true }
  });
  if (!source) return res.status(404).json({ message: "Source requirement not found" });
  const count = await prisma.requirement.count({ where: { rfqNumber: { startsWith: "REQ-DRAFT-" } } });
  const draftNumber = `REQ-DRAFT-${String(count + 1).padStart(4, "0")}`;
  const cloned = await prisma.requirement.create({
    data: {
      rfqNumber: draftNumber,
      rfqType: source.rfqType,
      title: `Clone of ${source.title}`,
      postedById: req.user!.id,
      postedOn: new Date(),
      freezeTime: daysFromNow(7),
      negotiationTime: source.negotiationTime ? daysFromNow(10) : null,
      status: "Draft",
      department: source.department,
      urgency: source.urgency,
      description: source.description,
      internalNotes: source.internalNotes,
      deliveryTerms: options.cloneTerms ? source.deliveryTerms : null,
      paymentTerms: options.cloneTerms ? source.paymentTerms : null,
      incoterms: options.cloneTerms ? source.incoterms : null,
      contactDetails: options.cloneTerms ? source.contactDetails : null,
      transactionConfig: source.transactionConfig,
      projectName: source.projectName,
      clientName: source.clientName,
      quotationStatus: "0 / 0",
      quotationCount: 0,
      invitedVendors: options.cloneVendors ? source.vendors.length : 0,
      items: {
        create: source.items.map((item) => ({
          itemNo: item.itemNo,
          materialCode: item.materialCode,
          materialName: item.materialName,
          productCode: item.productCode,
          productName: item.productName,
          mpnNumber: item.mpnNumber,
          quantity: item.quantity,
          uom: item.uom,
          makeModel: item.makeModel,
          hsnCode: item.hsnCode,
          deliveryAddress: options.cloneOnlyMaterialLineItems ? null : item.deliveryAddress,
          description: item.description,
          freightCharges: options.cloneOnlyMaterialLineItems ? 0 : item.freightCharges,
          insuranceCharges: options.cloneOnlyMaterialLineItems ? 0 : item.insuranceCharges,
          remarks: "Cloned from repository-driven requirement",
          attachmentName: null
        }))
      },
      ...(options.cloneTemplateQuestions ? {
        templateQuestions: {
          create: source.templateQuestions.map((question) => ({
            name: question.name,
            description: question.description,
            specification: question.specification,
            isTechnical: question.isTechnical,
            isMandatory: question.isMandatory,
            vendorResponseType: question.vendorResponseType,
            weightage: question.weightage
          }))
        }
      } : {}),
      ...(options.cloneVendors ? {
        vendors: {
          create: source.vendors.map((vendor) => ({
            vendorId: vendor.vendorId,
            status: "Selected for Draft",
            categoryMatch: vendor.categoryMatch,
            score: vendor.score,
            warnings: vendor.warnings,
            invitedAt: null
          }))
        }
      } : {}),
      ...(options.cloneAttachments ? {
        attachments: {
          create: source.attachments.map((attachment) => ({
            entityType: "Requirement",
            entityId: draftNumber,
            uploadedById: req.user!.id,
            fileName: `clone-${attachment.fileName}`,
            fileType: attachment.fileType,
            storagePath: attachment.storagePath
          }))
        }
      } : {})
    }
  });
  await prisma.requirementDraft.create({
    data: {
      ownerId: req.user!.id,
      requirementId: cloned.id,
      draftKey: cloned.rfqNumber,
      payload: JSON.stringify({ clonedFrom: source.id, options }),
      currentStep: 1,
      status: "Draft"
    }
  });
  await audit(req, "REQUIREMENT_CLONED", "Requirement", cloned.id, { sourceRequirementId: source.id, options });
  res.status(201).json({
    newRequirementId: cloned.id,
    draftNumber: cloned.rfqNumber,
    status: "Draft",
    redirectTo: `/requirements/${cloned.id}/edit`,
    message: "Requirement cloned successfully"
  });
}));

app.patch("/api/requirements/:id/status", authenticate, requirePermission("requirements"), route(async (req, res) => {
  const id = routeParam(req, "id");
  const input = z.object({ status: z.string() }).parse(req.body);
  const requirement = await prisma.requirement.update({ where: { id }, data: { status: input.status } });
  await audit(req, "WORKFLOW_STATUS", "Requirement", requirement.id, input);
  res.json(requirement);
}));

app.post("/api/requirements/:id/comments", authenticate, requirePermission("requirements"), route(async (req, res) => {
  const id = routeParam(req, "id");
  const input = z.object({ body: z.string().min(2) }).parse(req.body);
  const comment = await prisma.comment.create({
    data: {
      body: input.body,
      entityType: "Requirement",
      entityId: id,
      requirementId: id,
      userId: req.user!.id
    }
  });
  await audit(req, "COMMENT", "Requirement", id);
  res.status(201).json(comment);
}));

app.get("/api/prs", authenticate, requirePermission("prs:read"), route(async (req, res) => {
  const { page, pageSize, skip, take } = pagination(req.query);
  const search = String(req.query.search || "");
  const where = search ? { OR: [{ prNumber: { contains: search } }, { title: { contains: search } }, { department: { contains: search } }] } : {};
  const [items, total] = await Promise.all([
    prisma.pR.findMany({ where, skip, take, include: { owner: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.pR.count({ where })
  ]);
  res.json({ items, total, page, pageSize });
}));

app.post("/api/prs", authenticate, requirePermission("prs"), route(async (req, res) => {
  const input = prSchema.parse(req.body);
  const count = await prisma.pR.count();
  const pr = await prisma.pR.create({ data: { ...input, prNumber: nextNumber("PR", 10000 + count + 1), ownerId: req.user!.id } });
  await audit(req, "CREATE", "PR", pr.id);
  res.status(201).json(pr);
}));

app.post("/api/prs/:id/convert-to-rfq", authenticate, requirePermission("rfqs"), route(async (req, res) => {
  const id = routeParam(req, "id");
  const pr = await prisma.pR.findUnique({ where: { id } });
  if (!pr) return res.status(404).json({ message: "PR not found" });
  const count = await prisma.rFQ.count();
  const rfq = await prisma.rFQ.create({
    data: {
      rfqNumber: nextNumber("RFQ", 39000 + count + 1),
      prId: pr.id,
      title: pr.title,
      status: "Quotations Pending",
      quotationDeadline: new Date(Date.now() + 5 * 86400000),
      freezeTime: new Date(Date.now() + 3 * 86400000),
      lineItems: { create: [{ itemCode: "AUTO-001", description: pr.item, quantity: pr.quantity, uom: "EA", targetPrice: pr.budget / pr.quantity }] }
    }
  });
  await prisma.pR.update({ where: { id: pr.id }, data: { convertedRfqId: rfq.id, approvalStatus: "Converted to RFQ" } });
  await audit(req, "CONVERT_TO_RFQ", "PR", pr.id, { rfqId: rfq.id });
  res.status(201).json(rfq);
}));

app.get("/api/rfqs", authenticate, requirePermission("rfqs:read"), route(async (req, res) => {
  const { page, pageSize, skip, take } = pagination(req.query);
  const search = String(req.query.search || "");
  const where = search ? { OR: [{ rfqNumber: { contains: search } }, { title: { contains: search } }, { status: { contains: search } }] } : {};
  const [items, total] = await Promise.all([
    prisma.rFQ.findMany({ where, skip, take, include: { lineItems: true, quotations: { include: { vendor: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.rFQ.count({ where })
  ]);
  res.json({ items, total, page, pageSize });
}));

app.post("/api/rfqs", authenticate, requirePermission("rfqs"), route(async (req, res) => {
  const input = rfqSchema.parse(req.body);
  const count = await prisma.rFQ.count();
  const rfq = await prisma.rFQ.create({
    data: {
      rfqNumber: nextNumber("RFQ", 39000 + count + 1),
      title: input.title,
      prId: input.prId,
      requirementId: input.requirementId,
      quotationDeadline: input.quotationDeadline,
      freezeTime: input.freezeTime,
      negotiationTime: input.negotiationTime,
      status: "Quotations Pending",
      lineItems: { create: input.lineItems }
    },
    include: { lineItems: true }
  });
  await audit(req, "CREATE", "RFQ", rfq.id);
  res.status(201).json(rfq);
}));

app.get("/api/qcs", authenticate, requirePermission("qcs:read"), route(async (req, res) => {
  const { page, pageSize, skip, take } = pagination(req.query);
  const [items, total] = await Promise.all([
    prisma.qCS.findMany({ skip, take, include: { rfq: true, approvals: true }, orderBy: { createdAt: "desc" } }),
    prisma.qCS.count()
  ]);
  res.json({ items, total, page, pageSize });
}));

app.patch("/api/qcs/:id/approve", authenticate, requirePermission("qcs"), route(async (req, res) => {
  const id = routeParam(req, "id");
  const input = z.object({ status: z.enum(["Approved", "Rejected"]), comments: z.string().optional() }).parse(req.body);
  const qcs = await prisma.qCS.update({
    where: { id },
    data: { status: input.status === "Approved" ? "QCS Approved" : "QCS Rejected" }
  });
  await prisma.qCSApproval.create({
    data: { qcsId: qcs.id, approver: req.user!.email, role: req.user!.roles[0] || "Approver", status: input.status, comments: input.comments, decidedAt: new Date() }
  });
  await audit(req, "QCS_APPROVAL", "QCS", qcs.id, input);
  res.json(qcs);
}));

app.get("/api/pos", authenticate, requirePermission("pos:read"), route(async (req, res) => {
  const { page, pageSize, skip, take } = pagination(req.query);
  const [items, total] = await Promise.all([
    prisma.pO.findMany({ skip, take, include: { vendor: true }, orderBy: { createdAt: "desc" } }),
    prisma.pO.count()
  ]);
  res.json({ items, total, page, pageSize });
}));

app.post("/api/pos", authenticate, requirePermission("pos"), route(async (req, res) => {
  const input = poSchema.parse(req.body);
  const count = await prisma.pO.count();
  const po = await prisma.pO.create({ data: { ...input, poNumber: nextNumber("PO", 22000 + count + 1) } });
  await audit(req, "CREATE", "PO", po.id);
  res.status(201).json(po);
}));

app.get("/api/contracts", authenticate, requirePermission("contracts:read"), route(async (req, res) => {
  const { page, pageSize, skip, take } = pagination(req.query);
  const status = String(req.query.status || "All");
  const [items, total] = await Promise.all([
    prisma.contract.findMany({ where: status !== "All" ? { status } : {}, skip, take, include: { vendor: true, amendments: true, pos: true }, orderBy: { expiryDate: "asc" } }),
    prisma.contract.count({ where: status !== "All" ? { status } : {} })
  ]);
  res.json({ items, total, page, pageSize });
}));

app.post("/api/contracts", authenticate, requirePermission("contracts"), route(async (req, res) => {
  const input = z.object({
    vendorId: z.string(),
    title: z.string().min(3),
    contractType: z.string().default("Rate Contract"),
    startDate: z.coerce.date(),
    expiryDate: z.coerce.date(),
    value: z.coerce.number().positive(),
    department: z.string(),
    owner: z.string(),
    status: z.string().default("Pending Approval"),
    renewalRequired: z.boolean().default(false),
    terms: z.string().optional()
  }).parse(req.body);
  const count = await prisma.contract.count();
  const contract = await prisma.contract.create({
    data: {
      ...input,
      contractNo: nextNumber("CTR", 6000 + count + 1),
      renewalStatus: input.renewalRequired ? "Renewal Due" : "Active",
      balanceValue: input.value,
      fileName: "contract-placeholder.pdf",
      amendments: { create: { version: 1, summary: "Contract created", status: "Pending Approval" } }
    }
  });
  await audit(req, "CONTRACT_CREATED", "Contract", contract.id);
  res.status(201).json(contract);
}));

app.get("/api/contracts/utilization/summary", authenticate, requirePermission("contracts:read"), route(async (_req, res) => {
  const contracts = await prisma.contract.findMany({ include: { vendor: true }, orderBy: { expiryDate: "asc" }, take: 100 });
  res.json({
    items: contracts.map((contract) => ({
      id: contract.id,
      contractNo: contract.contractNo,
      vendor: contract.vendor.company,
      value: contract.value,
      utilizedValue: contract.utilizedValue,
      balanceValue: contract.balanceValue,
      utilizationPercent: contract.value ? Math.round((contract.utilizedValue / contract.value) * 100) : 0,
      expiryDate: contract.expiryDate,
      status: contract.status
    }))
  });
}));

app.get("/api/catalogue", authenticate, requirePermission("catalogue:read"), route(async (req, res) => {
  const { page, pageSize, skip, take } = pagination(req.query);
  const search = String(req.query.search || "");
  const where = search ? { OR: [{ itemCode: { contains: search } }, { name: { contains: search } }, { category: { contains: search } }] } : {};
  const [items, total] = await Promise.all([
    prisma.catalogueItem.findMany({ where, skip, take, include: { vendor: true }, orderBy: { updatedAt: "desc" } }),
    prisma.catalogueItem.count({ where })
  ]);
  res.json({ items, total, page, pageSize });
}));

app.get("/api/reports", authenticate, requirePermission("reports:read"), route(async (_req, res) => {
  const [spendByVendor, auditLogs, expiringContracts] = await Promise.all([
    prisma.pO.groupBy({ by: ["vendorId"], _sum: { totalAmount: true }, _count: true, orderBy: { _sum: { totalAmount: "desc" } }, take: 10 }),
    prisma.auditLog.findMany({ take: 25, orderBy: { createdAt: "desc" }, include: { user: true } }),
    prisma.contract.findMany({ take: 10, orderBy: { expiryDate: "asc" }, include: { vendor: true } })
  ]);
  const vendorIds = spendByVendor.map((entry) => entry.vendorId);
  const vendors = await prisma.vendor.findMany({ where: { id: { in: vendorIds } } });
  const vendorName = new Map(vendors.map((vendor) => [vendor.id, vendor.company]));
  res.json({
    spendByVendor: spendByVendor.map((entry) => ({ vendor: vendorName.get(entry.vendorId), amount: entry._sum.totalAmount || 0, orders: entry._count })),
    auditLogs,
    expiringContracts
  });
}));

const operationMap = {
  grns: {
    permission: "grn:read",
    list: (skip: number, take: number) => prisma.gRN.findMany({ skip, take, include: { po: { include: { vendor: true } }, lineItems: true }, orderBy: { receivedDate: "desc" } }),
    count: () => prisma.gRN.count()
  },
  asns: {
    permission: "asn:read",
    list: (skip: number, take: number) => prisma.aSN.findMany({ skip, take, include: { po: true, vendor: true }, orderBy: { deliveryDate: "asc" } }),
    count: () => prisma.aSN.count()
  },
  invoices: {
    permission: "invoice:read",
    list: (skip: number, take: number) => prisma.invoice.findMany({ skip, take, include: { po: true, vendor: true, payments: true }, orderBy: { submittedAt: "desc" } }),
    count: () => prisma.invoice.count()
  },
  payments: {
    permission: "payment:read",
    list: (skip: number, take: number) => prisma.payment.findMany({ skip, take, include: { po: true, invoice: true }, orderBy: { dueDate: "asc" } }),
    count: () => prisma.payment.count()
  },
  matching: {
    permission: "matching:read",
    list: (skip: number, take: number) => prisma.threeWayMatch.findMany({ skip, take, include: { po: true, grn: true, invoice: true }, orderBy: { status: "asc" } }),
    count: () => prisma.threeWayMatch.count()
  }
};

app.get("/api/operations/:module", authenticate, route(async (req, res) => {
  const moduleName = routeParam(req, "module") as keyof typeof operationMap;
  const config = operationMap[moduleName];
  if (!config) return res.status(404).json({ message: "Unknown operations module" });
  const roles = req.user?.roles || [];
  const permissions = permissionsForRoles(roles);
  if (!permissions.includes("*") && !permissions.includes(config.permission) && !permissions.includes(config.permission.split(":")[0])) {
    return res.status(403).json({ message: "You do not have permission for this module" });
  }
  const { page, pageSize, skip, take } = pagination(req.query);
  const [items, total] = await Promise.all([config.list(skip, take), config.count()]);
  res.json({ items, total, page, pageSize });
}));

app.patch("/api/operations/matching/:id/decision", authenticate, requirePermission("matching"), route(async (req, res) => {
  const id = routeParam(req, "id");
  const input = z.object({ status: z.enum(["Matched", "Rejected", "Quantity mismatch", "Price mismatch"]), exception: z.string().optional() }).parse(req.body);
  const match = await prisma.threeWayMatch.update({ where: { id }, data: { status: input.status, exception: input.exception, decidedAt: new Date() } });
  await audit(req, "THREE_WAY_MATCH_UPDATED", "ThreeWayMatch", match.id, input);
  res.json(match);
}));

app.get("/api/reports/:report/export", authenticate, requirePermission("reports:read"), route(async (req, res) => {
  const report = routeParam(req, "report");
  const format = String(req.query.format || "csv");
  const rows = reportRows(report, await buildReportRows(report));
  if (format === "pdf") return sendPdf(res, `${report} Report`, rows);
  if (format === "xlsx" || format === "xls") return sendExcelCompatible(res, report, rows);
  res.header("Content-Type", "text/csv");
  res.attachment(`${report}.csv`);
  res.send(toCsv(rows));
}));

app.get("/api/notifications", authenticate, route(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    take: 20
  });
  res.json(notifications);
}));

if (process.env.NODE_ENV === "production") {
  const distPath = path.resolve(__dirname, "../dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof z.ZodError) {
    return res.status(400).json({ message: "Validation failed", issues: err.issues });
  }
  const message = err instanceof Error ? err.message : "Unexpected server error";
  console.error(err);
  res.status(500).json({ message });
});

app.listen(port, () => {
  console.log(`VYNQ API listening on http://localhost:${port}`);
});
