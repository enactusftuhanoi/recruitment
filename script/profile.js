// Firebase imports with error handling
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
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// =========================== CONFIG & CONSTANTS ===========================
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDuTvBn8Xl01DYddVXQ7M0L24K3l-GyG0c",
  authDomain: "enactusftuhanoi-tracuu.firebaseapp.com",
  projectId: "enactusftuhanoi-tracuu",
};

const ROUND_DEFINITIONS = {
  1: { name: 'Vòng đơn', description: 'Nộp hồ sơ đăng ký' },
  2: { name: 'Phỏng vấn nhóm', description: 'Thảo luận nhóm và đánh giá' },
  3: { name: 'Thử thách', description: 'Hoàn thành nhiệm vụ thực tế' },
  4: { name: 'Phỏng vấn cá nhân', description: 'Đánh giá cuối cùng' },
  5: { name: 'Hoàn thành', description: 'Kết thúc quá trình' }
};

const STATUS_COLORS = {
  'Đã duyệt': 'badge-success',
  'Từ chối': 'badge-danger',
  'Đang chờ': 'badge-primary',
  'Đang thực hiện': 'badge-primary',
  'Chưa bắt đầu': 'badge-warning',
  'Chờ xử lý': 'badge-warning'
};

const AVATAR_COLORS = [
  '#1a73e8', '#4caf50', '#ff9800', '#9c27b0', 
  '#e91e63', '#00bcd4', '#8bc34a', '#ff5722',
  '#795548', '#607d8b', '#f44336', '#2196f3'
];

// =========================== APP INITIALIZATION ===========================
class UserManagement {
  constructor() {
    this.app = initializeApp(FIREBASE_CONFIG);
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
    
    this.currentUser = null;
    this.currentUserId = null;
    this.isLoading = false;
    
    this.initializeToastr();
    this.initializeEventListeners();
    this.initializeAuthStateListener();
    
    this.showLoader = this.debounce(this.showLoader.bind(this), 300);
  }

