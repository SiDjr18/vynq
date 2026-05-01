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
