// config/firebase.ts

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// KHÔNG CÓ BẤT KỲ IMPORT NÀO TỪ 'firebase/auth' Ở ĐÂY NỮA
import { getAuth } from 'firebase/auth'; // Chỉ lấy hàm getAuth thông thường

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


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app); 

// Lấy Auth instance TẠM THỜI (vì AuthContext sẽ khởi tạo lại nó)
const auth = getAuth(app);

export { app, auth, db, storage };