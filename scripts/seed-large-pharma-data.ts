import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const INDUSTRY = "CDMO / Pharma";

type CategorySpec = {
  category: string;
  count: number;
  subCategories: string[];
  baseNames: string[];
  uoms: string[];
  materialType: string;
  manufacturerType: string;
  vendorType: string;
  hsnPrefix: string;
};

const categorySpecs: CategorySpec[] = [
  {
    category: "Active Pharmaceutical Ingredients / APIs",
    count: 400,
    subCategories: ["Analgesic API", "Antidiabetic API", "Cardiovascular API", "Gastro API", "Antibiotic API", "SGLT2 API"],
    baseNames: ["Paracetamol API Pharma Grade", "Metformin Hydrochloride API", "Atorvastatin Calcium API", "Pantoprazole Sodium Sesquihydrate", "Cefuroxime Axetil API", "Telmisartan API", "Cilostazol API", "Dapagliflozin Propanediol API"],
    uoms: ["KG"],
    materialType: "Drug Substance",
    manufacturerType: "API Manufacturer",
    vendorType: "API Distributor",
    hsnPrefix: "2942"
  },
  {
    category: "API Intermediates",
    count: 350,
    subCategories: ["Heterocyclic Intermediate", "Protected Intermediate", "Side Chain Intermediate", "Chloro Intermediate", "Amino Acid Intermediate"],
    baseNames: ["Benzimidazole Intermediate Grade A", "Pyridine Intermediate Pharma Grade", "Chloro Acetyl Intermediate", "Protected Amino Acid Intermediate", "Statin Side Chain Intermediate"],
    uoms: ["KG"],
    materialType: "API Intermediate",
    manufacturerType: "API Intermediate Manufacturer",
    vendorType: "CDMO Supply Partner",
    hsnPrefix: "2933"
  },
  {
    category: "Excipients",
    count: 350,
    subCategories: ["Diluent", "Binder", "Disintegrant", "Lubricant", "Film Former"],
    baseNames: ["Lactose Monohydrate Pharma Grade", "Microcrystalline Cellulose PH102", "Povidone K30", "Crospovidone Type A", "Magnesium Stearate Pharma Grade", "Sodium Starch Glycolate", "Croscarmellose Sodium", "Hydroxypropyl Methylcellulose"],
    uoms: ["KG"],
    materialType: "Excipient",
    manufacturerType: "Excipient Manufacturer",
    vendorType: "Excipient Distributor",
    hsnPrefix: "3912"
  },
  {
    category: "Solvents",
    count: 250,
    subCategories: ["Alcohol Solvent", "Ketone Solvent", "Ester Solvent", "Chlorinated Solvent", "Aromatic Solvent"],
    baseNames: ["Methanol Pharma Grade", "Ethanol IP Grade", "Isopropyl Alcohol Pharma Grade", "Acetone Pharma Grade", "Dichloromethane Pharma Grade", "Ethyl Acetate Pharma Grade", "Toluene Pharma Grade"],
    uoms: ["LTR", "KG"],
    materialType: "Pharma Solvent",
    manufacturerType: "Pharma Solvent Manufacturer",
    vendorType: "Solvent Supplier",
    hsnPrefix: "2905"
  },
  {
    category: "Reagents & Catalysts",
    count: 250,
    subCategories: ["Catalyst", "Reducing Agent", "Acid Reagent", "Base Reagent", "Organic Reagent"],
    baseNames: ["Palladium Carbon Catalyst", "Sodium Borohydride", "Hydrochloric Acid AR Grade", "Sodium Hydroxide Pellets", "Potassium Carbonate", "Triethylamine", "Acetic Anhydride"],
    uoms: ["KG", "LTR"],
    materialType: "Reagent",
    manufacturerType: "API Intermediate Manufacturer",
    vendorType: "Reagent Supplier",
    hsnPrefix: "2815"
  },
  {
    category: "Primary Packaging Materials",
    count: 400,
    subCategories: ["Glass Container", "HDPE Container", "Closure", "Blister Material", "Sterile Primary Pack"],
    baseNames: ["Type-I Glass Vial 10ml", "Type-I Glass Vial 20ml", "Amber Glass Bottle 100ml", "HDPE Bottle 60ml", "HDPE Bottle 100ml", "Aluminum Flip-Off Seal 20mm", "Rubber Stopper 20mm", "PVC Blister Film", "Alu-Alu Foil", "Cold Form Blister Foil"],
    uoms: ["EA", "ROLL", "NOS"],
    materialType: "Primary Packaging",
    manufacturerType: "Primary Packaging Manufacturer",
    vendorType: "Packaging Supplier",
    hsnPrefix: "7010"
  },
  {
    category: "Secondary Packaging Materials",
    count: 300,
    subCategories: ["Carton", "Leaflet", "Shipper", "Label", "Insert"],
    baseNames: ["Printed Mono Carton", "Patient Information Leaflet", "Corrugated Shipper Box", "Product Label Roll", "Tamper Evident Label", "Printed Catch Cover", "Pharma Grade Insert Leaflet"],
    uoms: ["EA", "ROLL", "NOS"],
    materialType: "Secondary Packaging",
    manufacturerType: "Secondary Packaging Manufacturer",
    vendorType: "Packaging Supplier",
    hsnPrefix: "4819"
  },
  {
    category: "Sterile Manufacturing Consumables",
    count: 250,
    subCategories: ["Sterile Filter", "Sterile Transfer", "Cleanroom PPE", "Sterile Tubing", "Single Use Assembly"],
    baseNames: ["Sterile Syringe Filter 0.22 Micron", "Sterile Transfer Bag", "Sterile Sampling Bottle", "Cleanroom Gloves Nitrile", "Sterile Garment Set", "Sterile Tubing Set", "Single Use Bioreactor Bag"],
    uoms: ["EA", "PACK", "SET"],
    materialType: "Sterile Consumable",
    manufacturerType: "Sterile Consumables Manufacturer",
    vendorType: "Cleanroom Consumables Supplier",
    hsnPrefix: "3926"
  },
  {
    category: "Biologics / Bioprocess Materials",
    count: 200,
    subCategories: ["Cell Culture", "Chromatography", "Filtration", "Single Use Bioprocess", "Buffer"],
    baseNames: ["Cell Culture Media Powder", "Protein A Resin", "Chromatography Buffer", "Single Use Bioprocess Bag", "Sterile Connector", "Viral Filter", "TFF Cassette"],
    uoms: ["KG", "LTR", "EA"],
    materialType: "Bioprocess Material",
    manufacturerType: "Bioprocess Material Manufacturer",
    vendorType: "Bioprocess Supplier",
    hsnPrefix: "3822"
  },
  {
    category: "Quality Control / Lab Materials",
    count: 150,
    subCategories: ["Chromatography", "Reference Standard", "Glassware", "Lab Consumable", "Buffer Standard"],
    baseNames: ["HPLC Column C18", "Reference Standard", "Working Standard", "Volumetric Flask Class A", "HPLC Vial", "GC Column", "pH Buffer Solution"],
    uoms: ["EA", "PACK", "ML"],
    materialType: "QC Lab Material",
    manufacturerType: "QC Lab Material Manufacturer",
    vendorType: "Lab Material Supplier",
    hsnPrefix: "9027"
  },
  {
    category: "Engineering & Cleanroom Consumables",
    count: 100,
    subCategories: ["Cleanroom HVAC", "Cleanroom Cleaning", "SS316L Component", "Tri-Clamp Component", "Contamination Control"],
    baseNames: ["HEPA Filter", "Cleanroom Mop", "IPA Wipes", "SS316L Gasket", "Tri-Clamp Fitting", "Cleanroom Sticky Mat"],
    uoms: ["EA", "PACK", "SET"],
    materialType: "Cleanroom Consumable",
    manufacturerType: "Cleanroom Consumables Manufacturer",
    vendorType: "Engineering Consumables Supplier",
    hsnPrefix: "8421"
  }
];

