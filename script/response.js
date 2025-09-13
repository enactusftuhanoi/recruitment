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

// ==== Global State ====
const userEmail = sessionStorage.getItem("email");
let userRole = sessionStorage.getItem("role") || null;
let userDept = sessionStorage.getItem("department") || null;

let applications = [];
let currentApplicationId = null;

if (!userEmail || !userRole) {
  window.location.href = "login.html";
}


// CHÚ Ý: không gọi loadApplications trực tiếp khi load trang.
// Thay vào đó, lắng nghe auth state để đảm bảo chỉ load khi user đã đăng nhập.
auth.onAuthStateChanged(async (user) => {
  if (user) {
    try {
      const snap = await db.collection('account')
                           .where('email', '==', user.email)
                           .limit(1)
                           .get();

      if (!snap.empty) {
        const doc = snap.docs[0];
        const data = doc.data();

        userRole = data.role || userRole;
        userDept = data.department || userDept;

        // 👉 Lấy fullname từ document ID
        window.currentUserFullname = doc.id;  

        // Lưu session
        sessionStorage.setItem("role", userRole);
        sessionStorage.setItem("department", userDept);

        // 👉 Gọi 2 hàm sau khi đã xác định role và fullname
        applyRoleUIRules();
        renderUserInfoBox(window.currentUserFullname);

        // 👉 Gắn listener export sau khi UI đã sẵn sàng
        attachExportDepartmentListener();


      } else {
        // account không tồn tại
        await auth.signOut();
        window.location.href = 'login.html';
        return;
      }
    } catch (e) {
      console.error('Lỗi khi lấy account:', e);
    }

    loadApplications();
  } else {
    window.location.href = 'login.html';
  }
});


function renderUserInfoBox(fullname) {
  const box = document.getElementById('user-info-box');
  if (!box) return;

  const email = sessionStorage.getItem("email") || "";
  const role = (sessionStorage.getItem("role") || "").toLowerCase();
  const dept = sessionStorage.getItem("department") || "";

  const name = fullname || email.split("@")[0];

  let roleDisplay = "";
  if (role === "superadmin") {
    roleDisplay = `<i class="fa-solid fa-crown" style="color:#f1c40f; margin-right:6px;"></i>Super Admin`;
  } else if (role === "admin") {
    roleDisplay = `Admin${dept ? " | " + dept : ""}`;
  } else if (role === "member") {
    roleDisplay = `Member${dept ? " | " + dept : ""}`;
  }

  const adminBadge =
    role === "superadmin"
      ? `<a href="accounts.html" class="icon-badge" title="Quản trị">
           <i class="fa-solid fa-shield-halved"></i>
         </a>`
      : `<div class="icon-badge">
           <i class="fa-solid fa-users" title="Thành viên"></i>
         </div>`;

  box.innerHTML = `
    <div class="user-info-header">
      <div class="name">${name}</div>
      ${adminBadge}
    </div>
    <div class="email">${email}</div>
    <div class="user-info-footer">
      <div class="role ${role}">${roleDisplay}</div>
      <div class="logout-badge" id="logout-btn" title="Đăng xuất">
        <i class="fa-solid fa-right-from-bracket"></i>
      </div>
    </div>
  `;
}


function canActOnDepartment(application, departmentType) {
  if (!application) return false;
  if (userRole === 'superadmin') return true;
  if (userRole === 'admin') {
    const deptCode = departmentType === 'priority' ? application.priority_position : application.secondary_position;
    return deptCode === userDept;
  }
  return false;
}

function applyRoleUIRules() {
  // --- Nút export ---
  const exportAllBtn = document.getElementById('export-all-btn');
  const exportByCandidateBtn = document.getElementById('export-by-candidate-btn');
  const exportDeptSelect = document.getElementById('export-department');

  if (userRole === 'superadmin') {
    if (exportAllBtn) exportAllBtn.style.display = 'inline-block';
    if (exportByCandidateBtn) exportByCandidateBtn.style.display = 'inline-block';
    if (exportDeptSelect) exportDeptSelect.disabled = false;
  } else if (userRole === 'admin') {
    if (exportAllBtn) exportAllBtn.style.display = 'none';
    if (exportByCandidateBtn) exportByCandidateBtn.style.display = 'inline-block';
    if (exportDeptSelect) {
      exportDeptSelect.disabled = false;
      Array.from(exportDeptSelect.options).forEach(opt => {
        opt.disabled = opt.value !== userDept;
      });
      exportDeptSelect.value = userDept;
    }
  } else { // member
    if (exportAllBtn) exportAllBtn.style.display = 'none';
    if (exportByCandidateBtn) exportByCandidateBtn.style.display = 'none';
    if (exportDeptSelect) exportDeptSelect.disabled = true;
  }

  // --- Menu khác (nếu có) ---
  const systemMenu = document.getElementById('system-settings-menu');
  if (systemMenu) {
    systemMenu.style.display = (userRole === 'superadmin') ? 'block' : 'none';
  }

  // --- Các nút hành động khác ---
  if (userRole === 'member') {
    document.querySelectorAll('.action-button, .export-btn, .mark-reviewed-btn, .export-option-btn')
            .forEach(e => e.style.display = 'none');
  } else if (userRole === 'superadmin') {
    document.querySelectorAll('.export-option-btn, .export-btn, .action-button, .mark-reviewed-btn')
            .forEach(e => e.style.display = 'inline-block');
  }
}


