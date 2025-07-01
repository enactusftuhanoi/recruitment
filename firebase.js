// script/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// 🔧 Thay config này bằng của bạn
const firebaseConfig = {
      apiKey: "AIzaSyDuTvBn8Xl01DYddVXQ7M0L24K3l-GyG0c",
      authDomain: "enactusftuhanoi-tracuu.firebaseapp.com",
      projectId: "enactusftuhanoi-tracuu",
      storageBucket: "enactusftuhanoi-tracuu.appspot.com",
      messagingSenderId: "611356979403",
      appId: "1:611356979403:web:2c9a4cffb2b323ce3deb4e"
    };

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// DOM
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      alert("Lỗi đăng nhập: " + error.message);
    }
  });
}

// Nếu đã đăng nhập → chuyển hướng tới profile.html
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "/user/profile.html";
  }
});
