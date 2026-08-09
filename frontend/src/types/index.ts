export type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';
export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';
export type MovementType = 'IN' | 'OUT';
export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export const Role = {
  ADMIN: 'ADMIN' as Role,
  SALES: 'SALES' as Role,
  WAREHOUSE: 'WAREHOUSE' as Role,
  ACCOUNTS: 'ACCOUNTS' as Role,
};

export const CustomerType = {
  RETAIL: 'RETAIL' as CustomerType,
  WHOLESALE: 'WHOLESALE' as CustomerType,
  DISTRIBUTOR: 'DISTRIBUTOR' as CustomerType,
};

export const CustomerStatus = {
  LEAD: 'LEAD' as CustomerStatus,
  ACTIVE: 'ACTIVE' as CustomerStatus,
  INACTIVE: 'INACTIVE' as CustomerStatus,
};

export const MovementType = {
  IN: 'IN' as MovementType,
  OUT: 'OUT' as MovementType,
};

export const ChallanStatus = {
  DRAFT: 'DRAFT' as ChallanStatus,
  CONFIRMED: 'CONFIRMED' as ChallanStatus,
  CANCELLED: 'CANCELLED' as ChallanStatus,
};

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
}

export interface FollowUp {
  id: number;
  customerId: number;
  notes: string;
  followUpDate?: string | null;
  createdById: number;
  createdBy: {
    id: number;
    name: string;
    role: Role;
  };
  createdAt: string;
}

export interface Customer {
  id: number;
  customerName: string;
  mobileNumber: string;
  email: string;
  businessName: string;
  gstNumber?: string | null;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  followUps?: FollowUp[];
  _count?: {
    challans: number;
    followUps: number;
  };
}

export interface Product {
  id: number;
  productName: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minimumStock: number;
  warehouseLocation: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: number;
  productId: number;
  quantity: number;
  movementType: MovementType;
  reason: string;
  createdById: number;
  createdAt: string;
  product?: {
    id: number;
    productName: string;
    sku: string;
    currentStock: number;
  };
  createdBy?: {
    id: number;
    name: string;
    role: Role;
  };
}

export interface ChallanItem {
  id?: number;
  challanId?: number;
  productId: number;
  productNameSnapshot: string;
  skuSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  product?: Product;
}

export interface Challan {
  id: number;
  challanNumber: string;
  customerId: number;
  customer?: Customer;
  totalQuantity: number;
  status: ChallanStatus;
  createdById: number;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
  items: ChallanItem[];
}

export interface DashboardStats {
  summary: {
    totalCustomers: number;
    totalProducts: number;
    lowStockProductsCount: number;
    totalChallans: number;
    draftChallans: number;
    confirmedChallans: number;
  };
  lowStockProducts: Product[];
  recentChallans: Challan[];
  recentStockMovements: StockMovement[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: Pagination;
  available?: number;
  requested?: number;
  errors?: any[];
}
