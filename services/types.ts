// =========================
// Order-related types
// =========================
export type OrderStatus =
  | 'Draft'
  | 'Confirmed'
  | 'Assigned'
  | 'Processing'
  | 'PendingRevision'
  | 'Completed'
  | 'Shipped'
  | 'Canceled';

export interface OrderItem {
  qty: number;
  selectedVariant: any;
  productId: string;
  productName: string;
  sku: string;
  price: number;
}

export interface Order {
  id: string;
  creatorId: string;
  creatorName: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  warehouseManagerId?: string;
  warehouseManagerName?: string;
  revisionNote?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  assignedTo?: string; // ID của người được phân công
  assignedToName?: string;
  managerId?: string;
}

// =========================
// Staff-related types
// =========================
export type UserRole = 'admin' | 'truongphong' | 'thukho' | 'nhanvienkho' | 'nhanvienbanhang';

export interface StaffUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  managerId?: string | null; // ✅ Bổ sung field này để fix lỗi
}
