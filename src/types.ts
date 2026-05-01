export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  mobilePhone?: string;
  companyName?: string;
  roles: string[];
  permissions: string[];
};

export type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  filters?: Record<string, unknown>;
  facets?: Record<string, string[]>;
};

export type Vendor = {
  id: string;
  company: string;
  vendorName: string;
  phone: string;
  email: string;
  vendorCodes: string;
  status: string;
  category?: string;
  gstNumber?: string;
  panNumber?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  riskScore: number;
  vendorCode?: string;
  vendorType?: string;
  complianceStatus?: string;
  vendorRating?: number;
  responseRate?: number;
  onTimeDeliveryRate?: number;
  qualityScore?: number;
  preferredVendorFlag?: boolean;
};

export type Material = {
  id: string;
  materialCode: string;
  materialName: string;
  description: string;
  industry: string;
  category: string;
  subCategory: string;
  uom: string;
  materialType: string;
  specification: string;
  hsnCode: string;
  criticality: string;
  storageCondition: string;
  regulatoryCategory: string;
  pharmaGrade: string;
  shelfLifeMonths: number;
  activeStatus: string;
  _count?: { manufacturers: number; supplyMappings: number };
};

export type ManufacturerSuggestion = {
  id: string;
  manufacturerCode: string;
  manufacturerName: string;
  qualityCertification: string;
  regulatoryCertification: string;
  complianceStatus: string;
  leadTimeDays: number;
  rating: number;
  approvalStatus: string;
  moq: number;
};

export type VendorRecommendation = {
  id: string;
  materialCode: string;
  materialName: string;
  manufacturerCode: string;
  manufacturerName: string;
  vendorCode: string;
  vendorName: string;
  vendorType?: string;
  supplyPrice: number;
  currency: string;
  moq: number;
  leadTimeDays: number;
  lastPurchasePrice: number;
  vendorRating?: number;
  qualityScore?: number;
  onTimeDeliveryRate?: number;
  complianceStatus?: string;
  preferredVendorFlag: boolean;
  recommendationScore: number;
  badges: string[];
};

export type Requirement = {
  id: string;
  rfqNumber: string;
  rfqType: string;
  title: string;
  postedBy: { id: string; firstName: string; lastName: string };
  quotationStatus: string;
  postedOn: string;
  freezeTime: string;
  negotiationTime?: string;
  status: string;
  projectName?: string;
  clientName?: string;
  prNumber?: string;
  qcsCode?: string;
  comments?: Array<{ id: string; body: string; createdAt: string }>;
};

export type PR = {
  id: string;
  prNumber: string;
  title: string;
  department: string;
  budget: number;
  item: string;
  quantity: number;
  urgency: string;
  requiredDate: string;
  approvalStatus: string;
  owner?: { firstName: string; lastName: string };
};

export type RFQ = {
  id: string;
  rfqNumber: string;
  title: string;
  status: string;
  quotationDeadline: string;
  freezeTime: string;
  negotiationTime?: string;
  lineItems?: Array<{ id: string; itemCode: string; description: string; quantity: number; uom: string; targetPrice?: number }>;
  quotations?: Array<{ id: string; total: number; status: string; vendor: Vendor }>;
};

export type PO = {
  id: string;
  poNumber: string;
  title: string;
  totalAmount: number;
  status: string;
  approvalStatus: string;
  deliveryDate?: string;
  vendor?: Vendor;
};

export type QCS = {
  id: string;
  qcsCode: string;
  status: string;
  technicalScore: number;
  commercialScore: number;
  recommendedVendor?: string;
  rfq?: RFQ;
  approvals?: Array<{ id: string; approver: string; role: string; status: string; comments?: string }>;
};
