import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
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
    window.location.href = "../login.html";
    return;
  }

  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    alert("Không tìm thấy thông tin của bạn.");
    return;
  }

  const data = docSnap.data();

  // 🔷 1. Hiển thị trạng thái các vòng
  const currentRound = parseInt(data.current_round || "1");
  statusSection.innerHTML = steps.map(step => `
    <div class="step ${step.id < currentRound ? 'done' : step.id === currentRound ? 'current' : ''}">
      <div class="circle">${step.id}</div>
      <div class="label">${step.title}</div>
    </div>
  `).join("");

  // 🔷 2. Hiển thị thông tin cá nhân
  const fields = [
    { label: "Họ và Tên", value: data.fullname },
    { label: "MSSV", value: data.student_id },
    { label: "Lớp, Khoa, Trường", value: data.class_info },
    { label: "Ngày sinh", value: data.dob },
    { label: "Giới tính", value: data.gender },
    { label: "Số điện thoại", value: data.phone },
    { label: "Email", value: data.email },
    { label: "Link Facebook", value: data.facebook },
  ];

  profileInfo.innerHTML = fields.map(field => `
    <div class="info-item">
      <span class="label">${field.label}:</span>
      <span class="value">${field.value || "-"}</span>
    </div>
  `).join("");

  // 🔷 3. Chi tiết vòng hiện tại
  const roundInfo = data[`round_${currentRound}`] || {};
  currentRoundDetails.innerHTML = `
    <p><strong>Vòng:</strong> ${steps[currentRound - 1].title}</p>
    <p><strong>Thời gian:</strong> ${roundInfo.time || "Đang cập nhật"}</p>
    <p><strong>Ghi chú:</strong> ${roundInfo.note || "Không có ghi chú"}</p>
  `;
});
