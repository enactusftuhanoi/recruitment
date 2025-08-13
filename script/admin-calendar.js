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
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase configuration
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
const dashboardBtn = document.getElementById('dashboardBtn');
const logoutBtn = document.getElementById('logoutBtn');
const prevWeekBtn = document.getElementById('prevWeekBtn');
const nextWeekBtn = document.getElementById('nextWeekBtn');
const todayBtn = document.getElementById('todayBtn');
const addSlotBtn = document.getElementById('addSlotBtn');
const currentWeekRange = document.getElementById('currentWeekRange');
const calendarBody = document.querySelector('.calendar-body');
const viewTabs = document.querySelectorAll('.tab');
const calendarViews = document.querySelectorAll('.calendar-view');
const slotModal = document.getElementById('slotModal');
const slotDetailModal = document.getElementById('slotDetailModal');
const confirmModal = document.getElementById('confirmModal');
const closeModalBtns = document.querySelectorAll('.close-modal');
const slotForm = document.getElementById('slotForm');
const saveSlotBtn = document.getElementById('saveSlotBtn');
const editSlotBtn = document.getElementById('editSlotBtn');
const cancelSlotBtn = document.getElementById('cancelSlotBtn');
const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');
const confirmActionBtn = document.getElementById('confirmActionBtn');

// Calendar state
let currentDate = new Date();
let currentView = 'week';
let currentSlotId = null;
let slotsData = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  renderWeekView();
  loadSlots();
});

// Initialize event listeners
function initEventListeners() {
  // Navigation buttons
  dashboardBtn.addEventListener('click', () => {
    window.location.href = '/admin/dashboard.html';
  });

  logoutBtn.addEventListener('click', logout);
  prevWeekBtn.addEventListener('click', goToPrevWeek);
  nextWeekBtn.addEventListener('click', goToNextWeek);
  todayBtn.addEventListener('click', goToToday);
  addSlotBtn.addEventListener('click', showAddSlotModal);

  // View tabs
  viewTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchView(tab.dataset.view);
    });
  });

  // Modal close buttons
  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      slotModal.style.display = 'none';
      slotDetailModal.style.display = 'none';
      confirmModal.style.display = 'none';
    });
  });

  // Close modals when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === slotModal) slotModal.style.display = 'none';
    if (e.target === slotDetailModal) slotDetailModal.style.display = 'none';
    if (e.target === confirmModal) confirmModal.style.display = 'none';
  });

  // Form submission
  slotForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveSlot();
  });

  // Slot actions
  editSlotBtn.addEventListener('click', editCurrentSlot);
  cancelSlotBtn.addEventListener('click', showCancelConfirm);
  cancelConfirmBtn.addEventListener('click', () => confirmModal.style.display = 'none');
  confirmActionBtn.addEventListener('click', cancelCurrentSlot);

  // Check auth state
  // Thay thế phần checkAdminStatus bằng hàm đơn giản chỉ kiểm tra đăng nhập
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Người dùng đã đăng nhập - cho phép truy cập
    loadSlots();
  } else {
    // Chưa đăng nhập - chuyển hướng về trang login
    window.location.href = '/admin/login.html';
  }
});
}

// Logout function
async function logout() {
  try {
    await signOut(auth);
    window.location.href = '/admin/login.html';
  } catch (error) {
    console.error("Logout error:", error);
    showToast('error', 'Đăng xuất thất bại');
  }
}

// Switch calendar view
function switchView(view) {
  currentView = view;
  
  // Update active tab
  viewTabs.forEach(tab => tab.classList.remove('active'));
  document.querySelector(`.tab[data-view="${view}"]`).classList.add('active');
  
  // Update active view
  calendarViews.forEach(view => view.classList.remove('active'));
  document.getElementById(`${view}View`).classList.add('active');
  
  // Render appropriate view
  switch(view) {
    case 'week':
      renderWeekView();
      break;
    case 'day':
      renderDayView();
      break;
    case 'list':
      renderListView();
      break;
  }
}

// Navigation functions
function goToPrevWeek() {
  currentDate.setDate(currentDate.getDate() - 7);
  updateWeekRange();
  renderWeekView();
}

function goToNextWeek() {
  currentDate.setDate(currentDate.getDate() + 7);
  updateWeekRange();
  renderWeekView();
}

function goToToday() {
  currentDate = new Date();
  updateWeekRange();
  
  switch(currentView) {
    case 'week':
      renderWeekView();
      break;
    case 'day':
      renderDayView();
      break;
    case 'list':
      renderListView();
      break;
  }
}

