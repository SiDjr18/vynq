import { describe, expect, it } from "vitest";
import { requirementWizardSchema } from "../server/validation";

const future = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

function validPayload() {
  return {
    mode: "RFQ",
    draftKey: "test",
    specification: {
      requirementType: "RFQ",
      title: "Demo raw material requirement",
      projectName: "Demo Project",
      clientName: "Demo Department",
      department: "RM",
      urgency: "Normal",
      description: "Demo only",
      internalNotes: "No confidential data",
      enableNegotiation: true,
      items: [{
        itemNo: 1,
        productCode: "PC-001",
        productName: "Demo Item",
        quantity: 10,
        uom: "KG",
        freightCharges: 0,
        insuranceCharges: 0
      }],
      templateQuestions: [{
        name: "Technical Compliance",
        isTechnical: true,
        isMandatory: true,
        vendorResponseType: "Boolean",
        weightage: 40
      }]
    },
    terms: {
      incoterms: "DAP",
      contactDetails: "Demo procurement desk",
      paymentMilestones: [
        { milestoneName: "Advance", percentage: 40, dueCondition: "PO release", paymentDays: 0 },
        { milestoneName: "Delivery", percentage: 60, dueCondition: "Accepted GRN", paymentDays: 30 }
      ]
    },
    transaction: {
      urgency: "Normal",
      currency: "INR",
      quotationFreezeTime: future(2),
      noOfReminders: 2,
      reminderIntervalHours: 24,
      expectedNegotiationTime: future(3),
      quotationPriceLimit: false,
      technicalScoreRequired: true,
      commercialScoreRequired: true,
      reductionType: "Price",
      biddingType: "Sealed Bid",
      minimumDecrementValue: 100,
      bidVisibilityRule: "Buyer only",
      autoCloseRule: "Close at freeze time",
      watchers: [],
      approvalWorkflow: "Procurement Manager"
    },
    vendors: {
      selectedVendorIds: ["vendor-demo-id"],
      category: "Raw Materials",
      country: "India"
    }
  };
}

describe("requirement wizard validation", () => {
  it("accepts a valid RFQ wizard payload", () => {
    expect(() => requirementWizardSchema.parse(validPayload())).not.toThrow();
  });

  it("rejects payment milestones that do not equal 100 percent", () => {
    const payload = validPayload();
    payload.terms.paymentMilestones[1].percentage = 20;
    expect(() => requirementWizardSchema.parse(payload)).toThrow(/100/);
  });

  it("rejects negotiation time before freeze time", () => {
    const payload = validPayload();
    payload.transaction.expectedNegotiationTime = future(1);
    expect(() => requirementWizardSchema.parse(payload)).toThrow(/after freeze time/);
  });
});
