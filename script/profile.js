import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDuTvBn8Xl01DYddVXQ7M0L24K3l-GyG0c",
  authDomain: "enactusftuhanoi-tracuu.firebaseapp.com",
  projectId: "enactusftuhanoi-tracuu",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const statusTimeline = document.getElementById("statusTimeline");
const profileBox = document.getElementById("profileBox");

const renderTimeline = (statusMap) => {
  const rounds = [
    { id: 1, name: "Vòng đơn" },
    { id: 2, name: "Phỏng vấn nhóm" },
    { id: 3, name: "Thử thách" },
    { id: 4, name: "Phỏng vấn cá nhân" }
  ];

  statusTimeline.innerHTML = rounds.map(round => {
    const s = statusMap[`round${round.id}`] || {};
    const state = s.status || "Chưa bắt đầu";
    const time = s.time || "-";
    const info = s.info || "";

    return `
      <div class="round-step">
        <div class="step-title">${round.name}</div>
        <div class="step-status">${state}</div>
        <div class="step-time">${time}</div>
        <div class="step-info">${info}</div>
      </div>
    `;
  }).join("");
};

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Vui lòng đăng nhập để xem hồ sơ.");
    window.location.href = "../login.html";
    return;
  }

  const uid = user.uid;
  const userDoc = await getDoc(doc(db, "users", uid));

  if (!userDoc.exists()) {
    alert("Không tìm thấy hồ sơ.");
    return;
  }

  const data = userDoc.data();

  document.getElementById("fullname").textContent = data.fullname || "-";
  document.getElementById("studentId").textContent = data.mssv || "-";
  document.getElementById("classInfo").textContent = data.class || "-";
  document.getElementById("dob").textContent = data.dob || "-";
  document.getElementById("gender").textContent = data.gender || "-";
  document.getElementById("phone").textContent = data.phone || "-";
  document.getElementById("email").textContent = data.email || "-";
  document.getElementById("facebook").href = data.facebook || "#";

  // Gọi render trạng thái
  renderTimeline(data.status || {});
});
