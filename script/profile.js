// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getAuth, 
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDuTvBn8Xl01DYddVXQ7M0L24K3l-GyG0c",
  authDomain: "enactusftuhanoi-tracuu.firebaseapp.com",
  projectId: "enactusftuhanoi-tracuu",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Toastr configuration
toastr.options = {
  closeButton: true,
  debug: false,
  newestOnTop: true,
  progressBar: true,
  positionClass: 'toast-bottom-right',
  preventDuplicates: false,
  onclick: null,
  showDuration: '300',
  hideDuration: '1000',
  timeOut: '3000',
  extendedTimeOut: '1000',
  showEasing: 'swing',
  hideEasing: 'linear',
  showMethod: 'fadeIn',
  hideMethod: 'fadeOut'
};

// DOM elements
const logoutBtn = document.getElementById('logoutBtn');
const refreshBtn = document.getElementById('refreshBtn');
const editProfileBtn = document.getElementById('editProfileBtn');
const startOnboardingBtn = document.getElementById('startOnboardingBtn');
const editModal = document.getElementById('editModal');
const onboardingModal = document.getElementById('onboardingModal');
const closeModalButtons = document.querySelectorAll('.close-modal');
const editForm = document.getElementById('editForm');
const onboardingForm = document.getElementById('onboardingForm');

// Current user data
let currentUser = null;
let currentUserId = null;

// ========== HELPER FUNCTIONS ==========
function getInitials(name) {
  if (!name) return 'US';
  const names = name.trim().split(' ');
  let initials = names[0].substring(0, 1).toUpperCase();
  
  if (names.length > 1) {
    initials += names[names.length - 1].substring(0, 1).toUpperCase();
  }
  
  return initials || 'US';
}

