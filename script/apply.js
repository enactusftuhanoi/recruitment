import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔧 Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Form submit
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const form = document.getElementById("applyForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullname = document.getElementById("fullname").value.trim();
    const reason = document.getElementById("reason").value.trim();
    const skills = document.getElementById("skills").value.trim();

    try {
      // Ghi dữ liệu đơn ứng tuyển
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        displayName: user.displayName,
        fullname,
        reason,
        skills,
        status: "Đã nộp đơn",
        submittedAt: new Date()
      });

      alert("Đơn của bạn đã được gửi thành công!");
      window.location.href = "profile.html";
    } catch (err) {
      alert("Gửi đơn thất bại: " + err.message);
    }
  });

  // Logout
  document.getElementById("logoutBtn").addEventListener("click", () => {
    signOut(auth).then(() => {
      window.location.href = "index.html";
    });
  });
});
