const admin = require('firebase-admin');
//node deleteData.js
// 1. KHỞI TẠO FIREBASE ADMIN (giống file import)
// Đảm bảo file serviceAccountKey.json của bạn vẫn ở đúng vị trí
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

/**
 * Hàm xóa tất cả các document trong một collection theo từng batch.
 * @param {FirebaseFirestore.CollectionReference} collectionRef - Tham chiếu đến collection cần xóa.
 * @param {number} batchSize - Số lượng document xóa trong một lần.
 */
async function deleteCollection(collectionRef, batchSize) {
  const query = collectionRef.limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve, reject);
  });
}

async function deleteQueryBatch(query, resolve, reject) {
  try {
    const snapshot = await query.get();

    // Khi không còn document nào, quá trình hoàn tất
    if (snapshot.size === 0) {
      return resolve();
    }

    // Xóa các document trong một batch
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Gọi lại hàm để xóa batch tiếp theo
    process.nextTick(() => {
      deleteQueryBatch(query, resolve, reject);
    });
  } catch (error) {
    console.error("Lỗi khi xóa batch: ", error);
    reject(error);
  }
}

/**
 * Hàm chính để bắt đầu quá trình xóa
 */
async function deleteAllProductData() {
  console.log('!!! CẢNH BÁO: DỮ LIỆU SẼ BỊ XÓA VĨNH VIỄN !!!');
  console.log('Bắt đầu quá trình xóa dữ liệu trong 5 giây...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    console.log('\nĐang xóa collection "products"...');
    const productsRef = db.collection('products');
    await deleteCollection(productsRef, 100); // Xóa 100 document mỗi lần
    console.log('=> Xóa thành công collection "products"!');

    console.log('\nĐang xóa collection "categories"...');
    const categoriesRef = db.collection('categories');
    await deleteCollection(categoriesRef, 100);
    console.log('=> Xóa thành công collection "categories"!');

    console.log('\n✅ HOÀN TẤT! Dữ liệu đã được dọn dẹp.');
  } catch (error) {
    console.error('❌ Lỗi nghiêm trọng trong quá trình xóa dữ liệu:', error);
  }
}

// Chạy hàm chính
deleteAllProductData();
