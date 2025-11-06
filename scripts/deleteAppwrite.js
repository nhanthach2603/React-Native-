/* eslint-disable no-undef */
// d:\React-Native-\scripts\deleteAppwrite.js
const sdk = require('node-appwrite');
const path = require('path'); // Import path module

// --- 1. CẤU HÌNH VÀ KHỞI TẠO ---
require('dotenv').config({ path: path.resolve(__dirname, '.env') }); // Use path.resolve for consistent path resolution

// eslint-disable-next-line expo/no-env-var-destructuring
const { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID } = process.env;

if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY || !APPWRITE_DATABASE_ID) {
    console.error('❌ Lỗi: Vui lòng kiểm tra lại file .env và đảm bảo các biến môi trường Appwrite đã được thiết lập.');
    process.exit(1);
}

const client = new sdk.Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

const databases = new sdk.Databases(client);
const users = new sdk.Users(client);

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Xóa tất cả các document trong một collection.
 * @param {string} databaseId
 * @param {string} collectionId
 */
async function deleteAllDocuments(databaseId, collectionId) {
    console.log(`   -> Đang xóa documents trong collection '${collectionId}'...`);
    try {
        let documents = await databases.listDocuments(databaseId, collectionId);
        while (documents.total > 0) {
            console.log(`      - Tìm thấy ${documents.documents.length} documents để xóa...`);
            for (const doc of documents.documents) {
                await databases.deleteDocument(databaseId, collectionId, doc.$id);
            }
            documents = await databases.listDocuments(databaseId, collectionId);
        }
        console.log(`   -> ✅ Đã xóa hết documents trong '${collectionId}'.`);
    } catch (error) {
        // Bỏ qua lỗi nếu collection không tồn tại
        if (error.code !== 404) {
            console.error(`   -> ❌ Lỗi khi xóa documents từ '${collectionId}':`, error.message);
        } else {
            console.log(`   -> 🟡 Collection '${collectionId}' không tồn tại, bỏ qua.`);
        }
    }
}

/**
 * Xóa tất cả người dùng khỏi Appwrite Auth.
 */
async function deleteAllUsers() {
    console.log('\n👤 Chuẩn bị xóa tất cả người dùng khỏi Appwrite Auth...');
    try {
        let userList = await users.list();
        while (userList.total > 0) {
            console.log(`   - Tìm thấy ${userList.users.length} users để xóa...`);
            for (const user of userList.users) {
                await users.delete(user.$id);
            }
            userList = await users.list();
        }
        console.log('   -> ✅ Đã xóa hết người dùng khỏi Auth.');
    } catch (error) {
        console.error('   -> ❌ Lỗi khi xóa người dùng:', error.message);
    }
}

async function main() {
    console.log('============================================');
    console.log('💣 BẮT ĐẦU QUÁ TRÌNH XÓA DỮ LIỆU APPWRITE');
    console.log('!!! CẢNH BÁO: HÀNH ĐỘNG NÀY KHÔNG THỂ HOÀN TÁC !!!');
    console.log('============================================');
    await wait(5000); // Chờ 5 giây để người dùng có thể hủy

    // Lấy danh sách collections từ schema trong file setup.js để xóa
    const { schema } = require('./setup.js');
    for (const collection of schema.collections) {
        await deleteAllDocuments(APPWRITE_DATABASE_ID, collection.collectionId);
    }

    await deleteAllUsers();

    console.log('\n============================================');
    console.log(`🎉 HOÀN TẤT! Dữ liệu đã được dọn dẹp.`);
    console.log('============================================');
}

main().catch(console.error);