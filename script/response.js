// ==== Global State ====
const userEmail = sessionStorage.getItem("email");
let userRole = sessionStorage.getItem("role") || null;
let userDept = sessionStorage.getItem("department") || null;

let applications = [];
let currentApplicationId = null;

// ==== CÁC BIẾN NÀY SẼ ĐƯỢC LOAD TỪ FIREBASE ====
let interview = [];
let generalQuestions = [];
let banQuestions = {};

if (!userEmail || !userRole) {
  window.location.href = "login.html";
}

// ==== Xử lý tham số URL để tự động mở ứng viên cụ thể ====
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// Hàm tự động mở ứng viên khi có tham số ID
function autoOpenApplicationFromUrl() {
  const applicationId = getUrlParameter("id");
  if (applicationId) {
    const application = applications.find((app) => app.id === applicationId);
    if (application) {
      setTimeout(() => {
        showApplicationDetail(applicationId);
      }, 500);
    } else {
      console.warn("Không tìm thấy ứng viên với ID:", applicationId);
    }
  }
}

// ==== HÀM LOAD INTERVIEW & QUESTIONS TỪ FIREBASE ====
async function loadInterviewAndQuestions() {
    // Guard: đảm bảo db đã init
    if (typeof db === 'undefined' || db === null) {
        console.error('[Response] db chưa được khởi tạo — kiểm tra config.js');
        return;
    }

    try {
        // Load interview settings
        const interviewDoc = await db.collection("system").doc("interview_settings").get();
        if (interviewDoc.exists) {
            const data = interviewDoc.data();
            const slots = data.slots || [];
            if (slots.length > 0) {
                interview = buildInterviewFromSlots(slots);
            } else {
                interview = [];
            }
        }

        // Load questions
        const questionsDoc = await db.collection("system").doc("form_questions").get();
        if (questionsDoc.exists && questionsDoc.data().questions) {
            const raw = questionsDoc.data().questions;
            generalQuestions = raw.general || [];
            banQuestions = {
                "MD-Design": raw["MD-Design"] || raw["md-design"] || [],
                "MD-Content": raw["MD-Content"] || raw["md-content"] || [],
                HR: raw.HR || raw.hr || [],
                ER: raw.ER || raw.er || [],
                PD: raw.PD || raw.pd || [],
                MD: {
                    Design: raw["MD-Design"] || raw["md-design"] || [],
                    Content: raw["MD-Content"] || raw["md-content"] || []
                }
            };
        } else {
            console.warn('[Response] Không tìm thấy form_questions trong Firebase');
        }

        console.log('[Response] Đã tải dữ liệu từ Firebase:', {
            generalQuestions: generalQuestions.length,
            banQuestions: {
                'MD-Design': banQuestions['MD-Design']?.length,
                'MD-Content': banQuestions['MD-Content']?.length,
                HR: banQuestions.HR?.length,
                ER: banQuestions.ER?.length,
                PD: banQuestions.PD?.length,
            },
            interviewSlots: interview.length
        });
    } catch (error) {
        console.error('[Response] Lỗi tải dữ liệu câu hỏi:', error);
    }
}

// ==== BUILD INTERVIEW FROM SLOTS ====
function buildInterviewFromSlots(slots) {
    if (!slots || slots.length === 0) return [];

    const question = {
        id: "interview_schedule",
        question: "Vui lòng chọn các khung giờ phỏng vấn bạn có thể tham gia (chọn ít nhất 3 ca)",
        options: []
    };

    slots.forEach((slot, index) => {
        let displayLabel = '';
        const caNum = index + 1;
        
        // Lấy thông tin ngày
        let dateInfo = '';
        let timeRange = '';
        
        if (slot.dateTime) {
            try {
                const date = new Date(slot.dateTime);
                if (!isNaN(date.getTime())) {
                    const weekdays = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
                    const dayOfWeek = weekdays[date.getDay()];
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    dateInfo = `${dayOfWeek}, ${day}/${month}/${year}`;
                }
            } catch(e) {}
        }
        
        // Lấy giờ
        if (slot.startTime && slot.endTime) {
            timeRange = `${slot.startTime} - ${slot.endTime}`;
        } else if (slot.label) {
            const timeMatch = slot.label.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
            if (timeMatch) {
                timeRange = `${timeMatch[1]} - ${timeMatch[2]}`;
            }
        }
        
        // Ghép thành label: "Ca 1 (08:00 - 09:30) - Thứ 5, 25/06/2026"
        if (timeRange && dateInfo) {
            displayLabel = `Ca ${caNum} (${timeRange}) - ${dateInfo}`;
        } else if (timeRange) {
            displayLabel = `Ca ${caNum} (${timeRange})`;
        } else if (dateInfo) {
            displayLabel = `Ca ${caNum} - ${dateInfo}`;
        } else {
            displayLabel = slot.label || `Ca ${caNum}`;
        }
        
        question.options.push(displayLabel);
    });

    return [question];
}

// ============================================================
// HIỂN THỊ THÔNG TIN ỨNG TUYỂN - THEO TẦNG
// ============================================================

