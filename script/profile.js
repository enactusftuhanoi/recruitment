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
  const names = name.split(' ');
  let initials = names[0].substring(0, 1).toUpperCase();
  
  if (names.length > 1) {
    initials += names[names.length - 1].substring(0, 1).toUpperCase();
  }
  
  return initials;
}

function generateColorFromName(name) {
  const colors = [
    '#1a73e8', '#4caf50', '#ff9800', '#9c27b0', 
    '#e91e63', '#00bcd4', '#8bc34a', '#ff5722'
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

// Function to update user avatar with high quality image
function updateUserAvatar(user) {
  const avatarImg = document.getElementById('userAvatar');
  
  // Clear any existing content
  avatarImg.innerHTML = '';
  avatarImg.style.backgroundImage = '';
  
  // Try to get high quality photo from Google
  let photoUrl = user.photoURL;
  if (photoUrl && photoUrl.includes('googleusercontent.com')) {
    // Replace with higher quality version (s0=default, s96-c=96px, s400-c=400px)
    photoUrl = photoUrl.replace(/=s\d+(-c)?/, '=s1000-c');
  }

  if (photoUrl) {
    // Create image element to handle loading and error
    const img = new Image();
    img.src = photoUrl;
    
    img.onload = function() {
      avatarImg.style.backgroundImage = `url(${photoUrl})`;
      avatarImg.style.backgroundSize = 'cover';
      avatarImg.style.backgroundPosition = 'center';
    };
    
    img.onerror = function() {
      // Fallback to initials if image fails to load
      showInitialsAvatar(user);
    };
  } else {
    // No photo URL available, use initials
    showInitialsAvatar(user);
  }
}

// Helper function to show initials avatar
function showInitialsAvatar(user) {
  const avatarImg = document.getElementById('userAvatar');
  const name = user.fullname || user.email || 'User';
  const initials = getInitials(name);
  
  avatarImg.innerHTML = initials || '<i class="fas fa-user"></i>';
  avatarImg.style.backgroundColor = generateColorFromName(name);
  avatarImg.style.color = 'white';
  avatarImg.style.display = 'flex';
  avatarImg.style.alignItems = 'center';
  avatarImg.style.justifyContent = 'center';
  avatarImg.style.fontSize = initials.length > 2 ? '50px' : '60px';
  avatarImg.style.fontWeight = 'bold';
  avatarImg.style.backgroundImage = 'none';
}

async function loadUserData(userId, email) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    const userDoc = await getDoc(doc(db, "users", userId));
    
    if (userDoc.exists()) {
      // Existing user - show profile
      currentUser = userDoc.data();
      currentUserId = userId;
      
      document.getElementById('profileSection').style.display = 'block';
      document.getElementById('roundSection').style.display = 'block';
      document.getElementById('onboardingSection').style.display = 'none';
      
      updateProfileUI(currentUser);
      updateRoundProgress(currentUser.current_round || 1);
      showRoundDetails(currentUser.current_round || 1);
      
      // Update avatar with Google photo if available
      if (user && user.photoURL) {
        updateUserAvatar({
          ...currentUser,
          photoURL: user.photoURL
        });
      } else {
        updateUserAvatar(currentUser);
      }
    } else {
      // New user - show onboarding
      document.getElementById('profileSection').style.display = 'none';
      document.getElementById('roundSection').style.display = 'none';
      document.getElementById('onboardingSection').style.display = 'block';
      
      currentUserId = userId;
      
      if (email) {
        document.getElementById('onboardEmail').value = email;
      }
      
      // If user has Google photo, show it in onboarding
      if (user && user.photoURL) {
        const avatarPreview = document.createElement('div');
        avatarPreview.style.width = '100px';
        avatarPreview.style.height = '100px';
        avatarPreview.style.borderRadius = '50%';
        avatarPreview.style.backgroundImage = `url(${user.photoURL})`;
        avatarPreview.style.backgroundSize = 'cover';
        avatarPreview.style.backgroundPosition = 'center';
        avatarPreview.style.margin = '0 auto 15px';
        
        const onboardingIcon = document.querySelector('.onboarding-icon');
        onboardingIcon.innerHTML = '';
        onboardingIcon.appendChild(avatarPreview);
      }
    }
  } catch (error) {
    console.error('Error loading user data:', error);
    toastr.error('Lỗi khi tải dữ liệu người dùng');
  }
}