function generateColorFromName(name) {
  if (!name) return '#3b82f6';
  
  const colors = [
    '#3b82f6', '#4caf50', '#f59e0b', '#9c27b0', 
    '#ef4444', '#06b6d4', '#84cc16', '#f97316'
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

function formatInterviewTime(dateStr, slotNumber, startTime, endTime) {
  if (!dateStr) return 'Chưa cập nhật';
  
  try {
    // Try to parse date string (could be in different formats)
    let formattedDate = dateStr;
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      formattedDate = `${day}/${month}/${year}`;
    }
    
    return `Ca ${slotNumber} (${startTime} - ${endTime}) ngày ${formattedDate}`;
  } catch (e) {
    return `Ca ${slotNumber} (${startTime} - ${endTime}) ngày ${dateStr}`;
  }
}

// ========== AVATAR FUNCTIONS ==========
function updateUserAvatar(user) {
  const avatarImg = document.getElementById('userAvatar');
  if (!avatarImg) {
    console.error('Avatar element not found');
    return;
  }

  // Reset styles
  avatarImg.innerHTML = '';
  avatarImg.style.backgroundImage = '';
  avatarImg.style.backgroundColor = '';
  avatarImg.style.color = 'white';
  avatarImg.style.display = 'flex';
  avatarImg.style.alignItems = 'center';
  avatarImg.style.justifyContent = 'center';
  avatarImg.style.borderRadius = '50%';
  avatarImg.style.width = '200px';
  avatarImg.style.height = '200px';
  avatarImg.style.fontSize = '40px';
  avatarImg.style.fontWeight = 'bold';
  avatarImg.style.border = '3px solid white';
  avatarImg.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';

  // Try to use photo URL if available
  let photoUrl = user.photoURL;
  if (photoUrl && typeof photoUrl === 'string') {
    // Improve Google photo quality
    if (photoUrl.includes('googleusercontent.com')) {
      photoUrl = photoUrl.replace(/=s\d+(-c)?/, '=s400-c');
    }

    const img = new Image();
    img.src = photoUrl;
    
    img.onload = () => {
      avatarImg.style.backgroundImage = `url(${photoUrl})`;
      avatarImg.style.backgroundSize = 'cover';
      avatarImg.style.backgroundPosition = 'center';
    };
    
    img.onerror = () => {
      showInitialsAvatar(user);
    };
  } else {
    showInitialsAvatar(user);
  }
}

function showInitialsAvatar(user) {
  const avatarImg = document.getElementById('userAvatar');
  if (!avatarImg) return;

  const name = user.fullname || user.displayName || user.email || 'User';
  const initials = getInitials(name);
  
  avatarImg.innerHTML = initials;
  avatarImg.style.backgroundColor = generateColorFromName(name);
  avatarImg.style.backgroundImage = 'none';
}

// ========== USER PROFILE FUNCTIONS ==========
async function loadUserData(userId, email) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    console.log('Loading user data for:', userId);
    console.log('Current auth user:', user);

    const userDoc = await getDoc(doc(db, "users", userId));
    
    if (userDoc.exists()) {
      currentUser = userDoc.data();
      currentUserId = userId;
      
      console.log('User document data:', currentUser);

      // Update avatar with combined data
      updateUserAvatar({
        ...currentUser,
        photoURL: user?.photoURL || currentUser.photoURL,
        fullname: currentUser.fullname || user?.displayName,
        email: currentUser.email || user?.email
      });

      // Automatically update round4 if there are votes
      if (currentUser.votes && typeof currentUser.votes === 'object') {
        const scheduleId = Object.keys(currentUser.votes)[0];
        if (scheduleId) {
          try {
            const scheduleDoc = await getDoc(doc(db, "schedules", scheduleId));
            if (scheduleDoc.exists()) {
              const scheduleData = scheduleDoc.data();
              const voteData = currentUser.votes[scheduleId];
              
              currentUser.round_4 = {
                status: "Đã đăng ký",
                scheduleId: scheduleId,
                slots: Array.isArray(voteData.slots) ? voteData.slots : [],
                scheduleData: scheduleData, // Store full schedule data
                scheduleTitle: scheduleData.title || 'Không có tiêu đề',
                date: scheduleData.date || 'Chưa cập nhật',
                location: scheduleData.location || 'Chưa cập nhật',
                type: scheduleData.type || 'Chưa xác định',
                members: Array.isArray(scheduleData.members) ? scheduleData.members.join(', ') : '',
                updatedAt: new Date().toISOString()
              };
              
              // Update in Firestore
              await updateDoc(doc(db, "users", userId), {
                round_4: currentUser.round_4
              });
            }
          } catch (error) {
            console.error('Error loading schedule data:', error);
          }
        }
      }
      
      // Update UI
      document.getElementById('profileSection').style.display = 'block';
      document.getElementById('roundSection').style.display = 'block';
      document.getElementById('onboardingSection').style.display = 'none';
      
      updateProfileUI(currentUser);
      updateRoundProgress(currentUser.current_round || 1);
      showRoundDetails(currentUser.current_round || 1);
      
    } else {
      // New user - show onboarding
      console.log('New user, showing onboarding');
      document.getElementById('profileSection').style.display = 'none';
      document.getElementById('roundSection').style.display = 'none';
      document.getElementById('onboardingSection').style.display = 'block';
      
      currentUserId = userId;
      
      if (email) {
        document.getElementById('onboardEmail').value = email;
      }
      
      // Show Google photo in onboarding if available
      const onboardingAvatar = document.getElementById('onboardingAvatar');
      if (user?.photoURL && onboardingAvatar) {
        onboardingAvatar.style.backgroundImage = `url(${user.photoURL.replace(/=s\d+(-c)?/, '=s400-c')})`;
        onboardingAvatar.style.backgroundSize = 'cover';
        onboardingAvatar.style.backgroundPosition = 'center';
        onboardingAvatar.style.borderRadius = '50%';
        onboardingAvatar.style.width = '100px';
        onboardingAvatar.style.height = '100px';
      }
    }
  } catch (error) {
    console.error('Error loading user data:', error);
    toastr.error('Lỗi khi tải dữ liệu người dùng');
  }
}