function updateWeekRange() {
  const startOfWeek = getStartOfWeek(currentDate);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  const options = { day: 'numeric', month: 'numeric', year: 'numeric' };
  const startStr = startOfWeek.toLocaleDateString('vi-VN', options);
  const endStr = endOfWeek.toLocaleDateString('vi-VN', options);
  
  currentWeekRange.textContent = `Tuần ${getWeekNumber(startOfWeek)}: ${startStr} - ${endStr}`;
}

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  return new Date(d.setDate(diff));
}

function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

// Load slots from Firestore
async function loadSlots() {
  try {
    const slotsRef = collection(db, "interviewSlots");
    const q = query(slotsRef, orderBy("date"), orderBy("startTime"));
    const snapshot = await getDocs(q);
    
    slotsData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate() // Convert Firestore timestamp to Date
    }));
    
    renderCurrentView();
  } catch (error) {
    console.error("Error loading slots:", error);
    showToast('error', 'Không thể tải dữ liệu khung giờ');
  }
}

// Render current view based on state
function renderCurrentView() {
  switch(currentView) {
    case 'week':
      renderWeekView();
      break;
    case 'day':
      renderDayView();
      break;
    case 'list':
      renderListView();
      break;
  }
}

// Render week view
function renderWeekView() {
  const startOfWeek = getStartOfWeek(currentDate);
  const days = [];
  
  // Generate dates for the week
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    days.push(day);
  }
  
  // Clear previous content
  calendarBody.innerHTML = '';
  
  // Generate time slots (8:00 - 20:00)
  for (let hour = 8; hour <= 20; hour++) {
    const timeSlot = document.createElement('div');
    timeSlot.className = 'time-slot';
    timeSlot.style.gridRow = `${hour - 7}`;
    
    // Add time label
    const timeLabel = document.createElement('div');
    timeLabel.className = 'time-label';
    timeLabel.textContent = `${hour}:00`;
    timeSlot.appendChild(timeLabel);
    
    calendarBody.appendChild(timeSlot);
    
    // Add empty cells for each day
    for (let i = 1; i <= 7; i++) {
      const daySlot = document.createElement('div');
      daySlot.className = 'time-slot';
      daySlot.style.gridRow = `${hour - 7}`;
      daySlot.style.gridColumn = i + 1;
      calendarBody.appendChild(daySlot);
    }
  }
  
  // Add events to calendar
  slotsData.forEach(slot => {
    const slotDate = new Date(slot.date);
    const dayOfWeek = slotDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Only show slots for the current week
    if (isDateInWeek(slotDate, startOfWeek)) {
      const startTime = slot.startTime.split(':');
      const endTime = slot.endTime.split(':');
      const startHour = parseInt(startTime[0]);
      const startMin = parseInt(startTime[1]);
      const endHour = parseInt(endTime[0]);
      const endMin = parseInt(endTime[1]);
      
      const durationHours = endHour - startHour;
      const durationMins = endMin - startMin;
      const totalDuration = durationHours * 60 + durationMins;
      
      const rowStart = (startHour - 8) * 4 + Math.floor(startMin / 15) + 1;
      const rowSpan = Math.max(1, Math.ceil(totalDuration / 15));
      
      const dayColumn = dayOfWeek === 0 ? 8 : dayOfWeek + 1; // Sunday is column 8
      
      const eventElement = document.createElement('div');
      eventElement.className = 'slot-event';
      eventElement.style.gridColumn = dayColumn;
      eventElement.style.gridRow = `${rowStart} / span ${rowSpan}`;
      eventElement.innerHTML = `
        <div class="event-title">${slot.title}</div>
        <div class="event-time">${slot.startTime} - ${slot.endTime}</div>
      `;
      
      // Add status class
      if (slot.status === 'cancelled') {
        eventElement.classList.add('cancelled');
      } else if (slot.booked >= slot.maxCandidates) {
        eventElement.classList.add('booked');
      }
      
      eventElement.addEventListener('click', () => {
        showSlotDetail(slot.id);
      });
      
      calendarBody.appendChild(eventElement);
    }
  });
}

function isDateInWeek(date, startOfWeek) {
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return date >= startOfWeek && date < endOfWeek;
}

