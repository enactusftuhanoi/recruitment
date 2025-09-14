// profile.js (replaced) - đọc dữ liệu từ collection "applications" và dùng Google avatar

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// === Firebase config (same project as response.js / config.js) ===
const firebaseConfig = {
  apiKey: "AIzaSyAOP2j0qV0Ge-q2-Y9zo9Qc3eLmgtVOK3k",
  authDomain: "recruitment-enactusftuhanoi.firebaseapp.com",
  projectId: "recruitment-enactusftuhanoi",
  storageBucket: "recruitment-enactusftuhanoi.firebasestorage.app",
  messagingSenderId: "658928769643",
  appId: "1:658928769643:web:ef4e26633b7c41c922ef2e",
  measurementId: "G-BJT7ZPKYE3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// === Small UI helpers / Toastr (optional) ===
if (typeof toastr !== 'undefined') {
  toastr.options = {
    closeButton: true,
    progressBar: true,
    positionClass: 'toast-bottom-right',
    timeOut: 3000
  };
}

// === DOM elements (from profile.html) ===
const logoutBtn = document.getElementById('logoutBtn');
const refreshBtn = document.getElementById('refreshBtn');
const editProfileBtn = document.getElementById('editProfileBtn');
const startOnboardingBtn = document.getElementById('startOnboardingBtn');

const profileSection = document.getElementById('profileSection');
const onboardingSection = document.getElementById('onboardingSection');
const roundSection = document.getElementById('roundSection');

const userAvatarEl = document.getElementById('userAvatar');

// Profile fields
const elFullName = document.getElementById('userFullName');
const elGender = document.getElementById('userGender');
const elEmail = document.getElementById('userEmail');
const elPhone = document.getElementById('userPhone');
const elDob = document.getElementById('userDob');
const elSchool = document.getElementById('userSchool');
const elFaculty = document.getElementById('userFaculty');
const elStudentId = document.getElementById('userStudentId');
const elDepartment = document.getElementById('userDepartment');
const elCurrentRound = document.getElementById('userCurrentRound');
const elStatusBadge = document.getElementById('userStatus');

// Round detail elements (if present in HTML)
const progressBar = document.getElementById('progressBar');

// hide edit button (profile is read-only, data comes from applications)
if (editProfileBtn) editProfileBtn.style.display = 'none';

// === utility functions ===
function safeText(value, fallback = 'Chưa cập nhật') {
  if (value === undefined || value === null || value === '') return fallback;
  return value;
}

function setAvatarFromGoogle(photoURL) {
  if (!userAvatarEl) return;
  userAvatarEl.innerHTML = '';
  userAvatarEl.style.backgroundSize = 'cover';
  userAvatarEl.style.backgroundPosition = 'center';
  userAvatarEl.style.borderRadius = '50%';
  userAvatarEl.style.display = 'block';

  if (photoURL && typeof photoURL === 'string') {
    const url = photoURL.includes('googleusercontent.com') ? photoURL.replace(/=s\d+(-c)?/, '=s400-c') : photoURL;
    // Preload to avoid broken background
    const img = new Image();
    img.onload = () => {
      userAvatarEl.style.backgroundImage = `url(${url})`;
    };
    img.onerror = () => {
      // fallback: initials
      const initials = getInitialsFromName(document.getElementById('userFullName')?.textContent || '');
      userAvatarEl.style.backgroundImage = 'none';
      userAvatarEl.textContent = initials;
      userAvatarEl.style.display = 'flex';
      userAvatarEl.style.alignItems = 'center';
      userAvatarEl.style.justifyContent = 'center';
      userAvatarEl.style.color = 'white';
      userAvatarEl.style.fontSize = '40px';
      userAvatarEl.style.backgroundColor = '#3b82f6';
    };
    img.src = url;
  } else {
    // no photo => initials
    const initials = getInitialsFromName(document.getElementById('userFullName')?.textContent || '');
    userAvatarEl.style.backgroundImage = 'none';
    userAvatarEl.textContent = initials;
    userAvatarEl.style.display = 'flex';
    userAvatarEl.style.alignItems = 'center';
    userAvatarEl.style.justifyContent = 'center';
    userAvatarEl.style.color = 'white';
    userAvatarEl.style.fontSize = '40px';
    userAvatarEl.style.backgroundColor = '#3b82f6';
  }
}

function getInitialsFromName(name) {
  if (!name) return 'US';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) || '';
  const last = (parts.length > 1 ? parts[parts.length - 1].charAt(0) : '');
  return (first + last).toUpperCase() || 'US';
}