function updateProfileUI(user) {
  if (!user) return;

  // Basic info
  document.getElementById('userFullName').textContent = user.fullname || 'Chưa cập nhật';
  document.getElementById('userGender').textContent = user.gender || 'Chưa cập nhật';
  document.getElementById('userEmail').textContent = user.email || 'Chưa cập nhật';
  document.getElementById('userPhone').textContent = user.phone || 'Chưa cập nhật';
  document.getElementById('userDob').textContent = user.dob || 'Chưa cập nhật';
  document.getElementById('userSchool').textContent = user.school || 'Chưa cập nhật';
  document.getElementById('userFaculty').textContent = user.faculty || 'Chưa cập nhật';
  document.getElementById('userStudentId').textContent = user.studentId || 'Chưa cập nhật';
  document.getElementById('userDepartment').textContent = user.department || 'Chưa chọn';
  
  // Status info
  document.getElementById('userCurrentRound').textContent = getRoundText(user.current_round || 1);
  
  const statusBadge = document.getElementById('userStatus');
  if (statusBadge) {
    statusBadge.textContent = user.status || 'Chưa xác định';
    statusBadge.className = 'badge ';
    if (user.status === 'Đã duyệt') {
      statusBadge.classList.add('badge-success');
    } else if (user.status === 'Từ chối') {
      statusBadge.classList.add('badge-danger');
    } else {
      statusBadge.classList.add('badge-warning');
    }
  }
}

function getRoundText(round) {
  const rounds = [
    'Vòng đơn',
    'Phỏng vấn nhóm',
    'Thử thách',
    'Phỏng vấn cá nhân',
    'Hoàn thành'
  ];
  
  if (!round || round < 1) return 'Chưa bắt đầu';
  if (round <= 4) return `Vòng ${round}: ${rounds[round-1]}`;
  return rounds[4];
}

function updateRoundProgress(currentRound) {
  const steps = document.querySelectorAll('.step');
  const progressBar = document.getElementById('progressBar');
  
  if (!steps.length || !progressBar) return;

  // Reset all steps
  steps.forEach(step => {
    step.classList.remove('active', 'completed');
  });
  
  // Validate current round
  if (currentRound > 5) currentRound = 5;
  if (currentRound < 1) currentRound = 0;
  
  // Update steps
  for (let i = 0; i < currentRound; i++) {
    if (i < steps.length) {
      steps[i].classList.add('completed');
    }
  }
  
  // Set active step
  if (currentRound > 0 && currentRound <= 5) {
    steps[currentRound - 1].classList.add('active');
  }
  
  // Update progress bar
  progressBar.style.width = currentRound > 0 ? `${((currentRound - 1) / 4) * 100}%` : '0%';
}

function showRoundDetails(currentRound) {
  const roundCards = document.querySelectorAll('.round-card');
  if (!roundCards.length) return;

  // Hide all cards first
  roundCards.forEach(card => {
    card.style.display = 'none';
  });
  
  // Show relevant cards
  for (let i = 1; i <= currentRound; i++) {
    const roundCard = document.getElementById(`round${i}Details`);
    if (roundCard) {
      roundCard.style.display = 'block';
      updateRoundStatus(i);
    }
  }
}

