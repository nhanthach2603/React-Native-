const admin = require('firebase-admin');
const fs = require('fs');

// 1. KHỞI TẠO FIREBASE ADMIN
// Trỏ đến file serviceAccountKey.json của bạn
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Thay đổi URL nếu cần
  databaseURL: "https://appquanlykho-default-rtdb.firebaseio.com" 
});

const db = admin.firestore();

// 2. ĐỌC DỮ LIỆU TỪ FILE JSON MỚI
// Thay đổi tên file ở đây để import dữ liệu thời trang
const categoriesData = JSON.parse(fs.readFileSync('fashion_categories.json', 'utf8'));
const productsData = JSON.parse(fs.readFileSync('fashion_products.json', 'utf8'));

// 3. HÀM IMPORT DỮ LIỆU (Giữ nguyên)
async function importData() {
  try {
    // Sử dụng Batch để ghi dữ liệu hiệu quả hơn
    const categoryBatch = db.batch();
    console.log('Chuẩn bị import Categories...');
    categoriesData.forEach(category => {
      const docRef = db.collection('categories').doc(category.id);
      categoryBatch.set(docRef, category);
    });
    await categoryBatch.commit();
    console.log(`Import ${categoriesData.length} Categories thành công!`);

    const productBatch = db.batch();
    console.log('\nChuẩn bị import Products...');
    productsData.forEach(product => {
      const docRef = db.collection('products').doc(product.id);
      productBatch.set(docRef, product);
    });
    await productBatch.commit();
    console.log(`Import ${productsData.length} Products thành công!`);

    console.log('\nHoàn tất quá trình import!');

  } catch (error) {
    console.error('Lỗi trong quá trình import:', error);
  }
}

// 4. CHẠY HÀM IMPORT
importData();
