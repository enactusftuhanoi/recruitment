import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, getDocs, doc, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDuTvBn8Xl01DYddVXQ7M0L24K3l-GyG0c",
  authDomain: "enactusftuhanoi-tracuu.firebaseapp.com",
  projectId: "enactusftuhanoi-tracuu",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const userList = document.getElementById("userList");
const roundsContainer = document.getElementById("roundsContainer");
const roundDetailContainer = document.getElementById("roundDetailContainer");

const steps = [
  "Vòng đơn", "Phỏng vấn nhóm", "Thử thách", "Phỏng vấn cá nhân"
];

let usersData = [];

// ==== AUTH CHECK ====
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "https://member.enactusftuhanoi.id.vn/login.html?redirect=https://recruitment.enactusftuhanoi.id.vn/admin/admin.html";
    return;
  }

  const empDoc = await getDoc(doc(db, "employee", user.email));
  if (!empDoc.exists() || empDoc.data().role !== "admin") {
    alert("Bạn không có quyền truy cập trang này.");
    await signOut(auth);
    window.location.href = "https://member.enactusftuhanoi.id.vn/login.html?redirect=https://recruitment.enactusftuhanoi.id.vn/admin/admin.html";
    return;
  }

  loadUsers();
});

window.logout = async function() {
  await signOut(auth);
  window.location.href = "https://member.enactusftuhanoi.id.vn/login.html?redirect=https://recruitment.enactusftuhanoi.id.vn/admin/admin.html";
};

// ==== LOAD USERS ====
async function loadUsers() {
  const snapshot = await getDocs(collection(db, "users"));
  usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderUsers();
  renderRounds();
  renderRoundDetails();
}

// ==== RENDER USER TABLE ====
function renderUsers() {
  userList.innerHTML = usersData.map(user => `
    <tr>
      <td>${user.fullname}</td>
      <td>${user.email}</td>
      <td>
        <button onclick="editUser('${user.id}')">Chỉnh sửa</button>
      </td>
    </tr>
  `).join("");
}

window.editUser = async function (uid) {
  const user = usersData.find(u => u.id === uid);
  const name = prompt("Họ tên:", user.fullname);
  const email = prompt("Email:", user.email);
  if (name && email) {
    await updateDoc(doc(db, "users", uid), { fullname: name, email });
    loadUsers();
  }
}

// ==== RENDER ROUND STATUS ====
function renderRounds() {
  roundsContainer.innerHTML = usersData.map(user => `
    <div class="user-round-box">
      <h3>${user.fullname}</h3>
      <label>Vòng hiện tại: 
        <select onchange="changeRound('${user.id}', this.value)">
          ${[1, 2, 3, 4, 5].map(i => `
            <option value="${i}" ${i == user.current_round ? "selected" : ""}>
              ${i <= 4 ? `Vòng ${i}` : "✅ Đã hoàn thành"}
            </option>
          `).join("")}
        </select>
      </label>
    </div>
  `).join("");
}

window.changeRound = async function(uid, value) {
  await updateDoc(doc(db, "users", uid), { current_round: parseInt(value) });
  loadUsers();
}

// ==== RENDER ROUND DETAILS ====
function renderRoundDetails() {
  roundDetailContainer.innerHTML = usersData.map(user => {
    const roundsHTML = [1, 2, 3, 4].map(i => {
      const info = user[`round_${i}`] || {};
      return `
        <div style="border: 1px solid #ccc; margin: 8px 0; padding: 8px;">
          <h4>Vòng ${i}: ${steps[i - 1]}</h4>
          <label>Thời gian: <input type="text" value="${info.time || ''}" id="time-${user.id}-${i}"/></label><br/>
          <label>Ghi chú: <input type="text" value="${info.note || ''}" id="note-${user.id}-${i}"/></label><br/>
          <button class="save" onclick="saveRound('${user.id}', ${i})">Lưu</button>
        </div>
      `;
    }).join("");
    return `<div><h3>${user.fullname}</h3>${roundsHTML}</div>`;
  }).join("");
}

window.saveRound = async function(uid, round) {
  const time = document.getElementById(`time-${uid}-${round}`).value;
  const note = document.getElementById(`note-${uid}-${round}`).value;
  await updateDoc(doc(db, "users", uid), {
    [`round_${round}`]: { time, note }
  });
  alert("Đã lưu thành công!");
}

// ==== TAB SWITCHING ====
window.showTab = function(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add("hidden"));
  document.getElementById(tabId).classList.remove("hidden");
}