function renderApplicationInfo(application, container) {
    const section = document.createElement("div");
    section.className = "detail-section";
    
    let html = `
        <h3><i class="fas fa-briefcase"></i> Thông tin ứng tuyển</h3>
        <div class="app-info-grid">
            <!-- Dòng 1: Hình thức + Trạng thái tổng -->
            <div class="app-info-row">
                <div class="app-info-item">
                    <span class="app-label">Hình thức ứng tuyển</span>
                    <span class="app-value">${application.application_type === "form" ? "Điền đơn" : "Phỏng vấn"}</span>
                </div>
                <div class="app-info-item">
                    <span class="app-label">Trạng thái tổng</span>
                    <span class="status-indicator ${getStatusInfo(computeOverallStatus(application)).class}">
                        ${getStatusInfo(computeOverallStatus(application)).text}
                    </span>
                </div>
            </div>
    `;
    
    // === BAN ƯU TIÊN ===
    if (application.priority_position && application.priority_position !== "None") {
        const priorityStatus = getDepartmentStatus(application, "priority");
        const deptName = getDepartmentName(application.priority_position);
        const subDisplay = application.priority_position === "MD" 
            ? (application.md_sub_departments || []).join(", ") 
            : "";
        
        html += `
            <div class="app-info-divider"></div>
            <div class="app-info-row">
                <div class="app-info-item">
                    <span class="app-label">Ban ưu tiên</span>
                    <span class="app-value dept-name priority">
                        <i class="fas fa-star" style="font-size:12px;color:#3b82f6;"></i>
                        ${deptName} ${subDisplay ? `(${subDisplay})` : ''}
                    </span>
                </div>
                <div class="app-info-item">
                    <span class="app-label">Trạng thái</span>
                    <span class="dept-status ${priorityStatus.class}">${priorityStatus.text}</span>
                </div>
                ${priorityStatus.reason ? `
                    <div class="app-info-item full-width">
                        <span class="app-label">Lý do</span>
                        <span class="app-value reason">${priorityStatus.reason}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // === BAN DỰ BỊ ===
    if (application.secondary_position && application.secondary_position !== "None") {
        const secondaryStatus = getDepartmentStatus(application, "secondary");
        const deptName = getDepartmentName(application.secondary_position);
        const subDisplay = application.secondary_position === "MD" 
            ? (application.md_sub_departments_secondary || []).join(", ") 
            : "";
        
        html += `
            <div class="app-info-divider"></div>
            <div class="app-info-row">
                <div class="app-info-item">
                    <span class="app-label">Ban dự bị</span>
                    <span class="app-value dept-name secondary">
                        <i class="fas fa-clock" style="font-size:12px;color:#f59e0b;"></i>
                        ${deptName} ${subDisplay ? `(${subDisplay})` : ''}
                    </span>
                </div>
                <div class="app-info-item">
                    <span class="app-label">Trạng thái</span>
                    <span class="dept-status ${secondaryStatus.class}">${secondaryStatus.text}</span>
                </div>
                ${secondaryStatus.reason ? `
                    <div class="app-info-item full-width">
                        <span class="app-label">Lý do</span>
                        <span class="app-value reason">${secondaryStatus.reason}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // === BAN ĐƯỢC CHẤP NHẬN ===
    const accepted = getAcceptedDepartments(application);
    html += `
        <div class="app-info-divider"></div>
        <div class="app-info-row">
            <div class="app-info-item full-width">
                <span class="app-label">Ban được chấp nhận</span>
                <span class="app-value accepted">${accepted || "Chưa có"}</span>
            </div>
        </div>
    `;
    
    // === GHI CHÚ CHUNG (nếu có) ===
    if (application.note) {
        html += `
            <div class="app-info-divider"></div>
            <div class="app-info-row">
                <div class="app-info-item full-width">
                    <span class="app-label">Ghi chú chung</span>
                    <span class="app-value note">${application.note}</span>
                </div>
            </div>
        `;
    }
    
    html += `</div>`;
    section.innerHTML = html;
    container.appendChild(section);
}

// ============================================================
// LẤY TRẠNG THÁI CỦA TỪNG BAN
// ============================================================

function getDepartmentStatus(application, type) {
    const isPriority = type === "priority";
    const accepted = isPriority ? application.priorityAccepted : application.secondaryAccepted;
    const rejected = isPriority ? application.priorityRejected : application.secondaryRejected;
    const reason = isPriority ? application.priorityRejectionReason : application.secondaryRejectionReason;
    
    if (accepted) {
        return { text: "Đã chấp nhận", class: "status-passed", reason: null };
    } else if (rejected) {
        return { text: "Đã từ chối", class: "status-failed", reason: reason || "Không có lý do" };
    }
    return { text: "Chưa đánh giá", class: "status-pending", reason: null };
}

// ============================================================
// KIỂM TRA QUYỀN XEM/ĐÁNH GIÁ BAN
// ============================================================

function canViewDepartment(application, deptType) {
    if (!application) return false;
    if (userRole === "superadmin") return true;
    if (userRole === "admin") {
        const deptCode = deptType === "priority" 
            ? application.priority_position 
            : application.secondary_position;
        return deptCode === userDept;
    }
    return false;
}

function canViewAnyDepartment(application) {
    if (!application) return false;
    if (userRole === "superadmin") return true;
    if (userRole === "admin") {
        return application.priority_position === userDept || 
               application.secondary_position === userDept;
    }
    return false;
}

// ============================================================
// RENDER ĐÁNH GIÁ
// ============================================================

function renderEvaluationSection(application, container) {
    if (!application) return;
    
    // Kiểm tra xem có ban nào để đánh giá không
    const hasPriority = application.priority_position && application.priority_position !== "None";
    const hasSecondary = application.secondary_position && application.secondary_position !== "None";
    
    if (!hasPriority && !hasSecondary) {
        return; // Không có ban nào để đánh giá
    }
    
    const section = document.createElement("div");
    section.className = "detail-section evaluation-section";
    
    const title = document.createElement("h3");
    title.innerHTML = `<i class="fas fa-gavel"></i> Đánh giá`;
    section.appendChild(title);
    
    const grid = document.createElement("div");
    grid.className = "evaluation-grid";
    
    // Lấy danh sách các ban cần đánh giá
    const depts = [];
    
    if (hasPriority) {
        depts.push({
            type: "priority",
            code: application.priority_position,
            label: "Ưu tiên",
            accepted: application.priorityAccepted || false,
            rejected: application.priorityRejected || false,
            notes: application.application_type === "form" 
                ? (application.priority_notes || "") 
                : (application.priority_interview_notes || ""),
            by: application.application_type === "form" 
                ? (application.priority_evaluated_by || "") 
                : (application.priority_interview_evaluated_by || ""),
            at: application.application_type === "form" 
                ? (application.priority_evaluated_at || null) 
                : (application.priority_interview_evaluated_at || null),
            canAct: canActOnDepartment(application, "priority")
        });
    }
    
    if (hasSecondary) {
        depts.push({
            type: "secondary",
            code: application.secondary_position,
            label: "Dự bị",
            accepted: application.secondaryAccepted || false,
            rejected: application.secondaryRejected || false,
            notes: application.application_type === "form" 
                ? (application.secondary_notes || "") 
                : (application.secondary_interview_notes || ""),
            by: application.application_type === "form" 
                ? (application.secondary_evaluated_by || "") 
                : (application.secondary_interview_evaluated_by || ""),
            at: application.application_type === "form" 
                ? (application.secondary_evaluated_at || null) 
                : (application.secondary_interview_evaluated_at || null),
            canAct: canActOnDepartment(application, "secondary")
        });
    }
    
    // Render từng ban
    depts.forEach((dept) => {
        const box = document.createElement("div");
        box.className = `eval-box ${dept.type}`;
        
        let statusText = "Chưa đánh giá";
        let statusClass = "none";
        let statusIcon = '<i class="fas fa-clock" style="font-size:12px;"></i>';
        
        if (dept.accepted) {
            statusText = application.application_type === "form" ? "Đã chấp nhận" : "Pass";
            statusClass = "passed";
            statusIcon = '<i class="fas fa-check-circle" style="font-size:12px;"></i>';
        } else if (dept.rejected) {
            statusText = application.application_type === "form" ? "Đã từ chối" : "Fail";
            statusClass = "failed";
            statusIcon = '<i class="fas fa-times-circle" style="font-size:12px;"></i>';
        }
        
        const deptName = getDepartmentName(dept.code);
        const subDisplay = dept.code === "MD" ? getSubDeptDisplay(application, dept.type) : "";
        
        let actionsHTML = "";
        
        // Nếu có quyền đánh giá
        if (dept.canAct) {
            if (!dept.accepted && !dept.rejected) {
                // Chưa đánh giá -> hiện nút đánh giá
                if (application.application_type === "form") {
                    actionsHTML = `
                        <button class="btn-eval btn-pass" onclick="evalForm('${application.id}', '${dept.type}', 'pass')">
                            <i class="fas fa-check" style="font-size:11px;"></i> Chấp nhận
                        </button>
                        <button class="btn-eval btn-fail" onclick="evalForm('${application.id}', '${dept.type}', 'fail')">
                            <i class="fas fa-times" style="font-size:11px;"></i> Từ chối
                        </button>
                    `;
                } else {
                    actionsHTML = `
                        <button class="btn-eval btn-pass" onclick="evalInterview('${application.id}', '${dept.type}', 'pass')">
                            <i class="fas fa-check" style="font-size:11px;"></i> Pass
                        </button>
                        <button class="btn-eval btn-fail" onclick="evalInterview('${application.id}', '${dept.type}', 'fail')">
                            <i class="fas fa-times" style="font-size:11px;"></i> Fail
                        </button>
                    `;
                }
            } else {
                // Đã đánh giá -> hiện nút ghi chú + đặt lại
                if (application.application_type === "form") {
                    actionsHTML = `
                        <button class="btn-eval btn-note" onclick="addFormNote('${application.id}', '${dept.type}')">
                            <i class="fas fa-pen" style="font-size:11px;"></i> Ghi chú
                        </button>
                        <button class="btn-eval btn-reset" onclick="resetFormEval('${application.id}', '${dept.type}')">
                            <i class="fas fa-undo" style="font-size:11px;"></i> Đặt lại
                        </button>
                    `;
                } else {
                    actionsHTML = `
                        <button class="btn-eval btn-note" onclick="addInterviewNote('${application.id}', '${dept.type}')">
                            <i class="fas fa-pen" style="font-size:11px;"></i> Ghi chú
                        </button>
                        <button class="btn-eval btn-reset" onclick="resetInterviewEval('${application.id}', '${dept.type}')">
                            <i class="fas fa-undo" style="font-size:11px;"></i> Đặt lại
                        </button>
                    `;
                }
            }
        }
        
        box.innerHTML = `
            <div class="eval-row">
                <div class="eval-dept">
                    <i class="fas ${dept.type === 'priority' ? 'fa-star' : 'fa-clock'}" style="font-size:14px;color:${dept.type === 'priority' ? '#3b82f6' : '#f59e0b'};"></i>
                    ${deptName}
                    <span class="tag">${dept.label}</span>
                    ${subDisplay ? `<span class="tag">${subDisplay}</span>` : ''}
                    ${!dept.canAct ? `<span class="tag" style="background:#fee2e2;color:#991b1b;">Không có quyền</span>` : ''}
                </div>
                <span class="eval-badge ${statusClass}">${statusIcon} ${statusText}</span>
            </div>
            <div class="eval-meta">
                <span><span class="label">Người đánh giá</span> ${dept.by || '—'}</span>
                <span><span class="label">Thời gian</span> ${dept.at ? formatDateValue(dept.at) : '—'}</span>
            </div>
            ${dept.notes ? `<div class="eval-notes">${dept.notes}</div>` : ''}
            ${actionsHTML ? `<div class="eval-actions">${actionsHTML}</div>` : ''}
            ${dept.by ? `<div class="eval-by"><i class="fas fa-user-check" style="font-size:11px;"></i> Đánh giá bởi ${dept.by}</div>` : ''}
        `;
        
        grid.appendChild(box);
    });
    
    section.appendChild(grid);
    container.appendChild(section);
}

// ============================================================
// RENDER ĐÁNH GIÁ ĐƠN
// ============================================================

function renderFormEval(application, container) {
    const depts = [];
    
    if (application.priority_position && application.priority_position !== "None") {
        depts.push({
            type: "priority",
            code: application.priority_position,
            label: "Ưu tiên",
            accepted: application.priorityAccepted || false,
            rejected: application.priorityRejected || false,
            notes: application.priority_notes || "",
            by: application.priority_evaluated_by || "",
            at: application.priority_evaluated_at || null
        });
    }
    
    if (application.secondary_position && application.secondary_position !== "None") {
        depts.push({
            type: "secondary",
            code: application.secondary_position,
            label: "Dự bị",
            accepted: application.secondaryAccepted || false,
            rejected: application.secondaryRejected || false,
            notes: application.secondary_notes || "",
            by: application.secondary_evaluated_by || "",
            at: application.secondary_evaluated_at || null
        });
    }
    
    if (depts.length === 0) {
        container.innerHTML = `<p style="color: #94a3b8; font-size: 14px;">Chưa có ban ứng tuyển.</p>`;
        return;
    }
    
    depts.forEach((dept) => {
        const box = document.createElement("div");
        box.className = `eval-box ${dept.type}`;
        
        let statusText = "Chưa đánh giá";
        let statusClass = "none";
        let statusIcon = '<i class="fas fa-clock" style="font-size:12px;"></i>';
        
        if (dept.accepted) {
            statusText = "Đã chấp nhận";
            statusClass = "passed";
            statusIcon = '<i class="fas fa-check-circle" style="font-size:12px;"></i>';
        } else if (dept.rejected) {
            statusText = "Đã từ chối";
            statusClass = "failed";
            statusIcon = '<i class="fas fa-times-circle" style="font-size:12px;"></i>';
        }
        
        const deptName = getDepartmentName(dept.code);
        const subDisplay = dept.code === "MD" ? getSubDeptDisplay(application, dept.type) : "";
        
        box.innerHTML = `
            <div class="eval-row">
                <div class="eval-dept">
                    <i class="fas ${dept.type === 'priority' ? 'fa-star' : 'fa-clock'}" style="font-size:14px;color:${dept.type === 'priority' ? '#3b82f6' : '#f59e0b'};"></i>
                    ${deptName}
                    <span class="tag">${dept.label}</span>
                    ${subDisplay ? `<span class="tag">${subDisplay}</span>` : ''}
                </div>
                <span class="eval-badge ${statusClass}">${statusIcon} ${statusText}</span>
            </div>
            <div class="eval-meta">
                <span><span class="label">Người đánh giá</span> ${dept.by || '—'}</span>
                <span><span class="label">Thời gian</span> ${dept.at ? formatDateValue(dept.at) : '—'}</span>
            </div>
            ${dept.notes ? `<div class="eval-notes">${dept.notes}</div>` : ''}
            <div class="eval-actions">
                ${!dept.accepted && !dept.rejected ? `
                    <button class="btn-eval btn-pass" onclick="evalForm('${application.id}', '${dept.type}', 'pass')">
                        <i class="fas fa-check" style="font-size:11px;"></i> Chấp nhận
                    </button>
                    <button class="btn-eval btn-fail" onclick="evalForm('${application.id}', '${dept.type}', 'fail')">
                        <i class="fas fa-times" style="font-size:11px;"></i> Từ chối
                    </button>
                ` : `
                    <button class="btn-eval btn-note" onclick="addFormNote('${application.id}', '${dept.type}')">
                        <i class="fas fa-pen" style="font-size:11px;"></i> Ghi chú
                    </button>
                    <button class="btn-eval btn-reset" onclick="resetFormEval('${application.id}', '${dept.type}')">
                        <i class="fas fa-undo" style="font-size:11px;"></i> Đặt lại
                    </button>
                `}
            </div>
            ${dept.by ? `<div class="eval-by"><i class="fas fa-user-check" style="font-size:11px;"></i> Đánh giá bởi ${dept.by}</div>` : ''}
        `;
        
        container.appendChild(box);
    });
}

// ============================================================
// RENDER ĐÁNH GIÁ PHỎNG VẤN - CÓ NÚT RESET
// ============================================================

function renderInterviewEval(application, container) {
    const depts = [];
    
    if (application.priority_position && application.priority_position !== "None") {
        depts.push({
            type: "priority",
            code: application.priority_position,
            label: "Ưu tiên",
            accepted: application.priorityAccepted || false,
            rejected: application.priorityRejected || false,
            notes: application.priority_interview_notes || "",
            by: application.priority_interview_evaluated_by || "",
            at: application.priority_interview_evaluated_at || null
        });
    }
    
    if (application.secondary_position && application.secondary_position !== "None") {
        depts.push({
            type: "secondary",
            code: application.secondary_position,
            label: "Dự bị",
            accepted: application.secondaryAccepted || false,
            rejected: application.secondaryRejected || false,
            notes: application.secondary_interview_notes || "",
            by: application.secondary_interview_evaluated_by || "",
            at: application.secondary_interview_evaluated_at || null
        });
    }
    
    if (depts.length === 0) {
        container.innerHTML = `<p style="color: #94a3b8; font-size: 14px;">Chưa có ban ứng tuyển.</p>`;
        return;
    }
    
    depts.forEach((dept) => {
        const box = document.createElement("div");
        box.className = `eval-box ${dept.type}`;
        
        let statusText = "Chưa đánh giá";
        let statusClass = "none";
        let statusIcon = '<i class="fas fa-clock" style="font-size:12px;"></i>';
        
        if (dept.accepted) {
            statusText = "Pass";
            statusClass = "passed";
            statusIcon = '<i class="fas fa-check-circle" style="font-size:12px;"></i>';
        } else if (dept.rejected) {
            statusText = "Fail";
            statusClass = "failed";
            statusIcon = '<i class="fas fa-times-circle" style="font-size:12px;"></i>';
        }
        
        const deptName = getDepartmentName(dept.code);
        
        box.innerHTML = `
            <div class="eval-row">
                <div class="eval-dept">
                    <i class="fas ${dept.type === 'priority' ? 'fa-star' : 'fa-clock'}" style="font-size:14px;color:${dept.type === 'priority' ? '#3b82f6' : '#f59e0b'};"></i>
                    ${deptName}
                    <span class="tag">${dept.label}</span>
                </div>
                <span class="eval-badge ${statusClass}">${statusIcon} ${statusText}</span>
            </div>
            <div class="eval-meta">
                <span><span class="label">Người đánh giá</span> ${dept.by || '—'}</span>
                <span><span class="label">Thời gian</span> ${dept.at ? formatDateValue(dept.at) : '—'}</span>
            </div>
            ${dept.notes ? `<div class="eval-notes">${dept.notes}</div>` : ''}
            <div class="eval-actions">
                ${!dept.accepted && !dept.rejected ? `
                    <button class="btn-eval btn-pass" onclick="evalInterview('${application.id}', '${dept.type}', 'pass')">
                        <i class="fas fa-check" style="font-size:11px;"></i> Pass
                    </button>
                    <button class="btn-eval btn-fail" onclick="evalInterview('${application.id}', '${dept.type}', 'fail')">
                        <i class="fas fa-times" style="font-size:11px;"></i> Fail
                    </button>
                ` : `
                    <button class="btn-eval btn-note" onclick="addInterviewNote('${application.id}', '${dept.type}')">
                        <i class="fas fa-pen" style="font-size:11px;"></i> Ghi chú
                    </button>
                    <button class="btn-eval btn-reset" onclick="resetInterviewEval('${application.id}', '${dept.type}')">
                        <i class="fas fa-undo" style="font-size:11px;"></i> Đặt lại
                    </button>
                `}
            </div>
            ${dept.by ? `<div class="eval-by"><i class="fas fa-user-check" style="font-size:11px;"></i> Đánh giá bởi ${dept.by}</div>` : ''}
        `;
        
        container.appendChild(box);
    });
}

// ============================================================
// RESET ĐÁNH GIÁ PHỎNG VẤN
// ============================================================

async function resetInterviewEval(appId, deptType) {
    const result = await Swal.fire({
        title: "Đặt lại đánh giá phỏng vấn?",
        text: "Thao tác này sẽ xóa kết quả Pass/Fail hiện tại.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Có, đặt lại",
        cancelButtonText: "Hủy"
    });
    
    if (!result.isConfirmed) return;
    
    try {
        const prefix = deptType === "priority" ? "priority" : "secondary";
        const update = {};
        
        // Reset trạng thái
        update[`${prefix}Accepted`] = false;
        update[`${prefix}Rejected`] = false;
        
        // Reset ghi chú và người đánh giá
        update[`${prefix}_interview_notes`] = "";
        update[`${prefix}_interview_evaluated_by`] = "";
        update[`${prefix}_interview_evaluated_at`] = null;
        
        // Cập nhật lại trạng thái tổng
        const app = applications.find(a => a.id === appId);
        if (app) {
            const status = computeInterviewOverallStatus({ ...app, ...update });
            update.status = status.status;
            update.interview_result = status.interviewResult;
        }
        
        await db.collection("applications").doc(appId).update(update);
        
        Swal.fire("Thành công", "Đã đặt lại đánh giá phỏng vấn.", "success");
        await loadApplications();
        showApplicationDetail(appId);
    } catch (e) {
        Swal.fire("Lỗi", e.message, "error");
    }
}

// ============================================================
// HÀM XỬ LÝ
// ============================================================

function getSubDeptDisplay(application, type) {
    if (type === "priority") {
        return (application.md_sub_departments || []).join(", ");
    }
    return (application.md_sub_departments_secondary || []).join(", ");
}

// ============================================================
// ĐÁNH GIÁ ĐƠN
// ============================================================

async function evalForm(appId, deptType, action) {
    const app = applications.find(a => a.id === appId);
    if (!app) return;
    
    const isP = deptType === "priority";
    const deptName = getDepartmentName(isP ? app.priority_position : app.secondary_position);
    
    if (!canActOnDepartment(app, deptType)) {
        Swal.fire("Lỗi", `Bạn không có quyền đánh giá ban ${deptName}.`, "error");
        return;
    }
    
    const actionText = action === "pass" ? "CHẤP NHẬN" : "TỪ CHỐI";
    const result = await Swal.fire({
        title: `Xác nhận ${actionText}`,
        text: `Bạn có chắc muốn ${action === "pass" ? "chấp nhận" : "từ chối"} ứng viên này cho ban ${deptName}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: `Có, ${action === "pass" ? "chấp nhận" : "từ chối"}`,
        cancelButtonText: "Hủy"
    });
    
    if (!result.isConfirmed) return;
    
    let notes = "";
    if (action === "fail") {
        const { value } = await Swal.fire({
            title: "Lý do từ chối",
            input: "textarea",
            inputPlaceholder: "Nhập lý do...",
            showCancelButton: true,
            confirmButtonText: "Xác nhận",
            cancelButtonText: "Hủy"
        });
        if (value === undefined) return;
        notes = value || "Không có lý do";
    }
    
    try {
        const prefix = isP ? "priority" : "secondary";
        const update = {};
        
        if (action === "pass") {
            update[`${prefix}Accepted`] = true;
            update[`${prefix}Rejected`] = false;
        } else {
            update[`${prefix}Rejected`] = true;
            update[`${prefix}Accepted`] = false;
            // 🔥 QUAN TRỌNG: lưu lý do từ chối đúng field
            update[`${prefix}RejectionReason`] = notes;
        }
        
        update[`${prefix}_evaluated_by`] = window.currentUserFullname || "Unknown";
        update[`${prefix}_evaluated_at`] = new Date();
        update[`${prefix}_notes`] = notes;
        update.status = computeOverallStatus({ ...app, ...update });
        
        await db.collection("applications").doc(appId).update(update);
        
        Swal.fire("Thành công", `Đã ${action === "pass" ? "chấp nhận" : "từ chối"} ứng viên cho ban ${deptName}.`, "success");
        await loadApplications();
        showApplicationDetail(appId);
    } catch (e) {
        Swal.fire("Lỗi", e.message, "error");
    }
}

// ============================================================
// ĐÁNH GIÁ PHỎNG VẤN
// ============================================================

async function evalInterview(appId, deptType, action) {
    const app = applications.find(a => a.id === appId);
    if (!app) return;
    
    const isP = deptType === "priority";
    const deptName = getDepartmentName(isP ? app.priority_position : app.secondary_position);
    
    if (!canActOnDepartment(app, deptType)) {
        Swal.fire("Lỗi", `Bạn không có quyền đánh giá ban ${deptName}.`, "error");
        return;
    }
    
    const { value: notes } = await Swal.fire({
        title: `${action === "pass" ? "Pass" : "Fail"} - ${deptName}`,
        input: "textarea",
        inputLabel: "Ghi chú đánh giá",
        inputPlaceholder: "Nhập đánh giá...",
        showCancelButton: true,
        confirmButtonText: "Xác nhận",
        cancelButtonText: "Hủy"
    });
    
    if (notes === undefined) return;
    
    try {
        const prefix = isP ? "priority" : "secondary";
        const update = {};
        
        if (action === "pass") {
            update[`${prefix}Accepted`] = true;
            update[`${prefix}Rejected`] = false;
        } else {
            update[`${prefix}Rejected`] = true;
            update[`${prefix}Accepted`] = false;
        }
        
        update[`${prefix}_interview_notes`] = notes || "";
        update[`${prefix}_interview_evaluated_by`] = window.currentUserFullname || "Unknown";
        update[`${prefix}_interview_evaluated_at`] = new Date();
        
        const status = computeInterviewOverallStatus({ ...app, ...update });
        update.status = status.status;
        update.interview_result = status.interviewResult;
        
        await db.collection("applications").doc(appId).update(update);
        
        Swal.fire("Thành công", `Đã ${action === "pass" ? "Pass" : "Fail"} ứng viên cho ban ${deptName}.`, "success");
        await loadApplications();
        showApplicationDetail(appId);
    } catch (e) {
        Swal.fire("Lỗi", e.message, "error");
    }
}

// ============================================================
// GHI CHÚ
// ============================================================

async function addFormNote(appId, deptType) {
    const app = applications.find(a => a.id === appId);
    if (!app) return;
    
    const isP = deptType === "priority";
    const deptName = getDepartmentName(isP ? app.priority_position : app.secondary_position);
    const current = isP ? (app.priority_notes || "") : (app.secondary_notes || "");
    
    const { value: notes } = await Swal.fire({
        title: `Ghi chú - ${deptName}`,
        input: "textarea",
        inputValue: current,
        inputPlaceholder: "Nhập ghi chú...",
        showCancelButton: true,
        confirmButtonText: "Lưu",
        cancelButtonText: "Hủy"
    });
    
    if (notes === undefined) return;
    
    try {
        const prefix = isP ? "priority" : "secondary";
        const update = {};
        update[`${prefix}_notes`] = notes || "";
        await db.collection("applications").doc(appId).update(update);
        Swal.fire("Thành công", "Đã lưu ghi chú.", "success");
        await loadApplications();
        showApplicationDetail(appId);
    } catch (e) {
        Swal.fire("Lỗi", e.message, "error");
    }
}

async function addInterviewNote(appId, deptType) {
    const app = applications.find(a => a.id === appId);
    if (!app) return;
    
    const isP = deptType === "priority";
    const deptName = getDepartmentName(isP ? app.priority_position : app.secondary_position);
    const current = isP ? (app.priority_interview_notes || "") : (app.secondary_interview_notes || "");
    
    const { value: notes } = await Swal.fire({
        title: `Ghi chú phỏng vấn - ${deptName}`,
        input: "textarea",
        inputValue: current,
        inputPlaceholder: "Nhập ghi chú...",
        showCancelButton: true,
        confirmButtonText: "Lưu",
        cancelButtonText: "Hủy"
    });
    
    if (notes === undefined) return;
    
    try {
        const prefix = isP ? "priority" : "secondary";
        const update = {};
        update[`${prefix}_interview_notes`] = notes || "";
        await db.collection("applications").doc(appId).update(update);
        Swal.fire("Thành công", "Đã lưu ghi chú.", "success");
        await loadApplications();
        showApplicationDetail(appId);
    } catch (e) {
        Swal.fire("Lỗi", e.message, "error");
    }
}

// ============================================================
// RESET
// ============================================================

async function resetFormEval(appId, deptType) {
    const result = await Swal.fire({
        title: "Đặt lại đánh giá?",
        text: "Thao tác này sẽ xóa kết quả đánh giá hiện tại.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Có, đặt lại",
        cancelButtonText: "Hủy"
    });
    
    if (!result.isConfirmed) return;
    
    try {
        const prefix = deptType === "priority" ? "priority" : "secondary";
        const update = {};
        update[`${prefix}Accepted`] = false;
        update[`${prefix}Rejected`] = false;
        // 🔥 THÊM: xóa cả lý do từ chối khi reset
        update[`${prefix}RejectionReason`] = "";
        update[`${prefix}_notes`] = "";
        update[`${prefix}_evaluated_by`] = "";
        update[`${prefix}_evaluated_at`] = null;
        await db.collection("applications").doc(appId).update(update);
        Swal.fire("Thành công", "Đã đặt lại đánh giá.", "success");
        await loadApplications();
        showApplicationDetail(appId);
    } catch (e) {
        Swal.fire("Lỗi", e.message, "error");
    }
}

// ============================================================
// HÀM LẤY TÊN TIỂU BAN
// ============================================================

function getSubDepartmentDisplay(application, type) {
    if (type === "priority") {
        return (application.md_sub_departments || []).join(", ");
    } else {
        return (application.md_sub_departments_secondary || []).join(", ");
    }
}

// CHÚ Ý: không gọi loadApplications trực tiếp khi load trang.
auth.onAuthStateChanged(async (user) => {
  if (user) {
    try {
      const snap = await db
        .collection("account")
        .where("email", "==", user.email)
        .limit(1)
        .get();

      if (!snap.empty) {
        const doc = snap.docs[0];
        const data = doc.data();

        userRole = data.role || userRole;
        userDept = data.department || userDept;
        window.currentUserFullname = doc.id;

        sessionStorage.setItem("role", userRole);
        sessionStorage.setItem("department", userDept);

        applyRoleUIRules();
        renderUserInfoBox(window.currentUserFullname);
      } else {
        await auth.signOut();
        window.location.href = "login.html";
        return;
      }
    } catch (e) {
      console.error("Lỗi khi lấy account:", e);
    }

    // ==== LOAD INTERVIEW & QUESTIONS TỪ FIREBASE ====
    await loadInterviewAndQuestions();
    
    // ==== LOAD APPLICATIONS ====
    await loadApplications();
    autoOpenApplicationFromUrl();
  } else {
    window.location.href = "login.html";
  }
});

function renderUserInfoBox(fullname) {
  const box = document.getElementById("user-info-box");
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
  if (userRole === "superadmin") return true;
  if (userRole === "admin") {
    const deptCode =
      departmentType === "priority"
        ? application.priority_position
        : application.secondary_position;
    return deptCode === userDept;
  }
  return false;
}

function applyRoleUIRules() {
  // --- Nút export ---
  const exportAllBtn = document.getElementById("export-all-btn");
  const exportByCandidateBtn = document.getElementById(
    "export-by-candidate-btn"
  );
  const exportDeptSelect = document.getElementById("export-department");

  if (userRole === "superadmin") {
    if (exportAllBtn) exportAllBtn.style.display = "inline-block";
    if (exportByCandidateBtn)
      exportByCandidateBtn.style.display = "inline-block";
    if (exportDeptSelect) exportDeptSelect.disabled = false;
  } else if (userRole === "admin") {
    if (exportAllBtn) exportAllBtn.style.display = "none";
    if (exportByCandidateBtn)
      exportByCandidateBtn.style.display = "inline-block";
    if (exportDeptSelect) {
      exportDeptSelect.disabled = false;
      Array.from(exportDeptSelect.options).forEach((opt) => {
        opt.disabled = opt.value !== userDept;
      });
      exportDeptSelect.value = userDept;
    }
  } else {
    // member
    if (exportAllBtn) exportAllBtn.style.display = "none";
    if (exportByCandidateBtn) exportByCandidateBtn.style.display = "none";
    if (exportDeptSelect) exportDeptSelect.disabled = true;
  }

  // --- Menu khác (nếu có) ---
  const systemMenu = document.getElementById("system-settings-menu");
  if (systemMenu) {
    systemMenu.style.display = userRole === "superadmin" ? "block" : "none";
  }

  // --- Các nút hành động khác ---
  if (userRole === "member") {
    document
      .querySelectorAll(
        ".action-button, .export-btn, .mark-reviewed-btn, .export-option-btn"
      )
      .forEach((e) => (e.style.display = "none"));
  } else if (userRole === "superadmin") {
    document
      .querySelectorAll(
        ".export-option-btn, .export-btn, .action-button, .mark-reviewed-btn"
      )
      .forEach((e) => (e.style.display = "inline-block"));
  }
}

// Hàm tải danh sách ứng viên
async function loadApplications() {
  try {
    let snapshot;

    if (userRole === "superadmin") {
      snapshot = await db
        .collection("applications")
        .orderBy("timestamp", "desc")
        .get();
    } else if (userRole === "admin" || userRole === "member") {
      // Admin + Member chỉ xem ứng viên thuộc ban của mình
      try {
        snapshot = await db
          .collection("applications")
          .where("all_departments", "array-contains", userDept)
          .orderBy("timestamp", "desc")
          .get();
      } catch (err) {
        console.warn(
          "Không query được bằng all_departments, fallback filter client-side",
          err
        );
        const allSnap = await db
          .collection("applications")
          .orderBy("timestamp", "desc")
          .get();
        // Fallback: filter theo ban client-side
        applications = [];
        allSnap.forEach((doc) => {
          const data = doc.data();
          if (
            data.priority_position === userDept ||
            data.secondary_position === userDept
          ) {
            applications.push({
              id: doc.id,
              status: data.status || "new",
              ...data,
            });
          }
        });
        renderApplications();
        return;
      }
    }

    applications = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      applications.push({
        id: doc.id,
        status: data.status || "new",
        ...data,
      });
    });

    renderApplications();
  } catch (error) {
    console.error("Error loading applications:", error);
    Swal.fire(
      "Lỗi",
      "Không thể tải danh sách ứng viên: " + error.message,
      "error"
    );
  }
}

// Hàm hiển thị tên ban kèm tiểu ban (nếu có)
function getDepartmentDisplayText(application, type) {
  const deptCode =
    type === "priority"
      ? application.priority_position
      : application.secondary_position;
  let displayText = getDepartmentName(deptCode);

  // Thêm tiểu ban nếu là Ban Truyền thông (MD)
  if (deptCode === "MD") {
    const subDepts =
      type === "priority"
        ? application.md_sub_departments
        : application.md_sub_departments_secondary;

    if (subDepts && subDepts.length > 0) {
      displayText += ` (${subDepts.join(", ")})`;
    }
  }

  return displayText;
}

// Hàm hiển thị danh sách ứng viên
function renderApplications() {
  const applicationsList = document.getElementById("applications-list");
  const noApplications = document.getElementById("no-applications");

  if (!applicationsList) {
    console.error("Missing #applications-list element in DOM");
    return;
  }

  // Lọc theo bộ lọc
  const departmentFilter = document.getElementById("filter-department")?.value;
  const statusFilter = document.getElementById("filter-status")?.value;
  const typeFilter = document.getElementById("filter-type")?.value;
  const searchText =
    document.getElementById("search-input")?.value?.toLowerCase() || "";

  const filteredApplications = applications.filter((app) => {
    // Lọc theo ban (cả ưu tiên và dự bị)
    if (
      departmentFilter &&
      app.priority_position !== departmentFilter &&
      app.secondary_position !== departmentFilter
    ) {
      return false;
    }

    // Lọc theo trạng thái (dùng trạng thái tổng)
    if (statusFilter && computeOverallStatus(app) !== statusFilter)
      return false;

    // Lọc theo hình thức
    if (typeFilter && app.application_type !== typeFilter) return false;

    // Lọc theo tìm kiếm
    if (
      searchText &&
      !(
        (app.fullname || "").toLowerCase().includes(searchText) ||
        (app.email || "").toLowerCase().includes(searchText) ||
        (app.phone || "").toLowerCase().includes(searchText)
      )
    )
      return false;

    return true;
  });

  // Clear list (không xóa #no-applications vì nó ở ngoài)
  applicationsList.innerHTML = "";

  if (filteredApplications.length === 0) {
    if (noApplications) noApplications.style.display = "block";
    return;
  } else {
    if (noApplications) noApplications.style.display = "none";
  }

  filteredApplications.forEach((app) => {
    const appCard = document.createElement("div");
    appCard.className = "application-card";
    appCard.onclick = () => showApplicationDetail(app.id);

    const appDate = app.timestamp
      ? app.timestamp.toDate
        ? app.timestamp.toDate()
        : new Date(app.timestamp)
      : new Date();
    const formattedDate = appDate.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const overallStatus = computeOverallStatus(app);
    const statusInfo = getStatusInfo(overallStatus);

    // Hiển thị cả ban ưu tiên và dự bị (nếu có) cùng tiểu ban
    let departmentInfo = getDepartmentDisplayText(app, "priority");
    if (app.secondary_position && app.secondary_position !== "None") {
      departmentInfo += ` / ${getDepartmentDisplayText(app, "secondary")}`;
    }

    appCard.innerHTML = `
            <div class="application-card-header">
                <div class="applicant-name">${
                  app.fullname || "Chưa có tên"
                }</div>
                <div class="application-date">${formattedDate}</div>
            </div>
            <div class="application-details">
                <div class="detail-item">
                    <span class="detail-label">Email</span>
                    <span class="detail-value">${
                      app.email || "Chưa cung cấp"
                    }</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Số điện thoại</span>
                    <span class="detail-value">${
                      app.phone || "Chưa cung cấp"
                    }</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Ban ứng tuyển</span>
                    <span class="detail-value">${departmentInfo}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Trạng thái</span>
                    <span class="application-status ${statusInfo.class}">${
      statusInfo.text
    }</span>
                </div>
            </div>
        `;
    applicationsList.appendChild(appCard);
  });
}

// Hàm lấy thông tin trạng thái
function getStatusInfo(status) {
  switch (status) {
    case "reviewed":
      return { class: "status-reviewed", text: "Đã xem" };
    case "accepted":
      return { class: "status-accepted", text: "Chấp nhận" };
    case "rejected":
      return { class: "status-rejected", text: "Từ chối" };
    default:
      return { class: "status-new", text: "Mới" };
  }
}

// Hàm đánh dấu ứng viên đã xem
async function markAsReviewed() {
  if (!currentApplicationId) return;
  const application = applications.find(
    (app) => app.id === currentApplicationId
  );
  if (!application) return;

  // Chỉ superadmin hoặc admin của ít nhất 1 ban của ứng viên mới mark reviewed
  const canMark =
    userRole === "superadmin" ||
    (userRole === "admin" &&
      (application.priority_position === userDept ||
        application.secondary_position === userDept));
  if (!canMark) {
    Swal.fire(
      "Không có quyền",
      "Bạn không có quyền đánh dấu ứng viên này là đã xem.",
      "error"
    );
    return;
  }

  // chỉ mark khi status là 'new'
  if (application.status !== "new") return;

  try {
    // 🔥 THÊM try-catch để xử lý lỗi
    await db.collection("applications").doc(currentApplicationId).update({
      status: "reviewed",
      updatedAt: new Date(),
    });

    const appIndex = applications.findIndex(
      (app) => app.id === currentApplicationId
    );
    if (appIndex !== -1) {
      applications[appIndex].status = "reviewed";
    }

    // 🔥 THÊM thông báo thành công
    Swal.fire("Thành công", "Đã đánh dấu ứng viên là đã xem", "success");

    renderApplications();
    showApplicationDetail(currentApplicationId);
  } catch (error) {
    // 🔥 THÊM xử lý lỗi
    console.error("Lỗi khi đánh dấu đã xem:", error);
    Swal.fire(
      "Lỗi",
      "Không thể cập nhật trạng thái: " + error.message,
      "error"
    );
  }
}

function canActOnDepartment(application, departmentType) {
  if (!application) return false;
  // Super admin: làm gì cũng được
  if (userRole === "superadmin") return true;
  // Admin: chỉ nếu ban ứng viên trùng với ban admin
  if (userRole === "admin") {
    const deptCode =
      departmentType === "priority"
        ? application.priority_position
        : application.secondary_position;
    return deptCode === userDept;
  }
  // Member: không có quyền hành động
  return false;
}

// ============================================================
// HIỂN THỊ CHI TIẾT ỨNG VIÊN - VERSION MỚI
// ============================================================

function showApplicationDetail(appId) {
  const application = applications.find((app) => app.id === appId);
  if (!application) return;

  if (!canViewAnyDepartment(application) && userRole !== "superadmin") {
    Swal.fire("Lỗi", "Bạn không có quyền xem ứng viên này.", "error");
    hideDetailView();
    return;
  }

  currentApplicationId = appId;

  document.getElementById("detail-applicant-name").textContent =
    application.fullname || "Ứng viên";

  const detailSections = document.getElementById("detail-sections");
  detailSections.innerHTML = "";

  // ============================================================
  // 1. THÔNG TIN CÁ NHÂN
  // ============================================================
  renderPersonalInfo(application, detailSections);

  // ============================================================
  // 2. THÔNG TIN ỨNG TUYỂN - THEO TẦNG
  // ============================================================
  renderApplicationInfo(application, detailSections);

  // ============================================================
  // 3. XỬ LÝ THEO HÌNH THỨC ỨNG TUYỂN
  // ============================================================
  if (application.application_type === "form") {
    // ---- 3a. CÂU TRẢ LỜI CHUNG ----
    renderGeneralAnswers(application, detailSections);

    // ---- 3b. CÂU TRẢ LỜI BAN ƯU TIÊN (chỉ hiển thị nếu admin được xem ban đó) ----
    if (application.priority_position && canViewDepartment(application, "priority")) {
      renderBanAnswers(application, "priority", detailSections);
    }

    // ---- 3c. CÂU TRẢ LỜI BAN DỰ BỊ (chỉ hiển thị nếu admin được xem ban đó) ----
    if (application.secondary_position && application.secondary_position !== "None" && 
        canViewDepartment(application, "secondary")) {
      renderBanAnswers(application, "secondary", detailSections);
    }

  } else {
    // ---- HÌNH THỨC PHỎNG VẤN ----
    renderInterviewInfo(application, detailSections);
  }

  // ============================================================
  // 4. ĐÁNH GIÁ THEO BAN (GỘP TẤT CẢ VÀO ĐÂY)
  // ============================================================
  renderEvaluationSection(application, detailSections);

  // Hiển thị view chi tiết
  document.getElementById("applications-list").style.display = "none";
  document.getElementById("application-detail").style.display = "block";
}

// ============================================================
// RENDER THÔNG TIN CÁ NHÂN
// ============================================================

function renderPersonalInfo(application, container) {
  const section = document.createElement("div");
  section.className = "detail-section";
  
  let html = `
    <h3><i class="fas fa-user"></i> Thông tin cá nhân</h3>
    <div class="app-info-grid">
      <div class="app-info-row">
        <div class="app-info-item">
          <span class="app-label">Họ và tên</span>
          <span class="app-value">${application.fullname || "Chưa cung cấp"}</span>
        </div>
        <div class="app-info-item">
          <span class="app-label">Email</span>
          <span class="app-value">${application.email || "Chưa cung cấp"}</span>
        </div>
      </div>
      <div class="app-info-row">
        <div class="app-info-item">
          <span class="app-label">Số điện thoại</span>
          <span class="app-value">${application.phone || "Chưa cung cấp"}</span>
        </div>
        <div class="app-info-item">
          <span class="app-label">Facebook</span>
          <span class="app-value">${application.facebook ? `<a href="${application.facebook}" target="_blank" class="facebook-badge"><i class="fab fa-facebook"></i> Facebook</a>` : "Chưa cung cấp"}</span>
        </div>
      </div>
      <div class="app-info-row">
        <div class="app-info-item">
          <span class="app-label">Ngày sinh</span>
          <span class="app-value">${application.birthdate || "Chưa cung cấp"}</span>
        </div>
        <div class="app-info-item">
          <span class="app-label">Giới tính</span>
          <span class="app-value">${application.gender || "Chưa cung cấp"}</span>
        </div>
      </div>
      <div class="app-info-row">
        <div class="app-info-item">
          <span class="app-label">Trường</span>
          <span class="app-value">${application.school || "Chưa cung cấp"}</span>
        </div>
        <div class="app-info-item">
          <span class="app-label">Chuyên ngành</span>
          <span class="app-value">${application.major || "Chưa cung cấp"}</span>
        </div>
      </div>
    </div>
  `;
  
  section.innerHTML = html;
  container.appendChild(section);
}

// ============================================================
// RENDER THÔNG TIN ỨNG TUYỂN - THEO TẦNG
// ============================================================

function renderApplicationInfo(application, container) {
  const section = document.createElement("div");
  section.className = "detail-section";
  
  let html = `
    <h3><i class="fas fa-briefcase"></i> Thông tin ứng tuyển</h3>
    <div class="app-info-grid">
      <!-- Dòng 1: Hình thức + Trạng thái tổng -->
      <div class="app-info-row">
        <div class="app-info-item">
          <span class="app-label">Hình thức ứng tuyển</span>
          <span class="app-value">${application.application_type === "form" ? "Điền đơn" : "Phỏng vấn"}</span>
        </div>
        <div class="app-info-item">
          <span class="app-label">Trạng thái tổng</span>
          <span class="status-indicator ${getStatusInfo(computeOverallStatus(application)).class}">
            ${getStatusInfo(computeOverallStatus(application)).text}
          </span>
        </div>
      </div>
  `;

  // ---- BAN ƯU TIÊN ----
  if (application.priority_position && application.priority_position !== "None") {
    const priorityStatus = getDepartmentStatus(application, "priority");
    const deptName = getDepartmentName(application.priority_position);
    const subDisplay = application.priority_position === "MD" 
      ? (application.md_sub_departments || []).join(", ") 
      : "";
    
    html += `
      <div class="app-info-divider"></div>
      <div class="app-info-row">
        <div class="app-info-item">
          <span class="app-label">Ban ưu tiên</span>
          <span class="app-value dept-name priority">
            <i class="fas fa-star" style="font-size:12px;color:#3b82f6;"></i>
            ${deptName} ${subDisplay ? `(${subDisplay})` : ''}
          </span>
        </div>
        <div class="app-info-item">
          <span class="app-label">Trạng thái</span>
          <span class="dept-status ${priorityStatus.class}">${priorityStatus.text}</span>
        </div>
        ${priorityStatus.reason ? `
          <div class="app-info-item full-width">
            <span class="app-label">Lý do</span>
            <span class="app-value reason">${priorityStatus.reason}</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  // ---- BAN DỰ BỊ ----
  if (application.secondary_position && application.secondary_position !== "None") {
    const secondaryStatus = getDepartmentStatus(application, "secondary");
    const deptName = getDepartmentName(application.secondary_position);
    const subDisplay = application.secondary_position === "MD" 
      ? (application.md_sub_departments_secondary || []).join(", ") 
      : "";
    
    html += `
      <div class="app-info-divider"></div>
      <div class="app-info-row">
        <div class="app-info-item">
          <span class="app-label">Ban dự bị</span>
          <span class="app-value dept-name secondary">
            <i class="fas fa-clock" style="font-size:12px;color:#f59e0b;"></i>
            ${deptName} ${subDisplay ? `(${subDisplay})` : ''}
          </span>
        </div>
        <div class="app-info-item">
          <span class="app-label">Trạng thái</span>
          <span class="dept-status ${secondaryStatus.class}">${secondaryStatus.text}</span>
        </div>
        ${secondaryStatus.reason ? `
          <div class="app-info-item full-width">
            <span class="app-label">Lý do</span>
            <span class="app-value reason">${secondaryStatus.reason}</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  // ---- BAN ĐƯỢC CHẤP NHẬN ----
  const accepted = getAcceptedDepartments(application);
  html += `
    <div class="app-info-divider"></div>
    <div class="app-info-row">
      <div class="app-info-item full-width">
        <span class="app-label">Ban được chấp nhận</span>
        <span class="app-value accepted">${accepted || "Chưa có"}</span>
      </div>
    </div>
  `;

  // ---- GHI CHÚ CHUNG (nếu có) ----
  if (application.note) {
    html += `
      <div class="app-info-divider"></div>
      <div class="app-info-row">
        <div class="app-info-item full-width">
          <span class="app-label">Ghi chú chung</span>
          <span class="app-value note">${application.note}</span>
        </div>
      </div>
    `;
  }

  html += `</div>`;
  section.innerHTML = html;
  container.appendChild(section);
}

// ============================================================
// LẤY TRẠNG THÁI CỦA TỪNG BAN
// ============================================================

function getDepartmentStatus(application, type) {
    const isPriority = type === "priority";
    const accepted = isPriority ? application.priorityAccepted : application.secondaryAccepted;
    const rejected = isPriority ? application.priorityRejected : application.secondaryRejected;
    
    // 🔥 SỬA: đọc đúng field lý do từ chối
    const reason = isPriority 
        ? (application.priorityRejectionReason || application.priority_rejection_reason || "") 
        : (application.secondaryRejectionReason || application.secondary_rejection_reason || "");
    
    if (accepted) {
        return { text: "Đã chấp nhận", class: "status-passed", reason: null };
    } else if (rejected) {
        return { text: "Đã từ chối", class: "status-failed", reason: reason || "Không có lý do" };
    }
    return { text: "Chưa đánh giá", class: "status-pending", reason: null };
}

// ============================================================
// KIỂM TRA QUYỀN XEM/ĐÁNH GIÁ BAN
// ============================================================

function canViewDepartment(application, deptType) {
  if (!application) return false;
  if (userRole === "superadmin") return true;
  if (userRole === "admin") {
    const deptCode = deptType === "priority" 
      ? application.priority_position 
      : application.secondary_position;
    return deptCode === userDept;
  }
  return false;
}

function canViewAnyDepartment(application) {
  if (!application) return false;
  if (userRole === "superadmin") return true;
  if (userRole === "admin") {
    return application.priority_position === userDept || 
           application.secondary_position === userDept;
  }
  return false;
}

// ============================================================
// RENDER CÂU TRẢ LỜI CHUNG
// ============================================================

function renderGeneralAnswers(application, container) {
  // Helper lấy câu trả lời
  function resolveGeneralAnswer(app, question, index) {
    const directKey = `general_${question.id}`;
    if (app[directKey] !== undefined && app[directKey] !== null && app[directKey] !== "")
      return app[directKey];

    const systemKeys = new Set([
      'general_questions', 'general_info', 'general_status',
      'general_notes', 'general_comment'
    ]);
    const generalKeys = Object.keys(app)
      .filter(k => k.startsWith('general_') && !systemKeys.has(k))
      .sort();

    if (generalKeys[index] !== undefined) {
      return app[generalKeys[index]];
    }
    return undefined;
  }

  const generalKeys = Object.keys(application)
    .filter(k => k.startsWith('general_') &&
      !['general_questions','general_info','general_status','general_notes','general_comment'].includes(k));

  const hasGeneralAnswers = generalQuestions.length > 0 && generalKeys.length > 0;

  if (!hasGeneralAnswers) return;

  const section = document.createElement("div");
  section.className = "detail-section";
  section.innerHTML = '<h3><i class="fas fa-comments"></i> Câu trả lời chung</h3>';

  generalQuestions.forEach((q, idx) => {
    const answer = resolveGeneralAnswer(application, q, idx);
    const displayAnswer = (answer !== undefined && answer !== null && answer !== "")
      ? answer : "Chưa trả lời";

    const questionItem = document.createElement("div");
    questionItem.className = "question-item";

    let html = `<div class="question-text">${q.text || q.question || ""}</div>`;

    if (q.media) {
      if (q.media.type === "image") {
        html += `<div class="question-media"><img src="${q.media.url}" alt="${q.media.alt || ""}" class="question-img"></div>`;
      } else if (q.media.type === "video") {
        html += `<div class="question-media"><video src="${q.media.url}" controls class="question-video"></video></div>`;
      }
    }

    html += `<div class="answer-text">${formatAnswer(displayAnswer, q.type)}</div>`;
    questionItem.innerHTML = html;
    section.appendChild(questionItem);
  });

  container.appendChild(section);
}

// ============================================================
// RENDER CÂU TRẢ LỜI THEO BAN
// ============================================================

function renderBanAnswers(application, type, container) {
  const banCode = type === "priority" ? application.priority_position : application.secondary_position;
  if (!banCode || banCode === "None") return;

  const section = document.createElement("div");
  section.className = "detail-section";

  const deptName = getDepartmentName(banCode);
  const label = type === "priority" ? "Ưu tiên" : "Dự bị";
  
  let title = `<h3><i class="fas ${type === 'priority' ? 'fa-star' : 'fa-clock'}"></i> Câu trả lời cho ${deptName} (${label})</h3>`;
  
  if (type === "priority" && application.priorityRejected) {
    title = `<h3><i class="fas fa-star" style="color: #991b1b;"></i> Câu trả lời cho ${deptName} (${label} - Đã từ chối)</h3>`;
  } else if (type === "priority" && application.priorityAccepted) {
    title = `<h3><i class="fas fa-star" style="color: #166534;"></i> Câu trả lời cho ${deptName} (${label} - Đã chấp nhận)</h3>`;
  } else if (type === "secondary" && application.secondaryRejected) {
    title = `<h3><i class="fas fa-clock" style="color: #991b1b;"></i> Câu trả lời cho ${deptName} (${label} - Đã từ chối)</h3>`;
  } else if (type === "secondary" && application.secondaryAccepted) {
    title = `<h3><i class="fas fa-clock" style="color: #166534;"></i> Câu trả lời cho ${deptName} (${label} - Đã chấp nhận)</h3>`;
  }
  
  section.innerHTML = title;
  renderBanSpecificAnswers(application, type, section);
  container.appendChild(section);
}

// ============================================================
// RENDER NÚT HÀNH ĐỘNG CHO ĐƠN
// ============================================================

function renderFormActions(application, container) {
  // Ban ưu tiên
  if (application.priority_position && canActOnDepartment(application, "priority")) {
    const section = document.createElement("div");
    section.className = "detail-section";
    section.innerHTML = `<h3><i class="fas fa-gavel"></i> Đánh giá ban ưu tiên</h3>`;
    
    const actions = document.createElement("div");
    actions.className = "action-buttons";
    actions.innerHTML = `
      <button class="action-button btn-accept" onclick="acceptDepartment('priority')">
        <i class="fas fa-check"></i> Chấp nhận
      </button>
      <button class="action-button btn-reject" onclick="rejectDepartment('priority')">
        <i class="fas fa-times"></i> Từ chối
      </button>
      <button class="action-button btn-notes" onclick="addFormNote('${application.id}', 'priority')">
        <i class="fas fa-pen"></i> Ghi chú
      </button>
    `;
    section.appendChild(actions);
    container.appendChild(section);
  }

  // Ban dự bị
  if (application.secondary_position && application.secondary_position !== "None" && 
      canActOnDepartment(application, "secondary")) {
    const section = document.createElement("div");
    section.className = "detail-section";
    section.innerHTML = `<h3><i class="fas fa-gavel"></i> Đánh giá ban dự bị</h3>`;
    
    const actions = document.createElement("div");
    actions.className = "action-buttons";
    actions.innerHTML = `
      <button class="action-button btn-accept" onclick="acceptDepartment('secondary')">
        <i class="fas fa-check"></i> Chấp nhận
      </button>
      <button class="action-button btn-reject" onclick="rejectDepartment('secondary')">
        <i class="fas fa-times"></i> Từ chối
      </button>
      <button class="action-button btn-notes" onclick="addFormNote('${application.id}', 'secondary')">
        <i class="fas fa-pen"></i> Ghi chú
      </button>
    `;
    section.appendChild(actions);
    container.appendChild(section);
  }
}

// ============================================================
// RENDER THÔNG TIN PHỎNG VẤN
// ============================================================

function renderInterviewInfo(application, container) {
  const section = document.createElement("div");
  section.className = "detail-section";

  let html = `
    <h3><i class="fas fa-calendar-alt"></i> Thông tin phỏng vấn</h3>
    <div class="app-info-grid">
      <div class="app-info-row">
        <div class="app-info-item">
          <span class="app-label">Hình thức</span>
          <span class="app-value">Phỏng vấn trực tiếp</span>
        </div>
      </div>
  `;

  // Lịch phỏng vấn đã chọn
  let hasInterviewData = false;
  if (interview && interview.length > 0) {
    interview.forEach((day) => {
      const dayData = application[day.id];
      if (dayData && Array.isArray(dayData) && dayData.length > 0) {
        hasInterviewData = true;
        let scheduleHTML = '<div style="display:flex;flex-direction:column;gap:4px;margin-top:4px;">';
        dayData.forEach(slot => {
          scheduleHTML += `<div style="padding:4px 10px;background:#f8fafc;border-radius:4px;font-size:13px;border-left:3px solid #3b82f6;">${slot}</div>`;
        });
        scheduleHTML += '</div>';
        
        html += `
          <div class="app-info-row">
            <div class="app-info-item full-width">
              <span class="app-label">${day.question}</span>
              <span class="app-value">${scheduleHTML}</span>
            </div>
          </div>
        `;
      }
    });
  }

  if (!hasInterviewData) {
    html += `
      <div class="app-info-row">
        <div class="app-info-item">
          <span class="app-label">Lịch đã chọn</span>
          <span class="app-value" style="color: #991b1b;">Chưa chọn lịch phỏng vấn</span>
        </div>
      </div>
    `;
  }

  html += `</div>`;
  section.innerHTML = html;
  container.appendChild(section);
}

// ============================================================
// RENDER NÚT HÀNH ĐỘNG CHO PHỎNG VẤN
// ============================================================

function renderInterviewActions(application, container) {
  // Ban ưu tiên
  if (application.priority_position && canActOnDepartment(application, "priority")) {
    const section = document.createElement("div");
    section.className = "detail-section";
    
    const isAccepted = application.priorityAccepted;
    const isRejected = application.priorityRejected;
    let statusText = "Chưa đánh giá";
    let statusColor = "#92400e";
    if (isAccepted) { statusText = "Pass"; statusColor = "#166534"; }
    else if (isRejected) { statusText = "Fail"; statusColor = "#991b1b"; }
    
    section.innerHTML = `
      <h3><i class="fas fa-gavel"></i> Đánh giá phỏng vấn - ${getDepartmentName(application.priority_position)} (Ưu tiên)</h3>
      <div style="margin-bottom:12px;font-size:14px;color:${statusColor};font-weight:500;">
        Trạng thái: ${statusText}
      </div>
    `;
    
    const actions = document.createElement("div");
    actions.className = "action-buttons";
    
    if (!isAccepted && !isRejected) {
      actions.innerHTML = `
        <button class="action-button btn-accept" onclick="evalInterview('${application.id}', 'priority', 'pass')">
          <i class="fas fa-check"></i> Pass
        </button>
        <button class="action-button btn-reject" onclick="evalInterview('${application.id}', 'priority', 'fail')">
          <i class="fas fa-times"></i> Fail
        </button>
      `;
    } else {
      actions.innerHTML = `
        <button class="action-button btn-notes" onclick="addInterviewNote('${application.id}', 'priority')">
          <i class="fas fa-pen"></i> Ghi chú
        </button>
        <button class="action-button btn-reset" onclick="resetInterviewEval('${application.id}', 'priority')">
          <i class="fas fa-undo"></i> Đặt lại
        </button>
      `;
    }
    
    section.appendChild(actions);
    container.appendChild(section);
  }

  // Ban dự bị
  if (application.secondary_position && application.secondary_position !== "None" && 
      canActOnDepartment(application, "secondary")) {
    const section = document.createElement("div");
    section.className = "detail-section";
    
    const isAccepted = application.secondaryAccepted;
    const isRejected = application.secondaryRejected;
    let statusText = "Chưa đánh giá";
    let statusColor = "#92400e";
    if (isAccepted) { statusText = "Pass"; statusColor = "#166534"; }
    else if (isRejected) { statusText = "Fail"; statusColor = "#991b1b"; }
    
    section.innerHTML = `
      <h3><i class="fas fa-gavel"></i> Đánh giá phỏng vấn - ${getDepartmentName(application.secondary_position)} (Dự bị)</h3>
      <div style="margin-bottom:12px;font-size:14px;color:${statusColor};font-weight:500;">
        Trạng thái: ${statusText}
      </div>
    `;
    
    const actions = document.createElement("div");
    actions.className = "action-buttons";
    
    if (!isAccepted && !isRejected) {
      actions.innerHTML = `
        <button class="action-button btn-accept" onclick="evalInterview('${application.id}', 'secondary', 'pass')">
          <i class="fas fa-check"></i> Pass
        </button>
        <button class="action-button btn-reject" onclick="evalInterview('${application.id}', 'secondary', 'fail')">
          <i class="fas fa-times"></i> Fail
        </button>
      `;
    } else {
      actions.innerHTML = `
        <button class="action-button btn-notes" onclick="addInterviewNote('${application.id}', 'secondary')">
          <i class="fas fa-pen"></i> Ghi chú
        </button>
        <button class="action-button btn-reset" onclick="resetInterviewEval('${application.id}', 'secondary')">
          <i class="fas fa-undo"></i> Đặt lại
        </button>
      `;
    }
    
    section.appendChild(actions);
    container.appendChild(section);
  }
}

// Thêm ghi chú phỏng vấn
async function addInterviewNotes() {
  if (!currentApplicationId) return;

  const application = applications.find(
    (app) => app.id === currentApplicationId
  );
  if (!application || application.application_type !== "interview") return;

  const { value: notes } = await Swal.fire({
    title: "Thêm ghi chú phỏng vấn",
    input: "textarea",
    inputLabel: "Ghi chú",
    inputValue: application.interview_notes || "",
    inputPlaceholder: "Nhập ghi chú về buổi phỏng vấn...",
    showCancelButton: true,
    confirmButtonText: "Lưu",
    cancelButtonText: "Hủy",
  });

  if (notes !== undefined) {
    try {
      await db.collection("applications").doc(currentApplicationId).update({
        interview_notes: notes,
        interview_updated_at: new Date(),
      });

      // Cập nhật local data
      const appIndex = applications.findIndex(
        (app) => app.id === currentApplicationId
      );
      if (appIndex !== -1) {
        applications[appIndex].interview_notes = notes;
        applications[appIndex].interview_updated_at = new Date();
      }

      Swal.fire("Thành công", "Đã lưu ghi chú phỏng vấn", "success");
      showApplicationDetail(currentApplicationId);
    } catch (error) {
      console.error("Error saving interview notes:", error);
      Swal.fire("Lỗi", "Không thể lưu ghi chú", "error");
    }
  }
}

// Đánh giá kết quả phỏng vấn CHO TỪNG BAN - FIXED
async function evaluateInterview(result, departmentType = null) {
  if (!currentApplicationId) return;

  const application = applications.find(
    (app) => app.id === currentApplicationId
  );
  if (!application || application.application_type !== "interview") return;

  // Kiểm tra quyền trước
  let targetDepartment = departmentType;

  // Nếu không chỉ định departmentType, hỏi user muốn đánh giá ban nào
  if (!targetDepartment) {
    const departments = [];
    if (
      application.priority_position &&
      canActOnDepartment(application, "priority")
    ) {
      departments.push({
        value: "priority",
        text: `${getDepartmentName(application.priority_position)} (Ưu tiên)`,
      });
    }
    if (
      application.secondary_position &&
      application.secondary_position !== "None" &&
      canActOnDepartment(application, "secondary")
    ) {
      departments.push({
        value: "secondary",
        text: `${getDepartmentName(application.secondary_position)} (Dự bị)`,
      });
    }

    if (departments.length === 0) {
      Swal.fire(
        "Không có quyền",
        "Bạn không có quyền đánh giá ứng viên này.",
        "error"
      );
      return;
    }

    if (departments.length === 1) {
      targetDepartment = departments[0].value;
    } else {
      const { value: selectedDept } = await Swal.fire({
        title: "Chọn ban để đánh giá",
        input: "select",
        inputOptions: departments.reduce((options, dept) => {
          options[dept.value] = dept.text;
          return options;
        }, {}),
        showCancelButton: true,
        confirmButtonText: "Tiếp tục",
        cancelButtonText: "Hủy",
      });

      if (!selectedDept) return;
      targetDepartment = selectedDept;
    }
  }

  // KIỂM TRA QUYỀN LẠI SAU KHI ĐÃ XÁC ĐỊNH BAN
  if (!canActOnDepartment(application, targetDepartment)) {
    Swal.fire(
      "Không có quyền",
      "Bạn không có quyền đánh giá ứng viên cho ban này.",
      "error"
    );
    return;
  }

  const { value: notes } = await Swal.fire({
    title:
      result === "accepted"
        ? `Pass phỏng vấn - ${getDepartmentName(
            application[targetDepartment + "_position"]
          )}`
        : `Fail phỏng vấn - ${getDepartmentName(
            application[targetDepartment + "_position"]
          )}`,
    input: "textarea",
    inputLabel: "Ghi chú đánh giá",
    inputPlaceholder: "Nhập đánh giá chi tiết về ứng viên...",
    showCancelButton: true,
    confirmButtonText: "Xác nhận",
    cancelButtonText: "Hủy",
  });

  if (notes !== undefined) {
    try {
      const updateData = {
        interview_evaluated_at: new Date(),
        interview_evaluated_by: window.currentUserFullname || "Unknown",
      };

      // Cập nhật ghi chú theo ban
      if (targetDepartment === "priority") {
        updateData.priority_interview_notes = notes;
      } else {
        updateData.secondary_interview_notes = notes;
      }

      // Cập nhật trạng thái theo ban
      if (result === "accepted") {
        if (targetDepartment === "priority") {
          updateData.priorityAccepted = true;
          updateData.priorityRejected = false;
        } else {
          updateData.secondaryAccepted = true;
          updateData.secondaryRejected = false;
        }
      } else {
        if (targetDepartment === "priority") {
          updateData.priorityRejected = true;
          updateData.priorityAccepted = false;
          updateData.rejectionReason = notes || "Không phù hợp";
        } else {
          updateData.secondaryRejected = true;
          updateData.secondaryAccepted = false;
          updateData.rejectionReason = notes || "Không phù hợp";
        }
      }

      // Cập nhật trạng thái tổng dựa trên kết quả cả 2 ban
      const finalStatus = computeInterviewOverallStatus(
        application,
        updateData
      );
      updateData.status = finalStatus.status;
      updateData.interview_result = finalStatus.interviewResult;

      await db
        .collection("applications")
        .doc(currentApplicationId)
        .update(updateData);

      // Cập nhật local data
      const appIndex = applications.findIndex(
        (app) => app.id === currentApplicationId
      );
      if (appIndex !== -1) {
        Object.assign(applications[appIndex], updateData);
      }

      Swal.fire(
        "Thành công",
        `Đã ${
          result === "accepted" ? "chấp nhận" : "từ chối"
        } ứng viên cho ${getDepartmentName(
          application[targetDepartment + "_position"]
        )}`,
        "success"
      );
      showApplicationDetail(currentApplicationId);
    } catch (error) {
      console.error("Error evaluating interview:", error);
      Swal.fire("Lỗi", "Không thể cập nhật đánh giá phỏng vấn", "error");
    }
  }
}

// Hàm tính trạng thái tổng cho ứng viên phỏng vấn - NEW
function computeInterviewOverallStatus(application, updateData = {}) {
  // Kết hợp dữ liệu hiện tại và dữ liệu mới
  const currentData = { ...application, ...updateData };

  // Nếu có ít nhất một ban được chấp nhận -> accepted
  if (currentData.priorityAccepted || currentData.secondaryAccepted) {
    return { status: "accepted", interviewResult: "accepted" };
  }

  // Nếu cả hai ban đều bị từ chối -> rejected
  const hasPriority =
    currentData.priority_position && currentData.priority_position !== "None";
  const hasSecondary =
    currentData.secondary_position && currentData.secondary_position !== "None";

  if (hasPriority && hasSecondary) {
    if (currentData.priorityRejected && currentData.secondaryRejected) {
      return { status: "rejected", interviewResult: "rejected" };
    }
  } else if (hasPriority && currentData.priorityRejected) {
    return { status: "rejected", interviewResult: "rejected" };
  } else if (hasSecondary && currentData.secondaryRejected) {
    return { status: "rejected", interviewResult: "rejected" };
  }

  // Nếu có ít nhất một ban đã được đánh giá -> reviewed
  if (
    currentData.priorityAccepted ||
    currentData.priorityRejected ||
    currentData.secondaryAccepted ||
    currentData.secondaryRejected
  ) {
    return { status: "reviewed", interviewResult: "reviewed" };
  }

  // Mặc định là new
  return { status: "new", interviewResult: "pending" };
}

// Hàm hiển thị lịch phỏng vấn
function renderInterviewSchedule(application, container) {
  if (!application || application.application_type !== "interview") return;

  const interviewSection = document.createElement("div");
  interviewSection.className = "detail-section";

  let interviewHTML = `
        <h3><i class="fas fa-calendar-alt"></i> Lịch phỏng vấn đã chọn</h3>
        <div class="application-details">
    `;

  if (interview && interview.length > 0) {
    interview.forEach((day) => {
      const dayData = application[day.id];
      if (dayData && Array.isArray(dayData) && dayData.length > 0) {
        let scheduleHTML = '<div style="display:flex;flex-direction:column;gap:4px;">';
        dayData.forEach(slot => {
          scheduleHTML += `<div style="padding:4px 8px;background:var(--gray-100);border-radius:4px;font-size:13px;">${slot}</div>`;
        });
        scheduleHTML += '</div>';
        
        interviewHTML += `
          <div class="detail-item">
              <span class="detail-label">${day.question}</span>
              <span class="detail-value">${scheduleHTML}</span>
          </div>
        `;
      }
    });
  }

  // Nếu không có lịch nào được chọn
  let hasInterviewData = false;
  if (interview && interview.length > 0) {
    hasInterviewData = interview.some(
      (day) =>
        application[day.id] &&
        Array.isArray(application[day.id]) &&
        application[day.id].length > 0
    );
  }

  if (!hasInterviewData) {
    interviewHTML += `
      <div class="detail-item">
          <span class="detail-label">Lịch đã chọn</span>
          <span class="detail-value" style="color: var(--error);">Chưa chọn lịch phỏng vấn</span>
      </div>
    `;
  }

  interviewHTML += `</div>`;
  interviewSection.innerHTML = interviewHTML;
  container.appendChild(interviewSection);
}

// Hàm hiển thị câu trả lời đặc thù của từng ban
function renderBanSpecificAnswers(application, type, container) {
  const banCode =
    type === "priority"
      ? application.priority_position
      : application.secondary_position;
  if (!banCode || banCode === "None") return;

  // ── Helper resolve answer với index fallback ──────────────────────────────
  function resolveByIndex(app, prefix, question, index, banCodeArg, subArg) {
    // 1. Thử id trực tiếp
    const direct = getAnswer(app, prefix, question.id, subArg);
    if (direct !== undefined && direct !== null && direct !== "") return direct;

    // 2. Collect keys liên quan theo prefix + ban
    const banLower  = (banCodeArg || "").toLowerCase();
    const subLower  = (subArg || "").toLowerCase();
    const systemSuf = new Set([
      `${prefix}_status`, `${prefix}_position`,
      `${prefix}_interview_notes`, `${prefix}_accepted`, `${prefix}_rejected`
    ]);
    const knownBans = ["hr", "er", "pd", "md", "design", "content"];

    const candidates = Object.keys(app)
      .filter(k => {
        if (!k.startsWith(prefix + "_")) return false;
        if (systemSuf.has(k)) return false;
        const kl = k.toLowerCase();
        const hasKnownBan = knownBans.some(
          b => kl.includes(`_${b}_`) || kl.endsWith(`_${b}`)
        );
        if (hasKnownBan) {
          // key cũ kiểu priority_hr_qs1 → chỉ giữ nếu khớp ban/sub
          return kl.includes(`_${banLower}`) || (subLower && kl.includes(`_${subLower}`));
        }
        // key random (không chứa tên ban) → giữ lại
        return true;
      })
      .sort();

    return candidates[index] !== undefined ? app[candidates[index]] : undefined;
  }
  // ──────────────────────────────────────────────────────────────────────────

  if (banCode === "MD") {
    const subDepartments =
      type === "priority"
        ? application.md_sub_departments || []
        : application.md_sub_departments_secondary || [];

    if (!banQuestions["MD"]) {
        console.warn('[Response] banQuestions["MD"] chưa được load');
        return;
    }

    subDepartments.forEach((sub) => {
      const questions = banQuestions["MD"][sub] || [];
      questions.forEach((q, idx) => {
        const raw = resolveByIndex(application, type, q, idx, "MD", sub);
        const answer = (raw !== undefined && raw !== null && raw !== "")
          ? raw : "Chưa trả lời";
        const questionItem = document.createElement("div");
        questionItem.className = "question-item";
        let html = `<div class="question-text">${q.text || q.question || ""}</div>`;
        if (q.media && q.media.type === "image") {
          html += `<div class="question-media"><img src="${q.media.url}" alt="${
            q.media.alt || ""
          }"></div>`;
        }
        html += `<div class="answer-text">${formatAnswer(answer, q.type)}</div>`;
        questionItem.innerHTML = html;
        container.appendChild(questionItem);
      });
    });
    return;
  }

  const questions = banQuestions[banCode] || [];
  questions.forEach((q, idx) => {
    const raw = resolveByIndex(application, type, q, idx, banCode, null);
    const answer = (raw !== undefined && raw !== null && raw !== "")
      ? raw : "Chưa trả lời";
    const questionItem = document.createElement("div");
    questionItem.className = "question-item";
    questionItem.innerHTML = `
            <div class="question-text">${q.text || q.question || ""}</div>
            <div class="answer-text">${formatAnswer(answer, q.type)}</div>
        `;
    container.appendChild(questionItem);
  });
}

