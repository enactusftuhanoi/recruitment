// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
      apiKey: "AIzaSyDuTvBn8Xl01DYddVXQ7M0L24K3l-GyG0c",
      authDomain: "enactusftuhanoi-tracuu.firebaseapp.com",
      projectId: "enactusftuhanoi-tracuu",
      storageBucket: "enactusftuhanoi-tracuu.appspot.com",
      messagingSenderId: "611356979403",
      appId: "1:611356979403:web:2c9a4cffb2b323ce3deb4e"
    };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const profileBtn = document.getElementById('profileBtn');
const logoutBtn = document.getElementById('logoutBtn');
const scheduleTabs = document.querySelectorAll('.tab');
const scheduleItems = document.querySelectorAll('.schedule-item');
const scheduleDetailBtns = document.querySelectorAll('.schedule-detail-btn');
const scheduleVoteBtns = document.querySelectorAll('.schedule-vote-btn');
const selectedList = document.querySelector('.selected-list');
const submitVotesBtn = document.getElementById('submitVotesBtn');
const selectedCount = document.getElementById('selectedCount');
const maxSlots = document.getElementById('maxSlots');
const maxSlotsDisplay = document.getElementById('maxSlotsDisplay');

// Modals
const scheduleDetailModal = document.getElementById('scheduleDetailModal');
const confirmationModal = document.getElementById('confirmationModal');
const successModal = document.getElementById('successModal');
const closeModalBtns = document.querySelectorAll('.close-modal');

// Modal buttons
const voteFromDetailBtn = document.getElementById('voteFromDetailBtn');
const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');
const submitConfirmBtn = document.getElementById('submitConfirmBtn');
const closeSuccessBtn = document.getElementById('closeSuccessBtn');

// User data
let currentUser = null;
let selectedSlots = [];
let maxAllowedSlots = 3;

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  // Set max slots
  maxSlots.textContent = maxAllowedSlots;
  maxSlotsDisplay.textContent = maxAllowedSlots;

  // Check auth state
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      await loadUserData();
      await loadScheduleData();
    } else {
      window.location.href = '/login.html';
    }
  });

  // Event listeners
  profileBtn.addEventListener('click', () => {
    window.location.href = '/user/profile.html';
  });

  logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
      window.location.href = '/login.html';
    });
  });

  // Schedule tabs
  scheduleTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      scheduleTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const type = tab.dataset.tab;
      filterScheduleItems(type);
    });
  });

  // Schedule detail buttons
  scheduleDetailBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const scheduleItem = e.target.closest('.schedule-item');
      openScheduleDetailModal(scheduleItem);
    });
  });

  // Schedule vote buttons
  scheduleVoteBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const scheduleItem = e.target.closest('.schedule-item');
      const slotId = scheduleItem.dataset.id;
      
      if (scheduleItem.classList.contains('voted')) {
        removeSelectedSlot(slotId);
      } else {
        addSelectedSlot(slotId, scheduleItem);
      }
    });
  });

  // Modal close buttons
  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      scheduleDetailModal.style.display = 'none';
      confirmationModal.style.display = 'none';
    });
  });

  // Vote from detail modal
  voteFromDetailBtn.addEventListener('click', () => {
    const slotId = scheduleDetailModal.dataset.slotId;
    const scheduleItem = document.querySelector(`.schedule-item[data-id="${slotId}"]`);
    
    if (scheduleItem.classList.contains('voted')) {
      removeSelectedSlot(slotId);
    } else {
      addSelectedSlot(slotId, scheduleItem);
    }
    
    scheduleDetailModal.style.display = 'none';
  });

  // Submit votes
  submitVotesBtn.addEventListener('click', () => {
    openConfirmationModal();
  });

  // Confirm submit
  submitConfirmBtn.addEventListener('click', async () => {
    await submitVotes();
    confirmationModal.style.display = 'none';
    successModal.style.display = 'block';
  });

  // Cancel confirm
  cancelConfirmBtn.addEventListener('click', () => {
    confirmationModal.style.display = 'none';
  });

  // Close success modal
  closeSuccessBtn.addEventListener('click', () => {
    successModal.style.display = 'none';
  });

  // Close modals when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === scheduleDetailModal) {
      scheduleDetailModal.style.display = 'none';
    }
    if (e.target === confirmationModal) {
      confirmationModal.style.display = 'none';
    }
    if (e.target === successModal) {
      successModal.style.display = 'none';
    }
  });
});

