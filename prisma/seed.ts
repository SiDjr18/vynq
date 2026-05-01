import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, type Vendor } from "@prisma/client";

const prisma = new PrismaClient();

const roles = [
  "Admin",
  "Procurement Head",
  "Procurement Manager",
  "Buyer",
  "Vendor",
  "Finance Approver",
  "Legal Approver",
  "QCS Approver",
  "Warehouse User",
  "Viewer"
];

const permissions = [
  "dashboard", "vendors", "vendors:read", "requirements", "requirements:read", "prs", "prs:read",
  "rfqs", "rfqs:read", "qcs", "qcs:read", "pos", "pos:read", "contracts", "contracts:read",
  "catalogue", "catalogue:read", "reports", "reports:read", "settings", "grn", "grn:read",
  "asn", "asn:read", "invoice", "invoice:read", "payment", "payment:read", "matching", "matching:read"
];

const categories = ["Raw Materials", "Engineering", "Packaging", "Lab Supplies", "IT Services", "Logistics", "MRO", "Utilities", "Legal Services"];
const departments = ["RM", "Strategic Sourcing", "Finance", "QA", "Legal", "Operations", "Warehouse", "R&D", "IT"];
const statuses = [
  "Quotations Pending", "Negotiation Started", "Negotiation Scheduled", "Negotiation Cancelled",
  "Quotations Received", "Saved As Draft", "QCS Created", "QCS Pending", "QCS Approval Pending",
  "QCS Approved", "Closed"
];
const countries = ["India", "Singapore", "Germany", "United States", "United Kingdom"];
const projects = ["API Capacity Expansion", "Packaging Modernization", "Cold Chain Upgrade", "Warehouse Revamp", "QC Lab Automation", "Utilities Reliability"];

const defaultTemplateQuestions = [
  ["Supplier Specifications", "Provide supplier specification sheet", "Document", true, true, "File", 20],
  ["Supplier Make", "Confirm make or manufacturer", "Text", true, true, "Text", 10],
  ["Lead Time", "Confirm supply lead time", "Days", false, true, "Number", 15],
  ["Warranty", "Confirm warranty coverage", "Months", false, false, "Text", 10],
  ["Payment Terms", "Confirm payment terms", "Commercial", false, true, "Text", 15],
  ["Delivery Timeline", "Confirm delivery plan", "Schedule", false, true, "Date", 15],
  ["Technical Compliance", "Confirm compliance with technical requirements", "Yes/No", true, true, "Boolean", 15]
] as const;

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function money(min: number, max: number, seed: number) {
  const value = min + ((seed * 9301 + 49297) % 233280) / 233280 * (max - min);
  return Math.round(value * 100) / 100;
}

