// services/ProductService.ts
import { ID, Query } from "appwrite";
import { config, databases, realtime } from "../config/appwrite";

/* Types */
export interface ProductVariant {
  color?: string;
  size: string;
  quantity: number;
}

export interface Product {
  id: string;
  $id?: string;
  name?: string;
  sku?: string;
  stock?: number;
  totalQuantity: number;
  unit?: string;
  price?: number;
  category?: string;
  lastUpdatedBy?: string;
  updatedAt?: string;
  variants: ProductVariant[];
}

/* Helpers */
const calculateStock = (variants: ProductVariant[] = []): number =>
  variants.reduce((sum, v) => sum + (v?.quantity || 0), 0);

const safeParseVariants = (v: any): ProductVariant[] => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

/* Subscription type */
interface AppwriteSubscription {
  unsubscribe: () => void;
}

/* Service */
export class ProductService {
  private static productChannel() {
    return `databases.${config.databaseId}.collections.${config.productCollectionId}.documents`;
  }

  private static mapDocumentToProduct(d: any): Product {
    const variants = safeParseVariants(d.variants);
    return {
      id: d.$id,
      $id: d.$id,
      name: d.name,
      sku: d.sku,
      stock: d.stock ?? calculateStock(variants),
      unit: d.unit,
      price: d.price,
      category: d.category,
      lastUpdatedBy: d.lastUpdatedBy,
      updatedAt: d.updatedAt ?? d.$updatedAt,
      totalQuantity: calculateStock(variants),
      variants,
    };
  }

  // ========================================================
  // Product Methods
  // ========================================================
  static async getAllProducts(): Promise<Product[]> {
    const resp = await databases.listDocuments(config.databaseId, config.productCollectionId, [
      Query.orderDesc("$createdAt"),
    ]);
    return (resp.documents || []).map(this.mapDocumentToProduct);
  }

  static subscribeToProducts(onUpdateCallback: (products: Product[]) => void): () => void {
    let mounted = true;

    const fetchAndNotify = async () => {
      try {
        const products = await ProductService.getAllProducts();
        if (mounted) onUpdateCallback(products);
      } catch (e) {
        console.error("🔥 Lỗi khi lấy sản phẩm:", e);
      }
    };

    fetchAndNotify();

    let refetchTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefetch = () => {
      if (refetchTimer) clearTimeout(refetchTimer);
      refetchTimer = setTimeout(() => {
        fetchAndNotify();
        refetchTimer = null;
      }, 300);
    };

    const sub = realtime.subscribe(this.productChannel(), (res: any) => {
      scheduleRefetch();
    }) as unknown as AppwriteSubscription;

    return () => {
      mounted = false;
      if (refetchTimer) clearTimeout(refetchTimer);
      try {
        if (sub && typeof sub.unsubscribe === "function") sub.unsubscribe();
      } catch (err) {
        console.warn("Warning while unsubscribing realtime for products:", err);
      }
      console.log("Unsubscribed from products channel");
    };
  }

  static async addProduct(
    productData: Omit<Product, "$id" | "stock"> & { lastUpdatedBy: string }
  ) {
    const stock = calculateStock(productData.variants || []);
    const dataToSave = {
      ...productData,
      variants: JSON.stringify(productData.variants || []),
      stock,
      updatedAt: new Date().toISOString(),
    };
    return databases.createDocument(config.databaseId, config.productCollectionId, ID.unique(), dataToSave);
  }

  static async updateProduct(
    productId: string,
    updatedData: Partial<Omit<Product, "$id" | "stock">> & { lastUpdatedBy?: string }
  ) {
    const dataToUpdate: any = { ...updatedData };
    if (updatedData.variants) {
      dataToUpdate.variants = JSON.stringify(updatedData.variants);
      dataToUpdate.stock = calculateStock(updatedData.variants || []);
    }
    dataToUpdate.updatedAt = new Date().toISOString();
    return databases.updateDocument(config.databaseId, config.productCollectionId, productId, dataToUpdate);
  }

  static async deleteProduct(productId: string) {
    return databases.deleteDocument(config.databaseId, config.productCollectionId, productId);
  }
}
