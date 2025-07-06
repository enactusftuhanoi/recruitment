// dashboard.js - Main application logic
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    firebase.auth().onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = 'index.html';
        } else {
            document.getElementById('userEmail').textContent = user.email;
            initDashboard();
        }
    });
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', function() {
        firebase.auth().signOut().then(() => {
            window.location.href = 'index.html';
        });
    });
    
    // Navigation
    const navLinks = document.querySelectorAll('.sidebar nav ul li');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            const target = this.querySelector('a').getAttribute('href').substring(1);
            showSection(target);
        });
    });
    
    // Initialize tabs
    initTabs();
    
    // Initialize candidate modal
    initModal();
});

function initDashboard() {
    // Load statistics
    loadStatistics();
    
    // Load recent activities
    loadRecentActivities();
    
    // Load candidates table
    loadCandidatesTable();
    
    // Load rounds data
    loadRoundsData();
    
    // Load history data
    loadHistoryData();
}

function showSection(sectionId) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    
    document.getElementById(sectionId + 'Content').style.display = 'block';
    document.getElementById('pageTitle').textContent = document.querySelector(`.sidebar nav ul li a[href="#${sectionId}"]`).textContent;
}

function loadStatistics() {
    // In a real app, you would fetch these from Firestore
    document.getElementById('totalCandidates').textContent = '125';
    document.getElementById('completedCandidates').textContent = '45';
    document.getElementById('inProgressCandidates').textContent = '60';
    document.getElementById('pendingCandidates').textContent = '20';
}