// Render day view
function renderDayView() {
  const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const dayOfWeek = currentDate.getDay();
  const dayName = dayNames[dayOfWeek];
  const dateStr = currentDate.toLocaleDateString('vi-VN');
  
  document.getElementById('dayViewDate').textContent = `${dayName}, ${dateStr}`;
  
  const dayViewBody = document.querySelector('.day-view-body');
  dayViewBody.innerHTML = '';
  
  // Filter slots for the selected day
  const daySlots = slotsData.filter(slot => {
    const slotDate = new Date(slot.date);
    return (
      slotDate.getDate() === currentDate.getDate() &&
      slotDate.getMonth() === currentDate.getMonth() &&
      slotDate.getFullYear() === currentDate.getFullYear()
    );
  });
  
  // Group slots by hour
  const hours = {};
  daySlots.forEach(slot => {
    const hour = parseInt(slot.startTime.split(':')[0]);
    if (!hours[hour]) hours[hour] = [];
    hours[hour].push(slot);
  });
  
  // Create time slots
  for (let hour = 8; hour <= 20; hour++) {
    const timeSlot = document.createElement('div');
    timeSlot.className = 'day-time-slot';
    
    const timeLabel = document.createElement('div');
    timeLabel.className = 'day-time-label';
    timeLabel.textContent = `${hour}:00`;
    timeSlot.appendChild(timeLabel);
    
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'day-time-events';
    
    if (hours[hour]) {
      hours[hour].forEach(slot => {
        const eventElement = document.createElement('div');
        eventElement.className = 'day-event';
        
        let statusClass = '';
        if (slot.status === 'cancelled') {
          statusClass = 'cancelled';
        } else if (slot.booked >= slot.maxCandidates) {
          statusClass = 'booked';
        }
        
        eventElement.innerHTML = `
          <div class="event-header">
            <h4>${slot.title}</h4>
            <span class="badge ${statusClass}">${getStatusText(slot)}</span>
          </div>
          <div class="event-time">${slot.startTime} - ${slot.endTime}</div>
          <div class="event-location">${slot.location}</div>
          <div class="event-count">${slot.booked}/${slot.maxCandidates} ứng viên</div>
        `;
        
        eventElement.addEventListener('click', () => {
          showSlotDetail(slot.id);
        });
        
        eventsContainer.appendChild(eventElement);
      });
    }
    
    timeSlot.appendChild(eventsContainer);
    dayViewBody.appendChild(timeSlot);
  }
}

// Render list view
function renderListView() {
  const slotList = document.getElementById('slotList');
  slotList.innerHTML = '';
  
  // Filter slots based on filters
  const typeFilter = document.getElementById('listTypeFilter').value;
  const statusFilter = document.getElementById('listStatusFilter').value;
  
  const filteredSlots = slotsData.filter(slot => {
    const typeMatch = typeFilter === 'all' || slot.type === typeFilter;
    let statusMatch = true;
    
    if (statusFilter === 'available') {
      statusMatch = slot.status !== 'cancelled' && slot.booked < slot.maxCandidates;
    } else if (statusFilter === 'booked') {
      statusMatch = slot.status !== 'cancelled' && slot.booked >= slot.maxCandidates;
    } else if (statusFilter === 'cancelled') {
      statusMatch = slot.status === 'cancelled';
    }
    
    return typeMatch && statusMatch;
  });
  
  // Sort by date and time
  filteredSlots.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    
    if (dateA < dateB) return -1;
    if (dateA > dateB) return 1;
    
    return a.startTime.localeCompare(b.startTime);
  });
  
  // Add slots to list
  filteredSlots.forEach(slot => {
    const slotDate = new Date(slot.date);
    const dateStr = slotDate.toLocaleDateString('vi-VN');
    const dayName = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][slotDate.getDay()];
    
    const slotElement = document.createElement('div');
    slotElement.className = 'slot-card';
    
    let statusClass = '';
    if (slot.status === 'cancelled') {
      statusClass = 'cancelled';
    } else if (slot.booked >= slot.maxCandidates) {
      statusClass = 'booked';
    }
    
    slotElement.innerHTML = `
      <div class="slot-info">
        <div class="slot-time">${dayName}, ${dateStr} • ${slot.startTime} - ${slot.endTime}</div>
        <div class="slot-title">${slot.title}</div>
        <div class="slot-meta">
          <span class="slot-type ${slot.type}">
            <i class="fas fa-${slot.type === 'online' ? 'video' : 'map-marker-alt'}"></i> 
            ${slot.type === 'online' ? 'Online' : 'Offline'}
          </span>
          <span class="slot-status ${statusClass}">${getStatusText(slot)}</span>
          <span class="slot-count">${slot.booked}/${slot.maxCandidates} ứng viên</span>
        </div>
      </div>
      <div class="slot-actions">
        <button class="btn btn-outline btn-view" data-id="${slot.id}">
          <i class="fas fa-eye"></i> Xem
        </button>
        <button class="btn btn-outline btn-edit" data-id="${slot.id}">
          <i class="fas fa-edit"></i> Sửa
        </button>
      </div>
    `;
    
    slotList.appendChild(slotElement);
  });
  
  // Add event listeners to view and edit buttons
  document.querySelectorAll('.btn-view').forEach(btn => {
    btn.addEventListener('click', (e) => {
      showSlotDetail(e.currentTarget.getAttribute('data-id'));
    });
  });
  
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      editSlot(e.currentTarget.getAttribute('data-id'));
    });
  });
}

