// run_seeder.js (Hoặc .ts)

// SỬ DỤNG REQUIRE ĐỂ LẤY HÀM
const { seedAllData } = require('./scripts/seedData.js'); // Đảm bảo đúng đường dẫn và đuôi .js

const run = async () => {
    try {
        await seedAllData();
    } catch (e) {
        console.error("LỖI CHẠY SEEDING:", e);
    } finally {
        process.exit(0); 
    }
};

run();