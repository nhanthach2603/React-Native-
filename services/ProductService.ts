// services/ProductService.ts
import { ID, Query } from 'appwrite';
import { databases, config, realtime } from '../config/appwrite';

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

const DATABASE_ID = config.databaseId;
const PRODUCTS_COLLECTION_ID = config.productCollectionId;
const CATEGORIES_COLLECTION_ID = config.categoryCollectionId;

export class ProductService {
  // --- PRODUCT CRUD ---
  static subscribeToProducts(onUpdateCallback: (products: Product[]) => void) {
    const fetchProducts = async () => {
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          PRODUCTS_COLLECTION_ID,
          [Query.orderDesc('$createdAt')]
        );
        const products: Product[] = response.documents.map(d => ({
          id: d.$id,
          name: d.name,
          sku: d.sku,
          totalQuantity: d.totalQuantity,
          unit: d.unit,
          price: d.price,
          category: d.category,
          lastUpdatedBy: d.lastUpdatedBy,
          updatedAt: d.updatedAt,
          variants: d.variants,
        }));
        onUpdateCallback(products);
      } catch (error) {
        console.error("🔥 Lỗi khi lấy sản phẩm từ Appwrite:", error);
      }
    };

    // Fetch initial products
    fetchProducts();

    // Subscribe to real-time updates
    const unsubscribe = realtime.subscribe(`databases.${DATABASE_ID}.collections.${PRODUCTS_COLLECTION_ID}.documents`, response => {
      if (response.events.includes(`databases.${DATABASE_ID}.collections.${PRODUCTS_COLLECTION_ID}.documents.*`)) {
        // A document in the collection has changed, re-fetch all products
        fetchProducts();
      }
    });

    return () => unsubscribe();
  }

  static async addProduct(productData: Omit<Product, 'id'>) {
    try {
      await databases.createDocument(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        ID.unique(),
        { ...productData, updatedAt: new Date().toISOString() }
      );
    } catch (e: any) {
      console.error("🔥 Lỗi thêm sản phẩm:", e.message);
      throw new Error(`Không thể thêm sản phẩm. Lỗi: ${e.code || e.message}`);
    }
  }

  static async updateProduct(productId: string, updatedData: Partial<Product>) {
    try {
      if (!productId) throw new Error("ID sản phẩm không hợp lệ.");
      await databases.updateDocument(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        productId,
        { ...updatedData, updatedAt: new Date().toISOString() }
      );
    } catch (e: any) {
      console.error("🔥 Lỗi cập nhật sản phẩm:", e.message);
      throw new Error(`Không thể cập nhật sản phẩm. Lỗi: ${e.code || e.message}`);
    }
  }

  static async deleteProduct(productId: string) {
    try {
      if (!productId) throw new Error("ID sản phẩm không hợp lệ.");
      console.log("ProductService: Đang cố gắng xóa sản phẩm với ID:", productId);
      await databases.deleteDocument(DATABASE_ID, PRODUCTS_COLLECTION_ID, productId);
      console.log("ProductService: Xóa sản phẩm thành công!");
    } catch (e: any) {
      console.error("🔥 LỖI FATAL KHI XÓA SẢN PHẨM:", e.message);
      throw new Error(`Không thể xóa sản phẩm. Lỗi: ${e.code || e.message}`);
    }
  }

  // --- CATEGORY CRUD ---
  static subscribeToCategories(onUpdateCallback: (categories: Category[]) => void) {
    const fetchCategories = async () => {
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          CATEGORIES_COLLECTION_ID,
          [Query.orderDesc('$createdAt')]
        );
        const categories: Category[] = response.documents.map(d => ({
          id: d.$id,
          name: d.name,
        }));
        onUpdateCallback(categories);
      } catch (error) {
        console.error("🔥 Lỗi khi lấy danh mục từ Appwrite:", error);
      }
    };

    // Fetch initial categories
    fetchCategories();

    // Subscribe to real-time updates
    const unsubscribe = realtime.subscribe(`databases.${DATABASE_ID}.collections.${CATEGORIES_COLLECTION_ID}.documents`, response => {
      if (response.events.includes(`databases.${DATABASE_ID}.collections.${CATEGORIES_COLLECTION_ID}.documents.*`)) {
        // A document in the collection has changed, re-fetch all categories
        fetchCategories();
      }
    });

    return () => unsubscribe();
  }

  static async addCategory(name: string) {
    try {
      await databases.createDocument(
        DATABASE_ID,
        CATEGORIES_COLLECTION_ID,
        ID.unique(),
        { name }
      );
    } catch (e: any) {
      console.error("🔥 LỖI THÊM CATEGORY:", e.message);
      throw new Error(`Không thể thêm Category. Lỗi: ${e.code || e.message}`);
    }
  }

  static async deleteCategory(categoryId: string) {
    try {
      if (!categoryId) throw new Error("ID Category không hợp lệ.");
      console.log("ProductService: Đang cố gắng xóa category với ID:", categoryId);
      await databases.deleteDocument(DATABASE_ID, CATEGORIES_COLLECTION_ID, categoryId);
      console.log("ProductService: Xóa category thành công!");
    } catch (e: any) {
      console.error("🔥 LỖI FATAL KHI XÓA CATEGORY:", e.message);
      throw new Error(`Không thể xóa Category. Lỗi: ${e.code || e.message}`);
    }
  }
}