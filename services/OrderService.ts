import { ID, Query } from 'appwrite';
import { config, databases, functions, realtime } from '../config/appwrite';
import { Order, OrderStatus } from './types';

const dbId = config.databaseId;
const ordersCollectionId = config.orderCollectionId;

// Interface để type-safe subscription
interface AppwriteSubscription {
  unsubscribe: () => void;
}

/**
 * Chuyển document Appwrite thành Order object
 */
const mapDocumentToOrder = (doc: any): Order => ({
  ...doc,
  id: doc.$id,
  items: typeof doc.items === 'string' ? JSON.parse(doc.items) : doc.items || [],
  createdAt: new Date(doc.createdAt ?? doc.$createdAt),
  updatedAt: new Date(doc.updatedAt ?? doc.$updatedAt),
});

/**
 * Tạo subscription an toàn
 */
const createSubscription = (
  queries: string[],
  onUpdate: (orders: Order[]) => void
): (() => void) => {
  let mounted = true;

  const fetchAndNotify = async () => {
    try {
      const response = await databases.listDocuments(dbId, ordersCollectionId, queries);
      const orders = response.documents.map(mapDocumentToOrder);
      if (mounted) onUpdate(orders);
    } catch (e) {
      console.error('🔥 Lỗi khi lấy danh sách đơn hàng:', e);
    }
  };

  fetchAndNotify(); // initial fetch

  const channel = `databases.${dbId}.collections.${ordersCollectionId}.documents`;
  const subscription = realtime.subscribe(channel, () => {
    fetchAndNotify();
  }) as unknown as AppwriteSubscription; // type assertion để IDE không gạch đỏ

  return () => {
    mounted = false;
    if (subscription && typeof subscription.unsubscribe === 'function') {
      subscription.unsubscribe();
      console.log('✅ Unsubscribed from orders channel');
    }
  };
};

export class OrderService {
  // ================================================================
  // CRUD METHODS
  // ================================================================

  static async getOrdersByPicker(pickerId: string, statuses: OrderStatus[]): Promise<Order[]> {
    const response = await databases.listDocuments(dbId, ordersCollectionId, [
      Query.equal('assignedTo', pickerId),
      Query.equal('status', statuses),
      Query.orderDesc('updatedAt'),
    ]);
    return response.documents.map(mapDocumentToOrder);
  }

  static async addOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<any> {
    const dataToSave = {
      ...orderData,
      items: JSON.stringify(orderData.items),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return databases.createDocument(dbId, ordersCollectionId, ID.unique(), dataToSave);
  }

  static async updateOrder(orderId: string, orderData: Partial<Omit<Order, 'id' | 'createdAt'>>): Promise<any> {
    const dataToUpdate: any = { ...orderData, updatedAt: new Date().toISOString() };
    if (orderData.items) dataToUpdate.items = JSON.stringify(orderData.items);
    return databases.updateDocument(dbId, ordersCollectionId, orderId, dataToUpdate);
  }

  static async deleteOrder(order: Order): Promise<any> {
    return databases.deleteDocument(dbId, ordersCollectionId, order.id);
  }

  static async assignToWarehouseManager(orderId: string, managerId: string, managerName: string): Promise<any> {
    return this.updateOrder(orderId, {
      status: 'Assigned',
      warehouseManagerId: managerId,
      warehouseManagerName: managerName,
    });
  }

  static async completeOrderAndUpdateStock(order: Order): Promise<any> {
    const execution = await functions.createExecution(
      'completeOrder',
      JSON.stringify({ orderId: order.id })
    );
    if (execution.status !== 'completed' || execution.responseStatusCode !== 200) {
      const errorMsg = execution.responseBody
        ? JSON.parse(execution.responseBody).message
        : 'Lỗi không xác định từ server function.';
      throw new Error(errorMsg);
    }
    return JSON.parse(execution.responseBody);
  }

  // ================================================================
  // SUBSCRIPTION METHODS
  // ================================================================

  /**
   * Subscribe tất cả đơn hàng (tongquanly)
   */
  static subscribeToAllOrders(onUpdate: (orders: Order[]) => void): () => void {
    const queries = [Query.orderDesc('$updatedAt')];
    return createSubscription(queries, onUpdate);
  }

  /**
   * Subscribe đơn hàng của manager và staff (truongphong)
   */
  static subscribeToManagerOrders(
    managerId: string,
    staffUids: string[],
    onUpdate: (orders: Order[]) => void
  ): () => void {
    const creatorIds = [managerId, ...staffUids];
    const queries = [Query.equal('creatorId', creatorIds), Query.orderDesc('$updatedAt')];
    return createSubscription(queries, onUpdate);
  }

  /**
   * Subscribe đơn hàng của một nhân viên kinh doanh cụ thể (nhanvienkd)
   */
  static subscribeToSalespersonOrders(
    salespersonId: string,
    onUpdate: (orders: Order[]) => void
  ): () => void {
    const queries = [Query.equal('creatorId', salespersonId), Query.orderDesc('$updatedAt')];
    return createSubscription(queries, onUpdate);
  }

  /**
   * Subscribe đơn hàng của một thủ kho cụ thể (thukho)
   */
  static subscribeToWarehouseManagerOrders(
    managerId: string,
    onUpdate: (orders: Order[]) => void
  ): () => void {
    const queries = [Query.equal('warehouseManagerId', managerId), Query.orderDesc('$updatedAt')];
    return createSubscription(queries, onUpdate);
  }
}
export { Order };

