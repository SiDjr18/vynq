import { z } from "zod";

export const requirementItemSchema = z.object({
  itemNo: z.coerce.number().int().positive(),
  materialCode: z.string().regex(/^\d{10}$/, "Material code must be a 10-digit string").optional(),
  materialName: z.string().optional(),
  productCode: z.string().min(1, "Product Code is required"),
  productName: z.string().min(1, "Product Name is required"),
  mpnNumber: z.string().optional(),
  quantity: z.coerce.number().positive("Quantity must be greater than zero"),
  uom: z.string().min(1, "UOM is required"),
  makeModel: z.string().optional(),
  hsnCode: z.string().optional(),
  deliveryAddress: z.string().optional(),
  description: z.string().optional(),
  freightCharges: z.coerce.number().min(0).default(0),
  insuranceCharges: z.coerce.number().min(0).default(0),
  remarks: z.string().optional(),
  attachmentName: z.string().optional()
});

export const templateQuestionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  specification: z.string().optional(),
  isTechnical: z.boolean().default(false),
  isMandatory: z.boolean().default(false),
  vendorResponseType: z.string().default("Text"),
  weightage: z.coerce.number().int().min(0).max(100).default(0)
});

export const paymentMilestoneSchema = z.object({
  milestoneName: z.string().min(1),
  percentage: z.coerce.number().min(0).max(100),
  dueCondition: z.string().min(1),
  paymentDays: z.coerce.number().int().min(0),
  remarks: z.string().optional()
});

export const requirementWizardSchema = z.object({
  mode: z.enum(["RFQ", "RFP", "Reverse Auction"]).default("RFQ"),
  draftKey: z.string().default("default"),
  specification: z.object({
    requirementType: z.enum(["RFQ", "RFP", "Reverse Auction"]),
    title: z.string().min(3),
    projectName: z.string().min(1),
    clientName: z.string().min(1),
    department: z.string().min(1),
    urgency: z.string().min(1),
    description: z.string().optional(),
    internalNotes: z.string().optional(),
    enableNegotiation: z.boolean().default(false),
    items: z.array(requirementItemSchema).min(1),
    templateQuestions: z.array(templateQuestionSchema).min(1)
  }),
  terms: z.object({
    deliveryTerms: z.string().optional(),
    paymentTerms: z.string().optional(),
    incoterms: z.string().min(1, "Incoterms is required"),
    contactDetails: z.string().min(1, "Contact detail is required"),
    contractRequired: z.boolean().default(false),
    departments: z.array(z.string()).default([]),
    deliveryLocation: z.string().optional(),
    expectedDeliveryDate: z.coerce.date().optional(),
    partialDeliveryAllowed: z.boolean().default(false),
    advancePaymentAllowed: z.boolean().default(false),
    paymentMilestones: z.array(paymentMilestoneSchema).default([])
  }).superRefine((value, ctx) => {
    const total = value.paymentMilestones.reduce((sum, milestone) => sum + Number(milestone.percentage || 0), 0);
    if (value.paymentMilestones.length > 0 && Math.round(total) !== 100) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["paymentMilestones"], message: "Payment milestone total must equal 100%" });
    }
  }),
  transaction: z.object({
    urgency: z.string().min(1),
    currency: z.enum(["INR", "USD", "EUR", "GBP"]),
    quotationFreezeTime: z.coerce.date(),
    noOfReminders: z.coerce.number().int().min(0),
    reminderIntervalHours: z.coerce.number().int().min(1),
    expectedNegotiationTime: z.coerce.date(),
    quotationPriceLimit: z.boolean().default(false),
    technicalScoreRequired: z.boolean().default(false),
    commercialScoreRequired: z.boolean().default(true),
    reductionType: z.enum(["Price", "Discount", "Both"]),
    biddingType: z.enum(["Sealed Bid", "Open Bid", "Reverse Auction"]),
    minimumDecrementValue: z.coerce.number().min(0),
    bidVisibilityRule: z.string().min(1),
    autoCloseRule: z.string().min(1),
    watchers: z.array(z.string()).default([]),
    approvalWorkflow: z.string().min(1)
  }).superRefine((value, ctx) => {
    if (value.quotationFreezeTime <= new Date()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["quotationFreezeTime"], message: "Freeze time must be in the future" });
    }
    if (value.expectedNegotiationTime <= value.quotationFreezeTime) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["expectedNegotiationTime"], message: "Negotiation time must be after freeze time" });
    }
  }),
  vendors: z.object({
    selectedVendorIds: z.array(z.string()).min(1),
    category: z.string().optional(),
    country: z.string().optional()
  })
}).superRefine((value, ctx) => {
  if (value.transaction.technicalScoreRequired && !value.specification.templateQuestions.some((question) => question.isTechnical)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["specification", "templateQuestions"], message: "Technical template questions are required when technical score is enabled" });
  }
});

export function validateReminderLimit(noOfReminders: number, roles: string[]) {
  if (noOfReminders > 3 && !roles.includes("Admin")) {
    throw new z.ZodError([{
      code: z.ZodIssueCode.custom,
      path: ["transaction", "noOfReminders"],
      message: "Reminder count maximum is 3 unless the user is an Admin"
    }]);
  }
}

const pharmaIndustry = z.literal("CDMO / Pharma");
const sixDigitCode = z.string().regex(/^\d{6}$/, "Code must be a 6-digit string");
const tenDigitCode = z.string().regex(/^\d{10}$/, "Material code must be a 10-digit string");

export const materialSchema = z.object({
  materialCode: tenDigitCode,
  materialName: z.string().min(2),
  description: z.string().min(2),
  industry: pharmaIndustry,
  category: z.string().min(1),
  subCategory: z.string().min(1),
  uom: z.string().min(1),
  materialType: z.string().min(1),
  specification: z.string().min(1),
  hsnCode: z.string().min(4),
  criticality: z.string().min(1),
  storageCondition: z.string().min(1),
  regulatoryCategory: z.string().min(1),
  pharmaGrade: z.string().min(1),
  shelfLifeMonths: z.coerce.number().int().positive(),
  activeStatus: z.string().default("Active")
});

export const manufacturerSchema = z.object({
  manufacturerCode: sixDigitCode,
  manufacturerName: z.string().min(2),
  manufacturerShortName: z.string().min(1),
  manufacturerType: z.string().refine((value) => value.includes("Manufacturer"), "Manufacturer type must be pharma/CDMO related"),
  industry: pharmaIndustry,
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  pincode: z.string().min(4),
  contactPerson: z.string().min(1),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(6),
  qualityCertification: z.string().min(1),
  regulatoryCertification: z.string().min(1),
  complianceStatus: z.string().min(1),
  manufacturingCapacity: z.string().min(1),
  leadTimeDays: z.coerce.number().int().positive(),
  rating: z.coerce.number().min(0).max(5),
  activeStatus: z.string().default("Active")
});

export const pharmaVendorSchema = z.object({
  vendorCode: sixDigitCode,
  vendorName: z.string().min(2),
  vendorType: z.string().min(2),
  industry: pharmaIndustry,
  addressLine1: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
  complianceStatus: z.string().min(1)
});

export const vendorSupplyMappingSchema = z.object({
  materialCode: tenDigitCode,
  manufacturerCode: sixDigitCode,
  vendorCode: sixDigitCode,
  supplyPrice: z.coerce.number().positive(),
  moq: z.coerce.number().int().positive(),
  leadTimeDays: z.coerce.number().int().positive()
});