function updateRoundStatus(roundNumber) {
  if (!currentUser || !roundNumber) return;
  
  const roundData = currentUser[`round_${roundNumber}`] || {};
  const statusElement = document.getElementById(`round${roundNumber}Status`);
  const statusTextElement = document.getElementById(`round${roundNumber}StatusText`);
  
  if (statusElement && statusTextElement) {
    const status = roundData.status || 'Chưa bắt đầu';
    statusElement.textContent = status;
    statusTextElement.textContent = status;
    
    statusElement.className = 'badge ';
    if (status === 'Đã duyệt') {
      statusElement.classList.add('badge-success');
    } else if (status === 'Từ chối') {
      statusElement.classList.add('badge-danger');
    } else if (status === 'Đang chờ' || status === 'Đang thực hiện' || status === 'Đã đăng ký') {
      statusElement.classList.add('badge-primary');
    } else {
      statusElement.classList.add('badge-warning');
    }
  }
  
  // Update round-specific details
  switch(roundNumber) {
    case 1:
      document.getElementById('round1Deadline').textContent = roundData.deadline || 'Chưa cập nhật';
      document.getElementById('round1Guide').textContent = roundData.guide || 'Chưa cập nhật';
      break;
    case 2:
      document.getElementById('round2Time').textContent = roundData.time || 'Chưa cập nhật';
      document.getElementById('round2Location').textContent = roundData.location || 'Chưa cập nhật';
      document.getElementById('round2Members').textContent = roundData.members || 'Chưa cập nhật';
      break;
    case 3:
      document.getElementById('round3Challenge').textContent = roundData.challenge || 'Chưa cập nhật';
      document.getElementById('round3Deadline').textContent = roundData.deadline || 'Chưa cập nhật';
      document.getElementById('round3Materials').textContent = roundData.materials || 'Chưa cập nhật';
      break;
    case 4:
      if (roundData.slots && Array.isArray(roundData.slots) && roundData.slots.length > 0) {
        // Get first slot info (or can display all slots)
        const firstSlotIndex = roundData.slots[0];
        const slot = roundData.scheduleData?.slots?.[firstSlotIndex];
        
        if (slot) {
          const timeText = formatInterviewTime(
            roundData.date, 
            firstSlotIndex + 1, 
            slot.start, 
            slot.end
          );
          
          document.getElementById('round4Time').innerHTML = `<strong>${timeText}</strong>`;
          document.getElementById('round4Location').textContent = 
            `${roundData.location || 'Chưa cập nhật'} (${roundData.type || 'Chưa xác định'})`;
          document.getElementById('round4Interviewer').textContent = 
            roundData.members || 'Chưa cập nhật';
        } else {
          document.getElementById('round4Time').textContent = 'Chưa cập nhật thời gian';
          document.getElementById('round4Location').textContent = 'Chưa cập nhật';
          document.getElementById('round4Interviewer').textContent = 'Chưa cập nhật';
        }
      } else {
        document.getElementById('round4Time').textContent = 'Chưa đăng ký ca phỏng vấn';
        document.getElementById('round4Location').textContent = 'Chưa cập nhật';
        document.getElementById('round4Interviewer').textContent = 'Chưa cập nhật';
      }
      break;
  }
}

// ========== MODAL FUNCTIONS ==========
function showEditModal() {
  if (!currentUser) return;
  
  document.getElementById('editFullName').value = currentUser.fullname || '';
  document.getElementById('editEmail').value = currentUser.email || '';
  document.getElementById('editPhone').value = currentUser.phone || '';
  
  const gender = currentUser.gender || 'Nam';
  const genderRadio = document.querySelector(`input[name="gender"][value="${gender}"]`);
  if (genderRadio) genderRadio.checked = true;
  
  document.getElementById('editDob').value = currentUser.dob || '';
  document.getElementById('editSchool').value = currentUser.school || '';
  document.getElementById('editFaculty').value = currentUser.faculty || '';
  document.getElementById('editStudentId').value = currentUser.studentId || '';
  
  editModal.style.display = 'block';
}