function loadRecentActivities() {
    const activities = [
        {
            icon: 'fa-user-check',
            title: 'Trạng thái thay đổi',
            description: 'Nguyễn Văn A đã được chuyển sang vòng Phỏng vấn nhóm',
            time: '10 phút trước'
        },
        {
            icon: 'fa-user-plus',
            title: 'Ứng viên mới',
            description: 'Trần Thị B đã đăng ký ứng tuyển ban HR',
            time: '1 giờ trước'
        },
        {
            icon: 'fa-file-export',
            title: 'Xuất dữ liệu',
            description: 'Danh sách ứng viên vòng đơn đã được xuất',
            time: '3 giờ trước'
        },
        {
            icon: 'fa-comment-alt',
            title: 'Ghi chú mới',
            description: 'Đã thêm ghi chú cho ứng viên Lê Văn C',
            time: '5 giờ trước'
        }
    ];
    
    const activityList = document.getElementById('recentActivity');
    activityList.innerHTML = '';
    
    activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="fas ${activity.icon}"></i>
            </div>
            <div class="activity-details">
                <h4>${activity.title}</h4>
                <p>${activity.description} · <span>${activity.time}</span></p>
            </div>
        `;
        activityList.appendChild(activityItem);
    });
}

function loadCandidatesTable() {
    // Sample data - in a real app, you would fetch from Firestore
    const candidates = [
        {
            id: '1',
            name: 'Nguyễn Văn A',
            department: 'HR, PR',
            currentRound: 'Vòng đơn',
            status: 'pending',
            email: 'nguyenvana@example.com',
            phone: '0123456789',
            gender: 'Nam',
            dob: '01/01/2000',
            university: 'Đại học Ngoại thương',
            class: 'K47 - Kinh tế đối ngoại - A1',
            studentId: '123456789'
        },
        {
            id: '2',
            name: 'Trần Thị B',
            department: 'Finance',
            currentRound: 'Phỏng vấn nhóm',
            status: 'approved',
            email: 'tranthib@example.com',
            phone: '0987654321',
            gender: 'Nữ',
            dob: '15/05/2001',
            university: 'Đại học Ngoại thương',
            class: 'K47 - Kinh tế quốc tế - B2',
            studentId: '987654321'
        },
        {
            id: '3',
            name: 'Lê Văn C',
            department: 'Project',
            currentRound: 'Thử thách',
            status: 'approved',
            email: 'levanc@example.com',
            phone: '0369852147',
            gender: 'Nam',
            dob: '20/10/2000',
            university: 'Đại học Ngoại thương',
            class: 'K47 - Quản trị kinh doanh - C3',
            studentId: '456123789'
        }
    ];
    
    const tableBody = document.getElementById('candidatesTableBody');
    tableBody.innerHTML = '';
    
    candidates.forEach(candidate => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${candidate.name}</td>
            <td>${candidate.department}</td>
            <td>${candidate.currentRound}</td>
            <td>
                <select class="status-select" data-id="${candidate.id}">
                    <option value="pending" ${candidate.status === 'pending' ? 'selected' : ''}>Chờ xử lý</option>
                    <option value="approved" ${candidate.status === 'approved' ? 'selected' : ''}>Đã duyệt</option>
                    <option value="rejected" ${candidate.status === 'rejected' ? 'selected' : ''}>Từ chối</option>
                </select>
            </td>
            <td>
                <button class="action-btn btn-view view-candidate" data-id="${candidate.id}">Xem</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Add event listeners for status changes
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', function() {
            const candidateId = this.getAttribute('data-id');
            const newStatus = this.value;
            
            // In a real app, you would update Firestore here
            console.log(`Updating candidate ${candidateId} to status ${newStatus}`);
        });
    });
    
    // Add event listeners for view buttons
    document.querySelectorAll('.view-candidate').forEach(button => {
        button.addEventListener('click', function() {
            const candidateId = this.getAttribute('data-id');
            showCandidateDetails(candidateId);
        });
    });
    
    // Add sorting functionality
    document.querySelectorAll('#candidatesTable th[data-sort]').forEach(header => {
        header.addEventListener('click', function() {
            const sortKey = this.getAttribute('data-sort');
            console.log(`Sorting by ${sortKey}`);
            // Implement sorting logic here
        });
    });
    
    // Add search functionality
    document.getElementById('candidateSearch').addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        console.log(`Searching for: ${searchTerm}`);
        // Implement search logic here
    });
    
    // Add filter functionality
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    document.getElementById('roundFilter').addEventListener('change', applyFilters);
}

function applyFilters() {
    const statusFilter = document.getElementById('statusFilter').value;
    const roundFilter = document.getElementById('roundFilter').value;
    console.log(`Applying filters - Status: ${statusFilter}, Round: ${roundFilter}`);
    // Implement filter logic here
}

function initModal() {
    const modal = document.getElementById('candidateModal');
    const closeBtn = document.querySelector('.close');
    const viewButtons = document.querySelectorAll('.view-candidate');
    
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Edit/Save functionality
    const editBtn = document.getElementById('editCandidateBtn');
    const saveBtn = document.getElementById('saveCandidateBtn');
    
    editBtn.addEventListener('click', function() {
        // Enable editing
        const infoRows = document.querySelectorAll('.candidate-info .info-row span');
        infoRows.forEach(row => {
            const currentValue = row.textContent;
            row.innerHTML = `<input type="text" value="${currentValue}">`;
        });
        
        editBtn.style.display = 'none';
        saveBtn.style.display = 'inline-block';
    });
    
    saveBtn.addEventListener('click', function() {
        // Save changes
        const infoRows = document.querySelectorAll('.candidate-info .info-row');
        infoRows.forEach(row => {
            const input = row.querySelector('input');
            if (input) {
                const newValue = input.value;
                row.innerHTML = `<span>${newValue}</span>`;
            }
        });
        
        saveBtn.style.display = 'none';
        editBtn.style.display = 'inline-block';
        
        // In a real app, you would update Firestore here
        console.log('Candidate details updated');
    });
}

function showCandidateDetails(candidateId) {
    // In a real app, you would fetch candidate details from Firestore
    const candidates = {
        '1': {
            name: 'Nguyễn Văn A',
            department: 'HR',
            currentRound: 'Vòng đơn',
            status: 'pending',
            photo: 'images/default-avatar.jpg',
            gender: 'Nam',
            email: 'nguyenvana@example.com',
            phone: '0123456789',
            dob: '01/01/2000',
            university: 'Đại học Ngoại thương',
            class: 'K47 - Kinh tế đối ngoại - A1',
            studentId: '123456789'
        },
        '2': {
            name: 'Trần Thị B',
            department: 'Finance',
            currentRound: 'Phỏng vấn nhóm',
            status: 'approved',
            photo: 'images/default-avatar.jpg',
            gender: 'Nữ',
            email: 'tranthib@example.com',
            phone: '0987654321',
            dob: '15/05/2001',
            university: 'Đại học Ngoại thương',
            class: 'K47 - Kinh tế quốc tế - B2',
            studentId: '987654321'
        },
        '3': {
            name: 'Lê Văn C',
            department: 'Project',
            currentRound: 'Thử thách',
            status: 'approved',
            photo: 'images/default-avatar.jpg',
            gender: 'Nam',
            email: 'levanc@example.com',
            phone: '0369852147',
            dob: '20/10/2000',
            university: 'Đại học Ngoại thương',
            class: 'K47 - Quản trị kinh doanh - C3',
            studentId: '456123789'
        }
    };
    
    const candidate = candidates[candidateId];
    
    if (candidate) {
        document.getElementById('modalCandidateName').textContent = candidate.name;
        document.getElementById('modalDepartment').textContent = candidate.department;
        document.getElementById('modalCurrentRound').textContent = candidate.currentRound;
        
        // Update status badge
        const statusBadge = document.getElementById('modalStatus');
        statusBadge.textContent = candidate.status === 'pending' ? 'Chờ xử lý' : 
                                 candidate.status === 'approved' ? 'Đã duyệt' : 'Từ chối';
        statusBadge.className = 'status-badge ' + candidate.status;
        
        document.getElementById('modalPhoto').src = candidate.photo;
        document.getElementById('modalGender').textContent = candidate.gender;
        document.getElementById('modalEmail').textContent = candidate.email;
        document.getElementById('modalPhone').textContent = candidate.phone;
        document.getElementById('modalDob').textContent = candidate.dob;
        document.getElementById('modalUniversity').textContent = candidate.university;
        document.getElementById('modalClass').textContent = candidate.class;
        document.getElementById('modalStudentId').textContent = candidate.studentId;
        
        document.getElementById('candidateModal').style.display = 'block';
    }
}

function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.round-tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding content
            tabContents.forEach(content => {
                content.classList.remove('active-tab');
                if (content.id === `${tabId}Tab`) {
                    content.classList.add('active-tab');
                }
            });
        });
    });
    
    // Add save button event listeners
    document.getElementById('saveApplicationBtn').addEventListener('click', saveApplicationRound);
    document.getElementById('saveGroupInterviewBtn').addEventListener('click', saveGroupInterviewRound);
    document.getElementById('saveChallengeBtn').addEventListener('click', saveChallengeRound);
    
    // Add export button event listeners
    document.getElementById('exportAllBtn').addEventListener('click', exportAllCandidates);
    document.getElementById('exportByRoundBtn').addEventListener('click', exportByRound);
    document.getElementById('exportByDepartmentBtn').addEventListener('click', exportByDepartment);
}

function saveApplicationRound() {
    const status = document.getElementById('applicationStatus').value;
    console.log('Saving Application Round with status:', status);
    // In a real app, you would save to Firestore
}

function saveGroupInterviewRound() {
    const status = document.getElementById('groupInterviewStatus').value;
    const time = document.getElementById('groupInterviewTime').value;
    const location = document.getElementById('groupInterviewLocation').value;
    const members = document.getElementById('groupInterviewMembers').value;
    const notes = document.getElementById('groupInterviewNotes').value;
    
    console.log('Saving Group Interview Round:', { status, time, location, members, notes });
    // In a real app, you would save to Firestore
}

function saveChallengeRound() {
    const status = document.getElementById('challengeStatus').value;
    const description = document.getElementById('challengeDescription').value;
    const time = document.getElementById('challengeTime').value;
    const location = document.getElementById('challengeLocation').value;
    const teamMembers = document.getElementById('challengeTeamMembers').value;
    const advisor = document.getElementById('challengeAdvisor').value;
    const pitchingTime = document.getElementById('pitchingTime').value;
    const pitchingLocation = document.getElementById('pitchingLocation').value;
    
    console.log('Saving Challenge Round:', { 
        status, 
        description, 
        time, 
        location, 
        teamMembers, 
        advisor, 
        pitchingTime, 
        pitchingLocation 
    });
    // In a real app, you would save to Firestore
}

function loadRoundsData() {
    // In a real app, you would fetch rounds data from Firestore
    console.log('Loading rounds data...');
}

function loadHistoryData() {
    // In a real app, you would fetch history data from Firestore
    console.log('Loading history data...');
    
    // Apply history filters
    document.getElementById('applyHistoryFilter').addEventListener('click', function() {
        const fromDate = document.getElementById('historyFromDate').value;
        const toDate = document.getElementById('historyToDate').value;
        const type = document.getElementById('historyType').value;
        
        console.log('Applying history filters:', { fromDate, toDate, type });
        // Implement filter logic here
    });
}

function exportAllCandidates() {
    console.log('Exporting all candidates to CSV');
    // Implement CSV export logic here
    downloadCSV('enactus_candidates_all.csv', 'Sample CSV data');
}

function exportByRound() {
    const round = document.getElementById('exportRoundSelect').value;
    console.log(`Exporting candidates for round: ${round}`);
    // Implement CSV export logic here
    downloadCSV(`enactus_candidates_${round}.csv`, 'Sample CSV data');
}

function exportByDepartment() {
    const department = document.getElementById('exportDepartmentSelect').value;
    console.log(`Exporting candidates for department: ${department}`);
    // Implement CSV export logic here
    downloadCSV(`enactus_candidates_${department}.csv`, 'Sample CSV data');
}

function downloadCSV(filename, csvData) {
    // This is a simplified version - in a real app you would generate proper CSV
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}