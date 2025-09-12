// Firebase configuration
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
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth(); // <-- Auth instance

let applications = [];
let currentApplicationId = null;

// CHÚ Ý: không gọi loadApplications trực tiếp khi load trang.
// Thay vào đó, lắng nghe auth state để đảm bảo chỉ load khi user đã đăng nhập.
auth.onAuthStateChanged((user) => {
    if (user) {
        // Nếu bạn muốn thêm kiểm tra bổ sung (ví dụ: chỉ cho phép email domain nào...) 
        // có thể kiểm tra user.email ở đây.
        loadApplications(); // gọi tải dữ liệu khi user đã auth
    } else {
        // Nếu không login -> chuyển về trang login
        // Thay đường dẫn nếu login.html của bạn đặt ở folder khác (vd: '/admin/login.html')
        window.location.href = 'login.html';
    }
});
// Kiểm tra session
const userEmail = sessionStorage.getItem("email");
if (!userEmail) {
  window.location.href = "login.html"; 
}


// Hàm tải danh sách ứng viên
async function loadApplications() {
    try {
        const snapshot = await db.collection('applications')
            .orderBy('timestamp', 'desc')
            .get();
        
        applications = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            applications.push({
                id: doc.id,
                // Đảm bảo mọi ứng viên đều có trường status
                status: data.status || 'new',
                ...data
            });
        });
        
        renderApplications();
    } catch (error) {
        console.error('Error loading applications:', error);
        Swal.fire('Lỗi', 'Không thể tải danh sách ứng viên: ' + error.message, 'error');
    }
}

// Hàm hiển thị danh sách ứng viên
function renderApplications() {
    const applicationsList = document.getElementById('applications-list');
    const noApplications = document.getElementById('no-applications');

    if (!applicationsList) {
        console.error('Missing #applications-list element in DOM');
        return;
    }

    // Lọc theo bộ lọc
    const departmentFilter = document.getElementById('filter-department')?.value;
    const statusFilter = document.getElementById('filter-status')?.value;
    const typeFilter = document.getElementById('filter-type')?.value;
    const searchText = document.getElementById('search-input')?.value?.toLowerCase() || '';

    const filteredApplications = applications.filter(app => {
        // Lọc theo ban (cả ưu tiên và dự bị)
        if (departmentFilter && 
            app.priority_position !== departmentFilter && 
            app.secondary_position !== departmentFilter) {
            return false;
        }
        
        // Lọc theo trạng thái
        if (statusFilter && app.status !== statusFilter) return false;
        
        // Lọc theo hình thức
        if (typeFilter && app.application_type !== typeFilter) return false;
        
        // Lọc theo tìm kiếm
        if (searchText && !(
            (app.fullname || '').toLowerCase().includes(searchText) ||
            (app.email || '').toLowerCase().includes(searchText) ||
            (app.phone || '').toLowerCase().includes(searchText)
        )) return false;
        
        return true;
    });

    // Clear list (không xóa #no-applications vì nó ở ngoài)
    applicationsList.innerHTML = '';

    if (filteredApplications.length === 0) {
        if (noApplications) noApplications.style.display = 'block';
        return;
    } else {
        if (noApplications) noApplications.style.display = 'none';
    }

    filteredApplications.forEach(app => {
        const appCard = document.createElement('div');
        appCard.className = 'application-card';
        appCard.onclick = () => showApplicationDetail(app.id);

        const appDate = app.timestamp ? (app.timestamp.toDate ? app.timestamp.toDate() : new Date(app.timestamp)) : new Date();
        const formattedDate = appDate.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const statusInfo = getStatusInfo(app.status);
        
        // Hiển thị cả ban ưu tiên và dự bị (nếu có)
        let departmentInfo = getDepartmentName(app.priority_position);
        if (app.secondary_position && app.secondary_position !== 'None') {
            departmentInfo += ` / ${getDepartmentName(app.secondary_position)}`;
        }

        appCard.innerHTML = `
            <div class="application-card-header">
                <div class="applicant-name">${app.fullname || 'Chưa có tên'}</div>
                <div class="application-date">${formattedDate}</div>
            </div>
            <div class="application-details">
                <div class="detail-item">
                    <span class="detail-label">Email</span>
                    <span class="detail-value">${app.email || 'Chưa cung cấp'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Số điện thoại</span>
                    <span class="detail-value">${app.phone || 'Chưa cung cấp'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Ban ứng tuyển</span>
                    <span class="detail-value">${departmentInfo}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Trạng thái</span>
                    <span class="application-status ${statusInfo.class}">${statusInfo.text}</span>
                </div>
            </div>
        `;
        applicationsList.appendChild(appCard);
    });
}

// Hàm lấy thông tin trạng thái
function getStatusInfo(status) {
    switch(status) {
        case 'reviewed':
            return { class: 'status-reviewed', text: 'Đã xem' };
        case 'accepted':
            return { class: 'status-accepted', text: 'Chấp nhận' };
        case 'rejected':
            return { class: 'status-rejected', text: 'Từ chối' };
        default:
            return { class: 'status-new', text: 'Mới' };
    }
}

