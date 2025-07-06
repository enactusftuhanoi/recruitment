document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra trạng thái đăng nhập
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'index.html';
        } else {
            loadUserProfile(user);
        }
    });

    // Xử lý đăng xuất
    document.getElementById('logoutBtn').addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = 'index.html';
        });
    });

    // Xử lý submit form
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveProfile();
    });

    // Tự động điền email từ thông tin đăng nhập
    const user = auth.currentUser;
    if (user) {
        document.getElementById('email').value = user.email;
        
        // Tách tên từ email nếu có
        const emailPrefix = user.email.split('@')[0];
        const nameFromEmail = emailPrefix.split('.')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
        document.getElementById('fullName').value = nameFromEmail;
    }
});

async function loadUserProfile(user) {
    try {
        // Kiểm tra xem profile đã tồn tại chưa
        const doc = await candidatesCollection.doc(user.uid).get();
        
        if (doc.exists) {
            // Load thông tin hiện có
            const data = doc.data();
            populateForm(data);
            updateApplicationStatus(data.status, data.currentRound);
        } else {
            // Tạo profile mới nếu chưa có
            await candidatesCollection.doc(user.uid).set({
                email: user.email,
                status: 'pending',
                currentRound: 'application',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    } catch (error) {
        console.error("Error loading profile:", error);
        showError("Đã có lỗi xảy ra khi tải thông tin. Vui lòng thử lại.");
    }
}

function populateForm(data) {
    // Điền thông tin cá nhân
    document.getElementById('fullName').value = data.fullName || '';
    document.getElementById('gender').value = data.gender || '';
    document.getElementById('phone').value = data.phone || '';
    document.getElementById('dob').value = data.dob || '';
    
    // Điền thông tin học vấn
    document.getElementById('faculty').value = data.faculty || '';
    document.getElementById('class').value = data.class || '';
    document.getElementById('studentId').value = data.studentId || '';
    document.getElementById('academicYear').value = data.academicYear || '';
    
    // Điền thông tin ứng tuyển
    if (data.departments) {
        data.departments.forEach(dept => {
            const checkbox = document.querySelector(`input[name="department"][value="${dept}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }
    
    document.getElementById('motivation').value = data.motivation || '';
}

async function saveProfile() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        // Lấy giá trị từ form
        const profileData = {
            fullName: document.getElementById('fullName').value,
            gender: document.getElementById('gender').value,
            phone: document.getElementById('phone').value,
            dob: document.getElementById('dob').value,
            faculty: document.getElementById('faculty').value,
            class: document.getElementById('class').value,
            studentId: document.getElementById('studentId').value,
            academicYear: document.getElementById('academicYear').value,
            departments: Array.from(document.querySelectorAll('input[name="department"]:checked'))
                .map(checkbox => checkbox.value),
            motivation: document.getElementById('motivation').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Lưu vào Firestore
        await candidatesCollection.doc(user.uid).update(profileData);
        
        // Hiển thị thông báo thành công
        showSuccess("Thông tin đã được lưu thành công!");
        
        // Cập nhật trạng thái
        const doc = await candidatesCollection.doc(user.uid).get();
        updateApplicationStatus(doc.data().status, doc.data().currentRound);
        
    } catch (error) {
        console.error("Error saving profile:", error);
        showError("Đã có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại.");
    }
}

function updateApplicationStatus(status, currentRound) {
    // Cập nhật badge trạng thái
    const statusBadge = document.getElementById('applicationStatus');
    statusBadge.textContent = 
        status === 'pending' ? 'Đang xử lý' :
        status === 'approved' ? 'Đã duyệt' : 'Từ chối';
    statusBadge.className = `status-badge ${status}`;
    
    // Cập nhật badge vòng hiện tại
    const roundBadge = document.getElementById('currentRound');
    roundBadge.textContent = 
        currentRound === 'application' ? 'Vòng đơn' :
        currentRound === 'group-interview' ? 'Phỏng vấn nhóm' : 'Thử thách';
    
    // Cập nhật timeline
    const timelineSteps = document.querySelectorAll('.timeline-step');
    timelineSteps.forEach(step => step.classList.remove('active', 'completed'));
    
    if (currentRound === 'application') {
        timelineSteps[0].classList.add('active');
    } else if (currentRound === 'group-interview') {
        timelineSteps[0].classList.add('completed');
        timelineSteps[1].classList.add('active');
    } else if (currentRound === 'challenge') {
        timelineSteps[0].classList.add('completed');
        timelineSteps[1].classList.add('completed');
        timelineSteps[2].classList.add('active');
    }
    
    // Cập nhật trạng thái chi tiết
    const statusElements = document.querySelectorAll('.status-text');
    if (status === 'rejected') {
        statusElements.forEach(el => el.textContent = 'Không đạt');
    } else {
        statusElements[0].textContent = status === 'pending' ? 'Đang xử lý' : 'Đã duyệt';
        
        if (currentRound === 'application') {
            statusElements[1].textContent = 'Chưa bắt đầu';
            statusElements[2].textContent = 'Chưa bắt đầu';
        } else if (currentRound === 'group-interview') {
            statusElements[1].textContent = status === 'pending' ? 'Đang xử lý' : 'Đã duyệt';
            statusElements[2].textContent = 'Chưa bắt đầu';
        }
    }
}

function showSuccess(message) {
    const alert = document.createElement('div');
    alert.className = 'alert success';
    alert.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
}

function showError(message) {
    const alert = document.createElement('div');
    alert.className = 'alert error';
    alert.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
}