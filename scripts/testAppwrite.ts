import { config, databases } from '../config/appwrite';


(async () => {
  try {
    const result = await databases.listDocuments(config.databaseId, config.productCollectionId);
    console.log("✅ Appwrite connection OK:", result.total);
  } catch (err) {
    console.error("❌ Lỗi kết nối Appwrite:", err);
  }
})();