const roles = ["Admin", "Procurement Head", "Procurement Manager", "Buyer", "Vendor", "Finance Approver", "Legal Approver", "QCS Approver", "Warehouse User", "Viewer"];
const permissions = [
  "dashboard", "vendors", "vendors:read", "requirements", "requirements:read", "prs", "prs:read", "rfqs", "rfqs:read",
  "qcs", "qcs:read", "pos", "pos:read", "contracts", "contracts:read", "catalogue", "catalogue:read", "reports", "reports:read",
  "settings", "grn", "grn:read", "asn", "asn:read", "invoice", "invoice:read", "payment", "payment:read", "matching", "matching:read",
  "materials", "materials:read", "manufacturers", "manufacturers:read", "supply-network", "supply-network:read", "data-connectors", "data-connectors:read"
];

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function money(min: number, max: number, seed: number) {
  const value = min + (((seed * 9301 + 49297) % 233280) / 233280) * (max - min);
  return Math.round(value * 100) / 100;
}

function code(prefix: number, index: number) {
  return String(prefix + index).padStart(6, "0");
}

function chunk<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

async function createMany<T>(label: string, rows: T[], writer: (rows: T[]) => Promise<unknown>, size = 800) {
  for (const part of chunk(rows, size)) await writer(part);
  console.log(`${label}: ${rows.length}`);
}

