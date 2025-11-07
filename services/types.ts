export type OrderStatus = 'Draft' | 'Confirmed' | 'Assigned' | 'Processing' | 'PendingRevision' | 'Completed' | 'Shipped' | 'Canceled';

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
  assignedToName?: string;
  managerId?: string;
}