async function saveProfile(e) {
  e.preventDefault();
  
  if (!currentUserId) return;
  
  try {
    const genderRadio = document.querySelector('input[name="gender"]:checked');
    const gender = genderRadio ? genderRadio.value : 'Nam';
    
    const updatedData = {
      fullname: document.getElementById('editFullName').value.trim(),
      email: document.getElementById('editEmail').value.trim(),
      phone: document.getElementById('editPhone').value.trim(),
      gender: gender,
      dob: document.getElementById('editDob').value.trim(),
      school: document.getElementById('editSchool').value.trim(),
      faculty: document.getElementById('editFaculty').value.trim(),
      studentId: document.getElementById('editStudentId').value.trim(),
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(doc(db, "users", currentUserId), updatedData);
    
    currentUser = { ...currentUser, ...updatedData };
    updateProfileUI(currentUser);
    updateUserAvatar(currentUser);
    
    editModal.style.display = 'none';
    toastr.success('Cập nhật hồ sơ thành công');
  } catch (error) {
    console.error('Error updating profile:', error);
    toastr.error('Cập nhật hồ sơ thất bại');
  }
}

async function saveOnboardingData(e) {
  e.preventDefault();
  
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    toastr.error('Người dùng chưa đăng nhập');
    return;
  }
  
  try {
    const genderRadio = document.querySelector('input[name="onboardGender"]:checked');
    const gender = genderRadio ? genderRadio.value : 'Nam';
    const department = document.getElementById('onboardDepartment').value || 'Chưa chọn';
    
    const userData = {
      fullname: document.getElementById('onboardFullName').value.trim(),
      email: document.getElementById('onboardEmail').value.trim(),
      phone: document.getElementById('onboardPhone').value.trim(),
      gender: gender,
      dob: document.getElementById('onboardDob').value.trim(),
      school: document.getElementById('onboardSchool').value.trim(),
      faculty: document.getElementById('onboardFaculty').value.trim(),
      studentId: document.getElementById('onboardStudentId').value.trim(),
      department: department,
      status: "Chờ xử lý",
      current_round: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      round_1: {
        status: "Chưa bắt đầu",
        deadline: "15/07/2025",
        guide: "Hoàn thành form đăng ký"
      }
    };
    
    await setDoc(doc(db, "users", user.uid), userData);
    
    currentUser = userData;
    currentUserId = user.uid;
    updateProfileUI(currentUser);
    updateRoundProgress(1);
    showRoundDetails(1);
    updateUserAvatar({
      ...currentUser,
      photoURL: user.photoURL
    });
    
    document.getElementById('profileSection').style.display = 'block';
    document.getElementById('roundSection').style.display = 'block';
    document.getElementById('onboardingSection').style.display = 'none';
    onboardingModal.style.display = 'none';
    
    toastr.success('Đăng ký hồ sơ thành công!');
  } catch (error) {
    console.error('Lỗi khi lưu dữ liệu:', error);
    toastr.error('Đăng ký hồ sơ thất bại: ' + error.message);
  }
}

// ========== AUTH FUNCTIONS ==========
async function logout() {
  try {
    await signOut(auth);
    window.location.href = '/index.html';
  } catch (error) {
    console.error('Logout error:', error);
    toastr.error('Đăng xuất thất bại');
  }
}

// ========== INITIALIZATION ==========
function initEventListeners() {
  // Logout button
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
  
  // Refresh button
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      if (currentUserId) {
        loadUserData(currentUserId);
        toastr.info('Đang làm mới dữ liệu...');
      }
    });
  }
  
  // Edit profile button
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', showEditModal);
  }
  
  // Start onboarding button
  if (startOnboardingBtn) {
    startOnboardingBtn.addEventListener('click', () => {
      if (onboardingModal) onboardingModal.style.display = 'block';
    });
  }
  
  // Close modal buttons
  if (closeModalButtons.length) {
    closeModalButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (editModal) editModal.style.display = 'none';
        if (onboardingModal) onboardingModal.style.display = 'none';
      });
    });
  }
  
  // Close modal when clicking outside
  window.addEventListener('click', (event) => {
    if (editModal && event.target === editModal) {
      editModal.style.display = 'none';
    }
    if (onboardingModal && event.target === onboardingModal) {
      onboardingModal.style.display = 'none';
    }
  });
  
  // Form submissions
  if (editForm) {
    editForm.addEventListener('submit', (e) => saveProfile(e));
  }
  
  if (onboardingForm) {
    onboardingForm.addEventListener('submit', (e) => saveOnboardingData(e));
  }
}

// Auth state listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('User signed in:', user);
    currentUserId = user.uid;
    loadUserData(user.uid, user.email);
  } else {
    console.log('No user signed in, redirecting...');
    window.location.href = '/index.html';
  }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded');
  initEventListeners();
});