// Hàm đánh dấu ứng viên đã xem
async function markAsReviewed() {
    if (!currentApplicationId) return;

    const application = applications.find(app => app.id === currentApplicationId);
    if (!application || application.status !== 'new') return;

    await db.collection('applications').doc(currentApplicationId).update({
        status: 'reviewed',
        updatedAt: new Date()
    });

    const appIndex = applications.findIndex(app => app.id === currentApplicationId);
    if (appIndex !== -1) {
        applications[appIndex].status = 'reviewed';
    }

    renderApplications();
    showApplicationDetail(currentApplicationId);
}

// Hàm hiển thị chi tiết ứng viên
function showApplicationDetail(appId) {
    const application = applications.find(app => app.id === appId);
    
    if (!application) return;
    
    currentApplicationId = appId;
    
    // Hiển thị tên ứng viên
    document.getElementById('detail-applicant-name').textContent = application.fullname || 'Ứng viên';
    
    // Tạo nội dung chi tiết
    const detailSections = document.getElementById('detail-sections');
    detailSections.innerHTML = '';
    
    // Thông tin cá nhân (đã bổ sung đầy đủ)
    const personalInfoSection = document.createElement('div');
    personalInfoSection.className = 'detail-section';
    
    let personalInfoHTML = `
        <h3><i class="fas fa-user"></i> Thông tin cá nhân</h3>
        <div class="application-details">
            <div class="detail-item">
                <span class="detail-label">Họ và tên</span>
                <span class="detail-value">${application.fullname || 'Chưa cung cấp'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Email</span>
                <span class="detail-value">${application.email || 'Chưa cung cấp'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Số điện thoại</span>
                <span class="detail-value">${application.phone || 'Chưa cung cấp'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Facebook</span>
                <span class="detail-value">${application.facebook || 'Chưa cung cấp'}</span>
            </div>
    `;
    
    // Thêm các trường thông tin cá nhân bổ sung
    if (application.birthdate) {
        personalInfoHTML += `
            <div class="detail-item">
                <span class="detail-label">Ngày/tháng/năm sinh</span>
                <span class="detail-value">${application.birthdate || 'Chưa cung cấp'}</span>
            </div>
        `;
    }
    
    if (application.gender) {
        personalInfoHTML += `
            <div class="detail-item">
                <span class="detail-label">Giới tính</span>
                <span class="detail-value">${application.gender || 'Chưa cung cấp'}</span>
            </div>
        `;
    }
    
    if (application.school) {
        personalInfoHTML += `
            <div class="detail-item">
                <span class="detail-label">Trường</span>
                <span class="detail-value">${application.school || 'Chưa cung cấp'}</span>
            </div>
        `;
    }
    
    if (application.major) {
        personalInfoHTML += `
            <div class="detail-item">
                <span class="detail-label">Chuyên ngành</span>
                <span class="detail-value">${application.major || 'Chưa cung cấp'}</span>
            </div>
        `;
    }
    
    personalInfoSection.innerHTML = personalInfoHTML;
    detailSections.appendChild(personalInfoSection);
    personalInfoHTML += `</div>`;
    
    // Thông tin ứng tuyển (sắp xếp lại logic)
    const applicationInfoSection = document.createElement('div');
    applicationInfoSection.className = 'detail-section';
    
    let applicationInfoHTML = `
        <h3><i class="fas fa-briefcase"></i> Thông tin ứng tuyển</h3>
        <div class="application-details">
            <div class="detail-item">
                <span class="detail-label">Hình thức ứng tuyển</span>
                <span class="detail-value">${application.application_type === 'form' ? 'Điền đơn' : 'Phỏng vấn'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Ban ưu tiên</span>
                <span class="detail-value">${getDepartmentName(application.priority_position)}</span>
            </div>
    `;
    
    // Hiển thị ban dự bị nếu có
    if (application.secondary_position && application.secondary_position !== 'None') {
        applicationInfoHTML += `
            <div class="detail-item">
                <span class="detail-label">Ban dự bị</span>
                <span class="detail-value">${getDepartmentName(application.secondary_position)}</span>
            </div>
        `;
    }
    
    applicationInfoHTML += `
            <div class="detail-item">
                <span class="detail-label">Thời gian dành cho Enactus</span>
                <span class="detail-value">${application.availability || 'Chưa cung cấp'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Trạng thái tổng</span>
                <span class="detail-value">
                    <span class="status-indicator ${getStatusInfo(application.status || 'new').class}">
                        ${getStatusInfo(application.status || 'new').text}
                    </span>
                </span>
            </div>
    `;

    // Hiển thị trạng thái từng nguyện vọng nếu ứng viên có 2 nguyện vọng
    if (application.secondary_position && application.secondary_position !== 'None') {
        const priorityStatus = application.priorityRejected ? 
            '<span style="color: var(--error);">Đã từ chối</span>' : 
            (application.priorityAccepted ? '<span style="color: var(--success);">Đã chấp nhận</span>' : 'Chưa đánh giá');
        
        const secondaryStatus = application.secondaryRejected ? 
            '<span style="color: var(--error);">Đã từ chối</span>' : 
            (application.secondaryAccepted ? '<span style="color: var(--success);">Đã chấp nhận</span>' : 'Chưa đánh giá');
        
        applicationInfoHTML += `
            <div class="detail-item">
                <span class="detail-label">Trạng thái nguyện vọng ưu tiên</span>
                <span class="detail-value">${priorityStatus}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Trạng thái nguyện vọng dự bị</span>
                <span class="detail-value">${secondaryStatus}</span>
            </div>
        `;
    }

    // Xác định ban được chấp nhận dựa trên trạng thái từng nguyện vọng
    let acceptedDepartments = [];

    if (application.priorityAccepted) {
        acceptedDepartments.push(getDepartmentName(application.priority_position));
    }
    if (application.secondaryAccepted) {
        acceptedDepartments.push(getDepartmentName(application.secondary_position));
    }

    let acceptedText = acceptedDepartments.length > 0 
        ? acceptedDepartments.join(' / ') 
        : 'Không có';

    applicationInfoHTML += `
        <div class="detail-item">
            <span class="detail-label">Ban được chấp nhận</span>
            <span class="detail-value" style="color: var(--success); font-weight: bold;">
                ${acceptedText}
            </span>
        </div>
    `;


    // Hiển thị lý do từ chối (nếu có)
    if (application.rejectionReason) {
        applicationInfoHTML += `
            <div class="detail-item">
                <span class="detail-label">Lý do từ chối</span>
                <span class="detail-value" style="color: var(--error);">${application.rejectionReason}</span>
            </div>
        `;
    }

    // Hiển thị ghi chú (nếu có)
    if (application.note) {
        applicationInfoHTML += `
            <div class="detail-item">
                <span class="detail-label">Ghi chú</span>
                <span class="detail-value">${application.note}</span>
            </div>
        `;
    }

    applicationInfoHTML += `</div>`;
    applicationInfoSection.innerHTML = applicationInfoHTML;
    detailSections.appendChild(applicationInfoSection);
    
    // Câu trả lời chung
    if (application.general_intro) {
        const generalAnswersSection = document.createElement('div');
        generalAnswersSection.className = 'detail-section';
        generalAnswersSection.innerHTML = '<h3><i class="fas fa-comments"></i> Câu trả lời chung</h3>';
        
        generalQuestions.forEach(q => {
            const answer = application[`general_${q.id}`] || 'Chưa trả lời';
            
            const questionItem = document.createElement('div');
            questionItem.className = 'question-item';
            questionItem.innerHTML = `
                <div class="question-text">${q.question}</div>
                <div class="answer-text">${answer}</div>
            `;
            generalAnswersSection.appendChild(questionItem);
        });
        
        detailSections.appendChild(generalAnswersSection);
    }
    
    // Câu trả lời theo phân ban ưu tiên
    if (application.priority_position) {
        const priorityAnswersSection = document.createElement('div');
        priorityAnswersSection.className = 'detail-section';
        
        // Hiển thị thông báo nếu ban ưu tiên bị từ chối
        let priorityTitle = `<h3><i class="fas fa-star"></i> Câu trả lời cho ${getDepartmentName(application.priority_position)} (Ưu tiên)</h3>`;
        if (application.priorityRejected) {
            priorityTitle = `<h3><i class="fas fa-star" style="color: var(--error);"></i> Câu trả lời cho ${getDepartmentName(application.priority_position)} (Ưu tiên - Đã từ chối)</h3>`;
        } else if (application.acceptedDepartment === application.priority_position) {
            priorityTitle = `<h3><i class="fas fa-star" style="color: var(--success);"></i> Câu trả lời cho ${getDepartmentName(application.priority_position)} (Ưu tiên - Đã chấp nhận)</h3>`;
        }
        
        priorityAnswersSection.innerHTML = priorityTitle;
        
        // Kinh nghiệm và động lực
        if (application.priority_experience) {
            const experienceItem = document.createElement('div');
            experienceItem.className = 'question-item';
            experienceItem.innerHTML = `
                <div class="question-text">Kinh nghiệm và hiểu biết về vị trí này</div>
                <div class="answer-text">${application.priority_experience}</div>
            `;
            priorityAnswersSection.appendChild(experienceItem);
        }
        
        if (application.priority_motivation) {
            const motivationItem = document.createElement('div');
            motivationItem.className = 'question-item';
            motivationItem.innerHTML = `
                <div class="question-text">Động lực ứng tuyển vị trí này</div>
                <div class="answer-text">${application.priority_motivation}</div>
            `;
            priorityAnswersSection.appendChild(motivationItem);
        }
        
        // Câu hỏi đặc thù của ban
        renderBanSpecificAnswers(application, 'priority', priorityAnswersSection);
        
        // Thêm nút hành động riêng cho ban ưu tiên
        const priorityActions = document.createElement('div');
        priorityActions.className = 'action-buttons';
        priorityActions.innerHTML = `
            <button class="action-button btn-accept" onclick="acceptDepartment('priority')">
                <i class="fas fa-check"></i> Chấp nhận ban ưu tiên
            </button>
            <button class="action-button btn-reject" onclick="rejectDepartment('priority')">
                <i class="fas fa-times"></i> Từ chối ban ưu tiên
            </button>
        `;
        priorityAnswersSection.appendChild(priorityActions);
        
        detailSections.appendChild(priorityAnswersSection);
    }
    
    // Câu trả lời theo phân ban dự bị
    if (application.secondary_position && application.secondary_position !== 'None') {
        const secondaryAnswersSection = document.createElement('div');
        secondaryAnswersSection.className = 'detail-section';
        
        // Hiển thị thông báo nếu ban dự bị được chấp nhận
        let secondaryTitle = `<h3><i class="fas fa-clock"></i> Câu trả lời cho ${getDepartmentName(application.secondary_position)} (Dự bị)</h3>`;
        if (application.acceptedDepartment === application.secondary_position) {
            secondaryTitle = `<h3><i class="fas fa-clock" style="color: var(--success);"></i> Câu trả lời cho ${getDepartmentName(application.secondary_position)} (Dự bị - Đã chấp nhận)</h3>`;
        } else if (application.secondaryRejected) {
            secondaryTitle = `<h3><i class="fas fa-clock" style="color: var(--error);"></i> Câu trả lời cho ${getDepartmentName(application.secondary_position)} (Dự bị - Đã từ chối)</h3>`;
        }
        
        secondaryAnswersSection.innerHTML = secondaryTitle;
        
        // Kinh nghiệm và động lực
        if (application.secondary_experience) {
            const experienceItem = document.createElement('div');
            experienceItem.className = 'question-item';
            experienceItem.innerHTML = `
                <div class="question-text">Kinh nghiệm và hiểu biết về vị trí dự bị (nếu có)</div>
                <div class="answer-text">${application.secondary_experience}</div>
            `;
            secondaryAnswersSection.appendChild(experienceItem);
        }
        
        if (application.secondary_motivation) {
            const motivationItem = document.createElement('div');
            motivationItem.className = 'question-item';
            motivationItem.innerHTML = `
                <div class="question-text">Lý do chọn vị trí dự bị này</div>
                <div class="answer-text">${application.secondary_motivation}</div>
            `;
            secondaryAnswersSection.appendChild(motivationItem);
        }
        
        // Câu hỏi đặc thù của ban
        renderBanSpecificAnswers(application, 'secondary', secondaryAnswersSection);
        
        // Thêm nút hành động riêng cho ban dự bị
        const secondaryActions = document.createElement('div');
        secondaryActions.className = 'action-buttons';
        secondaryActions.innerHTML = `
            <button class="action-button btn-accept" onclick="acceptDepartment('secondary')">
                <i class="fas fa-check"></i> Chấp nhận ban dự bị
            </button>
            <button class="action-button btn-reject" onclick="rejectDepartment('secondary')">
                <i class="fas fa-times"></i> Từ chối ban dự bị
            </button>
        `;
        secondaryAnswersSection.appendChild(secondaryActions);
        
        detailSections.appendChild(secondaryAnswersSection);
    }
    
    // Hiển thị view chi tiết
    document.getElementById('applications-list').style.display = 'none';
    document.getElementById('application-detail').style.display = 'block';
}

