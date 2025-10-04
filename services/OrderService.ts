// services/OrderService.ts

import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  DocumentData,
  QuerySnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  notes?: string;
}

export interface Order {
  id: string;
  staffId: string;
  staffName?: string;
  assignedTo?: string;
  items: OrderItem[];
  status: 'Draft' | 'Pending' | 'Shipped' | 'Canceled';
  createdAt: string;
  lastUpdated?: string;
}

const ordersCollectionRef = collection(db, 'orders');

export class OrderService {
  static async createOrder(orderData: Omit<Order, 'id'>) {
    try {
      const docRef = await addDoc(ordersCollectionRef, {
        ...orderData,
        createdAt: new Date().toISOString(),
      });
      return docRef.id;
    } catch (e) {
      throw new Error('Không thể tạo đơn hàng.');
    }
  }

  static subscribeToPendingOrders(onUpdateCallback: (orders: Order[]) => void) {
    const q = query(ordersCollectionRef, where('status', '==', 'Pending'));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot: QuerySnapshot<DocumentData>) => {
        const orders: Order[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Order));
        onUpdateCallback(orders);
      },
      (error) => {
        console.error("Lỗi khi lắng nghe đơn hàng:", error);
      }
    );
    return unsubscribe;
  }

  static subscribeToAssignedOrders(userId: string, onUpdateCallback: (orders: Order[]) => void) {
    const q = query(
      ordersCollectionRef,
      where('assignedTo', '==', userId),
      where('status', '==', 'Assigned') 
    );
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot: QuerySnapshot<DocumentData>) => {
        const orders: Order[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Order));
        onUpdateCallback(orders);
      },
      (error) => {
        console.error("Lỗi khi lắng nghe đơn hàng đã giao:", error);
      }
    );
    return unsubscribe;
  }

  static async updateOrder(orderId: string, updatedData: Partial<Order>) {
    try {
      const orderDocRef = doc(db, 'orders', orderId);
      await updateDoc(orderDocRef, {
        ...updatedData,
        lastUpdated: new Date().toISOString()
      });
    } catch (e) {
      throw new Error('Không thể cập nhật đơn hàng.');
    }
  }
}