async function clear() {
  await prisma.dataIngestionError.deleteMany();
  await prisma.dataIngestionLog.deleteMany();
  await prisma.dataConnector.deleteMany();
  await prisma.vendorSupplyMapping.deleteMany();
  await prisma.materialManufacturer.deleteMany();
  await prisma.material.deleteMany();
  await prisma.manufacturer.deleteMany();
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

async function seedSecurity() {
  const permissionRows = await Promise.all(permissions.map((key) => prisma.permission.create({ data: { key, description: `${key} access` } })));
  const permissionMap = new Map(permissionRows.map((permission) => [permission.key, permission.id]));
  const roleRows = await Promise.all(roles.map((name) => prisma.role.create({ data: { name, description: `${name} role` } })));
  const roleMap = new Map(roleRows.map((role) => [role.name, role.id]));
  for (const role of roleRows) {
    const allowed = role.name === "Admin" ? permissions : permissions.filter((permission) => {
      if (role.name === "Viewer") return permission.endsWith(":read") || permission === "dashboard";
      if (role.name === "Vendor") return ["dashboard", "requirements:read", "rfqs:read", "pos:read", "materials:read", "supply-network:read"].includes(permission);
      return permission !== "settings";
    });
    await prisma.rolePermission.createMany({ data: allowed.map((key) => ({ roleId: role.id, permissionId: permissionMap.get(key)! })) });
  }
  const userInputs = [
    ["admin@demo.com", "Sidhartha", "Admin", "Admin", "Admin@123"],
    ["buyer@demo.com", "Buyer", "Demo", "Buyer", "Buyer@123"],
    ["vendor@demo.com", "Vendor", "Demo", "Vendor", "Vendor@123"],
    ["finance@demo.com", "Finance", "Demo", "Finance Approver", "Finance@123"],
    ["warehouse@demo.com", "Warehouse", "Demo", "Warehouse User", "Warehouse@123"],
    ["viewer@demo.com", "Viewer", "Demo", "Viewer", "Viewer@123"]
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
        companyName: "VYNQ Demo Enterprise",
        roles: { create: { roleId: roleMap.get(role)! } }
      }
    }));
  }
  return users;
}

