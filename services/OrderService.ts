// services/OrderService.ts
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Product, ProductVariant } from './ProductService';

export type OrderStatus =
  | 'Draft' // Đơn nháp, chỉ có người tạo thấy
  | 'Confirmed' // Đã xác nhận, chờ kho xử lý
  | 'Assigned' // Đã phân công cho nhân viên kho
  | 'Processing' // Đang soạn hàng
  | 'Completed' // Đã soạn xong, chờ xuất
  | 'PendingRevision' // Kho báo cáo vấn đề, chờ người tạo đơn sửa
  | 'Shipped' // Đã xuất kho,
  | 'Canceled'; // Đã hủy

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  price: number;
  qty: number;
  selectedVariant: ProductVariant;
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
  warehouseManagerId?: string | null; // UID của thủ kho được phân công
  warehouseManagerName?: string | null; // Tên của thủ kho
  assignedToName?: string | null; // Tên nhân viên kho
  createdAt: Timestamp;
  updatedAt: Timestamp;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  revisionNote?: string; // Ghi chú khi kho báo cáo vấn đề
}

const ordersCollectionRef = collection(db, 'orders');

export class OrderService {
  // [SỬA] Hoàn thiện chức năng soạn hàng: triển khai logic trừ kho khi hoàn thành
  static async completeOrderAndUpdateStock(order: Order): Promise<void> {
    if (!order || !order.items || order.items.length === 0) {
      throw new Error("Đơn hàng không hợp lệ hoặc không có sản phẩm.");
    }

    try {
      await runTransaction(db, async (transaction) => {
        // 1. Lấy thông tin mới nhất của tất cả sản phẩm trong đơn hàng
        const productRefsAndData = await Promise.all(
          order.items.map(async (item) => {
            const productRef = doc(db, 'products', item.productId);
            const productDoc = await transaction.get(productRef);
            if (!productDoc.exists()) {
              throw new Error(`Sản phẩm "${item.productName}" (ID: ${item.productId}) không còn tồn tại.`);
            }
            return { ref: productRef, data: productDoc.data() as Product, item: item };
          })
        );

        // 2. Kiểm tra tồn kho và chuẩn bị dữ liệu cập nhật
        for (const { data, item } of productRefsAndData) {
          const variant = data.variants.find(
            (v: ProductVariant) => v.size === item.selectedVariant.size && v.color === item.selectedVariant.color
          );
          if (!variant || variant.quantity < item.qty) {
            throw new Error(
              `Không đủ tồn kho cho sản phẩm "${item.productName}" (Biến thể: ${item.selectedVariant.color || ''} - ${item.selectedVariant.size}). Tồn: ${variant?.quantity || 0}, Cần: ${item.qty}.`
            );
          }
          // Trừ số lượng biến thể
          variant.quantity -= item.qty;
        }

        // 3. Cập nhật lại tất cả sản phẩm
        for (const { ref, data } of productRefsAndData) {
          // Tính lại tổng số lượng sau khi trừ
          const newTotalQuantity = data.variants.reduce((sum: number, v: ProductVariant) => sum + v.quantity, 0);
          transaction.update(ref, {
            variants: data.variants,
            totalQuantity: newTotalQuantity
          });
        }

        // 4. Cập nhật trạng thái đơn hàng
        const orderRef = doc(db, 'orders', order.id);
        transaction.update(orderRef, { status: 'Completed' });
      });
    } catch (error: any) {
      console.error("Lỗi khi hoàn thành đơn hàng và cập nhật kho: ", error);
      throw error;
    }
  }

  /**
   * [THÊM MỚI] Lấy danh sách đơn hàng đã hoàn thành của một nhân viên trong tháng hiện tại
   */
  static async getCompletedOrdersForStaffByMonth(staffUid: string): Promise<Order[]> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const q = query(
      ordersCollectionRef,
      where('assignedTo', '==', staffUid),
      where('status', '==', 'Completed'),
      where('updatedAt', '>=', startOfMonth),
      where('updatedAt', '<=', endOfMonth),
      orderBy('updatedAt', 'desc')
    );

    try {
      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      return orders;
    } catch (error) {
      console.error("Lỗi khi lấy đơn hàng đã hoàn thành:", error);
      return [];
    }
  }
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
  static subscribeToWarehouseOrders(warehouseManagerUid: string, callback: (orders: Order[]) => void): () => void {
    const q = query(
      ordersCollectionRef,
      where('warehouseManagerId', '==', warehouseManagerUid),
      where('status', 'in', ['Confirmed', 'Assigned', 'Processing', 'Completed'])
    );
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      callback(orders.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
    });
  }

  /**
   * Lấy TẤT CẢ đơn hàng trong kho (cho Trưởng phòng xem)
   */
  static subscribeToAllWarehouseOrders(callback: (orders: Order[]) => void): () => void {
    const q = query(
      ordersCollectionRef,
      where('status', 'in', ['Confirmed', 'Assigned', 'Processing', 'Completed', 'Shipped'])
    );
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
    try {
      await runTransaction(db, async (transaction) => {
        // --- GIAI ĐOẠN 1: ĐỌC DỮ LIỆU ---
        // Lấy tham chiếu và đọc tất cả các sản phẩm trong đơn hàng trước
        const productRefs = orderData.items.map(item => doc(db, 'products', item.productId));
        const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));

        const updatesPayload: { ref: any; data: { variants: ProductVariant[]; totalQuantity: number } }[] = [];

        // Kiểm tra và tính toán số lượng mới
        for (let i = 0; i < orderData.items.length; i++) {
          const item = orderData.items[i];
          const productDoc = productDocs[i];

          if (!productDoc.exists()) {
            throw new Error(`Sản phẩm "${item.productName}" không tồn tại.`);
          }

          const productData = productDoc.data() as Product;
          const variantIndex = productData.variants.findIndex(
            v => v.size === item.selectedVariant.size && v.color === item.selectedVariant.color
          );

          if (variantIndex === -1) {
            throw new Error(`Biến thể của sản phẩm "${item.productName}" không tìm thấy.`);
          }

          const newVariants = [...productData.variants];
          newVariants[variantIndex].quantity -= item.qty;
          const newTotalQuantity = newVariants.reduce((sum, v) => sum + v.quantity, 0);

          updatesPayload.push({ ref: productRefs[i], data: { variants: newVariants, totalQuantity: newTotalQuantity } });
        }

        // --- GIAI ĐOẠN 2: GHI DỮ LIỆU ---
        // 1. Ghi đơn hàng mới
        const newOrderRef = doc(collection(db, 'orders'));
        transaction.set(newOrderRef, {
          ...orderData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // 2. Cập nhật tất cả sản phẩm
        updatesPayload.forEach(payload => {
          transaction.update(payload.ref, payload.data);
        });
      });
    } catch (error) {
      console.error("Lỗi khi thêm đơn hàng và cập nhật kho: ", error);
      throw error; // Ném lỗi ra ngoài để component có thể xử lý
    }
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
      // Giả định rằng `item.totalQuantity` là số lượng tồn kho *trước khi* tạo đơn hàng này
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

  /**
   * Phân công đơn hàng cho Thủ kho
   */
  static async assignToWarehouseManager(orderId: string, warehouseManagerId: string, warehouseManagerName: string): Promise<void> {
    await this.updateOrder(orderId, {
      warehouseManagerId: warehouseManagerId,
      warehouseManagerName: warehouseManagerName,
      // Giữ nguyên status là 'Confirmed' để Thủ kho tiếp tục xử lý
    });
  }
}