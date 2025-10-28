// config/firebase.ts

import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Thay thế các giá trị YOUR_... bằng cấu hình Firebase thực tế của dự án bạn
const firebaseConfig = {
  apiKey: "AIzaSyDd4XmX1Zt0HwW_YLw5vRO0hSDjDyk2QXI",
  authDomain: "appquanlykho.firebaseapp.com",
  databaseURL: "https://appquanlykho-default-rtdb.firebaseio.com",
  projectId: "appquanlykho",
  storageBucket: "appquanlykho.firebasestorage.app",
  messagingSenderId: "97520746711",
  appId: "1:97520746711:web:4c877eba92e688fa113092",
  measurementId: "G-4MCVZ904N0"
};

// [SỬA LỖI] Đảm bảo Firebase chỉ được khởi tạo một lần duy nhất.
// Kiểm tra xem đã có ứng dụng nào được khởi tạo chưa. Nếu chưa, khởi tạo một cái mới.
// Nếu rồi, sử dụng lại ứng dụng đã có. Điều này giúp ổn định kết nối khi có hot-reload.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);
const storage = getStorage(app); 

const auth = getAuth(app);

export { app, auth, db, storage };
