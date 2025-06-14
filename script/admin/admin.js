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

// ✅ Chỉ cho phép các email sau được vào admin
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

  // Sự kiện cập nhật
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
    }
  });
});