// Hàm định dạng câu trả lời
function formatAnswer(answer, type) {
  if (Array.isArray(answer)) {
    return answer.join(", ");
  }

  return answer;
}

// Ẩn view chi tiết
function hideDetailView() {
  document.getElementById("applications-list").style.display = "block";
  document.getElementById("application-detail").style.display = "none";
  currentApplicationId = null;
}

// Chấp nhận từng ban riêng biệt
async function acceptDepartment(departmentType) {
  if (!currentApplicationId) return;

  const application = applications.find(
    (app) => app.id === currentApplicationId
  );
  if (!application) return;

  // 👉 Check quyền
  if (!canActOnDepartment(application, departmentType)) {
    Swal.fire(
      "Không có quyền",
      "Bạn không có quyền chấp nhận ứng viên cho ban này.",
      "error"
    );
    return;
  }

  const confirmResult = await Swal.fire({
    title: "Xác nhận",
    text: `Bạn có chắc chắn muốn CHẤP NHẬN ứng viên này cho ban ${
      departmentType === "priority" ? "ưu tiên" : "dự bị"
    }?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Có, chấp nhận",
    cancelButtonText: "Hủy",
  });

  if (!confirmResult.isConfirmed) return;

  try {
    const updateData = {};
    if (departmentType === "priority") {
      updateData.priorityAccepted = true;
      updateData.priorityRejected = false;
      // 🟢 XÓA: Không tự động hủy ban dự bị
      // Ứng viên có thể được accept cả 2 ban
    } else {
      updateData.secondaryAccepted = true;
      updateData.secondaryRejected = false;
      // 🟢 XÓA: Không tự động hủy ban ưu tiên
      // Ứng viên có thể được accept cả 2 ban
    }

    await db
      .collection("applications")
      .doc(currentApplicationId)
      .update(updateData);

    Swal.fire("Thành công", "Ứng viên đã được CHẤP NHẬN.", "success");

    // 👉 Load lại danh sách và sau đó mở lại detail
    await loadApplications();
    showApplicationDetail(currentApplicationId);
  } catch (err) {
    console.error(err);
    Swal.fire("Lỗi", "Không thể cập nhật trạng thái: " + err.message, "error");
  }
}

// Từ chối từng ban riêng biệt
async function rejectDepartment(departmentType) {
  if (!currentApplicationId) return;

  const application = applications.find(
    (app) => app.id === currentApplicationId
  );
  if (!application) return;

  // 👉 Check quyền
  if (!canActOnDepartment(application, departmentType)) {
    Swal.fire(
      "Không có quyền",
      "Bạn không có quyền từ chối ứng viên cho ban này.",
      "error"
    );
    return;
  }

  const { value: reason } = await Swal.fire({
    title: "Nhập lý do từ chối",
    input: "text",
    inputPlaceholder: "Ví dụ: Không phù hợp với ban",
    showCancelButton: true,
    confirmButtonText: "Từ chối",
    cancelButtonText: "Hủy",
  });

  try {
    const updateData = {
      rejectionReason: reason || "Không có lý do",
    };

    if (departmentType === "priority") {
      updateData.priorityRejected = true;
      updateData.priorityAccepted = false;
    } else {
      updateData.secondaryRejected = true;
      updateData.secondaryAccepted = false;
    }

    await db
      .collection("applications")
      .doc(currentApplicationId)
      .update(updateData);

    Swal.fire("Thành công", "Ứng viên đã bị TỪ CHỐI.", "success");

    // 👉 Load lại danh sách và sau đó mở lại detail
    await loadApplications();
    showApplicationDetail(currentApplicationId);
  } catch (err) {
    console.error(err);
    Swal.fire("Lỗi", "Không thể cập nhật trạng thái: " + err.message, "error");
  }
}

function getAcceptedDepartments(app) {
  const accepted = [];
  if (app.priorityAccepted) {
    accepted.push(getDepartmentName(app.priority_position) + " (Ưu tiên)");
  }
  if (app.secondaryAccepted) {
    accepted.push(getDepartmentName(app.secondary_position) + " (Dự bị)");
  }
  return accepted.length > 0 ? accepted.join(" / ") : "Chưa có";
}

// Lấy tên ban từ mã
function getDepartmentName(code) {
  const departments = {
    MD: "Truyền thông",
    HR: "Nhân sự",
    ER: "Đối ngoại",
    PD: "Dự án",
  };

  return departments[code] || code;
}

function computeOverallStatus(app) {
    if (!app) return "new";
    
    // Kiểm tra trạng thái từng ban
    const priorityStatus = app.priorityAccepted ? "accepted" : (app.priorityRejected ? "rejected" : null);
    const secondaryStatus = app.secondaryAccepted ? "accepted" : (app.secondaryRejected ? "rejected" : null);
    
    // Nếu có ít nhất 1 ban được chấp nhận
    if (priorityStatus === "accepted" || secondaryStatus === "accepted") {
        return "accepted";
    }
    
    // Nếu cả 2 ban đều bị từ chối (hoặc 1 ban nếu chỉ có 1)
    const hasPriority = app.priority_position && app.priority_position !== "None";
    const hasSecondary = app.secondary_position && app.secondary_position !== "None";
    
    if (hasPriority && hasSecondary) {
        if (priorityStatus === "rejected" && secondaryStatus === "rejected") {
            return "rejected";
        }
    } else if (hasPriority && priorityStatus === "rejected") {
        return "rejected";
    } else if (hasSecondary && secondaryStatus === "rejected") {
        return "rejected";
    }
    
    // Nếu đã có đánh giá (chấp nhận hoặc từ chối ít nhất 1 ban)
    if (priorityStatus === "accepted" || priorityStatus === "rejected" || 
        secondaryStatus === "accepted" || secondaryStatus === "rejected") {
        return "reviewed";
    }
    
    return "new";
}

// Hiển thị modal export
function showExportOptions() {
  const exportDeptSelect = document.getElementById("export-department");
  if (exportDeptSelect) {
    if (userRole === "admin") {
      exportDeptSelect.value = userDept; // 👉 admin mặc định ban của mình
    } else if (userRole === "superadmin") {
      if (!exportDeptSelect.value && exportDeptSelect.options.length > 0) {
        exportDeptSelect.selectedIndex = 0; // 👉 superadmin mặc định option đầu
      }
    }
  }

  document.getElementById("export-modal").style.display = "block";
}

// Đóng modal export
function closeExportModal() {
  document.getElementById("export-modal").style.display = "none";
  document.getElementById("department-filter").style.display = "none";
}

// Xử lý export dữ liệu
function exportData(type) {
  switch (type) {
    case "all":
      exportAllData();
      break;
    case "personal":
      exportPersonalInfo();
      break;
    case "results":
      exportResults();
      break;
    case "byDepartment":
      if (userRole === "admin") {
        // tự động export ban của admin
        document.getElementById("export-department").value = userDept;
        document
          .getElementById("export-department")
          .dispatchEvent(new Event("change"));
      } else {
        // superadmin thì cho chọn
        document.getElementById("department-filter").style.display = "block";
      }
      break;
    case "byCandidate":
      exportByCandidate();
      break;
    case "personalWithResults":
      exportPersonalWithResults();
      break;
    case "interviewSchedule": // THÊM CASE MỚI CHO LỊCH PHỎNG VẤN
      exportInterviewSchedule();
      break;
  }
}

// Định dạng giá trị ngày (timestamp hoặc string) thành dd/MM/yyyy
function formatDateValue(val) {
  if (!val) return "";
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
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (e) {
    console.error("formatDateValue error", e, val);
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
function extractVoteCounts(app, prefix, sub) {
  const counts = {};
  if (!app) return counts;

  const keys = Object.keys(app || {});
  // heuristic: tất cả keys có chứa 'vote', 'voter', 'voted', 'voting', 'votes', 'voters'
  const voteKeys = keys.filter((k) =>
    /vote|voter|voted|voting|votes|voters/i.test(k)
  );

  // also check explicit keys related to prefix (e.g. priority_votes, secondary_votes)
  if (prefix) {
    const pref = prefix + "_votes";
    if (keys.includes(pref)) voteKeys.push(pref);
  }

  // helper to add count
  const add = (opt, n = 1) => {
    const key = String(opt ?? "Không xác định").trim();
    if (!key) return;
    counts[key] = (counts[key] || 0) + (Number.isFinite(n) ? n : 1);
  };

  for (const k of voteKeys) {
    let v = app[k];
    if (v === undefined || v === null) continue;

    // If sub provided, attempt to look into nested objects e.g. app.priority_votes?.[sub]
    if (sub && typeof v === "object" && v[sub] !== undefined) {
      v = v[sub];
    }

    // Arrays
    if (Array.isArray(v)) {
      if (v.length === 0) continue;
      const first = v[0];
      if (typeof first === "string" || typeof first === "number") {
        v.forEach((item) => add(item));
      } else if (typeof first === "object") {
        // array of vote objects: try fields option/choice/value
        v.forEach((item) => {
          const opt =
            item.option ||
            item.choice ||
            item.value ||
            item.vote ||
            JSON.stringify(item);
          add(opt);
        });
      }
      continue;
    }

    // Objects (map option -> array or option -> count)
    if (typeof v === "object") {
      Object.keys(v).forEach((opt) => {
        const val = v[opt];
        if (Array.isArray(val)) {
          add(opt, val.length);
        } else if (typeof val === "number") {
          add(opt, val);
        } else if (typeof val === "string") {
          // comma separated?
          add(opt, val.split(",").filter(Boolean).length);
        } else {
          // fallback count 1
          add(opt, 1);
        }
      });
      continue;
    }

    // String: maybe JSON or comma-separated list or single option
    if (typeof v === "string") {
      // try parse JSON
      try {
        const parsed = JSON.parse(v);
        if (Array.isArray(parsed)) {
          parsed.forEach((p) => add(p));
          continue;
        } else if (typeof parsed === "object") {
          Object.keys(parsed).forEach((opt) => {
            const val = parsed[opt];
            if (Array.isArray(val)) add(opt, val.length);
            else if (typeof val === "number") add(opt, val);
            else add(opt, 1);
          });
          continue;
        }
      } catch (e) {
        // not JSON
      }
      // comma-separated
      const parts = v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (parts.length > 1) {
        parts.forEach((p) => add(p));
      } else {
        add(v);
      }
      continue;
    }

    // Number or other -> skip
  }

  return counts;
}

function getAnswer(app, prefix, qid, sub) {
  if (!app || !prefix || !qid) return undefined;
  const candidates = [];

  // primary pattern: prefix_qid
  candidates.push(`${prefix}_${qid}`);

  // if sub provided, try prefix_sub_qid and variations
  if (sub) {
    const subLower = String(sub).toLowerCase();
    candidates.push(`${prefix}_${subLower}_${qid}`); // e.g. priority_content_platforms
    if (qid.startsWith(subLower + "_")) {
      candidates.push(`${prefix}_${qid.replace(subLower + "_", "")}`);
    }
  }

  // try direct candidates
  for (const c of candidates) {
    if (Object.prototype.hasOwnProperty.call(app, c)) return app[c];
  }

  // fallback: scan keys that start with prefix_ and match tokens of qid
  const qidParts = qid
    .split("_")
    .filter(Boolean)
    .map((s) => s.toLowerCase());
  const keys = Object.keys(app || {});
  for (const k of keys) {
    const low = k.toLowerCase();
    if (!low.startsWith(prefix + "_")) continue;
    let matched = true;
    for (const part of qidParts) {
      if (!low.includes(part)) {
        matched = false;
        break;
      }
    }
    if (matched) return app[k];
  }

  return undefined;
}

function renderVoteResults(container, counts, title = "Kết quả vote") {
  const entries = Object.entries(counts);
  if (!entries || entries.length === 0) {
    const msg = document.createElement("div");
    msg.className = "no-vote-data";
    msg.textContent = "Không tìm thấy dữ liệu vote.";
    container.appendChild(msg);
    return;
  }

  // sort desc
  entries.sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, e) => s + e[1], 0) || 0;

  const wrapper = document.createElement("div");
  wrapper.className = "vote-results";

  const heading = document.createElement("h4");
  heading.innerHTML = `<i class="fas fa-chart-bar"></i> ${title}`;
  wrapper.appendChild(heading);

  entries.forEach(([opt, cnt]) => {
    const pct = total ? Math.round((cnt / total) * 100) : 0;
    const item = document.createElement("div");
    item.className = "vote-item";

    const meta = document.createElement("div");
    meta.className = "vote-meta";
    meta.innerHTML = `<div class="vote-option">${opt}</div><div class="vote-count">${cnt} phiếu (${pct}%)</div>`;

    const barWrap = document.createElement("div");
    barWrap.className = "vote-bar-wrap";
    const bar = document.createElement("div");
    bar.className = "vote-bar";
    bar.style.width = `${pct}%`;
    barWrap.appendChild(bar);

    item.appendChild(meta);
    item.appendChild(barWrap);
    wrapper.appendChild(item);
  });

  container.appendChild(wrapper);
}

/* Summary-only object for "Tổng hợp" sheet (only basic info) */
function normalizeApplicationForSummary(app, index = 0) {
  return {
    STT: index + 1,
    "Họ và tên": app.fullname ?? "",
    Email: app.email ?? "",
    "Số điện thoại": app.phone ? `'${app.phone}` : "",
    Facebook: app.facebook ?? "",
    "Ngày sinh": app.birthdate ? `'${formatDateValue(app.birthdate)}` : "",
    "Giới tính": app.gender ?? "",
    Trường: app.school ?? "",
    "Chuyên ngành": app.major ?? "",
    "Hình thức ứng tuyển":
      app.application_type === "form" ? "Điền đơn" : "Phỏng vấn",
    "Ban ưu tiên": getDepartmentName(app.priority_position),
    "Ban dự bị":
      app.secondary_position && app.secondary_position !== "None"
        ? getDepartmentName(app.secondary_position)
        : "Không có",
    "Trạng thái": getStatusInfo(computeOverallStatus(app)).text,
    "Ban được chấp nhận": getAcceptedDepartments(app),
    "Ghi chú": app.note ?? "",
    "Lý do từ chối": app.rejectionReason ?? "",
    "Ngày ứng tuyển": app.timestamp ? `'${formatDateValue(app.timestamp)}` : "",
  };
}

/* Full normalize: summary + general questions + priority + secondary */
function normalizeApplicationForExport(app, index = 0) {
  const data = normalizeApplicationForSummary(app, index);

  // general questions
  if (
    typeof generalQuestions !== "undefined" &&
    Array.isArray(generalQuestions)
  ) {
    generalQuestions.forEach((q, i) => {
      const val = getAnswer(app, "general", q.id);
      data[`Câu hỏi chung ${i + 1} - ${q.question}`] = Array.isArray(val)
        ? val.join("; ")
        : val ?? "";
    });
  }

  // priority-specific:
  if (app.priority_position) {
    const code = app.priority_position;
    if (code === "MD") {
      const subs = app.md_sub_departments || [];
      subs.forEach((sub) => {
        const qList = (banQuestions["MD"] && banQuestions["MD"][sub]) || [];
        qList.forEach((q) => {
          const val = getAnswer(app, "priority", q.id, sub);
          data[`Ưu tiên ${sub} - ${q.question}`] = Array.isArray(val)
            ? val.join("; ")
            : val ?? "";
        });
      });
    } else {
      const qList = banQuestions[code] || [];
      qList.forEach((q) => {
        const val = getAnswer(app, "priority", q.id);
        data[`Ưu tiên - ${q.question}`] = Array.isArray(val)
          ? val.join("; ")
          : val ?? "";
      });
    }
  }

  // secondary-specific:
  if (app.secondary_position && app.secondary_position !== "None") {
    const code = app.secondary_position;
    if (code === "MD") {
      const subs = app.md_sub_departments_secondary || [];
      subs.forEach((sub) => {
        const qList = (banQuestions["MD"] && banQuestions["MD"][sub]) || [];
        qList.forEach((q) => {
          const val = getAnswer(app, "secondary", q.id, sub);
          data[`Dự bị ${sub} - ${q.question}`] = Array.isArray(val)
            ? val.join("; ")
            : val ?? "";
        });
      });
    } else {
      const qList = banQuestions[code] || [];
      qList.forEach((q) => {
        const val = getAnswer(app, "secondary", q.id);
        data[`Dự bị - ${q.question}`] = Array.isArray(val)
          ? val.join("; ")
          : val ?? "";
      });
    }
  }

  return data;
}

/* Format answer for UI */
function formatAnswer(answer, type) {
  if (answer === undefined || answer === null) return "";
  if (Array.isArray(answer)) return answer.join("; ");
  if (typeof answer === "object") {
    try {
      return JSON.stringify(answer);
    } catch (e) {
      return String(answer);
    }
  }
  return String(answer);
}

/* Render ban-specific answers in detail view using getAnswer */
function renderBanSpecificAnswers(application, type, container) {
  const banCode = type === "priority" ? application.priority_position : application.secondary_position;
  if (!banCode || banCode === "None") return;

  // ── Helper lấy câu trả lời theo nhiều cách ──
  function getAnswerFlexible(app, prefix, questionId, questionText, sub) {
    // 1. Thử theo id
    const directKey = `${prefix}_${questionId}`;
    if (app[directKey] !== undefined && app[directKey] !== null && app[directKey] !== "") {
      return app[directKey];
    }

    // 2. Thử theo prefix + questionText (cho MD)
    const prefixLower = prefix.toLowerCase();
    const keys = Object.keys(app || {});
    
    // Tìm key bắt đầu bằng prefix_ và chứa từ khóa trong questionText
    const textTokens = questionText.toLowerCase().split(' ').filter(w => w.length > 3);
    for (const k of keys) {
      const kLower = k.toLowerCase();
      if (!kLower.startsWith(prefixLower + "_")) continue;
      
      // Nếu có sub (Design/Content) thì ưu tiên key chứa sub
      if (sub) {
        const subLower = sub.toLowerCase();
        if (!kLower.includes(subLower)) continue;
      }
      
      // Kiểm tra nếu key chứa token của câu hỏi
      let matched = true;
      for (const token of textTokens) {
        if (!kLower.includes(token)) {
          matched = false;
          break;
        }
      }
      if (matched && app[k] !== undefined && app[k] !== null && app[k] !== "") {
        return app[k];
      }
    }

    // 3. Fallback: lấy key đầu tiên matching prefix + sub
    for (const k of keys) {
      const kLower = k.toLowerCase();
      if (!kLower.startsWith(prefixLower + "_")) continue;
      if (sub && !kLower.includes(sub.toLowerCase())) continue;
      if (app[k] !== undefined && app[k] !== null && app[k] !== "") {
        return app[k];
      }
    }

    return undefined;
  }

  // ──────────────────────────────────────────────

  if (banCode === "MD") {
    const subDepartments = type === "priority" 
      ? application.md_sub_departments || [] 
      : application.md_sub_departments_secondary || [];

    if (!banQuestions["MD"]) {
      console.warn('[Response] banQuestions["MD"] chưa được load');
      return;
    }

    subDepartments.forEach((sub) => {
      const questions = banQuestions["MD"][sub] || [];
      questions.forEach((q) => {
        // Lấy câu trả lời với fallback
        const raw = getAnswerFlexible(application, type, q.id, q.text || q.question || '', sub);
        const answer = (raw !== undefined && raw !== null && raw !== "") ? raw : "Chưa trả lời";
        
        const questionItem = document.createElement("div");
        questionItem.className = "question-item";
        let html = `<div class="question-text">${q.text || q.question || ""}</div>`;
        if (q.media && q.media.type === "image") {
          html += `<div class="question-media"><img src="${q.media.url}" alt="${q.media.alt || ""}"></div>`;
        }
        html += `<div class="answer-text">${formatAnswer(answer, q.type)}</div>`;
        questionItem.innerHTML = html;
        container.appendChild(questionItem);
      });
    });
    return;
  }

  // Các ban khác (HR, ER, PD)
  const questions = banQuestions[banCode] || [];
  questions.forEach((q) => {
    const raw = getAnswerFlexible(application, type, q.id, q.text || q.question || '', null);
    const answer = (raw !== undefined && raw !== null && raw !== "") ? raw : "Chưa trả lời";
    
    const questionItem = document.createElement("div");
    questionItem.className = "question-item";
    questionItem.innerHTML = `
      <div class="question-text">${q.text || q.question || ""}</div>
      <div class="answer-text">${formatAnswer(answer, q.type)}</div>
    `;
    container.appendChild(questionItem);
  });
}

function renderGeneralQuestions() {
  const container = document.getElementById("general-questions");
  if (!container) {
    console.warn("renderGeneralQuestions: missing #general-questions element");
    return;
  }
  container.innerHTML = "";

  generalQuestions.forEach((q) => {
    const div = document.createElement("div");
    div.className = "form-group question-item";

    // label
    const label = document.createElement("label");
    label.setAttribute("for", `general_${q.id}`);
    if (q.required) label.classList.add("required");
    label.textContent = q.question;
    div.appendChild(label);

    // media (image/video)
    if (q.media) {
      const mediaWrap = document.createElement("div");
      mediaWrap.className = "question-media";
      if (q.media.type === "image") {
        const img = document.createElement("img");
        img.src = q.media.url;
        img.alt = q.media.alt || "";
        img.className = "question-img";
        mediaWrap.appendChild(img);
      }
      div.appendChild(mediaWrap);
    }

    // input / textarea
    let inputEl;
    switch (q.type) {
      case "textarea":
        inputEl = document.createElement("textarea");
        inputEl.rows = 3;
        break;
      case "email":
      case "tel":
      case "date":
      case "text":
        inputEl = document.createElement("input");
        inputEl.type = q.type;
        break;
      default:
        inputEl = document.createElement("input");
        inputEl.type = "text";
    }

    inputEl.id = `general_${q.id}`;
    inputEl.name = `general_${q.id}`;
    if (q.placeholder) inputEl.placeholder = q.placeholder;
    if (q.required) inputEl.required = true;

    // gán sự kiện lưu tạm
    inputEl.addEventListener("input", saveFormData);
    inputEl.addEventListener("change", saveFormData);

    div.appendChild(inputEl);
    container.appendChild(div);
  });
}

/* Helpers: header union */
function getHeadersFromData(arr) {
  const set = new Set();
  arr.forEach((obj) => Object.keys(obj || {}).forEach((k) => set.add(k)));
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
  const rows = headers.map((field) => {
    const row = { Trường: field };
    apps.forEach((app, i) => {
      row[`Ứng viên ${i + 1}`] = app[field] ?? "";
    });
    return row;
  });
  const headerRow = ["Trường", ...apps.map((_, i) => `Ứng viên ${i + 1}`)];
  return XLSX.utils.json_to_sheet(rows, { header: headerRow });
}

/* Main exporter: prompt for layout, create 'Tổng hợp' + per-department sheets (app may appear in both) */
async function exportDataWithLayout(
  filename,
  apps,
  includeByDepartment = false,
  splitPrioritySecondary = false
) {
  if (!apps || apps.length === 0) {
    Swal.fire("Thông báo", "Không có dữ liệu để xuất", "info");
    return;
  }

  const { value: mode } = await Swal.fire({
    title: "Chọn kiểu xuất dữ liệu",
    input: "radio",
    inputOptions: { vertical: "Hàng ngang", horizontal: "Hàng dọc" },
    inputValidator: (v) => !v && "Bạn phải chọn kiểu xuất!",
  });
  if (!mode) return;

  const wb = XLSX.utils.book_new();

  // 1) Sheet tổng hợp (luôn có)
  const summaryData = apps.map((a, i) => normalizeApplicationForSummary(a, i));
  const wsAll =
    mode === "vertical"
      ? buildVerticalSheet(summaryData)
      : buildHorizontalSheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsAll, "Tổng hợp");

  // 2) Nếu includeByDepartment = true => xuất mỗi ban 1 sheet
  if (includeByDepartment) {
    const grouped = {};
    apps.forEach((app, idx) => {
      if (app.priority_position) {
        grouped[app.priority_position] = grouped[app.priority_position] || {
          priority: [],
          secondary: [],
        };
        grouped[app.priority_position].priority.push(
          normalizeApplicationForExport(app, idx)
        );
      }
      if (app.secondary_position && app.secondary_position !== "None") {
        grouped[app.secondary_position] = grouped[app.secondary_position] || {
          priority: [],
          secondary: [],
        };
        grouped[app.secondary_position].secondary.push(
          normalizeApplicationForExport(app, idx)
        );
      }
    });

    Object.keys(grouped).forEach((dept) => {
      const deptName = getDepartmentName(dept);
      const group = grouped[dept];

      if (splitPrioritySecondary) {
        // Xuất 2 sheet riêng: Ưu tiên & Dự bị
        if (group.priority.length > 0) {
          const wsPri =
            mode === "vertical"
              ? buildVerticalSheet(group.priority)
              : buildHorizontalSheet(group.priority);
          XLSX.utils.book_append_sheet(
            wb,
            wsPri,
            `${deptName}_Ưu tiên`.substring(0, 31)
          );
        }
        if (group.secondary.length > 0) {
          const wsSec =
            mode === "vertical"
              ? buildVerticalSheet(group.secondary)
              : buildHorizontalSheet(group.secondary);
          XLSX.utils.book_append_sheet(
            wb,
            wsSec,
            `${deptName}_Dự bị`.substring(0, 31)
          );
        }
      } else {
        // Xuất gộp chung
        const combined = [...group.priority, ...group.secondary];
        if (combined.length > 0) {
          const ws =
            mode === "vertical"
              ? buildVerticalSheet(combined)
              : buildHorizontalSheet(combined);
          XLSX.utils.book_append_sheet(wb, ws, deptName.substring(0, 31));
        }
      }
    });
  }

  XLSX.writeFile(wb, filename);
}

