// d:\React-Native-\config\appwrite.ts
import { Account, Client, Databases, Functions, Realtime, Storage } from "appwrite";
import Constants from "expo-constants";

/**
 * Lấy extra từ expo config (hỗ trợ cả manifest cũ và expoConfig)
 */
const extra =
  (Constants as any).manifest?.extra ||
  (Constants as any).expoConfig?.extra ||
  {};

// debug nhỏ — bạn có thể bỏ các console log này sau khi chạy ok
console.log("EXTRA keys:", Object.keys(extra || {}));
console.log("APPWRITE_PROJECT_ID:", extra?.APPWRITE_PROJECT_ID);
console.log("APPWRITE_ENDPOINT:", extra?.APPWRITE_ENDPOINT);

const APPWRITE_ENDPOINT = extra?.APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = extra?.APPWRITE_PROJECT_ID;
const APPWRITE_DATABASE_ID = extra?.APPWRITE_DATABASE_ID;

const APPWRITE_COLLECTION_USERS = extra?.APPWRITE_COLLECTION_USERS;
const APPWRITE_COLLECTION_PRODUCTS = extra?.APPWRITE_COLLECTION_PRODUCTS;
const APPWRITE_COLLECTION_CATEGORIES = extra?.APPWRITE_COLLECTION_CATEGORIES;
const APPWRITE_COLLECTION_ORDERS = extra?.APPWRITE_COLLECTION_ORDERS;
const APPWRITE_COLLECTION_MESSAGES = extra?.APPWRITE_COLLECTION_MESSAGES;
const APPWRITE_COLLECTION_ROOMS = extra?.APPWRITE_COLLECTION_ROOMS;
const APPWRITE_BUCKET_FILES = extra?.APPWRITE_BUCKET_FILES;
const APPWRITE_BUCKET_CHAT_FILES = extra?.APPWRITE_BUCKET_CHAT_FILES;

console.log("APPWRITE_DATABASE_ID (before check):", APPWRITE_DATABASE_ID);
console.log("APPWRITE_COLLECTION_USERS (before check):", APPWRITE_COLLECTION_USERS);

// Kiểm tra tối thiểu
if (!APPWRITE_PROJECT_ID || !APPWRITE_ENDPOINT || !APPWRITE_DATABASE_ID) {
  // Throw để dev biết cấu hình sai. Bạn có thể chuyển sang console.warn nếu muốn non-fatal.
  throw new Error(
    "Vui lòng cấu hình APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID và APPWRITE_DATABASE_ID trong app.json (expo.extra)."
  );
}

// Khởi tạo client + service instances
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT) // ví dụ: https://fra.cloud.appwrite.io/v1
  .setProject(APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);
const realtime = new Realtime(client);
const functions = new Functions(client);

// Gói config tiện lợi
const config = {
  endpoint: APPWRITE_ENDPOINT,
  projectId: APPWRITE_PROJECT_ID,
  databaseId: APPWRITE_DATABASE_ID,
  userCollectionId: APPWRITE_COLLECTION_USERS,
  productCollectionId: APPWRITE_COLLECTION_PRODUCTS,
  categoryCollectionId: APPWRITE_COLLECTION_CATEGORIES,
  orderCollectionId: APPWRITE_COLLECTION_ORDERS,
  messageCollectionId: APPWRITE_COLLECTION_MESSAGES,
  roomCollectionId: APPWRITE_COLLECTION_ROOMS,
  storageBucketId: APPWRITE_BUCKET_FILES,
  chatFilesBucketId: APPWRITE_BUCKET_CHAT_FILES,
};

export { account, client, config, databases, functions, realtime, storage };