// Hàm hiển thị câu trả lời đặc thù của từng ban
function renderBanSpecificAnswers(application, type, container) {
    const banCode = type === 'priority' ? application.priority_position : application.secondary_position;
    
    if (!banCode || banCode === 'None') return;
    
    // Xử lý ban Truyền thông (MD) có tiểu ban
    if (banCode === 'MD') {
        const subDepartments = type === 'priority' ? 
            (application.md_sub_departments || []) : 
            (application.md_sub_departments_secondary || []);
        
        subDepartments.forEach(sub => {
            const questions = banQuestions['MD'][sub] || [];
            
            questions.forEach(q => {
                const questionKey = `${type}_${sub.toLowerCase()}_${q.id}`;
                const answer = application[questionKey] || 'Chưa trả lời';
                
                const questionItem = document.createElement('div');
                questionItem.className = 'question-item';
                
                let questionHTML = `<div class="question-text">${q.question}</div>`;
                
                // Hiển thị media nếu có
                if (q.media) {
                    if (q.media.type === 'image') {
                        questionHTML += `<div class="question-media">
                                            <img src="${q.media.url}" alt="${q.media.alt || ''}">
                                        </div>`;
                    }
                }
                
                questionHTML += `<div class="answer-text">${formatAnswer(answer, q.type)}</div>`;
                
                questionItem.innerHTML = questionHTML;
                container.appendChild(questionItem);
            });
        });
        
        return;
    }
    
    // Xử lý các ban khác
    const questions = banQuestions[banCode] || [];
    
    questions.forEach(q => {
        const questionKey = `${type}_${q.id}`;
        const answer = application[questionKey] || 'Chưa trả lời';
        
        const questionItem = document.createElement('div');
        questionItem.className = 'question-item';
        questionItem.innerHTML = `
            <div class="question-text">${q.question}</div>
            <div class="answer-text">${formatAnswer(answer, q.type)}</div>
        `;
        container.appendChild(questionItem);
    });
}

