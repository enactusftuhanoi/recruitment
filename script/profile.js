// profile.js
document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const onboardingSection = document.getElementById('onboardingSection');
  const profileSection = document.getElementById('profileSection');
  const roundSection = document.getElementById('roundSection');
  const startOnboardingBtn = document.getElementById('startOnboardingBtn');
  const editProfileBtn = document.getElementById('editProfileBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const editModal = document.getElementById('editModal');
  const onboardingModal = document.getElementById('onboardingModal');
  const closeModalButtons = document.querySelectorAll('.close-modal');
  const editForm = document.getElementById('editForm');
  const onboardingForm = document.getElementById('onboardingForm');
  
  // Check if user has profile data (simulated)
  const hasProfile = false; // Change to true to test with profile data
  
  // Initialize UI based on user state
  function initUI() {
    if (hasProfile) {
      onboardingSection.style.display = 'none';
      profileSection.style.display = 'block';
      roundSection.style.display = 'block';
      
      // Simulate loading profile data
      setTimeout(loadProfileData, 500);
    } else {
      onboardingSection.style.display = 'flex';
      profileSection.style.display = 'none';
      roundSection.style.display = 'none';
    }
  }
  
  // Load profile data (simulated)
  function loadProfileData() {
    // In a real app, this would come from a database
    const profileData = {
      fullName: 'Nguyễn Văn A',
      email: 'example@ftu.edu.vn',
      phone: '0123456789',
      gender: 'Nam',
      dob: '01/01/2007',
      school: 'Trường Đại học Ngoại Thương',
      faculty: 'K64 - Anh 05 - TC KTQT',
      studentId: '2415410000',
      department: 'Nhân sự',
      currentRound: 'Vòng 1',
      status: 'Chờ xử lý'
    };
    
    // Update profile section
    document.getElementById('userFullName').textContent = profileData.fullName;
    document.getElementById('userEmail').textContent = profileData.email;
    document.getElementById('userPhone').textContent = profileData.phone;
    document.getElementById('userGender').textContent = profileData.gender;
    document.getElementById('userDob').textContent = profileData.dob;
    document.getElementById('userSchool').textContent = profileData.school;
    document.getElementById('userFaculty').textContent = profileData.faculty;
    document.getElementById('userStudentId').textContent = profileData.studentId;
    document.getElementById('userDepartment').textContent = profileData.department;
    document.getElementById('userCurrentRound').textContent = profileData.currentRound;
    document.getElementById('userStatus').textContent = profileData.status;
    
    // Update progress bar
    updateProgressBar(1);
  }
  
  // Update progress bar based on current round
  function updateProgressBar(currentRound) {
    const progressBar = document.getElementById('progressBar');
    let progress = 0;
    
    switch(currentRound) {
      case 'Vòng 1':
        progress = 0;
        break;
      case 'Vòng 2':
        progress = 25;
        break;
      case 'Vòng 3':
        progress = 50;
        break;
      case 'Vòng 4':
        progress = 75;
        break;
      case 'Hoàn thành':
        progress = 100;
        break;
    }
    
    progressBar.style.width = `${progress}%`;
    
    // Update active steps
    document.querySelectorAll('.step').forEach((step, index) => {
      if (index < currentRound) {
        step.classList.add('active');
      } else {
        step.classList.remove('active');
      }
    });
  }
  
  // Show modal function
  function showModal(modal) {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
  
  // Hide modal function
  function hideModal(modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
  
  // Event Listeners
  startOnboardingBtn.addEventListener('click', () => {
    showModal(onboardingModal);
  });
  
  editProfileBtn.addEventListener('click', () => {
    // Pre-fill the form with current data
    document.getElementById('editFullName').value = document.getElementById('userFullName').textContent;
    document.getElementById('editEmail').value = document.getElementById('userEmail').textContent;
    document.getElementById('editPhone').value = document.getElementById('userPhone').textContent;
    document.getElementById('editDob').value = document.getElementById('userDob').textContent;
    document.getElementById('editSchool').value = document.getElementById('userSchool').textContent;
    document.getElementById('editFaculty').value = document.getElementById('userFaculty').textContent;
    document.getElementById('editStudentId').value = document.getElementById('userStudentId').textContent;
    
    // Set gender radio button
    const gender = document.getElementById('userGender').textContent;
    document.querySelector(`input[name="gender"][value="${gender}"]`).checked = true;
    
    showModal(editModal);
  });
  
  refreshBtn.addEventListener('click', () => {
    toastr.info('Đang làm mới dữ liệu...');
    // Simulate refresh
    setTimeout(() => {
      toastr.success('Dữ liệu đã được cập nhật');
    }, 1000);
  });
  
  logoutBtn.addEventListener('click', () => {
    toastr.info('Đang đăng xuất...');
    // Simulate logout
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
  });
  
  closeModalButtons.forEach(button => {
    button.addEventListener('click', () => {
      const modal = button.closest('.modal');
      hideModal(modal);
    });
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
      hideModal(event.target);
    }
  });
  
  // Form submission handlers
  editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form values
    const fullName = document.getElementById('editFullName').value;
    const email = document.getElementById('editEmail').value;
    const phone = document.getElementById('editPhone').value;
    const gender = document.querySelector('input[name="gender"]:checked').value;
    const dob = document.getElementById('editDob').value;
    const school = document.getElementById('editSchool').value;
    const faculty = document.getElementById('editFaculty').value;
    const studentId = document.getElementById('editStudentId').value;
    
    // Update profile (in a real app, this would save to database)
    document.getElementById('userFullName').textContent = fullName;
    document.getElementById('userEmail').textContent = email;
    document.getElementById('userPhone').textContent = phone;
    document.getElementById('userGender').textContent = gender;
    document.getElementById('userDob').textContent = dob;
    document.getElementById('userSchool').textContent = school;
    document.getElementById('userFaculty').textContent = faculty;
    document.getElementById('userStudentId').textContent = studentId;
    
    hideModal(editModal);
    toastr.success('Cập nhật hồ sơ thành công');
  });
  
  onboardingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form values
    const fullName = document.getElementById('onboardFullName').value;
    const email = document.getElementById('onboardEmail').value;
    const phone = document.getElementById('onboardPhone').value;
    const gender = document.querySelector('input[name="onboardGender"]:checked').value;
    const dob = document.getElementById('onboardDob').value;
    const school = document.getElementById('onboardSchool').value;
    const faculty = document.getElementById('onboardFaculty').value;
    const studentId = document.getElementById('onboardStudentId').value;
    const department = document.getElementById('onboardDepartment').value;
    
    // Create profile (in a real app, this would save to database)
    document.getElementById('userFullName').textContent = fullName;
    document.getElementById('userEmail').textContent = email;
    document.getElementById('userPhone').textContent = phone;
    document.getElementById('userGender').textContent = gender;
    document.getElementById('userDob').textContent = dob;
    document.getElementById('userSchool').textContent = school;
    document.getElementById('userFaculty').textContent = faculty;
    document.getElementById('userStudentId').textContent = studentId;
    document.getElementById('userDepartment').textContent = department;
    
    // Update UI
    hasProfile = true;
    initUI();
    
    hideModal(onboardingModal);
    toastr.success('Đăng ký hồ sơ thành công');
  });
  
  // Initialize the UI
  initUI();
  
  // Initialize toastr
  toastr.options = {
    positionClass: 'toast-bottom-right',
    progressBar: true,
    closeButton: true,
    timeOut: 3000
  };
});