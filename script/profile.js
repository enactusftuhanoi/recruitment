import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDuTvBn8Xl01DYddVXQ7M0L24K3l-GyG0c",
  authDomain: "enactusftuhanoi-tracuu.firebaseapp.com",
  projectId: "enactusftuhanoi-tracuu",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ROUND_INFO = [
  { name: "Vòng 1", label: "Đơn", field: "status1" },
  { name: "Vòng 2", label: "Phỏng vấn nhóm", field: "status2" },
  { name: "Vòng 3", label: "Thử thách", field: "status3" },
  { name: "Vòng 4", label: "Phỏng vấn cá nhân", field: "status4" },
];

function renderStatusBar(data) {
  const container = document.getElementById("statusBar");
  container.innerHTML = "";

  ROUND_INFO.forEach((round, i) => {
    const status = data[round.field]?.toLowerCase() || "chưa bắt đầu";
    const step = document.createElement("div");
    step.className = "step";

    if (status.includes("đạt") || status.includes("hoàn thành")) {
      step.classList.add("done");
    } else if (status.includes("đang") || status.includes("đang diễn ra")) {
      step.classList.add("current");
    }

    step.innerHTML = `
      <div class="circle">${i + 1}</div>
      <div class="label">${round.name}<br><small>${round.label}</small></div>
    `;
    container.appendChild(step);
  });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Vui lòng đăng nhập!");
    window.location.href = "../login.html";
    return;
  }

  const docRef = doc(db, "users", user.uid);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    alert("Không tìm thấy hồ sơ.");
    return;
  }

  const data = snap.data();
  renderStatusBar(data);

  const form = document.getElementById("profileForm");
  for (const field of form.elements) {
    if (field.name && data[field.name]) {
      field.value = data[field.name];
    }
  }

  const editBtn = document.getElementById("editBtn");
  const saveBtn = document.getElementById("saveBtn");

  editBtn.onclick = () => {
    [...form.elements].forEach(f => f.disabled = false);
    editBtn.style.display = "none";
    saveBtn.style.display = "inline-block";
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const updates = {};
    for (const field of form.elements) {
      if (field.name) updates[field.name] = field.value.trim();
    }

    await updateDoc(docRef, updates);
    alert("✅ Đã cập nhật hồ sơ!");

    [...form.elements].forEach(f => f.disabled = true);
    editBtn.style.display = "inline-block";
    saveBtn.style.display = "none";
  };
});