// Get status text
function getStatusText(slot) {
  if (slot.status === 'cancelled') return 'Đã hủy';
  if (slot.booked >= slot.maxCandidates) return 'Đã đầy';
  return 'Còn trống';
}

// Show add slot modal
function showAddSlotModal() {
  document.getElementById('slotModalTitle').textContent = 'Thêm khung giờ phỏng vấn';
  document.getElementById('slotForm').reset();
  document.getElementById('slotDate').valueAsDate = new Date();
  document.getElementById('slotStartTime').value = '09:00';
  document.getElementById('slotEndTime').value = '10:00';
  document.getElementById('slotMaxCandidates').value = '1';
  document.querySelector('input[name="multiSlot"][value="no"]').checked = true;
  
  currentSlotId = null;
  slotModal.style.display = 'block';
}

// Show slot detail modal
async function showSlotDetail(slotId) {
  const slot = slotsData.find(s => s.id === slotId);
  if (!slot) return;
  
  currentSlotId = slotId;
  
  const slotDate = new Date(slot.date);
  const dateStr = slotDate.toLocaleDateString('vi-VN');
  const dayName = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][slotDate.getDay()];
  
  // Update modal content
  document.getElementById('slotDetailTitle').textContent = slot.title;
  document.getElementById('detailSlotTitle').textContent = slot.title;
  document.getElementById('detailSlotTime').textContent = `${slot.startTime} - ${slot.endTime}, ${dayName} ${dateStr}`;
  document.getElementById('detailSlotType').textContent = slot.type === 'online' ? 'Online' : 'Offline';
  document.getElementById('detailSlotType').className = `badge ${slot.type === 'online' ? 'badge-primary' : 'badge-success'}`;
  document.getElementById('detailSlotLocation').textContent = slot.location;
  document.getElementById('detailSlotInterviewer').textContent = slot.interviewer || 'Chưa xác định';
  document.getElementById('detailSlotCapacity').textContent = `${slot.booked}/${slot.maxCandidates} ứng viên`;
  document.getElementById('detailSlotStatus').textContent = getStatusText(slot);
  document.getElementById('detailSlotStatus').className = `badge ${
    slot.status === 'cancelled' ? 'badge-danger' : 
    slot.booked >= slot.maxCandidates ? 'badge-warning' : 'badge-success'
  }`;
  document.getElementById('detailSlotNotes').innerHTML = slot.notes ? slot.notes.replace(/\n/g, '<br>') : 'Không có ghi chú';
  
  // Load candidates (in a real app, this would query Firestore)
  const candidateList = document.getElementById('slotCandidateList');
  candidateList.innerHTML = `
    <div class="text-muted" style="padding: 20px; text-align: center;">
      Đang tải danh sách ứng viên...
    </div>
  `;
  
  // Simulate loading candidates
  setTimeout(() => {
    if (slot.booked > 0) {
      let candidatesHTML = '';
      for (let i = 0; i < slot.booked; i++) {
        candidatesHTML += `
          <div class="candidate-item">
            <div class="candidate-info">
              <div class="candidate-name">Ứng viên ${i + 1}</div>
              <div class="candidate-email">example${i + 1}@ftu.edu.vn</div>
            </div>
            <div class="candidate-actions">
              <button class="btn btn-sm btn-outline">Xem hồ sơ</button>
              <button class="btn btn-sm btn-danger">Hủy đăng ký</button>
            </div>
          </div>
        `;
      }
      candidateList.innerHTML = candidatesHTML;
    } else {
      candidateList.innerHTML = `
        <div class="text-muted" style="padding: 20px; text-align: center;">
          Chưa có ứng viên nào đăng ký khung giờ này
        </div>
      `;
    }
  }, 500);
  
  // Update action buttons based on status
  cancelSlotBtn.style.display = slot.status === 'cancelled' ? 'none' : 'inline-block';
  cancelSlotBtn.textContent = slot.status === 'cancelled' ? 'Đã hủy' : 'Hủy khung giờ';
  cancelSlotBtn.disabled = slot.status === 'cancelled';
  
  slotDetailModal.style.display = 'block';
}

