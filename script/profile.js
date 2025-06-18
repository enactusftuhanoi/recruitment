import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔐 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDuTvBn8Xl01DYddVXQ7M0L24K3l-GyG0c",
  authDomain: "enactusftuhanoi-tracuu.firebaseapp.com",
  projectId: "enactusftuhanoi-tracuu",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 🔄 Mỗi vòng
const steps = [
  { id: 1, title: "Vòng đơn" },
  { id: 2, title: "Phỏng vấn nhóm" },
  { id: 3, title: "Thử thách" },
  { id: 4, title: "Phỏng vấn cá nhân" },
];

const statusSection = document.getElementById("statusSection");
const profileInfo = document.getElementById("profileInfo");
const currentRoundDetails = document.getElementById("currentRoundDetails");

// 🧠 Khi người dùng đăng nhập
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Bạn cần đăng nhập để xem hồ sơ.");
    window.location.href = "../login.html"; // hoặc "index.html" tùy bạn
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // Nếu chưa có, tạo mới
    await setDoc(userRef, {
      email: user.email,
      fullname: user.displayName || "Chưa cập nhật",
      status: "Chưa nộp đơn",
      current_round: 1,
      createdAt: new Date()
    });
  }
  // 🔓 Xử lý nút Đăng xuất
  document.getElementById("logoutBtn").addEventListener("click", () => {
    signOut(auth)
      .then(() => {
        alert("Bạn đã đăng xuất thành công.");
        window.location.href = "../login.html";
      })
      .catch((error) => {
        console.error("Lỗi đăng xuất:", error);
        alert("Đăng xuất thất bại. Vui lòng thử lại.");
      });
  });

  // Lấy lại dữ liệu đã có/tạo
  const docSnap = await getDoc(userRef);
  const data = docSnap.data();

  // 🔷 Hiển thị status (nếu bạn muốn thêm)
  if (document.getElementById("status")) {
    document.getElementById("status").textContent = data.status || "Chưa nộp đơn";
  }

  // 🔷 Hiển thị thông tin cá nhân
  const fields = [
    { label: "Họ và Tên", value: data.fullname },
    { label: "Email", value: data.email },
  ];
  profileInfo.innerHTML = fields.map(field => `
    <div class="info-item">
      <span class="label">${field.label}:</span>
      <span class="value">${field.value || "-"}</span>
    </div>
  `).join("");

  // 🔷 Hiển thị trạng thái các vòng
  const currentRound = parseInt(data.current_round || "1");
  statusSection.innerHTML = steps.map(step => `
    <div class="step ${step.id < currentRound ? 'done' : step.id === currentRound ? 'current' : ''}">
      <div class="circle">${step.id}</div>
      <div class="label">${step.title}</div>
    </div>
  `).join("");

  // 🔷 Chi tiết vòng hiện tại
  const roundInfo = data[`round_${currentRound}`] || {};
  currentRoundDetails.innerHTML = `
    <p><strong>Vòng:</strong> ${steps[currentRound - 1].title}</p>
    <p><strong>Thời gian:</strong> ${roundInfo.time || "Đang cập nhật"}</p>
    <p><strong>Ghi chú:</strong> ${roundInfo.note || "Không có ghi chú"}</p>
  `;
  
  window.addEventListener("beforeunload", () => {
  signOut(auth);
  window.location.href = "../login.html"; // hoặc "index.html" tùy bạn
  });

});
