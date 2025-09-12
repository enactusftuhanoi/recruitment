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
        
        let applications = [];
        let currentApplicationId = null;
        
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
                if (departmentFilter && app.priority_position !== departmentFilter) return false;
                if (statusFilter && app.status !== statusFilter) return false;
                if (typeFilter && app.application_type !== typeFilter) return false;
                if (searchText && !(
                    (app.fullname || '').toLowerCase().includes(searchText) ||
                    (app.email || '').toLowerCase().includes(searchText)
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
                            <span class="detail-value">${getDepartmentName(app.priority_position)}</span>
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
            
            // Thông tin cá nhân
            const personalInfoSection = document.createElement('div');
            personalInfoSection.className = 'detail-section';
            personalInfoSection.innerHTML = `
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
                    <div class="detail-item">
                        <span class="detail-label">Trường</span>
                        <span class="detail-value">${application.school || 'Chưa cung cấp'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Chuyên ngành</span>
                        <span class="detail-value">${application.major || 'Chưa cung cấp'}</span>
                    </div>
                </div>
            `;
            detailSections.appendChild(personalInfoSection);
            
            // Thông tin ứng tuyển
            const applicationInfoSection = document.createElement('div');
            applicationInfoSection.className = 'detail-section';
            applicationInfoSection.innerHTML = `
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
                    <div class="detail-item">
                        <span class="detail-label">Ban dự bị</span>
                        <span class="detail-value">${application.secondary_position ? getDepartmentName(application.secondary_position) : 'Không có'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Thời gian dành cho Enactus</span>
                        <span class="detail-value">${application.availability || 'Chưa cung cấp'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Trạng thái</span>
                        <span class="detail-value">
                            <span class="status-indicator ${getStatusInfo(application.status || 'new').class}">
                                ${getStatusInfo(application.status || 'new').text}
                            </span>
                        </span>
                    </div>
                </div>
            `;
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
                priorityAnswersSection.innerHTML = `<h3><i class="fas fa-star"></i> Câu trả lời cho ${getDepartmentName(application.priority_position)} (Ưu tiên)</h3>`;
                
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
                
                detailSections.appendChild(priorityAnswersSection);
            }
            
            // Câu trả lời theo phân ban dự bị
            if (application.secondary_position && application.secondary_position !== 'None') {
                const secondaryAnswersSection = document.createElement('div');
                secondaryAnswersSection.className = 'detail-section';
                secondaryAnswersSection.innerHTML = `<h3><i class="fas fa-clock"></i> Câu trả lời cho ${getDepartmentName(application.secondary_position)} (Dự bị)</h3>`;
                
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
        
        // Hàm cập nhật trạng thái ứng viên
        async function updateApplicationStatus(status) {
            if (!currentApplicationId) return;
            
            try {
                // Hiển thị loading
                Swal.fire({
                    title: 'Đang cập nhật...',
                    text: 'Vui lòng chờ trong giây lát',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });
                
                // Cập nhật trạng thái trong Firestore
                await db.collection('applications').doc(currentApplicationId).update({
                    status: status,
                    updatedAt: new Date()
                });
                
                // Cập nhật local data
                const appIndex = applications.findIndex(app => app.id === currentApplicationId);
                if (appIndex !== -1) {
                    applications[appIndex].status = status;
                }
                
                // Ẩn loading và hiển thị thông báo thành công
                Swal.close();
                Swal.fire({
                    icon: 'success',
                    title: 'Thành công',
                    text: `Đã cập nhật trạng thái ứng viên thành ${getStatusInfo(status).text.toLowerCase()}`
                });
                
                // Cập nhật lại giao diện
                renderApplications();
            } catch (error) {
                console.error('Error updating status:', error);
                Swal.fire('Lỗi', 'Có lỗi xảy ra khi cập nhật trạng thái: ' + error.message, 'error');
            }
        }
        
        // Đánh dấu đã xem
        async function markAsReviewed() {
            await updateApplicationStatus('reviewed');
        }
        
        // Đánh dấu chấp nhận
        async function markAsAccepted() {
            const { value: result } = await Swal.fire({
                title: 'Xác nhận chấp nhận ứng viên',
                input: 'textarea',
                inputLabel: 'Ghi chú (nếu có)',
                inputPlaceholder: 'Nhập ghi chú về ứng viên...',
                showCancelButton: true,
                confirmButtonText: 'Chấp nhận',
                cancelButtonText: 'Hủy',
                inputValidator: (value) => {
                    // Ghi chú không bắt buộc
                    return null;
                }
            });
            
            if (result !== undefined) {
                // Nếu người dùng xác nhận, cập nhật trạng thái
                await updateApplicationStatus('accepted');
                
                // Lưu ghi chú nếu có
                if (result) {
                    try {
                        await db.collection('applications').doc(currentApplicationId).update({
                            note: result
                        });
                    } catch (error) {
                        console.error('Error saving note:', error);
                    }
                }
            }
        }
        
        // Đánh dấu từ chối
        async function markAsRejected() {
            const { value: result } = await Swal.fire({
                title: 'Xác nhận từ chối ứng viên',
                input: 'textarea',
                inputLabel: 'Lý do từ chối',
                inputPlaceholder: 'Nhập lý do từ chối ứng viên...',
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
            
            if (result) {
                // Nếu người dùng xác nhận, cập nhật trạng thái
                await updateApplicationStatus('rejected');
                
                // Lưu lý do từ chối
                try {
                    await db.collection('applications').doc(currentApplicationId).update({
                        rejectionReason: result
                    });
                } catch (error) {
                    console.error('Error saving rejection reason:', error);
                }
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
        
        // Lắng nghe sự kiện thay đổi bộ lọc
        document.getElementById('filter-department').addEventListener('change', renderApplications);
        document.getElementById('filter-status').addEventListener('change', renderApplications);
        document.getElementById('filter-type').addEventListener('change', renderApplications);
        document.getElementById('search-input').addEventListener('input', renderApplications);
        
        // Tải ứng viên khi trang được tải
        window.addEventListener('load', loadApplications);