// Edit slot
function editCurrentSlot() {
  editSlot(currentSlotId);
  slotDetailModal.style.display = 'none';
}

function editSlot(slotId) {
  const slot = slotsData.find(s => s.id === slotId);
  if (!slot) return;
  
  currentSlotId = slotId;
  
  // Fill form with slot data
  document.getElementById('slotModalTitle').textContent = 'Chỉnh sửa khung giờ';
  document.getElementById('slotTitle').value = slot.title;
  document.getElementById('slotType').value = slot.type;
  document.getElementById('slotDate').valueAsDate = new Date(slot.date);
  document.getElementById('slotStartTime').value = slot.startTime;
  document.getElementById('slotEndTime').value = slot.endTime;
  document.getElementById('slotLocation').value = slot.location;
  document.getElementById('slotInterviewer').value = slot.interviewer || '';
  document.getElementById('slotMaxCandidates').value = slot.maxCandidates;
  document.getElementById('slotNotes').value = slot.notes || '';
  document.querySelector(`input[name="multiSlot"][value="${slot.allowMulti ? 'yes' : 'no'}"]`).checked = true;
  
  slotModal.style.display = 'block';
}

// Save slot to Firestore
async function saveSlot() {
  const title = document.getElementById('slotTitle').value.trim();
  const type = document.getElementById('slotType').value;
  const date = document.getElementById('slotDate').valueAsDate;
  const startTime = document.getElementById('slotStartTime').value;
  const endTime = document.getElementById('slotEndTime').value;
  const location = document.getElementById('slotLocation').value.trim();
  const interviewer = document.getElementById('slotInterviewer').value.trim();
  const maxCandidates = parseInt(document.getElementById('slotMaxCandidates').value);
  const notes = document.getElementById('slotNotes').value.trim();
  const allowMulti = document.querySelector('input[name="multiSlot"]:checked').value === 'yes';
  
  if (!title || !date || !startTime || !endTime || !location) {
    showToast('error', 'Vui lòng điền đầy đủ thông tin bắt buộc');
    return;
  }
  
  if (startTime >= endTime) {
    showToast('error', 'Giờ kết thúc phải sau giờ bắt đầu');
    return;
  }
  
  try {
    const slotData = {
      title,
      type,
      date,
      startTime,
      endTime,
      location,
      interviewer: interviewer || null,
      maxCandidates,
      notes: notes || null,
      allowMulti,
      booked: 0,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    if (currentSlotId) {
      // Update existing slot
      await updateDoc(doc(db, "interviewSlots", currentSlotId), slotData);
      showToast('success', 'Cập nhật khung giờ thành công');
    } else {
      // Add new slot
      await addDoc(collection(db, "interviewSlots"), slotData);
      showToast('success', 'Thêm khung giờ thành công');
    }
    
    // Reload slots
    await loadSlots();
    slotModal.style.display = 'none';
  } catch (error) {
    console.error("Error saving slot:", error);
    showToast('error', 'Lưu khung giờ thất bại');
  }
}

// Show cancel confirmation
function showCancelConfirm() {
  document.getElementById('confirmMessage').textContent = 'Bạn có chắc chắn muốn hủy khung giờ này?';
  confirmActionBtn.textContent = 'Xác nhận hủy';
  confirmActionBtn.onclick = cancelCurrentSlot;
  confirmModal.style.display = 'block';
}

// Cancel current slot
async function cancelCurrentSlot() {
  if (!currentSlotId) return;
  
  try {
    await updateDoc(doc(db, "interviewSlots", currentSlotId), {
      status: 'cancelled',
      updatedAt: new Date()
    });
    
    showToast('success', 'Hủy khung giờ thành công');
    confirmModal.style.display = 'none';
    slotDetailModal.style.display = 'none';
    
    // Reload slots
    await loadSlots();
  } catch (error) {
    console.error("Error cancelling slot:", error);
    showToast('error', 'Hủy khung giờ thất bại');
  }
}

// Show toast message
function showToast(type, message) {
  // In a real app, you would use Toastr or similar library
  console.log(`${type}: ${message}`);
  alert(`${type}: ${message}`);
}