function mapStatusToRound(status) {
  // Customize mapping if you have more detailed statuses
  // Default simple mapping:
  // new -> vòng đơn (1)
  // reviewed -> vòng đơn (1)
  // interview -> vòng 2
  // challenge -> vòng 3
  // final -> vòng 4
  // accepted -> hoàn thành
  // rejected -> từ chối
  const s = (status || '').toString().toLowerCase();
  if (s === 'new' || s === 'reviewed') return 1;
  if (s.includes('interview') || s === 'interview' || s === 'phỏng vấn') return 2;
  if (s.includes('challenge') || s === 'thử thách') return 3;
  if (s === 'final' || s.includes('final') || s.includes('phỏng vấn cá nhân')) return 4;
  if (s === 'accepted' || s === 'chấp nhận' || s === 'đã duyệt') return 5;
  if (s === 'rejected' || s === 'từ chối') return 0;
  return 1;
}

function updateProgressBarByRound(roundNumber) {
  if (!progressBar) return;
  const valid = Math.max(0, Math.min(5, roundNumber));
  progressBar.style.width = valid > 0 ? `${((valid - 1) / 4) * 100}%` : '0%';
  // set step classes if .step exist
  const steps = document.querySelectorAll('.step');
  if (steps && steps.length) {
    steps.forEach(s => s.classList.remove('active', 'completed'));
    for (let i = 0; i < (roundNumber > 0 ? Math.min(roundNumber, steps.length) : 0); i++) {
      steps[i].classList.add('completed');
    }
    if (roundNumber > 0 && steps[roundNumber - 1]) steps[roundNumber - 1].classList.add('active');
  }
}

function formatRoundTextByStatus(status) {
  if (!status) return 'Vòng 1: Vòng đơn';
  const s = status.toString();
  // translate a few common values to nicer labels
  if (s.toLowerCase() === 'new') return 'Vòng 1: Vòng đơn';
  if (s.toLowerCase() === 'reviewed') return 'Vòng 1: Đã xem đơn';
  if (s.toLowerCase().includes('interview')) return 'Vòng 2: Phỏng vấn';
  if (s.toLowerCase().includes('challenge') || s.toLowerCase().includes('thử thách')) return 'Vòng 3: Thử thách';
  if (s.toLowerCase().includes('final') || s.toLowerCase().includes('phỏng vấn cá nhân')) return 'Vòng 4: Phỏng vấn cá nhân';
  if (s.toLowerCase() === 'accepted' || s.toLowerCase().includes('đã duyệt')) return 'Hoàn thành: Đã được chấp nhận';
  if (s.toLowerCase() === 'rejected' || s.toLowerCase().includes('từ chối')) return 'Đã từ chối';
  return `Trạng thái: ${s}`;
}

