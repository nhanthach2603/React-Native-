/* eslint-disable no-undef */
const sdk = require('node-appwrite');
const path = require('path');

// [SỬA] Chỉ định rõ đường dẫn đến file .env trong cùng thư mục với script này
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log('DEBUG: APPWRITE_ENDPOINT:', process.env.APPWRITE_ENDPOINT);
console.log('DEBUG: APPWRITE_PROJECT_ID:', process.env.APPWRITE_PROJECT_ID);
console.log('DEBUG: APPWRITE_API_KEY (first 5 chars):', process.env.APPWRITE_API_KEY ? process.env.APPWRITE_API_KEY.substring(0, 5) + '...' : 'NOT SET');
console.log('DEBUG: APPWRITE_DATABASE_ID:', process.env.APPWRITE_DATABASE_ID);

// --- KIỂM TRA BIẾN MÔI TRƯỜNG ---
if (!process.env.APPWRITE_ENDPOINT || !process.env.APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY || !process.env.APPWRITE_DATABASE_ID) {
    console.error('❌ Lỗi: Các biến môi trường cần thiết chưa được thiết lập.');
    console.error('Vui lòng tạo file `.env` trong thư mục `scripts` và điền đầy đủ các giá trị:');
    console.error(' - APPWRITE_ENDPOINT\n - APPWRITE_PROJECT_ID\n - APPWRITE_API_KEY\n - APPWRITE_DATABASE_ID');
    process.exit(1);
}

// --- SCHEMA DATABASE ---
const schema = {
    databaseId: process.env.APPWRITE_DATABASE_ID,
    databaseName: 'AppQuanLyKhoDB',
    collections: [
        {
            collectionId: process.env.APPWRITE_COLLECTION_USERS,
            name: 'Users',
            attributes: [
                { key: 'name', type: 'string', size: 255, required: true },
                { key: 'email', type: 'email', size: 255, required: true },
                { key: 'role', type: 'string', size: 50, required: true },
                { key: 'managerId', type: 'string', size: 255, required: false },
                { key: 'phoneNumber', type: 'string', size: 20, required: false },
                { key: 'dateOfBirth', type: 'datetime', required: false },
                { key: 'address', type: 'string', size: 512, required: false },
                { key: 'hourlyRate', type: 'float', required: true },
                { key: 'monthlyHours', type: 'float', required: true },
                { key: 'monthlySalary', type: 'float', required: true },
                { key: 'schedule', type: 'string', size: 10000, required: false },
            ],
            indexes: [
                { key: 'idx_role', type: 'key', attributes: ['role'] },
                { key: 'idx_managerId', type: 'key', attributes: ['managerId'] },
                { key: 'idx_email', type: 'unique', attributes: ['email'] },
            ],
        },
        {
            collectionId: process.env.APPWRITE_COLLECTION_PRODUCTS,
            name: 'Products',
            attributes: [
                { key: 'name', type: 'string', size: 255, required: true },
                { key: 'sku', type: 'string', size: 100, required: true },
                { key: 'category', type: 'string', size: 255, required: true },
                { key: 'price', type: 'float', required: true },
                { key: 'unit', type: 'string', size: 50, required: true },
                { key: 'variants', type: 'string', size: 10000, required: false },
                { key: 'totalQuantity', type: 'integer', required: true },
            ],
            indexes: [
                { key: 'idx_sku', type: 'unique', attributes: ['sku'] },
                { key: 'idx_category', type: 'key', attributes: ['category'] },
                { key: 'idx_name', type: 'fulltext', attributes: ['name'] },
            ],
        },
        {
            collectionId: process.env.APPWRITE_COLLECTION_CATEGORIES,
            name: 'Categories',
            attributes: [
                { key: 'name', type: 'string', size: 255, required: true },
                { key: 'description', type: 'string', size: 512, required: false },
            ],
            indexes: [{ key: 'idx_name', type: 'unique', attributes: ['name'] }],
        },
        {
            collectionId: process.env.APPWRITE_COLLECTION_ORDERS,
            name: 'Orders',
            attributes: [
                { key: 'status', type: 'string', size: 50, required: true },
                { key: 'items', type: 'string', size: 20000, required: true },
                { key: 'totalAmount', type: 'float', required: true },
                { key: 'createdBy', type: 'string', size: 255, required: true },
                { key: 'creatorName', type: 'string', size: 255, required: true },
                { key: 'managerId', type: 'string', size: 255, required: false },
                { key: 'assignedTo', type: 'string', size: 255, required: false },
                { key: 'assignedToName', type: 'string', size: 255, required: false },
                { key: 'warehouseManagerId', type: 'string', size: 255, required: false },
                { key: 'customerName', type: 'string', size: 255, required: false },
                { key: 'customerPhone', type: 'string', size: 20, required: false },
                { key: 'customerAddress', type: 'string', size: 512, required: false },
                { key: 'revisionNote', type: 'string', size: 1000, required: false },
            ],
            indexes: [
                { key: 'idx_status', type: 'key', attributes: ['status'] },
                { key: 'idx_createdBy', type: 'key', attributes: ['createdBy'] },
                { key: 'idx_managerId', type: 'key', attributes: ['managerId'] },
                { key: 'idx_assignedTo', type: 'key', attributes: ['assignedTo'] },
                { key: 'idx_warehouseManagerId', type: 'key', attributes: ['warehouseManagerId'] },
            ],
        },
        {
            collectionId: process.env.APPWRITE_COLLECTION_ROOMS,
            name: 'Chat Rooms',
            attributes: [
                { key: 'name', type: 'string', size: 255, required: true },
                { key: 'type', type: 'string', size: 50, required: true },
                { key: 'participants', type: 'string', size: 255, required: true, array: true },
                { key: 'managerId', type: 'string', size: 255, required: false },
            ],
            indexes: [{ key: 'idx_participants', type: 'key', attributes: ['participants'] }],
        },
        {
            collectionId: process.env.APPWRITE_COLLECTION_MESSAGES,
            name: 'Messages',
            attributes: [
                { key: 'roomId', type: 'string', size: 255, required: true },
                { key: 'senderId', type: 'string', size: 255, required: true },
                { key: 'senderName', type: 'string', size: 255, required: true },
                { key: 'text', type: 'string', size: 4096, required: true },
                { key: 'imageUrl', type: 'url', size: 2000, required: false },
                { key: 'fileUrl', type: 'url', size: 2000, required: false },
            ],
            indexes: [{ key: 'idx_roomId', type: 'key', attributes: ['roomId'] }],
        },
    ],
};

