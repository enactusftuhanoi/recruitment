// Firebase + Admin Script
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDuTvBn8Xl01DYddVXQ7M0L24K3l-GyG0c",
  authDomain: "enactusftuhanoi-tracuu.firebaseapp.com",
  projectId: "enactusftuhanoi-tracuu",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// TAB CHUYỂN
const tabs = document.querySelectorAll('.tab-nav button');
const contents = document.querySelectorAll('.tab-content');
tabs.forEach(btn => {
  btn.onclick = () => {
    tabs.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    contents.forEach(tab => tab.classList.add('hidden'));
    document.getElementById(btn.dataset.tab).classList.remove('hidden');
  }
});

// LOAD THÍ SINH
async function loadCandidates() {
  const snapshot = await getDocs(collection(db, 'users'));
  const table = document.getElementById('candidatesTable');
  table.innerHTML = '';
  snapshot.forEach(doc => {
    const d = doc.data();
    table.innerHTML += `
      <tr>
        <td>${d.fullname || '-'}</td>
        <td>${d.email || '-'}</td>
        <td>${d.student_id || '-'}</td>
        <td>Vòng ${d.current_round || '1'}</td>
        <td><button onclick="selectUser('${doc.id}')">Chi tiết</button></td>
      </tr>
    `;
  });
}

// LOAD ROUNDS
const steps = ["Vòng đơn", "Phỏng vấn nhóm", "Thử thách", "Phỏng vấn cá nhân"];
function loadRounds() {
  const container = document.getElementById("roundsContent");
  container.innerHTML = steps.map((title, i) => `
    <div class="form-group">
      <label><strong>${title}</strong></label>
      <input id="round_${i+1}_time" placeholder="Thời gian">
      <input id="round_${i+1}_note" placeholder="Ghi chú">
      <button onclick="updateRoundInfo(${i+1})">Lưu</button>
    </div>`).join("");
}

async function updateRoundInfo(round) {
  const time = document.getElementById(`round_${round}_time`).value;
  const note = document.getElementById(`round_${round}_note`).value;

  const snapshot = await getDocs(collection(db, "users"));
  snapshot.forEach(async userDoc => {
    const ref = doc(db, "users", userDoc.id);
    await updateDoc(ref, { [`round_${round}.time`]: time, [`round_${round}.note`]: note });
  });
  alert("Đã lưu thông tin cho tất cả thí sinh!");
}

// CHI TIẾT VÒNG THEO USER
async function loadUserList() {
  const select = document.getElementById("userSelect");
  const snapshot = await getDocs(collection(db, "users"));
  select.innerHTML = "";
  snapshot.forEach(doc => {
    const d = doc.data();
    const option = document.createElement("option");
    option.value = doc.id;
    option.textContent = d.fullname || "Không tên";
    select.appendChild(option);
  });
  select.onchange = () => selectUser(select.value);
  selectUser(select.value);
}

async function selectUser(userId) {
  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const container = document.getElementById("roundDetails");
  container.innerHTML = steps.map((title, i) => {
    const round = data[`round_${i + 1}`] || {};
    return `
      <div class="form-group">
        <h4>${title}</h4>
        <label>Thời gian</label>
        <input value="${round.time || ''}" onchange="saveDetail('${userId}', ${i+1}, 'time', this.value)">
        <label>Ghi chú</label>
        <input value="${round.note || ''}" onchange="saveDetail('${userId}', ${i+1}, 'note', this.value)">
      </div>`;
  }).join("");
}

window.saveDetail = async (userId, round, field, value) => {
  const ref = doc(db, "users", userId);
  await updateDoc(ref, { [`round_${round}.${field}`]: value });
  console.log("Đã cập nhật");
};

loadCandidates();
loadRounds();
loadUserList();
