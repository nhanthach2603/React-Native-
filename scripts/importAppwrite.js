/* eslint-disable no-undef */
// d:\React-Native-\scripts\importAppwrite.js
const sdk = require('node-appwrite');
const fs = require('fs');
const path = require('path');

// --- 1. CẤU HÌNH VÀ KHỞI TẠO ---
 
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// eslint-disable-next-line expo/no-env-var-destructuring
const {
    APPWRITE_ENDPOINT,
    APPWRITE_PROJECT_ID,
    APPWRITE_API_KEY,
    APPWRITE_DATABASE_ID,
    APPWRITE_COLLECTION_USERS,
    APPWRITE_COLLECTION_PRODUCTS,
    APPWRITE_COLLECTION_CATEGORIES,
} = process.env;

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

// --- 2. CÁC HÀM IMPORT ---

/**
 * Import dữ liệu người dùng vào Appwrite Auth và Database.
 */
async function importUsers() {
    try {
         
        const usersFilePath = path.join(__dirname, 'users.json');
        const usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
        console.log(`\n👤 Chuẩn bị import ${usersData.length} người dùng vào Appwrite...`);

        for (const userData of usersData) {
            const { uid, email, password, displayName, role, ...prefsData } = userData;
            try {
                // Bước 1: Tạo người dùng trong Appwrite Auth
                const newUser = await users.create(uid, email, null, password, displayName);
                console.log(`   -> Đã tạo Auth user: ${email}`);

                // Bước 2: Cập nhật Prefs (chứa role và các thông tin khác)
                await users.updatePrefs(uid, { role, ...prefsData });
                console.log(`   -> Đã cập nhật role '${role}' và prefs cho user.`);

                // Bước 3: Tạo document trong collection 'Users'
                // Appwrite không tự động làm việc này, chúng ta cần tạo document riêng
                // để có thể query/filter dễ dàng.
                const userDocument = {
                    name: displayName,
                    email: email,
                    role: role,
                    ...prefsData
                };
                await databases.createDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_USERS, uid, userDocument);
                console.log(`   -> Đã tạo document trong collection 'Users' cho ${email}.`);

            } catch (error) {
                if (error.code === 409) { // User or document already exists
                    console.log(`   -> 🟡 Bỏ qua: Người dùng ${email} (UID: ${uid}) đã tồn tại.`);
                } else {
                    console.error(`   -> ❌ Lỗi khi import ${email}:`, error.message);
                }
            }
            await wait(200); // Thêm một khoảng nghỉ nhỏ để tránh rate limit
        }
        console.log('✅ Import người dùng hoàn tất!');
    } catch (error) {
        console.error('❌ Lỗi nghiêm trọng khi import người dùng:', error.message);
    }
}

/**
 * Import dữ liệu sản phẩm và danh mục vào Appwrite Database.
 */
async function importProductsAndCategories() {
    try {
        // Import Categories
        const categoriesFilePath = path.join(__dirname, 'fashion_categories.json');
        const categoriesData = JSON.parse(fs.readFileSync(categoriesFilePath, 'utf8'));
        console.log(`\n📂 Chuẩn bị import ${categoriesData.length} danh mục...`);
        for (const category of categoriesData) {
            try {
                await databases.createDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_CATEGORIES, category.id, category);
                console.log(`   -> Import thành công danh mục: ${category.name}`);
            } catch (e) {
                if (e.code === 409) console.log(`   -> 🟡 Bỏ qua: Danh mục ${category.name} đã tồn tại.`);
                else console.error(`   -> ❌ Lỗi import danh mục ${category.name}:`, e.message);
            }
            await wait(100);
        }
        console.log('✅ Import danh mục hoàn tất!');

        // Import Products
        const productsFilePath = path.join(__dirname, 'fashion_products.json');
        const productsData = JSON.parse(fs.readFileSync(productsFilePath, 'utf8'));
        console.log(`\n📦 Chuẩn bị import ${productsData.length} sản phẩm...`);
        for (const product of productsData) {
             try {
                await databases.createDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_PRODUCTS, product.id, product);
                console.log(`   -> Import thành công sản phẩm: ${product.name}`);
            } catch (e) {
                if (e.code === 409) console.log(`   -> 🟡 Bỏ qua: Sản phẩm ${product.name} đã tồn tại.`);
                else console.error(`   -> ❌ Lỗi import sản phẩm ${product.name}:`, e.message);
            }
            await wait(100);
        }
        console.log('✅ Import sản phẩm hoàn tất!');
    } catch (error) {
        console.error('❌ Lỗi nghiêm trọng khi import sản phẩm/danh mục:', error.message);
    }
}


/**
 * Hàm chính điều khiển luồng thực thi.
 */
async function main() {
    console.log('============================================');
    console.log('🚀 BẮT ĐẦU QUÁ TRÌNH IMPORT DỮ LIỆU VÀO APPWRITE');
    console.log('============================================');

    await importUsers();
    await importProductsAndCategories();

    console.log('\n============================================');
    console.log(`🎉 HOÀN TẤT!`);
    console.log('============================================');
}

main().catch(console.error);