// --- TẠO CLIENT APPWRITE (Đã sửa để dùng setKey() tường minh) ---
const serverClient = new sdk.Client();

serverClient
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new sdk.Databases(serverClient);

// Hàm tiện ích chờ
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function setupDatabase() {
    console.log('Bắt đầu quá trình cài đặt...');

    // 1. Tạo Database nếu chưa tồn tại
    try {
        console.log(`Đang tạo database "${schema.databaseName}"...`);
        // Lỗi 401: User (role: guests) missing scopes (["databases.write"]) xảy ra ở đây
        await databases.create(schema.databaseId, schema.databaseName);
        console.log(`✅ Database "${schema.databaseName}" đã được tạo.`);
    } catch (e) {
        if (e.code === 409) { // 409 Conflict = Database đã tồn tại
            console.log(`✅ Database "${schema.databaseName}" đã tồn tại.`);
        } else {
            console.error(`❌ Lỗi nghiêm trọng khi tạo/kiểm tra database:`, e);
            throw e; // Ném lỗi ra ngoài để dừng script
        }
    }

    // 2. Lặp qua từng collection để tạo
    for (const collection of schema.collections) {
        // 2.1. Tạo Collection nếu chưa tồn tại
        try {
            console.log(`\nĐang tạo collection "${collection.name}"...`);
            await databases.createCollection(schema.databaseId, collection.collectionId, collection.name);
            console.log(`   ✅ Collection "${collection.name}" đã được tạo.`);
            await wait(1000); // Chờ một chút để collection sẵn sàng
        } catch (e) {
            if (e.code === 409) { // 409 Conflict = Collection đã tồn tại
                console.log(`   ✅ Collection "${collection.name}" đã tồn tại.`);
            } else {
                console.error(`   ❌ Lỗi nghiêm trọng khi tạo collection "${collection.name}":`, e.message);
                continue; // Bỏ qua collection này và tiếp tục với collection tiếp theo
            }
        }

        // 2.2 Lặp qua từng attribute để tạo
        for (const attr of collection.attributes) {
            try {
                switch (attr.type) {
                    case 'string':
                        await databases.createStringAttribute(schema.databaseId, collection.collectionId, attr.key, attr.size, attr.required, undefined, attr.array);
                        break;
                    case 'integer':
                        await databases.createIntegerAttribute(schema.databaseId, collection.collectionId, attr.key, attr.required);
                        break;
                    case 'float':
                        await databases.createFloatAttribute(schema.databaseId, collection.collectionId, attr.key, attr.required);
                        break;
                    case 'boolean':
                        await databases.createBooleanAttribute(schema.databaseId, collection.collectionId, attr.key, attr.required);
                        break;
                    case 'datetime':
                        await databases.createDatetimeAttribute(schema.databaseId, collection.collectionId, attr.key, attr.required);
                        break;
                    case 'email':
                        await databases.createEmailAttribute(schema.databaseId, collection.collectionId, attr.key, attr.required);
                        break;
                    case 'url':
                        await databases.createUrlAttribute(schema.databaseId, collection.collectionId, attr.key, attr.required);
                        break;
                }
                console.log(`   - Đã tạo attribute: "${attr.key}"`);
                await wait(500);
            } catch (e) {
                if (e.code === 409) console.log(`   - Attribute "${attr.key}" đã tồn tại.`);
                else console.error(`   - Lỗi khi tạo attribute "${attr.key}":`, e.message);
            }
        }

        // 2.3 Chờ cho tất cả attributes được tạo xong trước khi tạo index
        console.log('   ... Đang chờ attributes sẵn sàng để tạo index...');
        await wait(2000); // Chờ 2 giây

        // 2.4 Lặp qua từng index để tạo
        for (const index of collection.indexes) {
            try {
                await databases.createIndex(schema.databaseId, collection.collectionId, index.key, index.type, index.attributes);
                console.log(`   - Đã tạo index: "${index.key}"`);
                await wait(500);
            } catch (e) {
                if (e.code === 409) console.log(`   - Index "${index.key}" đã tồn tại.`);
                else console.error(`   - Lỗi khi tạo index "${index.key}":`, e.message);
            }
        }
    }

    console.log('\n🎉 Quá trình cài đặt hoàn tất!');
}

setupDatabase().catch(error => {
    console.error('\n❌ Đã xảy ra lỗi nghiêm trọng:');
    console.error(error);
});