// Hàm tải danh sách ứng viên
async function loadApplications() {
  try {
    let snapshot;

    if (userRole === 'superadmin') {
      snapshot = await db.collection('applications')
                         .orderBy('timestamp', 'desc')
                         .get();
    } else if (userRole === 'admin' || userRole === 'member') {
      // Admin + Member chỉ xem ứng viên thuộc ban của mình
      try {
        snapshot = await db.collection('applications')
                           .where('all_departments', 'array-contains', userDept)
                           .orderBy('timestamp', 'desc')
                           .get();
      } catch (err) {
        console.warn('Không query được bằng all_departments, fallback filter client-side', err);
        const allSnap = await db.collection('applications').orderBy('timestamp','desc').get();
        // Fallback: filter theo ban client-side
        applications = [];
        allSnap.forEach(doc => {
          const data = doc.data();
          if (data.priority_position === userDept || data.secondary_position === userDept) {
            applications.push({ id: doc.id, status: data.status || 'new', ...data });
          }
        });
        renderApplications();
        return;
      }
    }

    applications = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      applications.push({
        id: doc.id,
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

        const overallStatus = computeOverallStatus(app);
        const statusInfo = getStatusInfo(overallStatus);

        
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
    if (!application) return;

    // Chỉ superadmin hoặc admin của ít nhất 1 ban của ứng viên mới mark reviewed
    const canMark = (userRole === 'superadmin') ||
                    (userRole === 'admin' && (
                        application.priority_position === userDept ||
                        application.secondary_position === userDept
                    ));
    if (!canMark) {
        Swal.fire('Không có quyền', 'Bạn không có quyền đánh dấu ứng viên này là đã xem.', 'error');
        return;
    }

    // chỉ mark khi status là 'new'
    if (application.status !== 'new') return;

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

function canActOnDepartment(application, departmentType) {
    if (!application) return false;
    // Super admin: làm gì cũng được
    if (userRole === 'superadmin') return true;
    // Admin: chỉ nếu ban ứng viên trùng với ban admin
    if (userRole === 'admin') {
        const deptCode = departmentType === 'priority' ? application.priority_position : application.secondary_position;
        return deptCode === userDept;
    }
    // Member: không có quyền hành động
    return false;
}

// Hàm hiển thị chi tiết ứng viên
function showApplicationDetail(appId) {
    const application = applications.find(app => app.id === appId);
    if (!application) return;

    currentApplicationId = appId;

    document.getElementById('detail-applicant-name').textContent = application.fullname || 'Ứng viên';

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
                    <span class="status-indicator ${getStatusInfo(computeOverallStatus(application)).class}">
                        ${getStatusInfo(computeOverallStatus(application)).text}
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
    let acceptedText = getAcceptedDepartments(application) || 'Không có';

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
    
      // --- Câu trả lời theo ban ưu tiên ---
    if (application.priority_position) {
        const priorityAnswersSection = document.createElement('div');
        priorityAnswersSection.className = 'detail-section';

        let priorityTitle = `<h3><i class="fas fa-star"></i> Câu trả lời cho ${getDepartmentName(application.priority_position)} (Ưu tiên)</h3>`;
        if (application.priorityRejected) {
        priorityTitle = `<h3><i class="fas fa-star" style="color: var(--error);"></i> Câu trả lời cho ${getDepartmentName(application.priority_position)} (Ưu tiên - Đã từ chối)</h3>`;
        } else if (application.acceptedDepartment === application.priority_position) {
        priorityTitle = `<h3><i class="fas fa-star" style="color: var(--success);"></i> Câu trả lời cho ${getDepartmentName(application.priority_position)} (Ưu tiên - Đã chấp nhận)</h3>`;
        }
        priorityAnswersSection.innerHTML = priorityTitle;

        renderBanSpecificAnswers(application, 'priority', priorityAnswersSection);

        // 👉 chỉ thêm nút nếu có quyền
        if (canActOnDepartment(application, 'priority')) {
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
        }

        detailSections.appendChild(priorityAnswersSection);
    }

    // --- Câu trả lời theo ban dự bị ---
    if (application.secondary_position && application.secondary_position !== 'None') {
        const secondaryAnswersSection = document.createElement('div');
        secondaryAnswersSection.className = 'detail-section';

        let secondaryTitle = `<h3><i class="fas fa-clock"></i> Câu trả lời cho ${getDepartmentName(application.secondary_position)} (Dự bị)</h3>`;
        if (application.acceptedDepartment === application.secondary_position) {
        secondaryTitle = `<h3><i class="fas fa-clock" style="color: var(--success);"></i> Câu trả lời cho ${getDepartmentName(application.secondary_position)} (Dự bị - Đã chấp nhận)</h3>`;
        } else if (application.secondaryRejected) {
        secondaryTitle = `<h3><i class="fas fa-clock" style="color: var(--error);"></i> Câu trả lời cho ${getDepartmentName(application.secondary_position)} (Dự bị - Đã từ chối)</h3>`;
        }
        secondaryAnswersSection.innerHTML = secondaryTitle;

        renderBanSpecificAnswers(application, 'secondary', secondaryAnswersSection);

        // 👉 chỉ thêm nút nếu có quyền
        if (canActOnDepartment(application, 'secondary')) {
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
        }

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

    if (banCode === 'MD') {
        const subDepartments = type === 'priority'
            ? (application.md_sub_departments || [])
            : (application.md_sub_departments_secondary || []);
        
        subDepartments.forEach(sub => {
            const questions = banQuestions['MD'][sub] || [];
            questions.forEach(q => {
                const answer = getAnswer(application, type, q.id, sub) || 'Chưa trả lời';
                const questionItem = document.createElement('div');
                questionItem.className = 'question-item';
                let html = `<div class="question-text">${q.question}</div>`;
                if (q.media && q.media.type === 'image') {
                    html += `<div class="question-media"><img src="${q.media.url}" alt="${q.media.alt || ''}"></div>`;
                }
                html += `<div class="answer-text">${formatAnswer(answer, q.type)}</div>`;
                questionItem.innerHTML = html;
                container.appendChild(questionItem);
            });
        });
        return;
    }

    const questions = banQuestions[banCode] || [];
    questions.forEach(q => {
        const answer = getAnswer(application, type, q.id) || 'Chưa trả lời';
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
// Chấp nhận từng ban riêng biệt
async function acceptDepartment(departmentType) {
  if (!currentApplicationId) return;

  const application = applications.find(app => app.id === currentApplicationId);
  if (!application) return;

  // 👉 Check quyền
  if (!canActOnDepartment(application, departmentType)) {
    Swal.fire('Không có quyền', 'Bạn không có quyền chấp nhận ứng viên cho ban này.', 'error');
    return;
  }

  const confirmResult = await Swal.fire({
    title: 'Xác nhận',
    text: `Bạn có chắc chắn muốn CHẤP NHẬN ứng viên này cho ban ${departmentType === 'priority' ? 'ưu tiên' : 'dự bị'}?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Có, chấp nhận',
    cancelButtonText: 'Hủy'
  });

  if (!confirmResult.isConfirmed) return;

  try {
    const updateData = {};
    if (departmentType === 'priority') {
      updateData.priorityAccepted = true;
      updateData.priorityRejected = false;
    } else {
      updateData.secondaryAccepted = true;
      updateData.secondaryRejected = false;
    }

    await db.collection('applications').doc(currentApplicationId).update(updateData);

    Swal.fire('Thành công', 'Ứng viên đã được CHẤP NHẬN.', 'success');

    // 👉 Load lại danh sách và sau đó mở lại detail
    await loadApplications();
    showApplicationDetail(currentApplicationId);

  } catch (err) {
    console.error(err);
    Swal.fire('Lỗi', 'Không thể cập nhật trạng thái: ' + err.message, 'error');
  }
}

// Từ chối từng ban riêng biệt
async function rejectDepartment(departmentType) {
  if (!currentApplicationId) return;

  const application = applications.find(app => app.id === currentApplicationId);
  if (!application) return;

  // 👉 Check quyền
  if (!canActOnDepartment(application, departmentType)) {
    Swal.fire('Không có quyền', 'Bạn không có quyền từ chối ứng viên cho ban này.', 'error');
    return;
  }

  const { value: reason } = await Swal.fire({
    title: 'Nhập lý do từ chối',
    input: 'text',
    inputPlaceholder: 'Ví dụ: Không phù hợp với ban',
    showCancelButton: true,
    confirmButtonText: 'Từ chối',
    cancelButtonText: 'Hủy'
  });

  const updateData = { rejectionReason: reason || 'Không có' };


  try {
    const updateData = { rejectionReason: reason };
    if (departmentType === 'priority') {
      updateData.priorityRejected = true;
      updateData.priorityAccepted = false;
    } else {
      updateData.secondaryRejected = true;
      updateData.secondaryAccepted = false;
    }

    await db.collection('applications').doc(currentApplicationId).update(updateData);

    Swal.fire('Thành công', 'Ứng viên đã bị TỪ CHỐI.', 'success');

    // 👉 Load lại danh sách và sau đó mở lại detail
    await loadApplications();
    showApplicationDetail(currentApplicationId);

  } catch (err) {
    console.error(err);
    Swal.fire('Lỗi', 'Không thể cập nhật trạng thái: ' + err.message, 'error');
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

function computeOverallStatus(app) {
    if (app.priorityAccepted || app.secondaryAccepted) return 'accepted';
    if ((app.priorityRejected && (!app.secondary_position || app.secondaryRejected)) ||
        (app.secondaryRejected && (!app.priority_position || app.priorityRejected))) {
        return 'rejected';
    }
    if (app.priorityRejected || app.secondaryRejected) return 'reviewed';
    return 'new';
}


// Hiển thị modal export
// Hiển thị modal export
function showExportOptions() {
  const exportDeptSelect = document.getElementById('export-department');
  if (exportDeptSelect) {
    if (userRole === 'admin') {
      exportDeptSelect.value = userDept;   // 👉 admin mặc định ban của mình
    } else if (userRole === 'superadmin') {
      if (!exportDeptSelect.value && exportDeptSelect.options.length > 0) {
        exportDeptSelect.selectedIndex = 0; // 👉 superadmin mặc định option đầu
      }
    }
  }

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
            if (userRole === 'admin') {
                // tự động export ban của admin
                document.getElementById('export-department').value = userDept;
                document.getElementById('export-department')
                        .dispatchEvent(new Event('change'));
            } else {
                // superadmin thì cho chọn
                document.getElementById('department-filter').style.display = 'block';
            }
            break;
        case 'byCandidate':
            exportByCandidate();
            break;
        case 'personalWithResults':
            exportPersonalWithResults();
            break;
    }
}

// Định dạng giá trị ngày (timestamp hoặc string) thành dd/MM/yyyy
function formatDateValue(val) {
    if (!val) return '';
    try {
        let d;
        if (val.toDate) {
            d = val.toDate(); // Firestore Timestamp
        } else if (val instanceof Date) {
            d = val;
        } else {
            d = new Date(val);
        }
        if (isNaN(d.getTime())) return val; // nếu parse fail thì trả lại raw
        return d.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        console.error('formatDateValue error', e, val);
        return val;
    }
}

/* --------------------- START: Unified answer/export block --------------------- */

/**
 * getAnswer: tìm câu trả lời với nhiều fallback pattern
 * prefix: 'general' | 'priority' | 'secondary'
 * qid: id từ questions.js (ví dụ 'platforms', 'content_level', ...)
 * sub: (tùy) sub-department, ví dụ 'Content' cho MD
 */
function getAnswer(app, prefix, qid, sub) {
    if (!app || !prefix || !qid) return undefined;
    const candidates = [];

    // primary pattern: prefix_qid
    candidates.push(`${prefix}_${qid}`);

    // if sub provided, try prefix_sub_qid and variations
    if (sub) {
        const subLower = String(sub).toLowerCase();
        candidates.push(`${prefix}_${subLower}_${qid}`); // e.g. priority_content_platforms
        if (qid.startsWith(subLower + '_')) {
            candidates.push(`${prefix}_${qid.replace(subLower + '_','')}`);
        }
    }

    // try direct candidates
    for (const c of candidates) {
        if (Object.prototype.hasOwnProperty.call(app, c)) return app[c];
    }

    // fallback: scan keys that start with prefix_ and match tokens of qid
    const qidParts = qid.split('_').filter(Boolean).map(s => s.toLowerCase());
    const keys = Object.keys(app || {});
    for (const k of keys) {
        const low = k.toLowerCase();
        if (!low.startsWith(prefix + '_')) continue;
        let matched = true;
        for (const part of qidParts) {
            if (!low.includes(part)) { matched = false; break; }
        }
        if (matched) return app[k];
    }

    return undefined;
}

/* Summary-only object for "Tổng hợp" sheet (only basic info) */
function normalizeApplicationForSummary(app, index = 0) {
    return {
        'STT': index + 1,
        'Họ và tên': app.fullname ?? '',
        'Email': app.email ?? '',
        'Số điện thoại': app.phone ? `'${app.phone}` : '',
        'Facebook': app.facebook ?? '',
        'Ngày sinh': app.birthdate ? `'${formatDateValue(app.birthdate)}` : '',
        'Giới tính': app.gender ?? '',
        'Trường': app.school ?? '',
        'Chuyên ngành': app.major ?? '',
        'Mã sinh viên': app.student_id ?? '',
        'Năm học': app.school_year ?? '',
        'Hình thức ứng tuyển': app.application_type === 'form' ? 'Điền đơn' : 'Phỏng vấn',
        'Ban ưu tiên': getDepartmentName(app.priority_position),
        'Ban dự bị': app.secondary_position && app.secondary_position !== 'None' ? getDepartmentName(app.secondary_position) : 'Không có',
        'Thời gian dành cho Enactus': app.availability ?? '',
        'Trạng thái': getStatusInfo(computeOverallStatus(app)).text,
        'Ban được chấp nhận': getAcceptedDepartments(app),
        'Ghi chú': app.note ?? '',
        'Lý do từ chối': app.rejectionReason ?? '',
        'Ngày ứng tuyển': app.timestamp ? `'${formatDateValue(app.timestamp)}` : ''
    };
}

/* Full normalize: summary + general questions + priority + secondary */
function normalizeApplicationForExport(app, index = 0) {
    const data = normalizeApplicationForSummary(app, index);

    // general questions
    if (typeof generalQuestions !== 'undefined' && Array.isArray(generalQuestions)) {
        generalQuestions.forEach((q, i) => {
            const val = getAnswer(app, 'general', q.id);
            data[`Câu hỏi chung ${i + 1} - ${q.question}`] = Array.isArray(val) ? val.join('; ') : (val ?? '');
        });
    }

    // priority-specific:
    if (app.priority_position) {
        const code = app.priority_position;
        if (code === 'MD') {
            const subs = app.md_sub_departments || [];
            subs.forEach(sub => {
                const qList = (banQuestions['MD'] && banQuestions['MD'][sub]) || [];
                qList.forEach(q => {
                    const val = getAnswer(app, 'priority', q.id, sub);
                    data[`Ưu tiên ${sub} - ${q.question}`] = Array.isArray(val) ? val.join('; ') : (val ?? '');
                });
            });
        } else {
            const qList = banQuestions[code] || [];
            qList.forEach(q => {
                const val = getAnswer(app, 'priority', q.id);
                data[`Ưu tiên - ${q.question}`] = Array.isArray(val) ? val.join('; ') : (val ?? '');
            });
        }
    }

    // secondary-specific:
    if (app.secondary_position && app.secondary_position !== 'None') {
        const code = app.secondary_position;
        if (code === 'MD') {
            const subs = app.md_sub_departments_secondary || [];
            subs.forEach(sub => {
                const qList = (banQuestions['MD'] && banQuestions['MD'][sub]) || [];
                qList.forEach(q => {
                    const val = getAnswer(app, 'secondary', q.id, sub);
                    data[`Dự bị ${sub} - ${q.question}`] = Array.isArray(val) ? val.join('; ') : (val ?? '');
                });
            });
        } else {
            const qList = banQuestions[code] || [];
            qList.forEach(q => {
                const val = getAnswer(app, 'secondary', q.id);
                data[`Dự bị - ${q.question}`] = Array.isArray(val) ? val.join('; ') : (val ?? '');
            });
        }
    }

    return data;
}

/* Format answer for UI */
function formatAnswer(answer, type) {
    if (answer === undefined || answer === null) return '';
    if (Array.isArray(answer)) return answer.join('; ');
    if (typeof answer === 'object') {
        try { return JSON.stringify(answer); } catch (e) { return String(answer); }
    }
    return String(answer);
}

/* Render ban-specific answers in detail view using getAnswer */
function renderBanSpecificAnswers(application, type, container) {
    const banCode = type === 'priority' ? application.priority_position : application.secondary_position;
    if (!banCode || banCode === 'None') return;

    if (banCode === 'MD') {
        const subs = type === 'priority' ? (application.md_sub_departments || []) : (application.md_sub_departments_secondary || []);
        subs.forEach(sub => {
            const qList = (banQuestions['MD'] && banQuestions['MD'][sub]) || [];
            qList.forEach(q => {
                const val = getAnswer(application, type, q.id, sub);
                const answer = val === undefined || val === null ? 'Chưa trả lời' : formatAnswer(val, q.type);
                const item = document.createElement('div');
                item.className = 'question-item';
                let html = `<div class="question-text">${q.question}</div>`;
                if (q.media && q.media.type === 'image') html += `<div class="question-media"><img src="${q.media.url}" alt="${q.media.alt || ''}"></div>`;
                html += `<div class="answer-text">${answer}</div>`;
                item.innerHTML = html;
                container.appendChild(item);
            });
        });
        return;
    }

    const qList = banQuestions[banCode] || [];
    qList.forEach(q => {
        const val = getAnswer(application, type, q.id);
        const answer = val === undefined || val === null ? 'Chưa trả lời' : formatAnswer(val, q.type);
        const item = document.createElement('div');
        item.className = 'question-item';
        item.innerHTML = `<div class="question-text">${q.question}</div><div class="answer-text">${answer}</div>`;
        container.appendChild(item);
    });
}

/* Helpers: header union */
function getHeadersFromData(arr) {
    const set = new Set();
    arr.forEach(obj => Object.keys(obj || {}).forEach(k => set.add(k)));
    return Array.from(set);
}

/* Vertical & Horizontal sheet builders (use union headers for consistency) */
function buildVerticalSheet(apps) {
    if (!apps || apps.length === 0) return XLSX.utils.aoa_to_sheet([[]]);
    const headers = getHeadersFromData(apps);
    return XLSX.utils.json_to_sheet(apps, { header: headers });
}

function buildHorizontalSheet(apps) {
    if (!apps || apps.length === 0) return XLSX.utils.aoa_to_sheet([[]]);
    const headers = getHeadersFromData(apps);
    const rows = headers.map(field => {
        const row = { 'Trường': field };
        apps.forEach((app, i) => { row[`Ứng viên ${i + 1}`] = app[field] ?? ''; });
        return row;
    });
    const headerRow = ['Trường', ...apps.map((_, i) => `Ứng viên ${i + 1}`)];
    return XLSX.utils.json_to_sheet(rows, { header: headerRow });
}

/* Main exporter: prompt for layout, create 'Tổng hợp' + per-department sheets (app may appear in both) */
async function exportDataWithLayout(filename, apps, includeByDepartment = false, splitPrioritySecondary = false) {
    if (!apps || apps.length === 0) {
        Swal.fire('Thông báo', 'Không có dữ liệu để xuất', 'info');
        return;
    }

    const { value: mode } = await Swal.fire({
        title: 'Chọn kiểu xuất dữ liệu',
        input: 'radio',
        inputOptions: { vertical: 'Hàng ngang', horizontal: 'Hàng dọc' },
        inputValidator: (v) => !v && 'Bạn phải chọn kiểu xuất!'
    });
    if (!mode) return;

    const wb = XLSX.utils.book_new();

    // 1) Sheet tổng hợp (luôn có)
    const summaryData = apps.map((a, i) => normalizeApplicationForSummary(a, i));
    const wsAll = (mode === 'vertical') ? buildVerticalSheet(summaryData) : buildHorizontalSheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsAll, 'Tổng hợp');

    // 2) Nếu includeByDepartment = true => xuất mỗi ban 1 sheet
    if (includeByDepartment) {
        const grouped = {};
        apps.forEach((app, idx) => {
            if (app.priority_position) {
                grouped[app.priority_position] = grouped[app.priority_position] || { priority: [], secondary: [] };
                grouped[app.priority_position].priority.push(normalizeApplicationForExport(app, idx));
            }
            if (app.secondary_position && app.secondary_position !== 'None') {
                grouped[app.secondary_position] = grouped[app.secondary_position] || { priority: [], secondary: [] };
                grouped[app.secondary_position].secondary.push(normalizeApplicationForExport(app, idx));
            }
        });

        Object.keys(grouped).forEach(dept => {
            const deptName = getDepartmentName(dept);
            const group = grouped[dept];

            if (splitPrioritySecondary) {
                // Xuất 2 sheet riêng: Ưu tiên & Dự bị
                if (group.priority.length > 0) {
                    const wsPri = (mode === 'vertical') ? buildVerticalSheet(group.priority) : buildHorizontalSheet(group.priority);
                    XLSX.utils.book_append_sheet(wb, wsPri, `${deptName}_Ưu tiên`.substring(0, 31));
                }
                if (group.secondary.length > 0) {
                    const wsSec = (mode === 'vertical') ? buildVerticalSheet(group.secondary) : buildHorizontalSheet(group.secondary);
                    XLSX.utils.book_append_sheet(wb, wsSec, `${deptName}_Dự bị`.substring(0, 31));
                }
            } else {
                // Xuất gộp chung
                const combined = [...group.priority, ...group.secondary];
                if (combined.length > 0) {
                    const ws = (mode === 'vertical') ? buildVerticalSheet(combined) : buildHorizontalSheet(combined);
                    XLSX.utils.book_append_sheet(wb, ws, deptName.substring(0, 31));
                }
            }
        });
    }

    XLSX.writeFile(wb, filename);
}


/* Export wrappers to call the unified exporter */
function exportPersonalInfo() {
  if (userRole === 'member') {
    Swal.fire('Không có quyền', 'Bạn không có quyền xuất dữ liệu.', 'error');
    closeExportModal();
    return;
  }

  let exportApps = applications;

  if (userRole === 'admin') {
    exportApps = applications.filter(app =>
      app.all_departments && app.all_departments.includes(userDept)
    );
  }

  if (!exportApps || exportApps.length === 0) {
    Swal.fire('Thông báo', 'Không có dữ liệu để xuất', 'info');
    closeExportModal();
    return;
  }

  exportDataWithLayout('enactus_thong_tin_ca_nhan.xlsx', exportApps, false);
  closeExportModal();
}

function exportResults() {
  if (userRole === 'member') {
    Swal.fire('Không có quyền', 'Bạn không có quyền xuất dữ liệu.', 'error');
    closeExportModal();
    return;
  }

  let exportApps = applications;
  if (userRole === 'admin') {
    exportApps = applications.filter(app =>
      app.all_departments && app.all_departments.includes(userDept)
    );
  }

  if (!exportApps || exportApps.length === 0) {
    Swal.fire('Thông báo', 'Không có dữ liệu để xuất', 'info');
    closeExportModal();
    return;
  }

  const rows = exportApps.map(app => {
    // Ban trúng tuyển
    let accepted = [];
    if (app.priorityAccepted) accepted.push(getDepartmentName(app.priority_position));
    if (app.secondaryAccepted) accepted.push(getDepartmentName(app.secondary_position));
    const acceptedText = accepted.length > 0 ? accepted.join(' / ') : '';

    // Ban bị từ chối
    let rejected = [];
    if (app.priorityRejected) rejected.push(getDepartmentName(app.priority_position));
    if (app.secondaryRejected) rejected.push(getDepartmentName(app.secondary_position));
    const rejectedText = rejected.length > 0 ? rejected.join(' / ') : '';

    return {
      'Họ và tên': app.fullname ?? '',
      'Email': app.email ?? '',
      'Số điện thoại': app.phone ?? '',
      'Ban trúng tuyển': acceptedText,
      'Ban bị từ chối': rejectedText
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Kết quả');

  XLSX.writeFile(wb, 'enactus_ket_qua_ung_tuyen.xlsx');
  closeExportModal();
}

function getAcceptedDepartments(app) {
  const accepted = [];
  if (app.priorityAccepted) {
    accepted.push(getDepartmentName(app.priority_position));
  }
  if (app.secondaryAccepted) {
    accepted.push(getDepartmentName(app.secondary_position));
  }
  return accepted.length > 0 ? accepted.join(' / ') : '';
}


function exportPersonalWithResults() {
  if (userRole === 'member') {
    Swal.fire('Không có quyền', 'Bạn không có quyền xuất dữ liệu.', 'error');
    closeExportModal();
    return;
  }

  let exportApps = applications;
  if (userRole === 'admin') {
    exportApps = applications.filter(app =>
      app.all_departments && app.all_departments.includes(userDept)
    );
  }

  if (!exportApps || exportApps.length === 0) {
    Swal.fire('Thông báo', 'Không có dữ liệu để xuất', 'info');
    closeExportModal();
    return;
  }

  exportDataWithLayout('enactus_thong_tin_va_ket_qua.xlsx', exportApps, false);
  closeExportModal();
}

async function exportByCandidate() {
    if (!currentApplicationId) { 
        Swal.fire('Thông báo', 'Vui lòng chọn một ứng viên để xuất dữ liệu', 'info'); 
        closeExportModal(); 
        return; 
    }
    const app = applications.find(a => a.id === currentApplicationId);
    if (userRole !== 'superadmin' && userRole !== 'admin') {
        Swal.fire('Không có quyền', 'Bạn không có quyền xuất dữ liệu ứng viên này.', 'error');
        closeExportModal();
        return;
    }
    // nếu admin, kiểm tra ban ứng viên có khớp
    if (userRole === 'admin' && !(app.priority_position === userDept || app.secondary_position === userDept)) {
        Swal.fire('Không có quyền', 'Bạn chỉ có thể xuất ứng viên của ban mình.', 'error');
        closeExportModal();
        return;
    }
    if (!app) return;

    const { value: mode } = await Swal.fire({
        title: 'Chọn kiểu xuất dữ liệu',
        input: 'radio',
        inputOptions: { 
            vertical: 'Hàng ngang', 
            horizontal: 'Hàng dọc' 
        },
        inputValidator: (v) => !v && 'Bạn phải chọn kiểu xuất!'
    });
    if (!mode) return;

    const wb = XLSX.utils.book_new();
    const data = [ normalizeApplicationForExport(app, 0) ];

    const ws = (mode === 'vertical') 
        ? buildVerticalSheet(data) 
        : buildHorizontalSheet(data);

    XLSX.utils.book_append_sheet(wb, ws, app.fullname || 'Ứng viên');

    XLSX.writeFile(wb, `enactus_ung_vien_${(app.fullname || 'ung_vien').replace(/\s+/g, '_')}.xlsx`);
    closeExportModal();
}

function exportAllData() {
  if (userRole !== 'superadmin') {
    Swal.fire('Không có quyền', 'Chỉ Super Admin được xuất toàn bộ dữ liệu.', 'error');
    closeExportModal();
    return;
  }
  exportDataWithLayout('enactus_toan_bo_du_lieu.xlsx', applications, true, false);
  closeExportModal();
}


// Giữ lại fields chung và chỉ giữ phần "Ưu tiên" hoặc "Dự bị" tùy loại
function filterExportData(data, type) {
    const filtered = {};
    Object.keys(data).forEach(key => {
        const isPriority = key.startsWith('Ưu tiên');
        const isSecondary = key.startsWith('Dự bị');

        // Luôn giữ các trường chung (không bắt đầu bằng 'Ưu tiên' hoặc 'Dự bị')
        if (!isPriority && !isSecondary) {
            filtered[key] = data[key];
            return;
        }

        // Giữ phần riêng theo type
        if (type === 'priority' && isPriority) {
            filtered[key] = data[key];
        } else if (type === 'secondary' && isSecondary) {
            filtered[key] = data[key];
        }
    });
    return filtered;
}

/* Replace export-department listener: safe attach */
(function attachExportDepartmentListener() {
  const el = document.getElementById('export-department');
  if (!el) return;
  try { el.replaceWith(el.cloneNode(true)); } catch (e) {}
  const elem = document.getElementById('export-department');
  if (!elem) return;

  elem.addEventListener('change', async function () {
    let department = this.value;

    // 👉 Nếu là admin thì luôn export theo ban của mình
    if (userRole === 'admin') {
      department = userDept;
    }

    if (!department) return;

    const deptApps = applications.filter(app =>
      app.all_departments && app.all_departments.includes(department)
    );

    if (deptApps.length === 0) {
      Swal.fire(
        'Thông báo',
        `Không có ứng viên nào trong ban ${getDepartmentName(department)}`,
        'info'
      );
      return;
    }

    // Hỏi layout
    const { value: mode } = await Swal.fire({
      title: 'Chọn kiểu xuất dữ liệu',
      input: 'radio',
      inputOptions: { vertical: 'Hàng ngang', horizontal: 'Hàng dọc' },
      inputValidator: (v) => !v && 'Bạn phải chọn kiểu xuất!',
    });
    if (!mode) return;

    const wb = XLSX.utils.book_new();

    // Tách ứng viên thành 2 nhóm: Ưu tiên & Dự bị
    const pri = deptApps
      .filter((app) => app.priority_position === department)
      .map((app, i) =>
        filterExportData(normalizeApplicationForExport(app, i), 'priority')
      );
    const sec = deptApps
      .filter((app) => app.secondary_position === department)
      .map((app, i) =>
        filterExportData(normalizeApplicationForExport(app, i), 'secondary')
      );

    if (pri.length > 0) {
      const wsPri =
        mode === 'vertical' ? buildVerticalSheet(pri) : buildHorizontalSheet(pri);
      XLSX.utils.book_append_sheet(
        wb,
        wsPri,
        `${getDepartmentName(department)}_Ưu tiên`.substring(0, 31)
      );
    }
    if (sec.length > 0) {
      const wsSec =
        mode === 'vertical' ? buildVerticalSheet(sec) : buildHorizontalSheet(sec);
      XLSX.utils.book_append_sheet(
        wb,
        wsSec,
        `${getDepartmentName(department)}_Dự bị`.substring(0, 31)
      );
    }

    XLSX.writeFile(
      wb,
      `enactus_ban_${getDepartmentName(department).replace(/\s+/g, '_')}.xlsx`
    );
    closeExportModal();
  });
})();

/* --------------------- END: Unified answer/export block --------------------- */



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
//window.addEventListener('load', loadApplications);