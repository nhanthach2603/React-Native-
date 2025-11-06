import { Databases, ID, Query } from 'appwrite';
import { config, databases } from '../config/appwrite';
import { Order, OrderStatus, StaffUser } from '../services/';

class OrderService {
  private databases: Databases;
  private databaseId: string;
  private ordersCollectionId: string;
  private staffCollectionId: string;

  constructor() {
    this.databases = databases;
    this.databaseId = config.databaseId;
    this.ordersCollectionId = config.orderCollectionId;
    this.staffCollectionId = config.userCollectionId;
  }

  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    try {
      const response = await this.databases.createDocument(
        this.databaseId,
        this.ordersCollectionId,
        ID.unique(),
        {
          ...orderData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
      return { id: response.$id, ...response as unknown as Order };
    } catch (error) {
      console.error("Error creating order: ", error);
      throw new Error("Không thể tạo đơn hàng.");
    }
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const response = await this.databases.getDocument(
        this.databaseId,
        this.ordersCollectionId,
        orderId
      );
      return { id: response.$id, ...response as unknown as Order };
    } catch (error) {
      console.error("Error getting order by ID: ", error);
      return null;
    }
  }

  async updateOrder(orderId: string, updates: Partial<Order>): Promise<Order> {
    try {
      const response = await this.databases.updateDocument(
        this.databaseId,
        this.ordersCollectionId,
        orderId,
        {
          ...updates,
          updatedAt: new Date().toISOString(),
        }
      );
      return { id: response.$id, ...response as unknown as Order };
    } catch (error) {
      console.error("Error updating order: ", error);
      throw new Error("Không thể cập nhật đơn hàng.");
    }
  }

  async deleteOrder(orderId: string): Promise<void> {
    try {
      await this.databases.deleteDocument(
        this.databaseId,
        this.ordersCollectionId,
        orderId
      );
    } catch (error) {
      console.error("Error deleting order: ", error);
      throw new Error("Không thể xóa đơn hàng.");
    }
  }

  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    try {
      const response = await this.databases.listDocuments(
        this.databaseId,
        this.ordersCollectionId,
        [Query.equal('status', status), Query.orderDesc('createdAt')]
      );
      return response.documents.map(doc => ({ id: doc.$id, ...doc as unknown as Order }));
    } catch (error) {
      console.error(`Error getting orders with status ${status}: `, error);
      throw new Error(`Không thể tải đơn hàng với trạng thái ${status}.`);
    }
  }

  async getOrdersByStaffId(staffId: string): Promise<Order[]> {
    try {
      const response = await this.databases.listDocuments(
        this.databaseId,
        this.ordersCollectionId,
        [Query.equal('assignedTo', staffId), Query.orderDesc('createdAt')]
      );
      return response.documents.map(doc => ({ id: doc.$id, ...doc as unknown as Order }));
    } catch (error) {
      console.error(`Error getting orders for staff ${staffId}: `, error);
      throw new Error(`Không thể tải đơn hàng cho nhân viên ${staffId}.`);
    }
    }

  async assignOrderToStaff(orderId: string, staffId: string): Promise<Order> {
    try {
      const updatedOrder = await this.updateOrder(orderId, { assignedTo: staffId, status: 'picking' });
      return updatedOrder;
    } catch (error) {
      console.error(`Error assigning order ${orderId} to staff ${staffId}: `, error);
      throw new Error("Không thể gán đơn hàng cho nhân viên.");
    }
  }

  async getPendingOrders(): Promise<Order[]> {
    return this.getOrdersByStatus('pending');
  }

  async getPickingOrders(): Promise<Order[]> {
    return this.getOrdersByStatus('picking');
  }

  async getCompletedOrders(): Promise<Order[]> {
    return this.getOrdersByStatus('completed');
  }

  async getStaffUsers(): Promise<StaffUser[]> {
    try {
      const response = await this.databases.listDocuments(
        this.databaseId,
        this.staffCollectionId,
        [
          Query.select(['$id', 'name', 'role', 'email']),
          Query.orderAsc('name')
        ]
      );
      if (response.documents.length === 0) {
        return [];
      }
      return response.documents.map(doc => ({ uid: doc.$id, ...doc as unknown as StaffUser }));
    } catch (error) {
      console.error("Error getting all staff with schedule: ", error);
      throw new Error("Không thể tải danh sách nhân viên.");
    }
  }
}

export const orderService = new OrderService();
