// d:\React-Native-\config\appwrite.ts (ĐÃ SỬA LỖI FUNCTIONS)

import Constants from "expo-constants";

import { Account, Client, Databases, Functions, Realtime, Storage } from 'appwrite';

const extra = (Constants.manifest && Constants.manifest.extra) || (Constants.expoConfig && Constants.expoConfig.extra) || {};
console.log("EXTRA:", extra);
console.log("APPWRITE_PROJECT_ID:", extra.APPWRITE_PROJECT_ID);
console.log("APPWRITE_ENDPOINT:", extra.APPWRITE_ENDPOINT);
const APPWRITE_BUCKET_CHAT_FILES = extra.APPWRITE_BUCKET_CHAT_FILES;
const APPWRITE_BUCKET_FILES = extra.APPWRITE_BUCKET_FILES;
const APPWRITE_COLLECTION_CATEGORIES = extra.APPWRITE_COLLECTION_CATEGORIES;
const APPWRITE_COLLECTION_MESSAGES = extra.APPWRITE_COLLECTION_MESSAGES;
const APPWRITE_COLLECTION_ORDERS = extra.APPWRITE_COLLECTION_ORDERS;
const APPWRITE_COLLECTION_PRODUCTS = extra.APPWRITE_COLLECTION_PRODUCTS;
const APPWRITE_COLLECTION_ROOMS = extra.APPWRITE_COLLECTION_ROOMS;
const APPWRITE_COLLECTION_USERS = extra.APPWRITE_COLLECTION_USERS;
const APPWRITE_DATABASE_ID = extra.APPWRITE_DATABASE_ID;
const APPWRITE_ENDPOINT = extra.APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = extra.APPWRITE_PROJECT_ID;

if (!APPWRITE_PROJECT_ID?.length || !APPWRITE_ENDPOINT?.length) {
	throw new Error("Vui lòng cấu hình APPWRITE_PROJECT_ID và APPWRITE_ENDPOINT trong file .env");
}

const client = new Client();

client
  .setEndpoint(APPWRITE_ENDPOINT) // Your Appwrite Endpoint 
  .setProject(APPWRITE_PROJECT_ID); // Your project ID

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);
const realtime = new Realtime(client);
const functions = new Functions(client); // <-- KHỞI TẠO DỊCH VỤ FUNCTIONS

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

// Export functions ra ngoài
export { account, client, config, databases, functions, realtime, storage };

// Đừng quên tạo file .env ở thư mục gốc và thêm vào:
// APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
// APPWRITE_PROJECT_ID=your_project_id
// APPWRITE_DATABASE_ID=your_database_id
// APPWRITE_COLLECTION_USERS=users
// ... và các collection/bucket ID khác