// Load user data
async function loadUserData() {
  try {
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // Update UI with user data
      document.getElementById('calendarUserName').textContent = userData.fullName || 'Người dùng';
      document.getElementById('calendarUserEmail').textContent = userData.email || 'Không có email';
      document.getElementById('calendarUserDepartment').textContent = userData.department || 'Chưa xác định';
      
      // Update avatar if available
      if (userData.avatarUrl) {
        document.getElementById('calendarUserAvatar').innerHTML = `<img src="${userData.avatarUrl}" alt="Avatar">`;
      }
      
      // Check if user already has selected slots
      if (userData.selectedSlots && userData.selectedSlots.length > 0) {
        selectedSlots = userData.selectedSlots;
        updateSelectedSlotsUI();
      }
    }
  } catch (error) {
    console.error('Error loading user data:', error);
    showToast('Có lỗi khi tải dữ liệu người dùng', 'error');
  }
}

// Load schedule data
async function loadScheduleData() {
  try {
    // In a real app, you would fetch schedule data from Firestore
    // For now, we'll use the hardcoded data in the HTML
    
    // Check which slots user has already selected
    scheduleItems.forEach(item => {
      const slotId = item.dataset.id;
      if (selectedSlots.includes(slotId)) {
        item.classList.add('voted');
        const voteBtn = item.querySelector('.schedule-vote-btn');
        voteBtn.innerHTML = '<i class="fas fa-times"></i> Hủy chọn';
        voteBtn.classList.remove('btn-primary');
        voteBtn.classList.add('btn-danger');
      }
    });
    
    updateSubmitButton();
  } catch (error) {
    console.error('Error loading schedule data:', error);
    showToast('Có lỗi khi tải dữ liệu lịch phỏng vấn', 'error');
  }
}

// Filter schedule items by type
function filterScheduleItems(type) {
  scheduleItems.forEach(item => {
    if (type === 'all') {
      item.style.display = 'block';
    } else {
      if (item.dataset.type === type) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    }
  });
}

// Open schedule detail modal
function openScheduleDetailModal(scheduleItem) {
  const slotId = scheduleItem.dataset.id;
  const type = scheduleItem.dataset.type;
  const title = scheduleItem.querySelector('.schedule-title').textContent;
  const time = scheduleItem.querySelector('.schedule-time').textContent;
  const location = scheduleItem.querySelector('.schedule-location').textContent;
  
  // Set modal data
  document.getElementById('detailModalTitle').innerHTML = `<i class="fas fa-info-circle"></i> ${title}`;
  document.getElementById('detailTitle').textContent = title;
  document.getElementById('detailTime').textContent = time;
  document.getElementById('detailLocation').textContent = location;
  
  // Set type badge
  const typeBadge = document.getElementById('detailType');
  typeBadge.textContent = type === 'online' ? 'Online' : 'Offline';
  typeBadge.className = 'badge ' + (type === 'online' ? 'badge-online' : 'badge-offline');
  
  // Store slot ID in modal for voting
  scheduleDetailModal.dataset.slotId = slotId;
  
  // Show modal
  scheduleDetailModal.style.display = 'block';
}

// Add selected slot
function addSelectedSlot(slotId, scheduleItem) {
  if (selectedSlots.length >= maxAllowedSlots) {
    showToast(`Bạn chỉ được chọn tối đa ${maxAllowedSlots} khung giờ`, 'warning');
    return;
  }
  
  if (!selectedSlots.includes(slotId)) {
    selectedSlots.push(slotId);
    scheduleItem.classList.add('voted');
    
    const voteBtn = scheduleItem.querySelector('.schedule-vote-btn');
    voteBtn.innerHTML = '<i class="fas fa-times"></i> Hủy chọn';
    voteBtn.classList.remove('btn-primary');
    voteBtn.classList.add('btn-danger');
    
    updateSelectedSlotsUI();
    updateSubmitButton();
    showToast('Đã thêm khung giờ vào danh sách chọn', 'success');
  }
}

