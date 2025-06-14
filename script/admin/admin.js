import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ✅ EmailJS Init
import "https://cdn.jsdelivr.net/npm/emailjs-com@3/dist/email.min.js";
emailjs.init("oZoiyPZ9LMydFbId3"); // ✅ Public Key của bạn

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
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${data.email}</td>
      <td>${data.fullname || "-"}</td>
      <td><input value="${data.status || ""}" data-field="status" data-id="${docSnap.id}"/></td>
      <td><input value="${data.interview || ""}" data-field="interview" data-id="${docSnap.id}"/></td>
      <td><input value="${data.result || ""}" data-field="result" data-id="${docSnap.id}"/></td>
      <td><button data-id="${docSnap.id}">Lưu</button></td>
    `;

    table.appendChild(tr);
  });

  table.addEventListener("click", async (e) => {
    if (e.target.tagName === "BUTTON") {
      const id = e.target.dataset.id;
      const row = e.target.closest("tr");
      const inputs = row.querySelectorAll("input");

      const updates = {};
      inputs.forEach(input => {
        updates[input.dataset.field] = input.value.trim();
      });

      await updateDoc(doc(db, "users", id), updates);
      alert("✅ Đã cập nhật!");

      // 👇 Gửi mail tự động nếu có kết quả
      if (updates.result && row.children[0].textContent.includes("@")) {
        const email = row.children[0].textContent;
        const fullname = row.children[1].textContent;
        const result = updates.result;

        // ⚙️ Tùy chỉnh kết quả
        const colorMap = {
          "Đạt": "#22c55e",
          "Trượt": "#ef4444",
          "Phỏng vấn": "#f59e0b"
        };

        const zaloLink = "enactusftuhanoi.id.vn";
        const interviewLink = result === "Phỏng vấn" ? updates.interview || "Sẽ cập nhật sau" : "";

        const emailParams = {
          to_email: email,
          fullname: fullname || "Ứng viên",
          result: result,
          result_color: colorMap[result] || "#1d4ed8",
          zalo_link: result === "Đạt" ? zaloLink : "",
          interview_link: result === "Phỏng vấn" ? interviewLink : "",
          year: new Date().getFullYear()
        };

        // 🔁 Gửi qua EmailJS
        emailjs.send("default_service", "enactusftuhn_recruitment", emailParams)
          .then(() => {
            console.log("📨 Email đã gửi tới", email);
          })
          .catch((err) => {
            console.error("❌ Lỗi gửi email:", err);
            alert("Lỗi gửi email. Kiểm tra lại cấu hình EmailJS.");
          });
      }
    }
  });
});