// Update profile UI with user data
function updateProfileUI(user) {
  document.getElementById('userFullName').textContent = user.fullname || 'Chưa cập nhật';
  document.getElementById('userGender').textContent = user.gender || 'Chưa cập nhật';
  document.getElementById('userEmail').textContent = user.email || 'Chưa cập nhật';
  document.getElementById('userPhone').textContent = user.phone || 'Chưa cập nhật';
  document.getElementById('userDob').textContent = user.dob || 'Chưa cập nhật';
  document.getElementById('userSchool').textContent = user.school || 'Chưa cập nhật';
  document.getElementById('userFaculty').textContent = user.faculty || 'Chưa cập nhật';
  document.getElementById('userStudentId').textContent = user.studentId || 'Chưa cập nhật';
  document.getElementById('userDepartment').textContent = user.department || 'Chưa chọn';
  
  // Update status badges
  document.getElementById('userCurrentRound').textContent = getRoundText(user.current_round || 1);
  document.getElementById('userStatus').textContent = user.status || 'Chưa xác định';
  
  // Update badge colors based on status
  const statusBadge = document.getElementById('userStatus');
  statusBadge.className = 'badge ';
  if (user.status === 'Đã duyệt') {
    statusBadge.classList.add('badge-success');
  } else if (user.status === 'Từ chối') {
    statusBadge.classList.add('badge-danger');
  } else {
    statusBadge.classList.add('badge-warning');
  }
}

// Get round text
function getRoundText(round) {
  if (!round) return 'Chưa bắt đầu';
  
  const rounds = [
    'Vòng đơn',
    'Phỏng vấn nhóm',
    'Thử thách',
    'Phỏng vấn cá nhân',
    'Hoàn thành'
  ];
  
  if (round <= 4) {
    return `Vòng ${round}: ${rounds[round-1]}`;
  } else {
    return rounds[4];
  }
}

// Update round progress visualization
function updateRoundProgress(currentRound) {
  const steps = document.querySelectorAll('.step');
  const progressBar = document.getElementById('progressBar');
  
  // Reset all steps
  steps.forEach(step => {
    step.classList.remove('active', 'completed');
  });
  
  // Calculate progress percentage
  let progressPercent = 0;
  
  if (currentRound > 5) currentRound = 5;
  
  // Update steps based on current round
  for (let i = 0; i < currentRound; i++) {
    if (i < steps.length) {
      steps[i].classList.add('completed');
    }
  }
  
  if (currentRound <= 5) {
    steps[currentRound - 1].classList.add('active');
    progressPercent = ((currentRound - 1) / 4) * 100;
  } else {
    progressPercent = 100;
  }
  
  progressBar.style.width = `${progressPercent}%`;
}

// Show round details based on current round
function showRoundDetails(currentRound) {
  // Hide all round details first
  document.querySelectorAll('.round-card').forEach(card => {
    card.style.display = 'none';
  });
  
  // Show details up to current round
  for (let i = 1; i <= currentRound; i++) {
    const roundCard = document.getElementById(`round${i}Details`);
    if (roundCard) {
      roundCard.style.display = 'block';
      updateRoundStatus(i);
    }
  }
}

