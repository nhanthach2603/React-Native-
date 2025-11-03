// services/ProductService.ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  onSnapshot,
  QuerySnapshot,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// --- ĐỊNH NGHĨA TYPES ---
export interface Category {
  id?: string;
  name: string;
}

export interface ProductVariant {
  color?: string; // Màu sắc, có thể không có
  size: string;    // Kích thước, bắt buộc
  quantity: number;
}

export interface Product {
  id?: string;
  name: string;
  sku: string;
  // quantity: number; // Sẽ thay thế bằng variants
  totalQuantity: number; // Tổng số lượng của tất cả variants
  unit: string;
  price: number;
  category: string;
  lastUpdatedBy?: string;
  updatedAt?: string;
  variants: ProductVariant[]; // Mảng chứa các biến thể
}

const productsCollectionRef = collection(db, 'products');
const categoriesCollectionRef = collection(db, 'categories');

export class ProductService {
  // --- PRODUCT CRUD ---
  static subscribeToProducts(onUpdateCallback: (products: Product[]) => void) {
    const unsubscribe = onSnapshot(
      productsCollectionRef,
      (querySnapshot: QuerySnapshot<DocumentData>) => {
        const products: Product[] = querySnapshot.docs.map(d => ({
          id: d.id, 
          ...(d.data() as Omit<Product, "id">),
        }));
        onUpdateCallback(products);
      },
      (error) => {
        console.error("🔥 Lỗi khi lắng nghe sản phẩm:", error);
      }
    );
    return unsubscribe;
  }

  static async addProduct(productData: Omit<Product, 'id'>) {
    try {
      await addDoc(productsCollectionRef, { ...productData, updatedAt: new Date().toISOString() });
    } catch (e: any) {
      console.error("🔥 Lỗi thêm sản phẩm:", e.message);
      throw new Error(`Không thể thêm sản phẩm. Lỗi: ${e.code || e.message}`);
    }
  }

  static async updateProduct(productId: string, updatedData: Partial<Product>) {
    try {
      if (!productId) throw new Error("ID sản phẩm không hợp lệ.");
      const productDocRef = doc(db, 'products', productId);
      await updateDoc(productDocRef, { ...updatedData, updatedAt: new Date().toISOString() });
    } catch (e: any) {
      console.error("🔥 Lỗi cập nhật sản phẩm:", e.message);
      throw new Error(`Không thể cập nhật sản phẩm. Lỗi: ${e.code || e.message}`);
    }
  }

  static async deleteProduct(productId: string) {
    try {
      if (!productId) throw new Error("ID sản phẩm không hợp lệ.");
      console.log("ProductService: Đang cố gắng xóa sản phẩm với ID:", productId);
      const productDocRef = doc(db, 'products', productId);
      await deleteDoc(productDocRef);
      console.log("ProductService: Xóa sản phẩm thành công!");
    } catch (e: any) {
      console.error("🔥 LỖI FATAL KHI XÓA SẢN PHẨM:", e.message);
      throw new Error(`Không thể xóa sản phẩm. Lỗi: ${e.code || e.message}`);
    }
  }

  // --- CATEGORY CRUD ---
  static subscribeToCategories(onUpdateCallback: (categories: Category[]) => void) {
    const unsubscribe = onSnapshot(
      categoriesCollectionRef,
      (querySnapshot: QuerySnapshot<DocumentData>) => {
        const categories: Category[] = querySnapshot.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<Category, "id">),
        }));
        onUpdateCallback(categories);
      },
      (error) => {
        console.error("🔥 Lỗi khi lắng nghe Categories:", error);
      }
    );
    return unsubscribe;
  }

  static async addCategory(name: string) {
    try {
      await addDoc(categoriesCollectionRef, { name });
    } catch (e: any) {
      console.error("🔥 LỖI THÊM CATEGORY:", e.message);
      throw new Error(`Không thể thêm Category. Lỗi: ${e.code || e.message}`);
    }
  }

  static async deleteCategory(categoryId: string) {
    try {
      if (!categoryId) throw new Error("ID Category không hợp lệ.");
      console.log("ProductService: Đang cố gắng xóa category với ID:", categoryId);
      const categoryDocRef = doc(db, 'categories', categoryId);
      await deleteDoc(categoryDocRef);
      console.log("ProductService: Xóa category thành công!");
    } catch (e: any) {
      console.error("🔥 LỖI FATAL KHI XÓA CATEGORY:", e.message);
      throw new Error(`Không thể xóa Category. Lỗi: ${e.code || e.message}`);
    }
  }
}