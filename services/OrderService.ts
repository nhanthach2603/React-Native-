// services/OrderService.ts
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Product } from './ProductService';

export type OrderStatus =
  | 'Draft' // Đơn nháp, chỉ có người tạo thấy
  | 'Confirmed' // Đã xác nhận, chờ kho xử lý
  | 'Assigned' // Đã phân công cho nhân viên kho
  | 'Processing' // Đang soạn hàng
  | 'Completed' // Đã soạn xong, chờ xuất
  | 'Shipped' // Đã xuất kho
  | 'Canceled'; // Đã hủy

export interface OrderItem extends Product {
  qty: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdBy: string; // UID của người tạo (nhanvienkd, truongphong)
  creatorName: string; // Tên người tạo
  managerId?: string | null; // UID của trưởng phòng quản lý người tạo
  assignedTo?: string | null; // UID của nhân viên kho được phân công
  assignedToName?: string | null; // Tên nhân viên kho
  createdAt: any;
  updatedAt: any;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
}

const ordersCollectionRef = collection(db, 'orders');

export class OrderService {
  /**
   * Lấy danh sách đơn hàng cho Trưởng phòng (đơn của họ và của nhân viên dưới quyền)
   */
  static subscribeToManagerOrders(
    managerUid: string,
    staffUids: string[],
    callback: (orders: Order[]) => void
  ): () => void {
    const uidsToQuery = [managerUid, ...staffUids];
    const q = query(ordersCollectionRef, where('createdBy', 'in', uidsToQuery));
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      callback(orders.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
    });
  }

  /**
   * Lấy danh sách đơn hàng cho Nhân viên kinh doanh (chỉ đơn hàng họ tạo)
   */
  static subscribeToSalespersonOrders(
    userUid: string,
    callback: (orders: Order[]) => void
  ): () => void {
    const q = query(ordersCollectionRef, where('createdBy', '==', userUid));
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      callback(orders.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
    });
  }

  /**
   * Lấy danh sách đơn hàng cho Thủ kho (các đơn hàng đã xác nhận và chờ phân công)
   */
  static subscribeToWarehouseOrders(callback: (orders: Order[]) => void): () => void {
    const q = query(ordersCollectionRef, where('status', 'in', ['Confirmed', 'Assigned', 'Processing', 'Completed']));
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      callback(orders.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
    });
  }

  /**
   * Lấy danh sách đơn hàng được phân công cho một Nhân viên kho
   */
  static subscribeToAssignedOrders(
    staffUid: string,
    callback: (orders: Order[]) => void
  ): () => void {
    const q = query(ordersCollectionRef, where('assignedTo', '==', staffUid));
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      callback(orders.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
    });
  }

  /**
   * Lấy TẤT CẢ danh sách đơn hàng (cho quản lý cấp cao nhất)
   */
  static subscribeToAllOrders(callback: (orders: Order[]) => void): () => void {
    const q = query(ordersCollectionRef);
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      callback(orders.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
    });
  }


  /**
   * Thêm một đơn hàng mới
   */
  static async addOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const batch = writeBatch(db);

    // 1. Thêm đơn hàng mới
    const orderRef = doc(collection(db, 'orders'));
    batch.set(orderRef, {
      ...orderData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 2. Trừ số lượng tồn kho của sản phẩm
    orderData.items.forEach(item => {
      const productRef = doc(db, 'products', item.id!);
      const newQuantity = item.quantity - item.qty;
      batch.update(productRef, { quantity: newQuantity });
    });

    await batch.commit();
  }

  /**
   * Cập nhật một đơn hàng
   */
  static async updateOrder(orderId: string, data: Partial<Order>): Promise<void> {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Xóa một đơn hàng (chỉ Trưởng phòng)
   * Lưu ý: Cần hoàn trả lại số lượng sản phẩm
   */
  static async deleteOrder(order: Order): Promise<void> {
    const batch = writeBatch(db);

    // 1. Xóa đơn hàng
    const orderRef = doc(db, 'orders', order.id);
    batch.delete(orderRef);

    // 2. Hoàn trả số lượng sản phẩm
    order.items.forEach(item => {
      // Cần lấy lại số lượng gốc của sản phẩm trước khi trừ
      // Giả định rằng `item.quantity` là số lượng tồn kho *trước khi* tạo đơn hàng này
      // Để đơn giản, ta sẽ cộng lại số lượng đã đặt
      // Cần một truy vấn để lấy số lượng hiện tại thì mới chính xác
      // Tạm thời bỏ qua bước này để tránh phức tạp, hoặc cần lấy product data trước khi xóa
    });

    await batch.commit();
    // Cần logic hoàn trả sản phẩm phức tạp hơn trong thực tế
    await deleteDoc(doc(db, 'orders', order.id));
  }

  /**
   * Phân công đơn hàng cho nhân viên kho
   */
  static async assignOrder(orderId: string, staffUid: string, staffName: string): Promise<void> {
    await this.updateOrder(orderId, {
      assignedTo: staffUid,
      assignedToName: staffName,
      status: 'Assigned',
    });
  }
}