// Hàm định dạng câu trả lời
function formatAnswer(answer, type) {
    if (Array.isArray(answer)) {
        return answer.join(', ');
    }
    
    return answer;
}

// Ẩn view chi tiết
function hideDetailView() {
    document.getElementById('applications-list').style.display = 'block';
    document.getElementById('application-detail').style.display = 'none';
    currentApplicationId = null;
}

// Chấp nhận từng ban riêng biệt
async function acceptDepartment(departmentType) {
    if (!currentApplicationId) return;
    
    try {
        const application = applications.find(app => app.id === currentApplicationId);
        if (!application) return;
        
        const { value: note } = await Swal.fire({
            title: `Xác nhận chấp nhận ${departmentType === 'priority' ? 'ban ưu tiên' : 'ban dự bị'}`,
            input: 'textarea',
            inputLabel: 'Ghi chú (nếu có)',
            inputPlaceholder: 'Nhập ghi chú về ứng viên...',
            showCancelButton: true,
            confirmButtonText: 'Chấp nhận',
            cancelButtonText: 'Hủy'
        });
        
        if (note !== undefined) {
            // Hiển thị loading
            Swal.fire({
                title: 'Đang cập nhật...',
                text: 'Vui lòng chờ trong giây lát',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            let updateData = {
                updatedAt: new Date()
            };
            
            if (departmentType === 'priority') {
                updateData.priorityAccepted = true;
                updateData.priorityRejected = false;
                updateData.acceptedDepartment = application.priority_position;
                updateData.acceptedDepartmentName = getDepartmentName(application.priority_position);
            } else {
                updateData.secondaryAccepted = true;
                updateData.secondaryRejected = false;
                updateData.acceptedDepartment = application.secondary_position;
                updateData.acceptedDepartmentName = getDepartmentName(application.secondary_position);
            }
            
            // Cập nhật trạng thái tổng nếu cả hai ban đều được chấp nhận
            // Accept
            if (departmentType === 'priority' && (!application.secondary_position || application.secondary_position === 'None')) {
                updateData.status = 'accepted';
            } else if (departmentType === 'secondary' && (!application.priority_position || application.priority_position === 'None')) {
                updateData.status = 'accepted';
            } else if ((updateData.priorityAccepted && application.secondaryAccepted) || 
                    (updateData.secondaryAccepted && application.priorityAccepted)) {
                updateData.status = 'accepted';
            }
            
            // Thêm ghi chú nếu có
            if (note) {
                updateData.note = note;
            }
            
            // Cập nhật trạng thái trong Firestore
            await db.collection('applications').doc(currentApplicationId).update(updateData);
            
            // Cập nhật local data
            const appIndex = applications.findIndex(app => app.id === currentApplicationId);
            if (appIndex !== -1) {
                applications[appIndex] = {
                    ...applications[appIndex],
                    ...updateData
                };
            }
            
            // Ẩn loading và hiển thị thông báo thành công
            Swal.close();
            Swal.fire({
                icon: 'success',
                title: 'Thành công',
                text: `Đã chấp nhận ${departmentType === 'priority' ? 'ban ưu tiên' : 'ban dự bị'}`
            });
            
            // Cập nhật lại giao diện chi tiết
            showApplicationDetail(currentApplicationId);
            
            // Cập nhật lại danh sách
            renderApplications();
        }
    } catch (error) {
        console.error('Error accepting department:', error);
        Swal.fire('Lỗi', 'Có lỗi xảy ra khi chấp nhận: ' + error.message, 'error');
    }
}

// Từ chối từng ban riêng biệt
async function rejectDepartment(departmentType) {
    if (!currentApplicationId) return;
    
    try {
        const application = applications.find(app => app.id === currentApplicationId);
        if (!application) return;
        
        const { value: rejectionReason } = await Swal.fire({
            title: `Xác nhận từ chối ${departmentType === 'priority' ? 'ban ưu tiên' : 'ban dự bị'}`,
            input: 'textarea',
            inputLabel: 'Lý do từ chối',
            inputPlaceholder: 'Nhập lý do từ chối...',
            showCancelButton: true,
            confirmButtonText: 'Từ chối',
            cancelButtonText: 'Hủy',
            inputValidator: (value) => {
                if (!value) {
                    return 'Vui lòng nhập lý do từ chối';
                }
                return null;
            }
        });
        
        if (rejectionReason) {
            // Hiển thị loading
            Swal.fire({
                title: 'Đang cập nhật...',
                text: 'Vui lòng chờ trong giây lát',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            let updateData = {
                updatedAt: new Date(),
                rejectionReason: rejectionReason
            };
            
            if (departmentType === 'priority') {
                updateData.priorityRejected = true;
                updateData.priorityAccepted = false;
            } else {
                updateData.secondaryRejected = true;
                updateData.secondaryAccepted = false;
            }
            
            // Cập nhật trạng thái tổng nếu cả hai ban đều bị từ chối
            // Reject
            if (departmentType === 'priority' && (!application.secondary_position || application.secondary_position === 'None')) {
                updateData.status = 'rejected';
            } else if (departmentType === 'secondary' && (!application.priority_position || application.priority_position === 'None')) {
                updateData.status = 'rejected';
            } else if ((updateData.priorityRejected && application.secondaryRejected) || 
                    (updateData.secondaryRejected && application.priorityRejected)) {
                updateData.status = 'rejected';
            }

            
            // Cập nhật trạng thái trong Firestore
            await db.collection('applications').doc(currentApplicationId).update(updateData);
            
            // Cập nhật local data
            const appIndex = applications.findIndex(app => app.id === currentApplicationId);
            if (appIndex !== -1) {
                applications[appIndex] = {
                    ...applications[appIndex],
                    ...updateData
                };
            }
            
            // Ẩn loading và hiển thị thông báo thành công
            Swal.close();
            Swal.fire({
                icon: 'success',
                title: 'Thành công',
                text: `Đã từ chối ${departmentType === 'priority' ? 'ban ưu tiên' : 'ban dự bị'}`
            });
            
            // Cập nhật lại giao diện chi tiết
            showApplicationDetail(currentApplicationId);
            
            // Cập nhật lại danh sách
            renderApplications();
        }
    } catch (error) {
        console.error('Error rejecting department:', error);
        Swal.fire('Lỗi', 'Có lỗi xảy ra khi từ chối: ' + error.message, 'error');
    }
}

// Lấy tên ban từ mã
function getDepartmentName(code) {
    const departments = {
        'MD': 'Truyền thông',
        'HR': 'Nhân sự',
        'ER': 'Đối ngoại',
        'PD': 'Nội dung'
    };
    
    return departments[code] || code;
}

// Hiển thị modal export
function showExportOptions() {
    document.getElementById('export-modal').style.display = 'block';
}

// Đóng modal export
function closeExportModal() {
    document.getElementById('export-modal').style.display = 'none';
    document.getElementById('department-filter').style.display = 'none';
}

// Xử lý export dữ liệu
function exportData(type) {
    switch(type) {
        case 'all':
            exportAllData();
            break;
        case 'personal':
            exportPersonalInfo();
            break;
        case 'results':
            exportResults();
            break;
        case 'byDepartment':
            // Hiển thị lựa chọn ban
            document.getElementById('department-filter').style.display = 'block';
            break;
        case 'byCandidate':
            exportByCandidate();
            break;
        case 'personalWithResults':
            exportPersonalWithResults();
            break;
    }
}

// Xuất toàn bộ dữ liệu
function exportAllData() {
    const csvContent = convertToCSV(applications, true, true);
    downloadCSV(csvContent, 'enactus_ung_vien_toan_bo.csv');
    closeExportModal();
}

// Xuất thông tin cá nhân
function exportPersonalInfo() {
    const personalData = applications.map(app => ({
        'Họ và tên': app.fullname,
        'Email': app.email,
        'Số điện thoại': app.phone,
        'Facebook': app.facebook,
        'Ngày/tháng/năm sinh': app.birthdate || '',
        'Giới tính': app.gender || '',
        'Trường': app.school || '',
        'Chuyên ngành': app.major || '',
        'Mã sinh viên': app.student_id || '',
        'Năm học': app.school_year || '',
        'Ban ưu tiên': getDepartmentName(app.priority_position),
        'Ban dự bị': app.secondary_position ? getDepartmentName(app.secondary_position) : 'Không có',
        'Thời gian dành cho Enactus': app.availability,
        'Ngày ứng tuyển': app.timestamp ? app.timestamp.toDate().toLocaleDateString('vi-VN') : ''
    }));
    
    const csvContent = convertToCSV(personalData, false, false);
    downloadCSV(csvContent, 'enactus_thong_tin_ca_nhan.csv');
    closeExportModal();
}

// Xuất kết quả ứng tuyển
function exportResults() {
    const resultsData = applications.map(app => ({
        'Họ và tên': app.fullname,
        'Email': app.email,
        'Ban ưu tiên': getDepartmentName(app.priority_position),
        'Ban dự bị': app.secondary_position ? getDepartmentName(app.secondary_position) : 'Không có',
        'Trạng thái': getStatusInfo(app.status || 'new').text,
        'Trạng thái ban ưu tiên': app.priorityAccepted ? 'Chấp nhận' : (app.priorityRejected ? 'Từ chối' : 'Chưa đánh giá'),
        'Trạng thái ban dự bị': app.secondaryAccepted ? 'Chấp nhận' : (app.secondaryRejected ? 'Từ chối' : 'Chưa đánh giá'),
        'Ban được chấp nhận': app.acceptedDepartment ? getDepartmentName(app.acceptedDepartment) : '',
        'Ghi chú': app.note || '',
        'Lý do từ chối': app.rejectionReason || ''
    }));
    
    const csvContent = convertToCSV(resultsData, false, false);
    downloadCSV(csvContent, 'enactus_ket_qua_ung_tuyen.csv');
    closeExportModal();
}

// Xuất theo ứng viên
function exportByCandidate() {
    if (!currentApplicationId) {
        Swal.fire('Thông báo', 'Vui lòng chọn một ứng viên để xuất dữ liệu', 'info');
        closeExportModal();
        return;
    }
    
    const application = applications.find(app => app.id === currentApplicationId);
    if (!application) return;
    
    const candidateData = prepareCandidateData(application);
    const csvContent = convertToCSV([candidateData], false, true);
    downloadCSV(csvContent, `enactus_ung_vien_${application.fullname.replace(/\s+/g, '_')}.csv`);
    closeExportModal();
}

// Xuất thông tin cá nhân + kết quả
function exportPersonalWithResults() {
    const combinedData = applications.map(app => ({
        'Họ và tên': app.fullname,
        'Email': app.email,
        'Số điện thoại': app.phone,
        'Facebook': app.facebook,
        'Ngày sinh': app.birthdate || '',
        'Giới tính': app.gender || '',
        'Trường': app.school || '',
        'Chuyên ngành': app.major || '',
        'Mã sinh viên': app.student_id || '',
        'Năm học': app.school_year || '',
        'Ban ưu tiên': getDepartmentName(app.priority_position),
        'Ban dự bị': app.secondary_position ? getDepartmentName(app.secondary_position) : 'Không có',
        'Thời gian dành cho Enactus': app.availability,
        'Trạng thái': getStatusInfo(app.status || 'new').text,
        'Trạng thái ban ưu tiên': app.priorityAccepted ? 'Chấp nhận' : (app.priorityRejected ? 'Từ chối' : 'Chưa đánh giá'),
        'Trạng thái ban dự bị': app.secondaryAccepted ? 'Chấp nhận' : (app.secondaryRejected ? 'Từ chối' : 'Chưa đánh giá'),
        'Ban được chấp nhận': app.acceptedDepartment ? getDepartmentName(app.acceptedDepartment) : '',
        'Ghi chú': app.note || '',
        'Lý do từ chối': app.rejectionReason || '',
        'Ngày ứng tuyển': app.timestamp ? app.timestamp.toDate().toLocaleDateString('vi-VN') : ''
    }));
    
    const csvContent = convertToCSV(combinedData, false, false);
    downloadCSV(csvContent, 'enactus_thong_tin_va_ket_qua.csv');
    closeExportModal();
}

// Chuẩn bị dữ liệu ứng viên cho export
function prepareCandidateData(application) {
    const data = {
        'Họ và tên': application.fullname,
        'Email': application.email,
        'Số điện thoại': application.phone,
        'Facebook': application.facebook,
        'Ngày sinh': application.birthdate || '',
        'Giới tính': application.gender || '',
        'Trường': application.school || '',
        'Chuyên ngành': application.major || '',
        'Mã sinh viên': application.student_id || '',
        'Năm học': application.school_year || '',
        'Hình thức ứng tuyển': application.application_type === 'form' ? 'Điền đơn' : 'Phỏng vấn',
        'Ban ưu tiên': getDepartmentName(application.priority_position),
        'Ban dự bị': application.secondary_position ? getDepartmentName(application.secondary_position) : 'Không có',
        'Thời gian dành cho Enactus': application.availability,
        'Trạng thái': getStatusInfo(application.status || 'new').text,
        'Trạng thái ban ưu tiên': application.priorityAccepted ? 'Chấp nhận' : (application.priorityRejected ? 'Từ chối' : 'Chưa đánh giá'),
        'Trạng thái ban dự bị': application.secondaryAccepted ? 'Chấp nhận' : (application.secondaryRejected ? 'Từ chối' : 'Chưa đánh giá'),
        'Ban được chấp nhận': application.acceptedDepartment ? getDepartmentName(application.acceptedDepartment) : '',
        'Ghi chú': application.note || '',
        'Lý do từ chối': application.rejectionReason || '',
        'Ngày ứng tuyển': application.timestamp ? application.timestamp.toDate().toLocaleDateString('vi-VN') : ''
    };
    
    // Thêm câu trả lời chung
    generalQuestions.forEach((q, index) => {
        data[`Câu hỏi chung ${index + 1}`] = application[`general_${q.id}`] || 'Chưa trả lời';
    });
    
    // Thêm câu trả lời ban ưu tiên
    if (application.priority_position) {
        data['Kinh nghiệm ban ưu tiên'] = application.priority_experience || '';
        data['Động lực ban ưu tiên'] = application.priority_motivation || '';
        
        // Thêm câu hỏi đặc thù ban ưu tiên
        if (application.priority_position === 'MD') {
            // Xử lý ban Truyền thông có tiểu ban
            const subDepartments = application.md_sub_departments || [];
            subDepartments.forEach(sub => {
                const questions = banQuestions['MD'][sub] || [];
                questions.forEach(q => {
                    const questionKey = `priority_${sub.toLowerCase()}_${q.id}`;
                    data[`${sub} - ${q.question}`] = application[questionKey] || 'Chưa trả lời';
                });
            });
        } else {
            // Xử lý các ban khác
            const questions = banQuestions[application.priority_position] || [];
            questions.forEach((q, index) => {
                const questionKey = `priority_${q.id}`;
                data[`Ban ưu tiên - Câu hỏi ${index + 1}`] = application[questionKey] || 'Chưa trả lời';
            });
        }
    }
    
    // Thêm câu trả lời ban dự bị
    if (application.secondary_position && application.secondary_position !== 'None') {
        data['Kinh nghiệm ban dự bị'] = application.secondary_experience || '';
        data['Động lực ban dự bị'] = application.secondary_motivation || '';
        
        // Thêm câu hỏi đặc thù ban dự bị
        if (application.secondary_position === 'MD') {
            // Xử lý ban Truyền thông có tiểu ban
            const subDepartments = application.md_sub_departments_secondary || [];
            subDepartments.forEach(sub => {
                const questions = banQuestions['MD'][sub] || [];
                questions.forEach(q => {
                    const questionKey = `secondary_${sub.toLowerCase()}_${q.id}`;
                    data[`${sub} (dự bị) - ${q.question}`] = application[questionKey] || 'Chưa trả lời';
                });
            });
        } else {
            // Xử lý các ban khác
            const questions = banQuestions[application.secondary_position] || [];
            questions.forEach((q, index) => {
                const questionKey = `secondary_${q.id}`;
                data[`Ban dự bị - Câu hỏi ${index + 1}`] = application[questionKey] || 'Chưa trả lời';
            });
        }
    }
    
    return data;
}

// Chuyển đổi dữ liệu sang CSV
function convertToCSV(data, includeAllData, includeAnswers) {
    if (data.length === 0) return '';
    
    const items = data;
    const delimiter = ',';
    const enclosure = '"';
    
    // Lấy tất cả các key có trong dữ liệu
    let keys = [];
    if (includeAllData) {
        // Với dữ liệu đầy đủ, lấy tất cả các key có trong bất kỳ object nào
        items.forEach(item => {
            for (let key in item) {
                if (!keys.includes(key)) {
                    keys.push(key);
                }
            }
        });
    } else {
        // Chỉ lấy các key từ item đầu tiên
        keys = Object.keys(items[0]);
    }
    
    // Tạo header
    let csv = keys.map(key => `${enclosure}${escapeCSV(key)}${enclosure}`).join(delimiter) + '\n';
    
    // Thêm dữ liệu
    items.forEach(item => {
        const row = keys.map(key => {
            let value = item[key] !== undefined ? item[key] : '';
            if (typeof value === 'string') {
                value = escapeCSV(value);
            }
            return `${enclosure}${value}${enclosure}`;
        });
        csv += row.join(delimiter) + '\n';
    });
    
    return csv;
}

// Escape giá trị CSV
function escapeCSV(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/"/g, '""');
}

// Tải file CSV
function downloadCSV(csvContent, fileName) {
    // Thêm BOM để hỗ trợ UTF-8
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Xử lý export theo ban
document.getElementById('export-department').addEventListener('change', function() {
    const department = this.value;
    const departmentData = applications.filter(app => 
        app.priority_position === department || app.secondary_position === department
    );
    
    if (departmentData.length === 0) {
        Swal.fire('Thông báo', `Không có ứng viên nào trong ban ${getDepartmentName(department)}`, 'info');
        return;
    }
    
    const csvContent = convertToCSV(departmentData, true, true);
    downloadCSV(csvContent, `enactus_ban_${getDepartmentName(department).replace(/\s+/g, '_')}.csv`);
    closeExportModal();
});

// Đóng modal khi click bên ngoài
window.onclick = function(event) {
    const modal = document.getElementById('export-modal');
    if (event.target === modal) {
        closeExportModal();
    }
};

// Lắng nghe sự kiện thay đổi bộ lọc
document.getElementById('filter-department').addEventListener('change', renderApplications);
document.getElementById('filter-status').addEventListener('change', renderApplications);
document.getElementById('filter-type').addEventListener('change', renderApplications);
document.getElementById('search-input').addEventListener('input', renderApplications);

// Tải ứng viên khi trang được tải
window.addEventListener('load', loadApplications);