// Update round status in details cards
function updateRoundStatus(roundNumber) {
  if (!currentUser) return;
  
  const roundData = currentUser[`round_${roundNumber}`] || {};
  const statusElement = document.getElementById(`round${roundNumber}Status`);
  const statusTextElement = document.getElementById(`round${roundNumber}StatusText`);
  
  if (statusElement && statusTextElement) {
    const status = roundData.status || 'Chưa bắt đầu';
    statusElement.textContent = status;
    statusTextElement.textContent = status;
    
    // Update badge color
    statusElement.className = 'badge ';
    if (status === 'Đã duyệt') {
      statusElement.classList.add('badge-success');
    } else if (status === 'Từ chối') {
      statusElement.classList.add('badge-danger');
    } else if (status === 'Đang chờ' || status === 'Đang thực hiện') {
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
      document.getElementById('round4Time').textContent = roundData.time || 'Chưa cập nhật';
      document.getElementById('round4Location').textContent = roundData.location || 'Chưa cập nhật';
      document.getElementById('round4Interviewer').textContent = roundData.interviewer || 'Chưa cập nhật';
      break;
  }
}

// Show edit modal with current data
function showEditModal() {
  if (!currentUser) return;
  
  document.getElementById('editFullName').value = currentUser.fullname || '';
  document.getElementById('editEmail').value = currentUser.email || '';
  document.getElementById('editPhone').value = currentUser.phone || '';
  
  // Set gender radio button
  const gender = currentUser.gender || 'Nam';
  document.querySelector(`input[name="gender"][value="${gender}"]`).checked = true;
  
  document.getElementById('editDob').value = currentUser.dob || '';
  document.getElementById('editSchool').value = currentUser.school || '';
  document.getElementById('editFaculty').value = currentUser.faculty || '';
  document.getElementById('editStudentId').value = currentUser.studentId || '';
  
  editModal.style.display = 'block';
}

// Save edited profile
async function saveProfile(e) {
  e.preventDefault();
  
  if (!currentUserId) return;
  
  try {
    const gender = document.querySelector('input[name="gender"]:checked').value;
    
    const updatedData = {
      fullname: document.getElementById('editFullName').value,
      email: document.getElementById('editEmail').value,
      phone: document.getElementById('editPhone').value,
      gender: gender,
      dob: document.getElementById('editDob').value,
      school: document.getElementById('editSchool').value,
      faculty: document.getElementById('editFaculty').value,
      studentId: document.getElementById('editStudentId').value,
      updatedAt: new Date()
    };
    
    await updateDoc(doc(db, "users", currentUserId), updatedData);
    
    // Update local data
    currentUser = { ...currentUser, ...updatedData };
    updateProfileUI(currentUser);
    
    // Close modal
    editModal.style.display = 'none';
    
    toastr.success('Cập nhật hồ sơ thành công');
  } catch (error) {
    console.error('Error updating profile:', error);
    toastr.error('Cập nhật hồ sơ thất bại');
  }
}

// Save onboarding data
async function saveOnboardingData(e) {
  e.preventDefault();
  
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    toastr.error('Người dùng chưa đăng nhập');
    return;
  }
  
  try {
    const gender = document.querySelector('input[name="onboardGender"]:checked').value;
    const department = document.getElementById('onboardDepartment').value;
    
    const userData = {
      fullname: document.getElementById('onboardFullName').value,
      email: document.getElementById('onboardEmail').value,
      phone: document.getElementById('onboardPhone').value,
      gender: gender,
      dob: document.getElementById('onboardDob').value,
      school: document.getElementById('onboardSchool').value,
      faculty: document.getElementById('onboardFaculty').value,
      studentId: document.getElementById('onboardStudentId').value,
      department: department,
      status: "Chờ xử lý",
      current_round: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      round_1: {
        status: "Chưa bắt đầu",
        deadline: "15/07/2025",
        guide: "Hoàn thành form đăng ký"
      }
    };
    
    // Sử dụng UID của người dùng đã đăng nhập
    await setDoc(doc(db, "users", user.uid), userData);
    
    // Cập nhật UI
    currentUser = userData;
    currentUserId = user.uid;
    updateProfileUI(currentUser);
    updateRoundProgress(1);
    showRoundDetails(1);
    
    // Ẩn onboarding và hiển thị profile
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

// Logout function
async function logout() {
  try {
    await signOut(auth);
    window.location.href = '/index.html'; // Redirect to login page
  } catch (error) {
    console.error('Logout error:', error);
    toastr.error('Đăng xuất thất bại');
  }
}

// Initialize event listeners
function initEventListeners() {
  // Logout button
  logoutBtn.addEventListener('click', logout);
  
  // Refresh button
  refreshBtn.addEventListener('click', () => {
    if (currentUserId) {
      loadUserData(currentUserId);
      toastr.info('Đang làm mới dữ liệu...');
    }
  });
  
  // Edit profile button
  editProfileBtn.addEventListener('click', showEditModal);
  
  // Start onboarding button
  startOnboardingBtn.addEventListener('click', () => {
    onboardingModal.style.display = 'block';
  });
  
  // Close modal buttons
  closeModalButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      editModal.style.display = 'none';
      onboardingModal.style.display = 'none';
    });
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === editModal) {
      editModal.style.display = 'none';
    }
    if (event.target === onboardingModal) {
      onboardingModal.style.display = 'none';
    }
  });
  
  // Edit form submission
  editForm.addEventListener('submit', (e) => saveProfile(e));
  
  // Onboarding form submission
  onboardingForm.addEventListener('submit', (e) => saveOnboardingData(e));
}

// Check auth state and load data
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUserId = user.uid;
    loadUserData(user.uid, user.email);
  } else {
    window.location.href = '/index.html'; // Redirect if not logged in
  }
});

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
  initEventListeners();
});