async function clear() {
  await prisma.auditLog.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.catalogueItem.deleteMany();
  await prisma.contractAmendment.deleteMany();
  await prisma.threeWayMatch.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.aSN.deleteMany();
  await prisma.gRNLineItem.deleteMany();
  await prisma.gRN.deleteMany();
  await prisma.pOLineItem.deleteMany();
  await prisma.pO.deleteMany();
  await prisma.qCSComparison.deleteMany();
  await prisma.qCSApproval.deleteMany();
  await prisma.qCS.deleteMany();
  await prisma.quotationLineItem.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.rFQLineItem.deleteMany();
  await prisma.rFQ.deleteMany();
  await prisma.rFP.deleteMany();
  await prisma.pR.deleteMany();
  await prisma.requirementVendor.deleteMany();
  await prisma.requirementDraft.deleteMany();
  await prisma.requirementTemplateQuestion.deleteMany();
  await prisma.requirementItem.deleteMany();
  await prisma.requirement.deleteMany();
  await prisma.vendorDocument.deleteMany();
  await prisma.vendorContact.deleteMany();
  await prisma.vendorCategory.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.department.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await clear();
  const permissionRows = await Promise.all(permissions.map((key) => prisma.permission.create({ data: { key, description: `${key} access` } })));
  const permissionMap = new Map(permissionRows.map((permission) => [permission.key, permission.id]));
  const roleRows = await Promise.all(roles.map((name) => prisma.role.create({ data: { name, description: `${name} role` } })));
  const roleMap = new Map(roleRows.map((role) => [role.name, role.id]));

  for (const role of roleRows) {
    const allowed = role.name === "Admin"
      ? permissions
      : permissions.filter((permission) => {
        if (role.name === "Vendor") return ["dashboard", "requirements:read", "rfqs:read", "pos:read", "asn", "invoice:read", "payment:read"].includes(permission);
        if (role.name === "Finance Approver") return permission.includes("payment") || permission.includes("invoice") || permission.includes("reports") || permission === "dashboard";
        if (role.name === "Legal Approver") return permission.includes("contracts") || permission === "dashboard" || permission === "reports:read";
        if (role.name === "Warehouse User") return permission.includes("grn") || permission.includes("asn") || permission === "dashboard" || permission === "pos:read";
        if (role.name === "Viewer") return permission.endsWith(":read") || permission === "dashboard";
        return !["settings"].includes(permission);
      });
    await prisma.rolePermission.createMany({ data: allowed.map((key) => ({ roleId: role.id, permissionId: permissionMap.get(key)! })) });
  }

  const userInputs = [
    ["admin@demo.com", "Aarav", "Admin", "Admin", "Admin@123"],
    ["head@demo.com", "Meera", "Head", "Procurement Head", "Head@123"],
    ["manager@demo.com", "Nisha", "Manager", "Procurement Manager", "Manager@123"],
    ["buyer@demo.com", "Rohan", "Buyer", "Buyer", "Buyer@123"],
    ["vendor@demo.com", "Priya", "Vendor", "Vendor", "Vendor@123"],
    ["finance@demo.com", "Kabir", "Finance", "Finance Approver", "Finance@123"],
    ["legal@demo.com", "Ira", "Legal", "Legal Approver", "Legal@123"],
    ["qcs@demo.com", "Dev", "QCS", "QCS Approver", "Qcs@123"],
    ["warehouse@demo.com", "Anya", "Warehouse", "Warehouse User", "Warehouse@123"],
    ["viewer@demo.com", "Vihaan", "Viewer", "Viewer", "Viewer@123"]
  ] as const;
  const users = [];
  for (const [email, firstName, lastName, role, password] of userInputs) {
    users.push(await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(password, 10),
        firstName,
        lastName,
        mobilePhone: "9000000000",
        companyName: "Procure360 Demo Enterprise",
        roles: { create: { roleId: roleMap.get(role)! } }
      }
    }));
  }

  for (let index = 0; index < departments.length; index += 1) {
    await prisma.department.create({ data: { name: departments[index], code: departments[index].slice(0, 3).toUpperCase(), owner: users[index % users.length].email, budget: money(500000, 9000000, index) } });
  }

  const vendors: Vendor[] = [];
  const vendorStatuses = ["Approved", "Blocked", "On Hold", "Unapproved", "Inactive"];
  for (let index = 1; index <= 100; index += 1) {
    const category = categories[index % categories.length];
    const status = vendorStatuses[index % vendorStatuses.length];
    const vendor = await prisma.vendor.create({
      data: {
        company: `${category.replace(/\s/g, "")} Partner ${String(index).padStart(3, "0")}`,
        vendorName: `Contact ${String(index).padStart(3, "0")}`,
        phone: `98${String(70000000 + index * 997).padStart(8, "0")}`,
        email: `vendor${index}@example.local`,
        vendorCodes: `VND-${String(index).padStart(5, "0")}`,
        status,
        gstNumber: `29DEMO${String(index).padStart(4, "0")}F1Z${index % 9}`,
        panNumber: `DEMO${String(index).padStart(5, "0")}X`,
        category,
        bankName: "Demo Cooperative Bank",
        accountNumber: `00098765${String(index).padStart(4, "0")}`,
        ifscCode: `FREE000${String(index).padStart(4, "0")}`,
        riskScore: 15 + (index % 80),
        contacts: { create: { name: `Contact ${index}`, email: `vendor${index}@example.local`, phone: `98${String(70000000 + index * 997).padStart(8, "0")}`, title: "Commercial Lead", isPrimary: true } },
        categories: { create: [0, 1].map((offset) => ({ category: categories[(index + offset) % categories.length], country: countries[(index + offset) % countries.length], rating: 3.1 + ((index + offset) % 19) / 10, responseRate: 55 + (index % 45), onTimeDelivery: 60 + (index % 38), priceCompetitiveness: 58 + (index % 40), qualityScore: 62 + (index % 36), complianceValidUntil: daysFromNow((index % 5 === 0 ? -20 : 90) + index) })) },
        documents: { create: [
          { type: "GST", fileName: `gst-${index}.pdf`, status: status === "Approved" ? "Verified" : "Pending" },
          { type: "PAN", fileName: `pan-${index}.pdf`, status: status === "Blocked" ? "Rejected" : "Verified" },
          { type: "Bank", fileName: `bank-${index}.pdf`, status: status === "Inactive" ? "Expired" : "Verified" }
        ] }
      }
    });
    vendors.push(vendor);
  }

  const requirements = [];
  for (let index = 1; index <= 300; index += 1) {
    const type = index % 10 === 0 ? "RFP" : index % 8 === 0 ? "Reverse Auction" : "RFQ";
    const invited = 3 + (index % 8);
    const received = index % 4 === 0 ? Math.max(1, invited - 2) : Math.max(0, invited - 1);
    const requirement = await prisma.requirement.create({
      data: {
        rfqNumber: `REQ-${String(33000 + index)}`,
        rfqType: type,
        title: `${categories[index % categories.length]} requirement ${String(index).padStart(3, "0")}`,
        postedById: users[index % users.length].id,
        postedOn: daysFromNow(-index),
        freezeTime: daysFromNow((index % 30) + 1),
        negotiationTime: daysFromNow((index % 30) + 3),
        status: statuses[index % statuses.length],
        department: departments[index % departments.length],
        urgency: ["Normal", "High", "Critical", "High: Will be closed in 2 days"][index % 4],
        description: "Dummy requirement description for safe local demo procurement data.",
        internalNotes: "Internal demo note. No confidential information.",
        deliveryTerms: "Door delivery with appointment confirmation.",
        paymentTerms: "30 days from accepted invoice.",
        incoterms: ["EXW", "FOB", "CIF", "DAP"][index % 4],
        contactDetails: "Procurement desk 9000000000",
        transactionConfig: JSON.stringify({ currency: ["INR", "USD", "EUR", "GBP"][index % 4], reminders: index % 4, biddingType: ["Sealed Bid", "Open Bid", "Reverse Auction"][index % 3] }),
        projectName: projects[index % projects.length],
        clientName: departments[(index + 2) % departments.length],
        prNumber: `PR${String(10000 + index)}`,
        qcsCode: index % 3 === 0 ? `QCS-${String(29000 + index)}` : null,
        quotationStatus: `${received} / ${invited}`,
        quotationCount: received,
        invitedVendors: invited,
        items: { create: [0, 1].map((offset) => ({ itemNo: offset + 1, productCode: `PC-${index}-${offset}`, productName: `${categories[(index + offset) % categories.length]} Item`, mpnNumber: `MPN-${index}${offset}`, quantity: 10 + index + offset, uom: offset % 2 ? "EA" : "KG", makeModel: "Generic Model", hsnCode: `28${String(500000 + index + offset)}`, deliveryAddress: "Demo warehouse address", description: "Seeded line item", freightCharges: 250 + offset * 100, insuranceCharges: 125 + offset * 50, remarks: "Dummy remarks" })) },
        templateQuestions: { create: defaultTemplateQuestions.map(([name, description, specification, isTechnical, isMandatory, vendorResponseType, weightage]) => ({ name, description, specification, isTechnical, isMandatory, vendorResponseType, weightage })) },
        vendors: { create: Array.from({ length: Math.min(invited, 6) }).map((_, offset) => ({ vendorId: vendors[(index + offset) % vendors.length].id, status: offset < received ? "Responded" : "Invited", categoryMatch: 70 + offset * 4, score: 68 + offset * 5, warnings: offset === 1 && index % 5 === 0 ? "Compliance expiring soon" : null, invitedAt: daysFromNow(-index + offset) })) },
        comments: { create: { body: "Requirement created in seeded demo workflow.", entityType: "Requirement", entityId: `REQ-${String(33000 + index)}`, userId: users[index % users.length].id } }
      }
    });
    requirements.push(requirement);
  }

  const prs = [];
  for (let index = 1; index <= 150; index += 1) {
    prs.push(await prisma.pR.create({
      data: {
        prNumber: `PR${String(10000 + index)}`,
        title: `${categories[index % categories.length]} PR ${index}`,
        department: departments[index % departments.length],
        budget: money(50000, 2500000, index),
        item: `${categories[index % categories.length]} Material`,
        quantity: 10 + index,
        urgency: ["Low", "Medium", "High", "Critical"][index % 4],
        requiredDate: daysFromNow(3 + index % 60),
        approvalStatus: ["Draft", "Pending Approval", "Approved", "Rejected", "Converted to RFQ"][index % 5],
        ownerId: users[index % users.length].id
      }
    }));
  }

  const rfqs = [];
  for (let index = 0; index < 150; index += 1) {
    const requirement = requirements[index];
    rfqs.push(await prisma.rFQ.create({
      data: {
        rfqNumber: `RFQ-${String(39000 + index + 1)}`,
        requirementId: requirement.id,
        prId: prs[index % prs.length].id,
        title: requirement.title,
        status: requirement.status,
        quotationDeadline: daysFromNow(2 + index % 30),
        freezeTime: requirement.freezeTime,
        negotiationTime: requirement.negotiationTime,
        lineItems: { create: { itemCode: `ITM-${String(index + 1).padStart(4, "0")}`, description: requirement.title, quantity: 5 + index, uom: "EA", targetPrice: money(500, 40000, index) } }
      }
    }));
  }

  for (let index = 1; index <= 30; index += 1) {
    await prisma.rFP.create({ data: { rfpNumber: `RFP-${String(41000 + index)}`, requirementId: requirements[(index * 3) % requirements.length].id, title: `Service proposal ${index}`, status: ["Draft", "Published", "Evaluation", "Closed"][index % 4], proposalDeadline: daysFromNow(index + 7) } });
  }

  for (let index = 0; index < 120; index += 1) {
    const rfq = rfqs[index % rfqs.length];
    const vendor = vendors[index % vendors.length];
    const total = money(75000, 3500000, index);
    await prisma.quotation.create({
      data: {
        rfqId: rfq.id,
        vendorId: vendor.id,
        status: ["Submitted", "Under Review", "Shortlisted", "Rejected"][index % 4],
        total,
        submittedAt: daysFromNow(-index % 20),
        lineItems: { create: { description: rfq.title, quantity: 10 + index % 8, unitPrice: total / (10 + index % 8), taxRate: 18 } }
      }
    });
  }

  for (let index = 0; index < 70; index += 1) {
    await prisma.qCS.create({
      data: {
        qcsCode: `QCS-${String(29000 + index)}`,
        rfqId: rfqs[index % rfqs.length].id,
        status: ["QCS Pending", "QCS Approval Pending", "QCS Approved"][index % 3],
        technicalScore: 70 + index % 25,
        commercialScore: 65 + index % 30,
        recommendedVendor: vendors[index % vendors.length].company,
        approvals: { create: [
          { approver: "qcs@demo.com", role: "QCS Approver", status: index % 3 === 2 ? "Approved" : "Pending" },
          { approver: "manager@demo.com", role: "Procurement Manager", status: index % 4 === 0 ? "Approved" : "Pending" }
        ] },
        comparisons: { create: [0, 1, 2].map((rank) => ({ vendorName: vendors[(index + rank) % vendors.length].company, technicalScore: 70 + rank * 6, commercialScore: 72 + rank * 5, rank: rank + 1, remarks: "Seeded comparison" })) }
      }
    });
  }

  const contracts = [];
  for (let index = 1; index <= 50; index += 1) {
    const value = money(500000, 12000000, index);
    const utilized = Math.round(value * ((index % 80) / 100));
    contracts.push(await prisma.contract.create({
      data: {
        contractNo: `CTR-${String(5000 + index)}`,
        vendorId: vendors[index % vendors.length].id,
        title: `${categories[index % categories.length]} framework agreement`,
        fileName: `contract-${index}.pdf`,
        startDate: daysFromNow(-180 - index),
        expiryDate: daysFromNow(10 + index * 7),
        renewalStatus: ["Active", "Renewal Due", "Expired", "Under Review"][index % 4],
        value,
        utilizedValue: utilized,
        balanceValue: value - utilized,
        contractType: ["Rate Contract", "Master Service", "Annual Maintenance"][index % 3],
        department: departments[index % departments.length],
        owner: users[index % users.length].email,
        status: ["Active", "Pending Approval", "Expired", "Draft"][index % 4],
        renewalRequired: index % 4 === 1,
        terms: "Dummy contract terms for local demo.",
        amendments: { create: [{ version: 1, summary: "Initial contract approval", valueChange: 0, status: "Approved" }] }
      }
    }));
  }

  const pos = [];
  for (let index = 1; index <= 100; index += 1) {
    const totalAmount = money(100000, 4500000, index);
    pos.push(await prisma.pO.create({
      data: {
        poNumber: `PO${String(22000 + index)}`,
        vendorId: vendors[index % vendors.length].id,
        prNumber: prs[index % prs.length].prNumber,
        title: `Purchase order ${index}`,
        totalAmount,
        status: ["Draft", "Pending Approval", "Active", "Acknowledged", "Delivered", "Closed"][index % 6],
        approvalStatus: ["Pending", "Approved", "Finance Review"][index % 3],
        acknowledgedAt: index % 3 === 0 ? daysFromNow(-index) : null,
        deliveryDate: daysFromNow(7 + index % 45),
        department: departments[index % departments.length],
        contractId: contracts[index % contracts.length].id,
        lineItems: { create: [{ itemCode: `PO-ITM-${index}`, description: "Seeded PO line", quantity: 10 + index, uom: "EA", unitPrice: totalAmount / (10 + index) }] }
      }
    }));
  }

  const grns = [];
  for (let index = 1; index <= 80; index += 1) {
    const po = pos[index % pos.length];
    grns.push(await prisma.gRN.create({
      data: {
        grnNumber: `GRN-${String(7000 + index)}`,
        poId: po.id,
        status: index % 3 === 0 ? "Closed" : "Open",
        receivedDate: daysFromNow(-index % 30),
        quantityReceived: 20 + index,
        quantityRejected: index % 5,
        remarks: "Demo GRN",
        lineItems: { create: { itemCode: `PO-ITM-${index}`, quantityReceived: 20 + index, quantityRejected: index % 5, remarks: "Accepted with demo inspection" } }
      }
    }));
  }

  const invoices = [];
  for (let index = 1; index <= 60; index += 1) {
    const po = pos[index % pos.length];
    invoices.push(await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${String(8000 + index)}`,
        poId: po.id,
        vendorId: po.vendorId,
        grnId: grns[index % grns.length]?.id,
        status: ["Submitted", "Under Review", "Approved", "Rejected", "Paid"][index % 5],
        amount: Math.round(po.totalAmount * (0.7 + (index % 20) / 100)),
        submittedAt: daysFromNow(-index),
        dueDate: daysFromNow(10 + index),
        fileName: `invoice-${index}.pdf`
      }
    }));
  }

  for (let index = 1; index <= 90; index += 1) {
    const po = pos[index % pos.length];
    await prisma.aSN.create({ data: { asnNumber: `ASN-${String(9000 + index)}`, poId: po.id, vendorId: po.vendorId, status: ["Pending ASN", "Submitted", "In Transit", "Delivered"][index % 4], deliveryDate: daysFromNow(index % 30), trackingRef: `TRK-${index}`, shipmentNote: "Mock shipment tracking" } });
  }

  for (let index = 1; index <= 40; index += 1) {
    const invoice = invoices[index % invoices.length];
    await prisma.payment.create({ data: { paymentNumber: `PAY-${String(1000 + index)}`, poId: invoice.poId, invoiceId: invoice.id, status: ["Pending", "Scheduled", "Part Paid", "Paid"][index % 4], dueDate: invoice.dueDate, paidAmount: index % 4 === 3 ? invoice.amount : Math.round(invoice.amount * 0.4), pendingAmount: index % 4 === 3 ? 0 : Math.round(invoice.amount * 0.6), paymentReference: index % 4 === 3 ? `REF-${index}` : null } });
  }

  const matchStatuses = ["Matched", "Quantity mismatch", "Price mismatch", "Pending GRN", "Pending Invoice"];
  for (let index = 1; index <= 90; index += 1) {
    const po = pos[index % pos.length];
    await prisma.threeWayMatch.create({ data: { poId: po.id, grnId: grns[index % grns.length]?.id, invoiceId: invoices[index % invoices.length]?.id, status: matchStatuses[index % matchStatuses.length], exception: index % 5 === 0 ? "Seeded exception report" : null, decidedAt: index % 2 === 0 ? daysFromNow(-index % 10) : null } });
  }

  for (let index = 1; index <= 120; index += 1) {
    await prisma.catalogueItem.create({ data: { itemCode: `CAT-${String(index).padStart(4, "0")}`, name: `${categories[index % categories.length]} catalogue item ${index}`, category: categories[index % categories.length], uom: index % 2 ? "EA" : "KG", vendorId: vendors[index % vendors.length].id, currentPrice: money(500, 85000, index), previousPrice: money(500, 90000, index + 3), isActive: index % 7 !== 0 } });
  }

  for (const user of users) {
    await prisma.notification.createMany({ data: [
      { userId: user.id, title: "QCS approval pending", message: "A comparison sheet is waiting for review.", type: "Approval" },
      { userId: user.id, title: "Contract expiry alert", message: "One contract is expiring within 30 days.", type: "Alert" },
      { userId: user.id, title: "Three way match exception", message: "A PO/GRN/Invoice exception requires attention.", type: "Exception" }
    ] });
  }

  await prisma.auditLog.createMany({ data: [
    { userId: users[0].id, action: "SEED", entity: "Database", entityId: "seed", metadata: "Initial advanced local demo data" },
    { userId: users[3].id, action: "RFQ_PUBLISHED", entity: "Requirement", entityId: requirements[0].id, metadata: "Seed publish event" },
    { userId: users[5].id, action: "INVOICE_MATCHED", entity: "ThreeWayMatch", entityId: "seed-match", metadata: "Seed matching event" }
  ] });

  console.log("Advanced seed complete");
  console.log("Login: admin@demo.com / Admin@123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
