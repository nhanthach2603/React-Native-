// services/CategoryService.ts
import { ID, Query } from "appwrite";
import { config, databases, realtime } from "../config/appwrite";
import { AppwriteUser } from "../context/AuthContext";

interface AppwriteSubscription {
  unsubscribe: () => void;
}

export interface Category {
  $id?: string;
  name: string;
}

export class CategoryService {
  private static dbId = config.databaseId;
  private static collectionId = config.categoryCollectionId;

  private static categoryChannel() {
    return `databases.${this.dbId}.collections.${this.collectionId}.documents`;
  }

  static async getAllCategories(): Promise<Category[]> {
    try {
      const response = await databases.listDocuments(this.dbId, this.collectionId, [
        Query.orderAsc("name"),
      ]);
      return (response.documents || []).map(d => ({ $id: d.$id, name: d.name }));
    } catch (error: any) {
      console.error("🔥 Lỗi khi lấy danh mục:", error);
      throw new Error(error.message || "Không thể tải danh sách danh mục.");
    }
  }

  static async addCategory(name: string, currentUser: AppwriteUser | null): Promise<any> {
    if (!currentUser || (currentUser.role !== 'tongquanly' && currentUser.role !== 'truongphong')) {
      throw new Error("Bạn không có quyền để tạo danh mục mới.");
    }
    try {
      const response = await databases.createDocument(
        this.dbId,
        this.collectionId,
        ID.unique(),
        { name }
      );
      return response;
    } catch (error: any) {
      console.error("🔥 Lỗi khi tạo danh mục:", error);
      throw new Error(error.message || "Không thể thêm danh mục.");
    }
  }

  static async updateCategory(id: string, data: Partial<Category>): Promise<any> {
    try {
      const response = await databases.updateDocument(this.dbId, this.collectionId, id, data);
      return response;
    } catch (error: any) {
      console.error("🔥 Lỗi khi cập nhật danh mục:", error);
      throw new Error(error.message || "Không thể cập nhật danh mục.");
    }
  }

  static async deleteCategory(id: string): Promise<any> {
    try {
      const response = await databases.deleteDocument(this.dbId, this.collectionId, id);
      return response;
    } catch (error: any) {
      console.error("🔥 Lỗi khi xóa danh mục:", error);
      throw new Error(error.message || "Không thể xóa danh mục.");
    }
  }

  /**
   * Subscribe to category changes. Returns a cleanup function.
   */
  static subscribeToCategories(onUpdateCallback: (categories: Category[]) => void): () => void {
    let mounted = true;
    const fetchAndNotify = async () => {
      try {
        const categories = await CategoryService.getAllCategories();
        if (mounted) onUpdateCallback(categories);
      } catch (e) {
        console.error("🔥 Lỗi khi lấy danh mục:", e);
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

    const sub = realtime.subscribe(
      this.categoryChannel(),
      (response) => {
        console.log("Realtime category event:", response?.events);
        scheduleRefetch();
      }
    ) as unknown as AppwriteSubscription;

    return () => {
      mounted = false;
      if (refetchTimer) {
        clearTimeout(refetchTimer);
        refetchTimer = null;
      }
      try {
        if (sub) {
          sub.unsubscribe();
        }
      } catch (err) {
        console.warn("Warning while unsubscribing realtime for categories:", err);
      }
      console.log("Unsubscribed from categories channel");
    };
  }
}