// === Main: load profile from applications by email ===
async function loadProfileForEmail(email, googleUser) {
  try {
    // Query applications collection for this email
    const q = query(collection(db, "applications"), where("email", "==", email));
    const snap = await getDocs(q);

    if (snap.empty) {
      // No application -> show onboarding only
      if (profileSection) profileSection.style.display = 'none';
      if (roundSection) roundSection.style.display = 'none';
      if (onboardingSection) onboardingSection.style.display = 'block';

      // Make startOnboardingBtn redirect to application form (adjust path if needed)
      if (startOnboardingBtn) {
        startOnboardingBtn.onclick = () => {
          // Replace 'application.html' with actual form path if different
          window.location.href = 'application.html';
        };
      }

      if (typeof toastr !== 'undefined') toastr.info('Bạn chưa nộp đơn - vui lòng điền form ứng tuyển');
      return;
    }

    // Use the FIRST matching application (should be unique)
    const appDoc = snap.docs[0];
    const data = appDoc.data();

    // Display profile section
    if (onboardingSection) onboardingSection.style.display = 'none';
    if (profileSection) profileSection.style.display = 'block';
    if (roundSection) roundSection.style.display = 'block';

    // Fill fields - ensure mapping to your app schema
    elFullName && (elFullName.textContent = safeText(data.fullname || data.name || data.full_name));
    elGender && (elGender.textContent = safeText(data.gender));
    elEmail && (elEmail.textContent = safeText(data.email || email));
    elPhone && (elPhone.textContent = safeText(data.phone));
    elDob && (elDob.textContent = safeText(data.birthdate || data.dob));
    elSchool && (elSchool.textContent = safeText(data.school));
    // major / faculty - some forms call it 'major' or 'faculty'
    elFaculty && (elFaculty.textContent = safeText(data.major || data.faculty));
    elStudentId && (elStudentId.textContent = safeText(data.studentId || data.mssv || data.student_id));
    // Department(s)
    let deptText = safeText(data.priority_position || data.priority || data.department || 'Chưa chọn');
    if (data.secondary_position && data.secondary_position !== 'None') {
      deptText += ` / ${data.secondary_position}`;
    } else if (data.secondary && data.secondary !== 'None') {
      deptText += ` / ${data.secondary}`;
    }
    elDepartment && (elDepartment.textContent = deptText);

    // Avatar: always take from Google
    if (googleUser && googleUser.photoURL) {
      setAvatarFromGoogle(googleUser.photoURL);
    } else {
      // If googleUser missing photo, still try application-stored photo if any
      const photoFromApp = data.photoURL || data.avatar;
      setAvatarFromGoogle(photoFromApp);
    }

    // Status & round
    const appStatus = data.status || data.overall_status || data.application_status || 'new';
    elCurrentRound && (elCurrentRound.textContent = formatRoundTextByStatus(appStatus));
    if (elStatusBadge) {
      elStatusBadge.textContent = (appStatus || 'Chưa xác định');
      elStatusBadge.className = 'badge';
      const sLower = (appStatus || '').toString().toLowerCase();
      if (sLower.includes('accept') || sLower.includes('đã duyệt') || sLower.includes('accepted')) {
        elStatusBadge.classList.add('badge-success');
      } else if (sLower.includes('reject') || sLower.includes('từ chối') || sLower.includes('rejected')) {
        elStatusBadge.classList.add('badge-danger');
      } else if (sLower.includes('review') || sLower.includes('reviewed')) {
        elStatusBadge.classList.add('badge-primary');
      } else {
        elStatusBadge.classList.add('badge-warning');
      }
    }

    // Progress bar & round cards
    const mappedRound = mapStatusToRound(appStatus);
    updateProgressBarByRound(mappedRound);

    // OPTIONAL: populate round-specific cards if your application doc includes round_1, round_2...
    // We try to render round_i fields if exist to keep parity with old UI:
    for (let i = 1; i <= 4; i++) {
      const roundKey = `round_${i}`;
      const roundCard = document.getElementById(`round${i}Details`);
      if (!roundCard) continue;

      // Hide all first, we'll show only up to mappedRound
      roundCard.style.display = (i <= mappedRound) ? 'block' : 'none';

      if (i <= mappedRound) {
        // If doc has a block like round_1, use it
        const rdata = data[roundKey] || {};
        const statusEl = document.getElementById(`round${i}Status`);
        const statusTextEl = document.getElementById(`round${i}StatusText`);
        if (statusEl) statusEl.textContent = rdata.status || safeText(rdata.state || 'Chưa cập nhật');
        if (statusTextEl) statusTextEl.textContent = rdata.status || rdata.state || 'Chưa cập nhật';

        // Fill specific fields for rounds (best-effort)
        if (i === 1) {
          const dl = document.getElementById('round1Deadline');
          const g = document.getElementById('round1Guide');
          if (dl) dl.textContent = rdata.deadline || 'Chưa cập nhật';
          if (g) g.textContent = rdata.guide || 'Hoàn thành form đăng ký';
        }
        if (i === 2) {
          const t = document.getElementById('round2Time');
          const loc = document.getElementById('round2Location');
          const members = document.getElementById('round2Members');
          if (t) t.textContent = rdata.time || 'Chưa cập nhật';
          if (loc) loc.textContent = rdata.location || 'Chưa cập nhật';
          if (members) members.textContent = (rdata.members || rdata.panel || 'Chưa cập nhật');
        }
        if (i === 3) {
          const ch = document.getElementById('round3Challenge');
          const dl = document.getElementById('round3Deadline');
          const mats = document.getElementById('round3Materials');
          if (ch) ch.textContent = rdata.challenge || rdata.task || 'Chưa cập nhật';
          if (dl) dl.textContent = rdata.deadline || 'Chưa cập nhật';
          if (mats) mats.textContent = rdata.materials || 'Chưa cập nhật';
        }
        if (i === 4) {
          const t = document.getElementById('round4Time');
          const loc = document.getElementById('round4Location');
          const interviewer = document.getElementById('round4Interviewer');

          // Round 4 could store scheduleData + slots as in old code - we try to display friendly text
          if (rdata.slots && Array.isArray(rdata.slots) && rdata.slots.length > 0) {
            const s = rdata.slots[0];
            // try scheduleData.slots
            const slotObj = rdata.scheduleData?.slots?.[s] || null;
            if (slotObj) {
              t && (t.innerHTML = `<strong>Ca ${s + 1}: ${slotObj.start} - ${slotObj.end} ngày ${rdata.date || rdata.scheduleDate || 'Chưa cập nhật'}</strong>`);
            } else {
              t && (t.textContent = 'Đã đăng ký ca phỏng vấn');
            }
          } else {
            t && (t.textContent = rdata.time || 'Chưa đăng ký ca phỏng vấn');
          }
          loc && (loc.textContent = rdata.location || rdata.venue || 'Chưa cập nhật');
          interviewer && (interviewer.textContent = rdata.members || rdata.interviewer || 'Chưa cập nhật');
        }
      }
    }

  } catch (err) {
    console.error('Lỗi khi load profile từ applications:', err);
    if (typeof toastr !== 'undefined') toastr.error('Lỗi khi tải hồ sơ: ' + err.message);
  }
}

// === Auth handling ===
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // not logged in -> redirect to login
    window.location.href = 'login.html';
    return;
  }

  // When logged in, check applications
  loadProfileForEmail(user.email, user);

  // Wire logout
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      try {
        await signOut(auth);
        window.location.href = 'login.html';
      } catch (e) {
        console.error('Logout failed', e);
        if (typeof toastr !== 'undefined') toastr.error('Đăng xuất thất bại');
      }
    };
  }

  // Refresh
  if (refreshBtn) {
    refreshBtn.onclick = () => {
      // reload data
      loadProfileForEmail(user.email, user);
      if (typeof toastr !== 'undefined') toastr.info('Đang làm mới dữ liệu...');
    };
  }
});

// safety: if DOM loaded and no auth yet, still hide sections
document.addEventListener('DOMContentLoaded', () => {
  if (profileSection) profileSection.style.display = 'none';
  if (roundSection) roundSection.style.display = 'none';
  if (onboardingSection) onboardingSection.style.display = 'none';
});