/* Export wrappers to call the unified exporter */
function exportPersonalInfo() {
  if (userRole === "member") {
    Swal.fire("Không có quyền", "Bạn không có quyền xuất dữ liệu.", "error");
    closeExportModal();
    return;
  }

  let exportApps = applications;

  if (userRole === "admin") {
    exportApps = applications.filter(
      (app) => app.all_departments && app.all_departments.includes(userDept)
    );
  }

  if (!exportApps || exportApps.length === 0) {
    Swal.fire("Thông báo", "Không có dữ liệu để xuất", "info");
    closeExportModal();
    return;
  }

  exportDataWithLayout("enactus_thong_tin_ca_nhan.xlsx", exportApps, false);
  closeExportModal();
}

function exportResults() {
  if (userRole === "member") {
    Swal.fire("Không có quyền", "Bạn không có quyền xuất dữ liệu.", "error");
    closeExportModal();
    return;
  }

  let exportApps = applications;
  if (userRole === "admin") {
    exportApps = applications.filter(
      (app) => app.all_departments && app.all_departments.includes(userDept)
    );
  }

  if (!exportApps || exportApps.length === 0) {
    Swal.fire("Thông báo", "Không có dữ liệu để xuất", "info");
    closeExportModal();
    return;
  }

  const rows = exportApps.map((app) => {
    // Ban trúng tuyển
    let accepted = [];
    if (app.priorityAccepted)
      accepted.push(getDepartmentName(app.priority_position));
    if (app.secondaryAccepted)
      accepted.push(getDepartmentName(app.secondary_position));
    const acceptedText = accepted.length > 0 ? accepted.join(" / ") : "";

    // Ban bị từ chối
    let rejected = [];
    if (app.priorityRejected)
      rejected.push(getDepartmentName(app.priority_position));
    if (app.secondaryRejected)
      rejected.push(getDepartmentName(app.secondary_position));
    const rejectedText = rejected.length > 0 ? rejected.join(" / ") : "";

    return {
      "Họ và tên": app.fullname ?? "",
      Email: app.email ?? "",
      "Số điện thoại": app.phone ?? "",
      "Ban trúng tuyển": acceptedText,
      "Ban bị từ chối": rejectedText,
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Kết quả");

  XLSX.writeFile(wb, "enactus_ket_qua_ung_tuyen.xlsx");
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
  return accepted.length > 0 ? accepted.join(" / ") : "";
}

function exportPersonalWithResults() {
  if (userRole === "member") {
    Swal.fire("Không có quyền", "Bạn không có quyền xuất dữ liệu.", "error");
    closeExportModal();
    return;
  }

  let exportApps = applications;
  if (userRole === "admin") {
    exportApps = applications.filter(
      (app) => app.all_departments && app.all_departments.includes(userDept)
    );
  }

  if (!exportApps || exportApps.length === 0) {
    Swal.fire("Thông báo", "Không có dữ liệu để xuất", "info");
    closeExportModal();
    return;
  }

  exportDataWithLayout("enactus_thong_tin_va_ket_qua.xlsx", exportApps, false);
  closeExportModal();
}

async function exportByCandidate() {
  if (!currentApplicationId) {
    Swal.fire(
      "Thông báo",
      "Vui lòng chọn một ứng viên để xuất dữ liệu",
      "info"
    );
    closeExportModal();
    return;
  }
  const app = applications.find((a) => a.id === currentApplicationId);
  if (userRole !== "superadmin" && userRole !== "admin") {
    Swal.fire(
      "Không có quyền",
      "Bạn không có quyền xuất dữ liệu ứng viên này.",
      "error"
    );
    closeExportModal();
    return;
  }
  // nếu admin, kiểm tra ban ứng viên có khớp
  if (
    userRole === "admin" &&
    !(app.priority_position === userDept || app.secondary_position === userDept)
  ) {
    Swal.fire(
      "Không có quyền",
      "Bạn chỉ có thể xuất ứng viên của ban mình.",
      "error"
    );
    closeExportModal();
    return;
  }
  if (!app) return;

  const { value: mode } = await Swal.fire({
    title: "Chọn kiểu xuất dữ liệu",
    input: "radio",
    inputOptions: {
      vertical: "Hàng ngang",
      horizontal: "Hàng dọc",
    },
    inputValidator: (v) => !v && "Bạn phải chọn kiểu xuất!",
  });
  if (!mode) return;

  const wb = XLSX.utils.book_new();
  const data = [normalizeApplicationForExport(app, 0)];

  const ws =
    mode === "vertical" ? buildVerticalSheet(data) : buildHorizontalSheet(data);

  XLSX.utils.book_append_sheet(wb, ws, app.fullname || "Ứng viên");

  XLSX.writeFile(
    wb,
    `enactus_ung_vien_${(app.fullname || "ung_vien").replace(/\s+/g, "_")}.xlsx`
  );
  closeExportModal();
}

function exportAllData() {
  if (userRole !== "superadmin") {
    Swal.fire(
      "Không có quyền",
      "Chỉ Super Admin được xuất toàn bộ dữ liệu.",
      "error"
    );
    closeExportModal();
    return;
  }
  exportDataWithLayout(
    "enactus_toan_bo_du_lieu.xlsx",
    applications,
    true,
    false
  );
  closeExportModal();
}

// Export lịch phỏng vấn theo template
async function exportInterviewSchedule() {
  try {
    // Lấy dữ liệu ứng viên phỏng vấn
    const interviewApps = applications.filter(
      (app) => app.application_type === "interview"
    );

    if (interviewApps.length === 0) {
      Swal.fire("Thông báo", "Không có ứng viên phỏng vấn nào", "info");
      return;
    }

    // Tạo workbook mới
    const wb = XLSX.utils.book_new();

    // Tạo dữ liệu cho sheet
    const data = [];

    // Header - lấy các ca từ interview
    const headers = ["STT", "Họ và tên", "Ban ưu tiên", "Ban dự bị"];
    
    // Thêm các ca phỏng vấn vào header - Format "Ca 1 (08:00 - 09:30) - Thứ 5, 25/06"
    if (interview && interview.length > 0) {
      interview.forEach((day) => {
        day.options.forEach((option) => {
          // Rút gọn để làm header: "Ca 1 - 08:00-09:30 - Thứ 5 25/06"
          let shortHeader = option;
          // Lấy phần ca và thời gian
          const caMatch = option.match(/(Ca \d+)/);
          const timeMatch = option.match(/\((\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\)/);
          const dateMatch = option.match(/-\s*(Thứ\s*\d+,\s*\d{2}\/\d{2}\/\d{4})/);
          
          if (caMatch && timeMatch) {
            let short = `${caMatch[1]} (${timeMatch[1]}-${timeMatch[2]})`;
            if (dateMatch) {
              // Rút gọn ngày: "Thứ 5, 25/06"
              const dateParts = dateMatch[1].split(',');
              if (dateParts.length === 2) {
                const dayMonth = dateParts[1].trim().split('/');
                if (dayMonth.length >= 2) {
                  short += ` - ${dateParts[0].trim()} ${dayMonth[0]}/${dayMonth[1]}`;
                }
              }
            }
            headers.push(short);
          } else {
            headers.push(option);
          }
        });
      });
    }

    data.push(headers);

    // Thêm dữ liệu ứng viên
    interviewApps.forEach((app, index) => {
      const row = [
        index + 1,
        app.fullname || "",
        getDepartmentName(app.priority_position) || "",
        app.secondary_position && app.secondary_position !== "None"
          ? getDepartmentName(app.secondary_position)
          : "Không có",
      ];

      // Thêm dữ liệu lịch phỏng vấn đã chọn - Đánh dấu X
      if (interview && interview.length > 0) {
        interview.forEach((day) => {
          const dayData = app[day.id];
          day.options.forEach((option) => {
            // Đánh dấu X nếu ứng viên chọn ca này
            row.push(dayData && dayData.includes(option) ? "X" : "");
          });
        });
      }

      data.push(row);
    });

    // Tạo worksheet từ dữ liệu
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Điều chỉnh độ rộng cột
    const colWidths = [
      { wch: 5 },  // STT
      { wch: 25 }, // Họ và tên
      { wch: 15 }, // Ban ưu tiên
      { wch: 15 }, // Ban dự bị
    ];

    // Thêm độ rộng cho các cột ca phỏng vấn
    if (interview && interview.length > 0) {
      interview.forEach((day) => {
        day.options.forEach(() => {
          colWidths.push({ wch: 20 });
        });
      });
    }

    ws["!cols"] = colWidths;

    // Thêm worksheet vào workbook
    XLSX.utils.book_append_sheet(wb, ws, "Lịch phỏng vấn");

    // Xuất file
    XLSX.writeFile(wb, "enactus_lich_phong_van.xlsx");

    Swal.fire("Thành công", "Đã xuất lịch phỏng vấn thành công", "success");
  } catch (error) {
    console.error("Error exporting interview schedule:", error);
    Swal.fire(
      "Lỗi",
      "Không thể xuất lịch phỏng vấn: " + error.message,
      "error"
    );
  }
}

// Giữ lại fields chung và chỉ giữ phần "Ưu tiên" hoặc "Dự bị" tùy loại
function filterExportData(data, type) {
  const filtered = {};
  Object.keys(data).forEach((key) => {
    const isPriority = key.startsWith("Ưu tiên");
    const isSecondary = key.startsWith("Dự bị");

    // Luôn giữ các trường chung (không bắt đầu bằng 'Ưu tiên' hoặc 'Dự bị')
    if (!isPriority && !isSecondary) {
      filtered[key] = data[key];
      return;
    }

    // Giữ phần riêng theo type
    if (type === "priority" && isPriority) {
      filtered[key] = data[key];
    } else if (type === "secondary" && isSecondary) {
      filtered[key] = data[key];
    }
  });
  return filtered;
}

/* Replace export-department listener: safe attach */
(function attachExportDepartmentListener() {
  const el = document.getElementById("export-department");
  if (!el) return;
  try {
    el.replaceWith(el.cloneNode(true));
  } catch (e) {}
  const elem = document.getElementById("export-department");
  if (!elem) return;

  elem.addEventListener("change", async function () {
    let department = this.value;

    // 👉 Nếu là admin thì luôn export theo ban của mình
    if (userRole === "admin") {
      department = userDept;
    }

    if (!department) return;

    const deptApps = applications.filter(
      (app) => app.all_departments && app.all_departments.includes(department)
    );

    if (deptApps.length === 0) {
      Swal.fire(
        "Thông báo",
        `Không có ứng viên nào trong ban ${getDepartmentName(department)}`,
        "info"
      );
      return;
    }

    // Hỏi layout
    const { value: mode } = await Swal.fire({
      title: "Chọn kiểu xuất dữ liệu",
      input: "radio",
      inputOptions: { vertical: "Hàng ngang", horizontal: "Hàng dọc" },
      inputValidator: (v) => !v && "Bạn phải chọn kiểu xuất!",
    });
    if (!mode) return;

    const wb = XLSX.utils.book_new();

    // Tách ứng viên thành 2 nhóm: Ưu tiên & Dự bị
    const pri = deptApps
      .filter((app) => app.priority_position === department)
      .map((app, i) =>
        filterExportData(normalizeApplicationForExport(app, i), "priority")
      );
    const sec = deptApps
      .filter((app) => app.secondary_position === department)
      .map((app, i) =>
        filterExportData(normalizeApplicationForExport(app, i), "secondary")
      );

    if (pri.length > 0) {
      const wsPri =
        mode === "vertical"
          ? buildVerticalSheet(pri)
          : buildHorizontalSheet(pri);
      XLSX.utils.book_append_sheet(
        wb,
        wsPri,
        `${getDepartmentName(department)}_Ưu tiên`.substring(0, 31)
      );
    }
    if (sec.length > 0) {
      const wsSec =
        mode === "vertical"
          ? buildVerticalSheet(sec)
          : buildHorizontalSheet(sec);
      XLSX.utils.book_append_sheet(
        wb,
        wsSec,
        `${getDepartmentName(department)}_Dự bị`.substring(0, 31)
      );
    }

    XLSX.writeFile(
      wb,
      `enactus_ban_${getDepartmentName(department).replace(/\s+/g, "_")}.xlsx`
    );
    closeExportModal();
  });
})();

/* --------------------- END: Unified answer/export block --------------------- */

// Đóng modal khi click bên ngoài
window.onclick = function (event) {
  const modal = document.getElementById("export-modal");
  if (event.target === modal) {
    closeExportModal();
  }
};

document.addEventListener("click", function (e) {
  if (e.target.closest("#logout-btn")) {
    auth.signOut().then(() => {
      sessionStorage.clear();
      window.location.href = "login.html";
    });
  }
});

// Lắng nghe sự kiện thay đổi bộ lọc
document
  .getElementById("filter-department")
  .addEventListener("change", renderApplications);
document
  .getElementById("filter-status")
  .addEventListener("change", renderApplications);
document
  .getElementById("filter-type")
  .addEventListener("change", renderApplications);
document
  .getElementById("search-input")
  .addEventListener("input", renderApplications);

// Tải ứng viên khi trang được tải
//window.addEventListener('load', loadApplications);