// Remove selected slot
function removeSelectedSlot(slotId) {
  selectedSlots = selectedSlots.filter(id => id !== slotId);
  
  const scheduleItem = document.querySelector(`.schedule-item[data-id="${slotId}"]`);
  if (scheduleItem) {
    scheduleItem.classList.remove('voted');
    
    const voteBtn = scheduleItem.querySelector('.schedule-vote-btn');
    voteBtn.innerHTML = '<i class="fas fa-check"></i> Chọn';
    voteBtn.classList.remove('btn-danger');
    voteBtn.classList.add('btn-primary');
  }
  
  updateSelectedSlotsUI();
  updateSubmitButton();
  showToast('Đã xóa khung giờ khỏi danh sách chọn', 'info');
}

// Update selected slots UI
function updateSelectedSlotsUI() {
  selectedList.innerHTML = '';
  selectedCount.textContent = selectedSlots.length;
  
  selectedSlots.forEach(slotId => {
    const scheduleItem = document.querySelector(`.schedule-item[data-id="${slotId}"]`);
    if (scheduleItem) {
      const time = scheduleItem.querySelector('.schedule-time').textContent;
      const location = scheduleItem.querySelector('.schedule-location').textContent;
      
      const slotElement = document.createElement('div');
      slotElement.className = 'selected-item';
      slotElement.dataset.id = slotId;
      slotElement.innerHTML = `
        <div class="selected-info">
          <span class="selected-time">${time.replace('<i class="fas fa-clock"></i> ', '')}</span>
          <span class="selected-location">${location.replace('<i class="fas fa-map-marker-alt"></i> ', '').replace('<i class="fas fa-video"></i> ', '')}</span>
        </div>
        <button class="btn btn-sm btn-danger remove-slot-btn">
          <i class="fas fa-times"></i>
        </button>
      `;
      
      // Add event listener to remove button
      const removeBtn = slotElement.querySelector('.remove-slot-btn');
      removeBtn.addEventListener('click', () => {
        removeSelectedSlot(slotId);
      });
      
      selectedList.appendChild(slotElement);
    }
  });
}

// Update submit button state
function updateSubmitButton() {
  if (selectedSlots.length > 0) {
    submitVotesBtn.disabled = false;
  } else {
    submitVotesBtn.disabled = true;
  }
}

// Open confirmation modal
function openConfirmationModal() {
  const confirmSlotsList = document.getElementById('confirmSlotsList');
  confirmSlotsList.innerHTML = '';
  
  selectedSlots.forEach(slotId => {
    const scheduleItem = document.querySelector(`.schedule-item[data-id="${slotId}"]`);
    if (scheduleItem) {
      const time = scheduleItem.querySelector('.schedule-time').textContent;
      const location = scheduleItem.querySelector('.schedule-location').textContent;
      
      const li = document.createElement('li');
      li.textContent = `${time.replace('<i class="fas fa-clock"></i> ', '')} - ${location.replace('<i class="fas fa-map-marker-alt"></i> ', '').replace('<i class="fas fa-video"></i> ', '')}`;
      confirmSlotsList.appendChild(li);
    }
  });
  
  confirmationModal.style.display = 'block';
}

// Submit votes to Firebase
async function submitVotes() {
  try {
    const userRef = doc(db, 'users', currentUser.uid);
    
    // Update user document with selected slots
    await updateDoc(userRef, {
      selectedSlots: selectedSlots,
      interviewStatus: 'scheduled',
      lastUpdated: new Date()
    });
    
    showToast('Đã gửi lựa chọn lịch phỏng vấn thành công', 'success');
  } catch (error) {
    console.error('Error submitting votes:', error);
    showToast('Có lỗi khi gửi lựa chọn lịch phỏng vấn', 'error');
  }
}

// Show toast message
function showToast(message, type) {
  // You would implement this with toastr or similar library
  console.log(`${type}: ${message}`);
  // Example with toastr:
  // toastr[type](message);
}

// Initialize toastr (if using)
// toastr.options = {
//   positionClass: 'toast-bottom-right',
//   progressBar: true,
//   timeOut: 3000
// };
