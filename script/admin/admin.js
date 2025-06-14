import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ✅ EmailJS init
import "https://cdn.jsdelivr.net/npm/emailjs-com@3/dist/email.min.js";
emailjs.init("oZoiyPZ9LMydFbId3");

const adminEmails = [
  "tuhm.enactusftu@gmail.com",
  "tuhm2567@gmail.com",
];

const firebaseConfig = {
  apiKey: "AIzaSyDuTvBn8Xl01DYddVXQ7M0L24K3l-GyG0c",
  authDomain: "enactusftuhanoi-tracuu.firebaseapp.com",
  projectId: "enactusftuhanoi-tracuu",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const table = document.getElementById("userTable");

const colorMap = {
  "Đạt": "#22c55e",
  "Trượt": "#ef4444",
  "Phỏng vấn": "#f59e0b"
};

function formatDateWithDay(dateStr, timeStr) {
  const date = new Date(dateStr + "T" + timeStr);
  const weekdays = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  return `${weekdays[date.getDay()]}, ${timeStr}, ${date.getDate()}/${date.getMonth() + 1}`;
}

onAuthStateChanged(auth, async (user) => {
  if (!user || !adminEmails.includes(user.email)) {
    alert("Bạn không có quyền truy cập admin.");
    window.location.href = "../index.html";
    return;
  }

  document.getElementById("adminEmail").textContent = `Đăng nhập với tư cách: ${user.email}`;
  const snapshot = await getDocs(collection(db, "users"));
  table.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${data.email}</td>
      <td>${data.fullname || "-"}</td>
      <td><input value="${data.status || ""}" data-type="status" data-id="${id}"/></td>
      <td>
        <input type="date" data-type="date" data-id="${id}" />
        <select data-type="time" data-id="${id}">
          <option>19:00</option>
          <option>19:30</option>
          <option>20:00</option>
          <option>20:30</option>
        </select>
        <input placeholder="Phòng/Zoom" data-type="location" data-id="${id}" />
      </td>
      <td><input value="${data.result || ""}" data-type="result" data-id="${id}"/></td>
      <td><button data-id="${id}">Lưu</button></td>
    `;
    table.appendChild(tr);
  });

  table.addEventListener("click", async (e) => {
    if (e.target.tagName !== "BUTTON") return;

    const id = e.target.dataset.id;
    const row = e.target.closest("tr");

    const updates = {};
    const inputs = row.querySelectorAll("input, select");

    let date = "", time = "", location = "";

    inputs.forEach((input) => {
      const field = input.dataset.type;
      const value = input.value.trim();

      if (field === "status" || field === "result") {
        updates[field] = value;
      }
      if (field === "date") date = value;
      if (field === "time") time = value;
      if (field === "location") location = value;
    });

    // Nếu có lịch thì gộp lại
    if (date && time && location) {
      updates.interview = `${formatDateWithDay(date, time)}, ${location}`;
    }

    await updateDoc(doc(db, "users", id), updates);
    alert("✅ Đã cập nhật!");

    // 📨 Gửi email nếu có kết quả
    if (updates.result && row.children[0].textContent.includes("@")) {
      const email = row.children[0].textContent;
      const fullname = row.children[1].textContent;
      const result = updates.result;

      const emailParams = {
        to_email: email,
        fullname: fullname || "Ứng viên",
        result: result,
        result_color: colorMap[result] || "#1d4ed8",
        zalo_link: result === "Đạt" ? "https://zalo.me/g/enactus2025" : "",
        interview_link: result === "Phỏng vấn" ? updates.interview || "Sẽ cập nhật sau" : "",
        year: new Date().getFullYear()
      };

      emailjs.send("default_service", "enactusftuhn_recruitment", emailParams)
        .then(() => {
          console.log("📨 Đã gửi mail cho", email);
        })
        .catch((err) => {
          console.error("❌ Lỗi gửi mail:", err);
        });
    }
  });
});
