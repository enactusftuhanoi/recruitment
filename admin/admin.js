import "https://cdn.jsdelivr.net/npm/emailjs-com@3/dist/email.min.js";

emailjs.init("oZoiyPZ9LMydFbId3");

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, getDocs, doc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDuTvBn8Xl01DYddVXQ7M0L24K3l-GyG0c",
  authDomain: "enactusftuhanoi-tracuu.firebaseapp.com",
  projectId: "enactusftuhanoi-tracuu",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const userList = document.getElementById("userList");
const roundsContainer = document.getElementById("roundsContainer");
const roundDetailContainer = document.getElementById("roundDetailContainer");

const steps = [
  "Vòng đơn", "Phỏng vấn nhóm", "Thử thách", "Phỏng vấn cá nhân"
];

let usersData = [];

async function loadUsers() {
  const snapshot = await getDocs(collection(db, "users"));
  usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderUsers();
  renderRounds();
  renderRoundDetails();
}

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

window.showTab = function(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add("hidden"));
  document.getElementById(tabId).classList.remove("hidden");
}

let generatedOTP = "";
let otpTimestamp = null;
let loginEmail = "";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

window.sendOTP = async function () {
  loginEmail = document.getElementById("loginEmail").value.trim().toLowerCase();
  if (!loginEmail) return alert("Vui lòng nhập email.");

  const snapshot = await getDocs(collection(db, "employees"));
  const matched = snapshot.docs.find(doc =>
    doc.data().email?.toLowerCase() === loginEmail &&
    doc.data().process === "Active"
  );

  if (!matched) {
    alert("Email không tồn tại hoặc chưa được kích hoạt.");
    return;
  }

  generatedOTP = generateOTP();
  otpTimestamp = Date.now();

  try {
    await emailjs.send("service_1gnlqvu", "recruitment_otp", {
      email: loginEmail,
      otp_code: generatedOTP
    });
    alert("Đã gửi mã OTP tới email của bạn.");
    document.getElementById("otpInput").classList.remove("hidden");
    document.getElementById("verifyBtn").classList.remove("hidden");
  } catch (error) {
    console.error("Lỗi gửi email:", error);
    alert("Không thể gửi OTP. Vui lòng thử lại.");
  }
};

window.verifyOTP = function () {
  const entered = document.getElementById("otpInput").value.trim();
  const now = Date.now();

  if (!generatedOTP || !otpTimestamp || (now - otpTimestamp > 5 * 60 * 1000)) {
    alert("Mã OTP đã hết hạn. Vui lòng gửi lại.");
    return;
  }

  if (entered === generatedOTP) {
    localStorage.setItem("loggedInEmail", loginEmail);
    alert("Đăng nhập thành công!");
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("adminContent").style.display = "block";
    loadUsers();
  } else {
    alert("Sai mã OTP. Vui lòng thử lại.");
  }
};

window.logout = function () {
  localStorage.removeItem("loggedInEmail");
  location.reload();
};

window.addEventListener("DOMContentLoaded", () => {
  const savedEmail = localStorage.getItem("loggedInEmail");
  if (savedEmail) {
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("adminContent").style.display = "block";
    loadUsers();
  }
});

window.addEventListener("beforeunload", () => {
  localStorage.removeItem("loggedInEmail");
});