async function main() {
  await clear();
  const users = await seedSecurity();
  const adminId = users[0].id;
  await prisma.department.createMany({
    data: ["API Sourcing", "Formulation Sourcing", "Quality Control", "Sterile Manufacturing", "Biologics", "Engineering"].map((name, index) => ({
      name,
      code: `PH${index + 1}`,
      owner: "admin@demo.com",
      budget: money(5_000_000, 90_000_000, index)
    }))
  });

  const materials = [];
  let materialIndex = 0;
  for (const spec of categorySpecs) {
    for (let local = 1; local <= spec.count; local += 1) {
      materialIndex += 1;
      const base = spec.baseNames[(local - 1) % spec.baseNames.length];
      materials.push({
        materialCode: String(1_000_000_000 + materialIndex),
        materialName: `${base} Demo ${String(local).padStart(4, "0")}`,
        description: `${base} generated dummy CDMO / Pharma procurement material.`,
        industry: INDUSTRY,
        category: spec.category,
        subCategory: spec.subCategories[(local - 1) % spec.subCategories.length],
        uom: spec.uoms[(local - 1) % spec.uoms.length],
        materialType: spec.materialType,
        specification: `${spec.materialType}; pharma procurement specification; assay and compliance documents required.`,
        hsnCode: `${spec.hsnPrefix}${String(1000 + (local % 8999))}`,
        criticality: ["High", "Medium", "Low", "Critical"][local % 4],
        storageCondition: ["Controlled Room Temperature", "2-8C Refrigerated", "Store below 25C", "Nitrogen Blanketed", "Dry Protected"][local % 5],
        regulatoryCategory: ["GMP", "DMF Available", "CEP Available", "Pharma Grade", "Compendial"][local % 5],
        pharmaGrade: ["IP", "USP", "EP", "JP", "In-house Pharma Grade"][local % 5],
        shelfLifeMonths: 12 + (local % 49),
        activeStatus: "Active"
      });
    }
  }
  await createMany("Materials created", materials, (rows) => prisma.material.createMany({ data: rows }));
  const materialRows = await prisma.material.findMany({ orderBy: { materialCode: "asc" } });
  const materialByCode = new Map(materialRows.map((material) => [material.materialCode, material]));

  const manufacturerRows = [];
  const manufacturersPerType = new Map<string, number>();
  for (const spec of categorySpecs) {
    manufacturersPerType.set(spec.manufacturerType, 0);
  }
  for (let index = 1; index <= 1500; index += 1) {
    const spec = categorySpecs[index % categorySpecs.length];
    const typeCount = (manufacturersPerType.get(spec.manufacturerType) || 0) + 1;
    manufacturersPerType.set(spec.manufacturerType, typeCount);
    manufacturerRows.push({
      manufacturerCode: code(500000, index),
      manufacturerName: `${spec.manufacturerType.replace(" Manufacturer", "")} Demo Maker ${String(typeCount).padStart(4, "0")}`,
      manufacturerShortName: `MFG${String(index).padStart(4, "0")}`,
      manufacturerType: spec.manufacturerType,
      industry: INDUSTRY,
      addressLine1: `Demo Pharma Industrial Park ${index}`,
      addressLine2: `Block ${index % 20}`,
      city: ["Hyderabad", "Ahmedabad", "Pune", "Bengaluru", "Visakhapatnam"][index % 5],
      state: ["Telangana", "Gujarat", "Maharashtra", "Karnataka", "Andhra Pradesh"][index % 5],
      country: "India",
      pincode: String(500000 + (index % 99999)).padStart(6, "0"),
      contactPerson: `Manufacturer Contact ${index}`,
      contactEmail: `manufacturer${index}@example.local`,
      contactPhone: `91${String(8000000000 + index).slice(0, 10)}`,
      qualityCertification: ["WHO-GMP", "USFDA Registered", "EU-GMP", "ISO 9001", "EXCiPACT"][index % 5],
      regulatoryCertification: ["DMF Available", "CEP Available", "GMP Certified", "USFDA Registered", "EU-GMP"][index % 5],
      complianceStatus: ["Compliant", "Compliant", "Compliant", "Pending Review", "Expiring Soon"][index % 5],
      manufacturingCapacity: `${500 + (index % 9000)} ${spec.uoms[0]} / month`,
      leadTimeDays: 14 + (index % 75),
      rating: Number((3.4 + (index % 16) / 10).toFixed(1)),
      activeStatus: "Active"
    });
  }
  await createMany("Manufacturers created", manufacturerRows, (rows) => prisma.manufacturer.createMany({ data: rows }));
  const manufacturerMasters = await prisma.manufacturer.findMany();
  const manufacturersByType = new Map<string, typeof manufacturerMasters>();
  for (const manufacturer of manufacturerMasters) {
    const list = manufacturersByType.get(manufacturer.manufacturerType) || [];
    list.push(manufacturer);
    manufacturersByType.set(manufacturer.manufacturerType, list);
  }

  const vendors = [];
  for (let index = 1; index <= 3000; index += 1) {
    const spec = categorySpecs[index % categorySpecs.length];
    const vendorCode = code(700000, index);
    vendors.push({
      company: `${spec.vendorType.replace(" Supplier", "").replace(" Distributor", "")} Demo Vendor ${String(index).padStart(4, "0")}`,
      vendorName: `${spec.vendorType.replace(" Supplier", "").replace(" Distributor", "")} Demo Vendor ${String(index).padStart(4, "0")}`,
      vendorCode,
      vendorCodes: vendorCode,
      vendorType: spec.vendorType,
      industry: INDUSTRY,
      phone: `91${String(7000000000 + index).slice(0, 10)}`,
      email: `vendor${index}@example.local`,
      addressLine1: `Demo Pharma Supply Estate ${index}`,
      addressLine2: `Unit ${index % 99}`,
      city: ["Mumbai", "Hyderabad", "Ahmedabad", "Pune", "Chennai"][index % 5],
      state: ["Maharashtra", "Telangana", "Gujarat", "Maharashtra", "Tamil Nadu"][index % 5],
      country: "India",
      pincode: String(400000 + (index % 99999)).padStart(6, "0"),
      contactPerson: `Vendor Contact ${index}`,
      contactEmail: `vendor${index}@example.local`,
      contactPhone: `91${String(7000000000 + index).slice(0, 10)}`,
      taxId: `GSTDEMO${String(index).padStart(6, "0")}`,
      businessRegistrationNo: `PANDEMO${String(index).padStart(5, "0")}`,
      paymentTerms: ["30 days", "45 days", "60 days", "Advance 20%"][index % 4],
      deliveryTerms: ["DAP Site", "Ex Works", "Door Delivery", "Cold Chain Delivery"][index % 4],
      creditDays: [30, 45, 60, 15][index % 4],
      vendorRating: Number((3.3 + (index % 17) / 10).toFixed(1)),
      responseRate: 60 + (index % 39),
      onTimeDeliveryRate: 62 + (index % 36),
      qualityScore: 65 + (index % 34),
      complianceStatus: ["Compliant", "Compliant", "Compliant", "Pending Review", "Non-Compliant"][index % 5],
      blacklistedStatus: index % 97 === 0,
      activeStatus: index % 83 === 0 ? "Inactive" : "Active",
      preferredVendorFlag: index % 6 === 0,
      status: index % 97 === 0 ? "Blocked" : "Approved",
      gstNumber: `GSTDEMO${String(index).padStart(6, "0")}`,
      panNumber: `PANDEMO${String(index).padStart(5, "0")}`,
      category: spec.category,
      bankName: "Demo Local Bank",
      accountNumber: `000000${String(index).padStart(8, "0")}`,
      ifscCode: `DEMO${String(index).padStart(7, "0")}`,
      riskScore: index % 100
    });
  }
  await createMany("Vendors created", vendors, (rows) => prisma.vendor.createMany({ data: rows }), 600);
  const vendorMasters = await prisma.vendor.findMany();

  const materialManufacturerRows = [];
  for (let index = 0; index < materialRows.length; index += 1) {
    const material = materialRows[index];
    const spec = categorySpecs.find((entry) => entry.category === material.category)!;
    const typeManufacturers = manufacturersByType.get(spec.manufacturerType)!;
    for (let slot = 0; slot < 5; slot += 1) {
      const manufacturer = typeManufacturers[(index * 5 + slot) % typeManufacturers.length];
      materialManufacturerRows.push({
        materialId: material.id,
        manufacturerId: manufacturer.id,
        materialCode: material.materialCode,
        manufacturerCode: manufacturer.manufacturerCode,
        manufacturerPartNo: `MPN-${material.materialCode}-${slot + 1}`,
        manufacturerMaterialGrade: material.pharmaGrade,
        approvalStatus: slot < 4 ? "Approved" : "Qualified",
        qualityStatus: slot === 4 && index % 9 === 0 ? "Under Review" : "Approved",
        leadTimeDays: manufacturer.leadTimeDays,
        moq: 10 + ((index + slot) % 90)
      });
    }
  }
  await createMany("Material-Manufacturer mappings created", materialManufacturerRows, (rows) => prisma.materialManufacturer.createMany({ data: rows }), 700);
  const materialManufacturerMasters = await prisma.materialManufacturer.findMany();

  const supplyRows = [];
  for (let index = 0; index < materialManufacturerMasters.length; index += 1) {
    const link = materialManufacturerMasters[index];
    const material = materialByCode.get(link.materialCode)!;
    const spec = categorySpecs.find((entry) => entry.category === material.category)!;
    const matchingVendors = vendorMasters.filter((vendor) => vendor.vendorType === spec.vendorType);
    const count = 3 + (index % 2);
    for (let slot = 0; slot < count; slot += 1) {
      const vendor = matchingVendors[(index * 4 + slot) % matchingVendors.length];
      const price = money(120, 95_000, index + slot);
      supplyRows.push({
        materialId: link.materialId,
        manufacturerId: link.manufacturerId,
        vendorId: vendor.id,
        materialCode: link.materialCode,
        manufacturerCode: link.manufacturerCode,
        vendorCode: vendor.vendorCode!,
        supplyPrice: price,
        currency: ["INR", "USD", "EUR"][index % 3],
        moq: link.moq + slot * 5,
        leadTimeDays: Math.max(7, link.leadTimeDays - slot * 2),
        annualCapacity: `${1000 + (index % 9000)} ${material.uom}`,
        lastQuotedPrice: Number((price * 1.03).toFixed(2)),
        lastPurchasePrice: Number((price * 0.98).toFixed(2)),
        priceValidityDate: daysFromNow(30 + (index % 180)),
        preferredRank: slot + 1,
        supplyStatus: vendor.blacklistedStatus ? "Blocked" : vendor.complianceStatus === "Non-Compliant" ? "Compliance Risk" : "Approved",
        lastTransactionDate: daysFromNow(-(index % 365))
      });
    }
  }
  await createMany("Vendor supply mappings created", supplyRows, (rows) => prisma.vendorSupplyMapping.createMany({ data: rows }), 700);

  const requirements = [];
  for (let index = 1; index <= 1000; index += 1) {
    const material = materialRows[(index * 7) % materialRows.length];
    const count = await prisma.requirement.count();
    requirements.push(await prisma.requirement.create({
      data: {
        rfqNumber: `PH-RFQ-${String(500000 + count + 1)}`,
        rfqType: index % 5 === 0 ? "RFP" : "RFQ",
        title: `${material.materialName} procurement`,
        postedById: adminId,
        postedOn: daysFromNow(-index),
        freezeTime: daysFromNow(3 + (index % 30)),
        negotiationTime: daysFromNow(5 + (index % 30)),
        status: ["Quotations Pending", "QCS Pending", "QCS Approval Pending", "QCS Approved", "Closed"][index % 5],
        department: ["API Sourcing", "Quality Control", "Sterile Manufacturing", "Biologics"][index % 4],
        urgency: ["Normal", "High", "Critical"][index % 3],
        description: "CDMO / Pharma dummy requirement generated from material repository.",
        deliveryTerms: "Door delivery with pharma compliance documents.",
        paymentTerms: "45 days from accepted invoice.",
        incoterms: "DAP",
        contactDetails: "VYNQ procurement desk 9000000000",
        transactionConfig: JSON.stringify({ currency: "INR", repositoryDriven: true }),
        projectName: "CDMO Demo Program",
        clientName: "VYNQ Demo Enterprise",
        prNumber: `PH-PR-${String(100000 + index)}`,
        qcsCode: index % 4 === 0 ? `PH-QCS-${String(200000 + index)}` : null,
        quotationStatus: "3 / 5",
        quotationCount: 3,
        invitedVendors: 5,
        items: {
          create: {
            itemNo: 1,
            materialCode: material.materialCode,
            materialName: material.materialName,
            productCode: material.materialCode,
            productName: material.materialName,
            quantity: 25 + (index % 200),
            uom: material.uom,
            hsnCode: material.hsnCode,
            description: material.specification,
            remarks: "Repository auto-captured line item"
          }
        },
        templateQuestions: {
          create: [
            { name: "Regulatory Compliance", description: "Confirm GMP/DMF/CEP support", specification: material.regulatoryCategory, isTechnical: true, isMandatory: true, vendorResponseType: "Text", weightage: 25 },
            { name: "Lead Time", description: "Confirm supply lead time", specification: "Days", isTechnical: false, isMandatory: true, vendorResponseType: "Number", weightage: 15 }
          ]
        }
      }
    }));
  }

  const rfqs = [];
  for (let index = 0; index < 1000; index += 1) {
    const requirement = requirements[index];
    const material = materialRows[(index * 7) % materialRows.length];
    rfqs.push(await prisma.rFQ.create({
      data: {
        rfqNumber: `RFQ-${String(800000 + index + 1)}`,
        requirementId: requirement.id,
        title: requirement.title,
        status: requirement.status,
        quotationDeadline: daysFromNow(4 + (index % 28)),
        freezeTime: requirement.freezeTime,
        negotiationTime: requirement.negotiationTime,
        lineItems: { create: { materialCode: material.materialCode, itemCode: material.materialCode, description: material.materialName, quantity: 10 + (index % 90), uom: material.uom, targetPrice: money(1000, 400000, index) } }
      }
    }));
  }

  for (let index = 0; index < 3000; index += 1) {
    const rfq = rfqs[index % rfqs.length];
    const mapping = supplyRows[index % supplyRows.length];
    const vendor = vendorMasters.find((entry) => entry.vendorCode === mapping.vendorCode)!;
    await prisma.quotation.create({
      data: {
        rfqId: rfq.id,
        vendorId: vendor.id,
        status: ["Submitted", "Shortlisted", "Under Review"][index % 3],
        total: mapping.supplyPrice * (10 + (index % 90)),
        submittedAt: daysFromNow(-(index % 90)),
        lineItems: { create: { description: `${mapping.materialCode} pharma quotation`, quantity: 10 + (index % 90), unitPrice: mapping.supplyPrice, taxRate: 18 } }
      }
    });
  }

  const pos = [];
  for (let index = 0; index < 500; index += 1) {
    const mapping = supplyRows[index % supplyRows.length];
    const vendor = vendorMasters.find((entry) => entry.vendorCode === mapping.vendorCode)!;
    pos.push(await prisma.pO.create({
      data: {
        poNumber: `PH-PO-${String(300000 + index + 1)}`,
        vendorId: vendor.id,
        prNumber: `PH-PR-${String(100000 + index + 1)}`,
        title: `${mapping.materialCode} pharma PO`,
        totalAmount: mapping.lastPurchasePrice * mapping.moq,
        status: ["Issued", "Acknowledged", "Part Delivered", "Closed"][index % 4],
        approvalStatus: ["Approved", "Pending", "Approved"][index % 3],
        deliveryDate: daysFromNow(10 + (index % 80)),
        department: ["API Sourcing", "Quality Control", "Sterile Manufacturing", "Biologics"][index % 4],
        lineItems: { create: { materialCode: mapping.materialCode, itemCode: mapping.materialCode, description: `${mapping.materialCode} repository PO line`, quantity: mapping.moq, uom: "KG", unitPrice: mapping.lastPurchasePrice } }
      }
    }));
  }

  for (let index = 0; index < 300; index += 1) {
    const mapping = supplyRows[index % supplyRows.length];
    const vendor = vendorMasters.find((entry) => entry.vendorCode === mapping.vendorCode)!;
    await prisma.contract.create({
      data: {
        contractNo: `PH-CTR-${String(600000 + index + 1)}`,
        vendorId: vendor.id,
        title: `${mapping.materialCode} pharma supply agreement`,
        fileName: `pharma-contract-${index + 1}.pdf`,
        startDate: daysFromNow(-120 - index),
        expiryDate: daysFromNow(60 + index),
        renewalStatus: ["Active", "Renewal Due", "Under Review"][index % 3],
        value: mapping.supplyPrice * 1000,
        utilizedValue: mapping.supplyPrice * (200 + (index % 600)),
        balanceValue: mapping.supplyPrice * (400 + (index % 400)),
        contractType: "Pharma Rate Contract",
        department: "API Sourcing",
        owner: "Sidhartha Admin",
        status: "Active",
        terms: "Dummy CDMO / Pharma supply terms.",
        amendments: { create: { version: 1, summary: "Repository-generated pharma contract", status: "Approved" } }
      }
    });
  }

  const grns = [];
  for (let index = 0; index < 400; index += 1) {
    const po = pos[index % pos.length];
    grns.push(await prisma.gRN.create({
      data: {
        grnNumber: `PH-GRN-${String(700000 + index + 1)}`,
        poId: po.id,
        status: index % 3 === 0 ? "Closed" : "Open",
        receivedDate: daysFromNow(-(index % 120)),
        quantityReceived: 80 + (index % 300),
        quantityRejected: index % 9,
        remarks: "Generated pharma GRN",
        lineItems: { create: { itemCode: po.poNumber, quantityReceived: 80 + (index % 300), quantityRejected: index % 9 } }
      }
    }));
  }

  const invoices = [];
  for (let index = 0; index < 600; index += 1) {
    const po = pos[index % pos.length];
    invoices.push(await prisma.invoice.create({
      data: {
        invoiceNumber: `PH-INV-${String(900000 + index + 1)}`,
        poId: po.id,
        vendorId: po.vendorId,
        status: ["Submitted", "Matched", "Pending GRN", "Price mismatch"][index % 4],
        amount: po.totalAmount,
        submittedAt: daysFromNow(-(index % 100)),
        dueDate: daysFromNow(15 + (index % 80)),
        fileName: `invoice-${index + 1}.pdf`
      }
    }));
  }

  for (let index = 0; index < 250; index += 1) {
    const po = pos[index % pos.length];
    const invoice = invoices[index % invoices.length];
    await prisma.payment.create({
      data: {
        paymentNumber: `PH-PAY-${String(950000 + index + 1)}`,
        poId: po.id,
        invoiceId: invoice.id,
        status: ["Pending", "Scheduled", "Paid", "Part Paid"][index % 4],
        dueDate: invoice.dueDate,
        paidAmount: index % 4 === 2 ? invoice.amount : Math.round(invoice.amount * 0.25),
        pendingAmount: index % 4 === 2 ? 0 : Math.round(invoice.amount * 0.75),
        paymentReference: `PAYREF-${index + 1}`
      }
    });
  }

  for (let index = 0; index < 300; index += 1) {
    await prisma.threeWayMatch.create({
      data: {
        poId: pos[index % pos.length].id,
        grnId: grns[index % grns.length].id,
        invoiceId: invoices[index % invoices.length].id,
        status: ["Matched", "Quantity mismatch", "Price mismatch", "Pending GRN", "Pending Invoice"][index % 5],
        exception: index % 5 === 0 ? null : "Generated demo exception"
      }
    });
  }

  const connector = await prisma.dataConnector.create({
    data: {
      connectorName: "Local Pharma Material Mock API",
      industry: INDUSTRY,
      baseUrl: "local://mock-api",
      endpointPath: "/mock/pharma-materials.json",
      method: "GET",
      authType: "None",
      headersJson: "{}",
      queryParamsJson: "{}",
      fieldMappingJson: JSON.stringify({ materialCode: "materialCode", materialName: "materialName", vendorCode: "vendorCode" }),
      refreshFrequency: "Manual",
      activeStatus: "Active"
    }
  });
  await prisma.dataIngestionLog.create({
    data: { connectorId: connector.id, completedAt: new Date(), totalRecords: 25, importedRecords: 25, failedRecords: 0, status: "Success" }
  });

  await prisma.auditLog.create({
    data: { userId: adminId, action: "PHARMA_SEED_COMPLETED", entity: "Material", entityId: "CDMO_PHARMA", metadata: JSON.stringify({ materials: 3000, vendorSupplyMappings: supplyRows.length }) }
  });

  console.log("Seed completed successfully:");
  console.log("- Industry: CDMO / Pharma only");
  console.log("- Materials created: 3000");
  console.log("- First material code: 1000000001");
  console.log("- Last material code: 1000003000");
  console.log("- Material-Manufacturer mappings created: 15000");
  console.log(`- Manufacturers created: ${manufacturerRows.length}`);
  console.log(`- Vendors created: ${vendors.length}`);
  console.log(`- Vendor supply mappings created: ${supplyRows.length}`);
  console.log("- RFQs created: 1000");
  console.log("- Quotations created: 3000");
  console.log("- POs created: 500");
  console.log("- Contracts created: 300");
  console.log("- Invoices created: 600");
  console.log("- GRNs created: 400");
  console.log("- Payments created: 250");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