  // =========================== UTILITY METHODS ===========================
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  generateHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  }

  getInitials(name) {
    if (!name) return 'U';
    
    const words = name.trim().split(' ').filter(word => word.length > 0);
    if (words.length === 0) return 'U';
    
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  generateColorFromName(name) {
    const index = this.generateHash(name) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
  }

  formatDate(date) {
    if (!date) return 'Chưa cập nhật';
    if (date.toDate) return date.toDate().toLocaleDateString('vi-VN');
    if (date instanceof Date) return date.toLocaleDateString('vi-VN');
    return date;
  }

  sanitizeInput(input) {
    return input?.toString().trim() || '';
  }

  // =========================== UI HELPER METHODS ===========================
  initializeToastr() {
    if (typeof toastr !== 'undefined') {
      toastr.options = {
        closeButton: true,
        newestOnTop: true,
        progressBar: true,
        positionClass: 'toast-bottom-right',
        timeOut: 3000,
        extendedTimeOut: 1000,
        showEasing: 'swing',
        hideEasing: 'linear',
        showMethod: 'fadeIn',
        hideMethod: 'fadeOut'
      };
    }
  }

  showNotification(type, message) {
    if (typeof toastr !== 'undefined') {
      toastr[type](message);
    } else {
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }

  showLoader(show = true) {
    const loader = document.getElementById('pageLoader');
    if (loader) {
      loader.style.display = show ? 'flex' : 'none';
    }
    this.isLoading = show;
  }

  setElementText(id, text) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = text || 'Chưa cập nhật';
    }
  }

  setElementValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.value = value || '';
    }
  }

  // =========================== AVATAR MANAGEMENT ===========================
  async updateUserAvatar(user) {
    const avatarElement = document.getElementById('userAvatar');
    if (!avatarElement) return;

    this.resetAvatar(avatarElement);

    let photoUrl = user.photoURL;
    if (photoUrl?.includes('googleusercontent.com')) {
      photoUrl = photoUrl.replace(/=s\d+(-c)?/, '=s400-c');
    }

    if (photoUrl) {
      try {
        await this.loadImageWithFallback(avatarElement, photoUrl, user);
      } catch (error) {
        this.showInitialsAvatar(avatarElement, user);
      }
    } else {
      this.showInitialsAvatar(avatarElement, user);
    }
  }

  resetAvatar(avatarElement) {
    avatarElement.innerHTML = '';
    avatarElement.style.backgroundImage = '';
    avatarElement.className = avatarElement.className.replace(/avatar-\w+/g, '');
  }

  loadImageWithFallback(avatarElement, photoUrl, user) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        reject(new Error('Image load timeout'));
      }, 5000);

      img.onload = () => {
        clearTimeout(timeout);
        avatarElement.style.backgroundImage = `url(${photoUrl})`;
        avatarElement.style.backgroundSize = 'cover';
        avatarElement.style.backgroundPosition = 'center';
        avatarElement.classList.add('avatar-image');
        resolve();
      };

      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Image load failed'));
      };

      img.src = photoUrl;
    });
  }

  showInitialsAvatar(avatarElement, user) {
    const name = user.fullname || user.email || 'User';
    const initials = this.getInitials(name);
    
    avatarElement.innerHTML = initials;
    avatarElement.style.backgroundColor = this.generateColorFromName(name);
    avatarElement.style.color = 'white';
    avatarElement.style.display = 'flex';
    avatarElement.style.alignItems = 'center';
    avatarElement.style.justifyContent = 'center';
    avatarElement.style.fontSize = initials.length > 2 ? '45px' : '55px';
    avatarElement.style.fontWeight = '600';
    avatarElement.style.backgroundImage = 'none';
    avatarElement.classList.add('avatar-initials');
  }

  // =========================== DATA LOADING ===========================
  async loadUserData(userId, email) {
    if (this.isLoading) return;
    
    this.showLoader(true);
    
    try {
      const user = this.auth.currentUser;
      const userDoc = await getDoc(doc(this.db, "users", userId));
      
      if (userDoc.exists()) {
        await this.handleExistingUser(userDoc.data(), userId, user);
      } else {
        await this.handleNewUser(userId, email, user);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      this.showNotification('error', 'Lỗi khi tải dữ liệu người dùng');
    } finally {
      this.showLoader(false);
    }
  }

  async handleExistingUser(userData, userId, firebaseUser) {
    this.currentUser = userData;
    this.currentUserId = userId;
    
    this.showSection('profileSection', true);
    this.showSection('roundSection', true);
    this.showSection('onboardingSection', false);
    
    this.updateProfileUI(this.currentUser);
    this.updateRoundProgress(this.currentUser.current_round || 1);
    this.showRoundDetails(this.currentUser.current_round || 1);
    
    await this.updateUserAvatar({
      ...this.currentUser,
      photoURL: firebaseUser?.photoURL
    });
  }

  async handleNewUser(userId, email, firebaseUser) {
    this.currentUserId = userId;
    
    this.showSection('profileSection', false);
    this.showSection('roundSection', false);
    this.showSection('onboardingSection', true);
    
    if (email) {
      this.setElementValue('onboardEmail', email);
    }
    
    if (firebaseUser?.photoURL) {
      await this.showOnboardingAvatar(firebaseUser.photoURL);
    }
  }

  showSection(sectionId, show) {
    const section = document.getElementById(sectionId);
    if (section) {
      section.style.display = show ? 'block' : 'none';
    }
  }

  async showOnboardingAvatar(photoUrl) {
    const onboardingIcon = document.querySelector('.onboarding-icon');
    if (!onboardingIcon) return;

    const avatarPreview = document.createElement('div');
    Object.assign(avatarPreview.style, {
      width: '100px',
      height: '100px',
      borderRadius: '50%',
      backgroundImage: `url(${photoUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      margin: '0 auto 15px',
      border: '3px solid #fff',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    });
    
    onboardingIcon.innerHTML = '';
    onboardingIcon.appendChild(avatarPreview);
  }

  // =========================== UI UPDATE METHODS ===========================
  updateProfileUI(user) {
    const fields = {
      'userFullName': user.fullname,
      'userGender': user.gender,
      'userEmail': user.email,
      'userPhone': user.phone,
      'userDob': this.formatDate(user.dob),
      'userSchool': user.school,
      'userFaculty': user.faculty,
      'userStudentId': user.studentId,
      'userDepartment': user.department || 'Chưa chọn'
    };

    Object.entries(fields).forEach(([id, value]) => {
      this.setElementText(id, value);
    });

    this.updateStatusBadges(user);
  }

  updateStatusBadges(user) {
    const currentRoundText = this.getRoundText(user.current_round || 1);
    this.setElementText('userCurrentRound', currentRoundText);
    this.setElementText('userStatus', user.status || 'Chưa xác định');
    
    const statusBadge = document.getElementById('userStatus');
    if (statusBadge) {
      statusBadge.className = `badge ${STATUS_COLORS[user.status] || 'badge-warning'}`;
    }
  }

  getRoundText(round) {
    if (!round || round < 1) return 'Chưa bắt đầu';
    
    const roundInfo = ROUND_DEFINITIONS[Math.min(round, 5)];
    return round <= 4 ? `Vòng ${round}: ${roundInfo.name}` : roundInfo.name;
  }

  updateRoundProgress(currentRound) {
    const steps = document.querySelectorAll('.step');
    const progressBar = document.getElementById('progressBar');
    
    if (!steps.length || !progressBar) return;

    // Reset and update steps
    steps.forEach((step, index) => {
      step.classList.remove('active', 'completed');
      
      if (index < currentRound - 1) {
        step.classList.add('completed');
      } else if (index === currentRound - 1 && currentRound <= 5) {
        step.classList.add('active');
      }
    });

    // Update progress bar
    const progressPercent = Math.min(((currentRound - 1) / 4) * 100, 100);
    progressBar.style.width = `${progressPercent}%`;
    progressBar.style.transition = 'width 0.3s ease';
  }

  showRoundDetails(currentRound) {
    // Hide all round cards
    document.querySelectorAll('.round-card').forEach(card => {
      card.style.display = 'none';
    });

    // Show cards up to current round with animation
    for (let i = 1; i <= Math.min(currentRound, 4); i++) {
      const roundCard = document.getElementById(`round${i}Details`);
      if (roundCard) {
        roundCard.style.display = 'block';
        this.updateRoundStatus(i);
        
        // Add subtle animation
        setTimeout(() => {
          roundCard.classList.add('fade-in');
        }, i * 100);
      }
    }
  }

  updateRoundStatus(roundNumber) {
    if (!this.currentUser) return;
    
    const roundData = this.currentUser[`round_${roundNumber}`] || {};
    const status = roundData.status || 'Chưa bắt đầu';
    
    const statusElement = document.getElementById(`round${roundNumber}Status`);
    const statusTextElement = document.getElementById(`round${roundNumber}StatusText`);
    
    if (statusElement) {
      statusElement.textContent = status;
      statusElement.className = `badge ${STATUS_COLORS[status] || 'badge-warning'}`;
    }
    
    if (statusTextElement) {
      statusTextElement.textContent = status;
    }
    
    this.updateRoundSpecificDetails(roundNumber, roundData);
  }

  updateRoundSpecificDetails(roundNumber, roundData) {
    const detailMappings = {
      1: {
        'round1Deadline': roundData.deadline,
        'round1Guide': roundData.guide
      },
      2: {
        'round2Time': roundData.time,
        'round2Location': roundData.location,
        'round2Members': roundData.members
      },
      3: {
        'round3Challenge': roundData.challenge,
        'round3Deadline': roundData.deadline,
        'round3Materials': roundData.materials
      },
      4: {
        'round4Time': roundData.time,
        'round4Location': roundData.location,
        'round4Interviewer': roundData.interviewer
      }
    };

    const details = detailMappings[roundNumber];
    if (details) {
      Object.entries(details).forEach(([id, value]) => {
        this.setElementText(id, value);
      });
    }
  }

  // =========================== MODAL MANAGEMENT ===========================
  showEditModal() {
    if (!this.currentUser) return;
    
    const editModal = document.getElementById('editModal');
    if (!editModal) return;

    // Populate form fields
    const fields = {
      'editFullName': this.currentUser.fullname,
      'editEmail': this.currentUser.email,
      'editPhone': this.currentUser.phone,
      'editDob': this.currentUser.dob,
      'editSchool': this.currentUser.school,
      'editFaculty': this.currentUser.faculty,
      'editStudentId': this.currentUser.studentId
    };

    Object.entries(fields).forEach(([id, value]) => {
      this.setElementValue(id, value);
    });

    // Set gender radio button
    const gender = this.currentUser.gender || 'Nam';
    const genderRadio = document.querySelector(`input[name="gender"][value="${gender}"]`);
    if (genderRadio) genderRadio.checked = true;

    editModal.style.display = 'block';
    editModal.classList.add('modal-fade-in');
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('modal-fade-out');
      setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.remove('modal-fade-in', 'modal-fade-out');
      }, 200);
    }
  }

  // =========================== FORM HANDLING ===========================
  async saveProfile(e) {
    e.preventDefault();
    
    if (!this.currentUserId || this.isLoading) return;
    
    this.showLoader(true);
    
    try {
      const formData = this.getFormData([
        'editFullName', 'editEmail', 'editPhone', 
        'editDob', 'editSchool', 'editFaculty', 'editStudentId'
      ]);

      const genderInput = document.querySelector('input[name="gender"]:checked');
      if (!genderInput) throw new Error('Vui lòng chọn giới tính');

      const updatedData = {
        ...formData,
        gender: genderInput.value,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(this.db, "users", this.currentUserId), updatedData);
      
      // Update local data
      this.currentUser = { ...this.currentUser, ...updatedData };
      this.updateProfileUI(this.currentUser);
      
      this.hideModal('editModal');
      this.showNotification('success', 'Cập nhật hồ sơ thành công');
    } catch (error) {
      console.error('Error updating profile:', error);
      this.showNotification('error', 'Cập nhật hồ sơ thất bại: ' + error.message);
    } finally {
      this.showLoader(false);
    }
  }

  async saveOnboardingData(e) {
    e.preventDefault();
    
    const user = this.auth.currentUser;
    if (!user || this.isLoading) return;
    
    this.showLoader(true);
    
    try {
      const formData = this.getFormData([
        'onboardFullName', 'onboardEmail', 'onboardPhone',
        'onboardDob', 'onboardSchool', 'onboardFaculty', 
        'onboardStudentId', 'onboardDepartment'
      ]);

      const genderInput = document.querySelector('input[name="onboardGender"]:checked');
      if (!genderInput) throw new Error('Vui lòng chọn giới tính');

      if (!formData.onboardFullName || !formData.onboardPhone) {
        throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc');
      }

      const userData = {
        fullname: this.sanitizeInput(formData.onboardFullName),
        email: this.sanitizeInput(formData.onboardEmail),
        phone: this.sanitizeInput(formData.onboardPhone),
        gender: genderInput.value,
        dob: formData.onboardDob,
        school: this.sanitizeInput(formData.onboardSchool),
        faculty: this.sanitizeInput(formData.onboardFaculty),
        studentId: this.sanitizeInput(formData.onboardStudentId),
        department: formData.onboardDepartment,
        status: "Chờ xử lý",
        current_round: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        round_1: {
          status: "Chưa bắt đầu",
          deadline: "15/07/2025",
          guide: "Hoàn thành form đăng ký"
        }
      };

      await setDoc(doc(this.db, "users", user.uid), userData);
      
      // Update UI
      this.currentUser = userData;
      this.currentUserId = user.uid;
      
      await this.handleExistingUser(userData, user.uid, user);
      
      this.hideModal('onboardingModal');
      this.showNotification('success', 'Đăng ký hồ sơ thành công!');
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      this.showNotification('error', 'Đăng ký hồ sơ thất bại: ' + error.message);
    } finally {
      this.showLoader(false);
    }
  }

  getFormData(fieldIds) {
    const data = {};
    fieldIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        data[id] = element.value.trim();
      }
    });
    return data;
  }

  // =========================== AUTH MANAGEMENT ===========================
  async logout() {
    if (this.isLoading) return;
    
    try {
      this.showLoader(true);
      await signOut(this.auth);
      window.location.href = '/index.html';
    } catch (error) {
      console.error('Logout error:', error);
      this.showNotification('error', 'Đăng xuất thất bại');
      this.showLoader(false);
    }
  }

  initializeAuthStateListener() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.currentUserId = user.uid;
        this.loadUserData(user.uid, user.email);
      } else {
        window.location.href = '/index.html';
      }
    });
  }

  // =========================== EVENT LISTENERS ===========================
  initializeEventListeners() {
    document.addEventListener('DOMContentLoaded', () => {
      this.bindElementEvents();
    });
  }

  bindElementEvents() {
    const eventBindings = {
      'logoutBtn': { event: 'click', handler: () => this.logout() },
      'refreshBtn': { event: 'click', handler: () => this.refreshData() },
      'editProfileBtn': { event: 'click', handler: () => this.showEditModal() },
      'startOnboardingBtn': { event: 'click', handler: () => this.showModal('onboardingModal') },
      'editForm': { event: 'submit', handler: (e) => this.saveProfile(e) },
      'onboardingForm': { event: 'submit', handler: (e) => this.saveOnboardingData(e) }
    };

    Object.entries(eventBindings).forEach(([id, {event, handler}]) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener(event, handler);
      }
    });

    this.bindModalEvents();
  }

  bindModalEvents() {
    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) {
          this.hideModal(modal.id);
        }
      });
    });

    // Close modal on outside click
    ['editModal', 'onboardingModal'].forEach(modalId => {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            this.hideModal(modalId);
          }
        });
      }
    });

    // ESC key to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideModal('editModal');
        this.hideModal('onboardingModal');
      }
    });
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'block';
      modal.classList.add('modal-fade-in');
    }
  }

  refreshData() {
    if (this.currentUserId && !this.isLoading) {
      this.loadUserData(this.currentUserId);
      this.showNotification('info', 'Đang làm mới dữ liệu...');
    }
  }
}

// =========================== INITIALIZATION ===========================
// Initialize the application
const userApp = new UserManagement();
