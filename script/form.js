// ============================================================
// KHỞI TẠO FIREBASE - TỰ ĐỘNG TRONG FORM.JS
// ============================================================

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBrHfc2ERn3oxu6va8RkAckxiBoo6GocgM",
  authDomain: "enactusftuhanoi.firebaseapp.com",
  projectId: "enactusftuhanoi",
  storageBucket: "enactusftuhanoi.firebasestorage.app",
  messagingSenderId: "281439714678",
  appId: "1:281439714678:web:c310c2836e4ca7ad38ce57",
  measurementId: "G-4V8B3GJ38D"
};

// Khai báo biến global trong file
let db, auth;

// Kiểm tra và khởi tạo Firebase nếu chưa có
if (typeof firebase !== 'undefined') {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        // Khởi tạo services
        auth = firebase.auth();
        db = firebase.firestore();
        
        // Gán vào window để dùng toàn cục
        window.auth = auth;
        window.db = db;
        
        console.log('[Form] Firebase initialized successfully');
        console.log('[Form] db:', db ? 'OK' : 'FAILED');
        console.log('[Form] auth:', auth ? 'OK' : 'FAILED');
    } catch (e) {
        console.error('[Form] Error initializing Firebase services:', e);
    }
} else {
    console.error('[Form] Firebase SDK not loaded!');
}

// ============================================================
// BIẾN TOÀN CỤC
// ============================================================
let applicationType = '';
let currentSection = 0;
const totalSections = 4;

// Dữ liệu câu hỏi - sẽ được tải từ Firebase
let generalQuestions = [];
let banQuestions = {};
let interview = [];
let formSettings = {};
let interviewSettings = {};
let notifySettings = {};

// ============================================================
// KHỞI TẠO - TẢI DỮ LIỆU TỪ FIREBASE
// ============================================================
async function initFormData() {
    try {
        // KIỂM TRA DB TRƯỚC KHI DÙNG
        if (typeof db === 'undefined' || db === null) {
            console.error('[Form] db is undefined! Cannot fetch data.');
            return;
        }

        const [questionsDoc, formSettingsDoc, interviewSettingsDoc, notifyDoc] = await Promise.all([
            db.collection("system").doc("form_questions").get(),
            db.collection("system").doc("form_settings").get(),
            db.collection("system").doc("interview_settings").get(),
            db.collection("system").doc("notify_settings").get()
        ]);

        // Tải câu hỏi
        if (questionsDoc.exists && questionsDoc.data().questions) {
            const raw = questionsDoc.data().questions;
            generalQuestions = raw.general || [];
            banQuestions = {
                "MD-Design": raw["MD-Design"] || raw["md-design"] || [],
                "MD-Content": raw["MD-Content"] || raw["md-content"] || [],
                MD: {
                    Design: raw["MD-Design"] || raw["md-design"] || [],
                    Content: raw["MD-Content"] || raw["md-content"] || []
                },
                HR: raw.HR || raw.hr || [],
                ER: raw.ER || raw.er || [],
                PD: raw.PD || raw.pd || []
            };
        }

        // Tải cài đặt form
        if (formSettingsDoc.exists) {
            formSettings = formSettingsDoc.data();
        }

        // Tải cài đặt phỏng vấn
        if (interviewSettingsDoc.exists) {
            interviewSettings = interviewSettingsDoc.data();
            // Chuyển đổi slots từ Firebase thành định dạng interview[]
            const slots = interviewSettings.slots || [];
            if (slots.length > 0) {
                interview = buildInterviewFromSlots(slots);
            }
        }

        // Tải thông báo
        if (notifyDoc.exists) {
            notifySettings = notifyDoc.data();
        }

        console.log('[Form] Đã tải dữ liệu từ Firebase:', {
            generalQuestions: generalQuestions.length,
            banQuestions: Object.keys(banQuestions),
            interviewSlots: (interviewSettings.slots || []).length,
            notifyEnabled: notifySettings.enabled
        });

    } catch (error) {
        console.error('[Form] Lỗi tải dữ liệu:', error);
        // Fallback: không có câu hỏi nào
        generalQuestions = [];
        banQuestions = {};
        interview = [];
    }
}

function buildInterviewFromSlots(slots) {
    if (!slots || !Array.isArray(slots) || slots.length === 0) {
        console.warn('[Form] No interview slots found');
        return [];
    }

    // Tạo options từ slots - KHÔNG ĐÁNH SỐ TOÀN CỤC
    const options = [];
    
    // Nhóm theo ngày trước
    const groupedByDate = {};
    slots.forEach((slot) => {
        let dateKey = '';
        if (slot.dateTime) {
            try {
                const date = new Date(slot.dateTime);
                if (!isNaN(date.getTime())) {
                    const weekdays = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
                    const dayOfWeek = weekdays[date.getDay()];
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    dateKey = `${dayOfWeek}, ${day}/${month}/${year}`;
                }
            } catch(e) {}
        }
        if (!groupedByDate[dateKey]) {
            groupedByDate[dateKey] = [];
        }
        groupedByDate[dateKey].push(slot);
    });

    // Xử lý từng ngày, đánh số ca trong ngày từ 1
    Object.keys(groupedByDate).forEach(dateKey => {
        const slotsInDay = groupedByDate[dateKey];
        // Sắp xếp theo giờ
        slotsInDay.sort((a, b) => {
            if (a.startTime && b.startTime) {
                return a.startTime.localeCompare(b.startTime);
            }
            return 0;
        });
        
        slotsInDay.forEach((slot, idx) => {
            const caNumber = idx + 1; // ✅ Đánh số trong ngày
            
            let timeRange = '';
            let dateInfo = dateKey;
            
            // Lấy giờ
            if (slot.startTime && slot.endTime) {
                timeRange = `${slot.startTime} - ${slot.endTime}`;
            } else if (slot.label) {
                const timeMatch = slot.label.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
                if (timeMatch) {
                    timeRange = `${timeMatch[1]} - ${timeMatch[2]}`;
                }
            }
            
            // Ghép thành label
            let displayLabel = '';
            if (timeRange && dateInfo) {
                displayLabel = `Ca ${caNumber} (${timeRange}) - ${dateInfo}`;
            } else if (timeRange) {
                displayLabel = `Ca ${caNumber} (${timeRange})`;
            } else if (dateInfo) {
                displayLabel = `Ca ${caNumber} - ${dateInfo}`;
            } else {
                displayLabel = slot.label || `Ca ${caNumber}`;
            }
            
            options.push(displayLabel);
        });
    });

    // Tạo câu hỏi duy nhất
    const interviewQuestion = {
        id: "interview_schedule",
        question: "Vui lòng chọn các khung giờ phỏng vấn bạn có thể tham gia (chọn ít nhất 3 ca)",
        options: options
    };

    console.log('[Form] Built interview slots:', options.length);
    return [interviewQuestion];
}

// ============================================================
// KIỂM TRA THỜI GIAN VÀ THÔNG BÁO
// ============================================================
function checkFormAvailability() {
    const now = new Date();
    const formEl = document.getElementById("recruitmentForm");

    // Kiểm tra bật thủ công
    if (formSettings.enabled) return; // form mở

    // Kiểm tra thời gian
    const startTime = formSettings.startTime
        ? (formSettings.startTime.toDate ? formSettings.startTime.toDate() : new Date(formSettings.startTime))
        : null;
    const endTime = formSettings.endTime
        ? (formSettings.endTime.toDate ? formSettings.endTime.toDate() : new Date(formSettings.endTime))
        : null;

    if (startTime && now < startTime) {
        // Form chưa mở
        formEl.style.display = "none";
        showFormClosed(`Form sẽ mở vào lúc <strong>${startTime.toLocaleString("vi-VN")}</strong>. Vui lòng quay lại sau!`);
        return;
    }

    if (endTime && now > endTime) {
        // Form đã đóng
        formEl.style.display = "none";
        showFormClosed(`Form tuyển dụng đã đóng vào lúc <strong>${endTime.toLocaleString("vi-VN")}</strong>. Cảm ơn bạn đã quan tâm!`);
        return;
    }
    // Nếu không có startTime/endTime hoặc đang trong khoảng thời gian hợp lệ -> mở bình thường
}

function checkInterviewAvailability() {
    const now = new Date();
    const enabled = interviewSettings.enabled;
    const endTime = interviewSettings.endTime
        ? (interviewSettings.endTime.toDate ? interviewSettings.endTime.toDate() : new Date(interviewSettings.endTime))
        : null;

    const isOpen = enabled || (endTime && now <= endTime);

    const typeInterview = document.getElementById("type-interview");
    if (!typeInterview) return;

    if (!isOpen) {
        typeInterview.style.opacity = "0.5";
        typeInterview.style.cursor = "not-allowed";
        typeInterview.title = "Hình thức phỏng vấn thay đơn đã đóng";
        typeInterview.onclick = function() {
            Swal.fire({
                icon: "warning",
                title: "Phỏng vấn thay đơn đã đóng",
                html: endTime
                    ? `Thời hạn đăng ký đã kết thúc vào lúc <strong>${endTime.toLocaleString("vi-VN")}</strong>. Vui lòng chọn hình thức điền đơn.`
                    : "Hình thức phỏng vấn thay đơn hiện chưa được mở. Vui lòng chọn hình thức điền đơn."
            });
        };
    }
}

function showFormClosed(htmlMessage) {
    const existing = document.getElementById("form-closed-msg");
    if (existing) return;

    const msgBox = document.createElement("div");
    msgBox.id = "form-closed-msg";
    msgBox.innerHTML = `
        <div style="max-width:600px;margin:40px auto;padding:32px;background:#fff;border-radius:16px;box-shadow:0 4px 12px rgba(0,0,0,0.08);text-align:center;">
            <div style="width:56px;height:56px;background:#FEE2E2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
            </div>
            <h2 style="font-size:20px;font-weight:700;color:#111827;margin-bottom:12px;">Form đã đóng</h2>
            <p style="font-size:15px;color:#6B7280;line-height:1.6;">${htmlMessage}</p>
        </div>
    `;
    const formEl = document.getElementById("recruitmentForm");
    if (formEl && formEl.parentNode) {
        formEl.parentNode.insertBefore(msgBox, formEl);
    }
}

// ============================================================
// HIỂN THỊ THÔNG BÁO TỪ FIREBASE
// ============================================================
async function showNotification() {
    try {
        // KIỂM TRA DB TRƯỚC KHI DÙNG
        if (typeof db === 'undefined' || db === null) {
            console.warn('[Form] db not available, skipping notification');
            return;
        }

        const doc = await db.collection("system").doc("notify_settings").get();
        if (!doc.exists) return;
        const data = doc.data();
        if (!data.enabled || (!data.title && !data.content)) return;

        const colors = {
            info: { bg: "#EFF6FF", border: "#DBEAFE", text: "#1E40AF" },
            warning: { bg: "#FFF7ED", border: "#FFEDD5", text: "#9A3412" },
            success: { bg: "#F0FDF4", border: "#DCFCE7", text: "#166534" }
        };
        const color = colors[data.type] || colors.info;

        const icons = {
            info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8h.01M12 12v4"/></svg>`,
            warning: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 22h20L12 2zM12 8v5M12 17h.01"/></svg>`,
            success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
        };

        const notif = document.createElement("div");
        notif.style.cssText = `
            margin-bottom:20px;
            padding:14px 16px;
            background:${color.bg};
            border:1px solid ${color.border};
            border-radius:10px;
            color:${color.text};
            display:flex;
            gap:10px;
            align-items:flex-start;
            font-size:14px;
            line-height:1.5;
        `;
        notif.innerHTML = `
            <div style="flex-shrink:0;margin-top:1px;">${icons[data.type] || icons.info}</div>
            <div>
                ${data.title ? `<div style="font-weight:700;margin-bottom:4px;">${data.title}</div>` : ""}
                ${data.content ? `<div>${data.content}</div>` : ""}
            </div>
        `;

        const container = document.querySelector(".form-container");
        if (container) {
            container.insertBefore(notif, container.firstChild);
        }
    } catch (e) {
        console.warn("[Form] Không tải được thông báo:", e);
    }
}

// ============================================================
// CHỌN HÌNH THỨC ỨNG TUYỂN
// ============================================================
function selectApplicationType(type) {
    applicationType = type;
    document.getElementById('application_type').value = type;

    document.querySelectorAll('.application-type').forEach(el => {
        el.classList.remove('selected');
    });
    const target = document.getElementById(`type-${type}`);
    if (target) target.classList.add('selected');
}

// ============================================================
// LOAD INTRO TỪ FIREBASE (thay thế loadIntroFromMarkdown)
// ============================================================
async function loadIntroFromMarkdown() {
    try {
        if (typeof db === 'undefined' || db === null) {
            console.warn('[Form] db not available, skipping intro load');
            return;
        }

        const doc = await db.collection("system").doc("intro_settings").get();

        const container = document.getElementById("intro-info-container");
        const titleEl   = document.querySelector("#sectionIntro h2");

        if (doc.exists) {
            const data = doc.data();

            // Cập nhật tiêu đề (phần sau icon.png)
            if (titleEl && data.title) {
                // Giữ lại img tag, chỉ thay text
                const img = titleEl.querySelector("img");
                titleEl.innerHTML = "";
                if (img) titleEl.appendChild(img);
                titleEl.appendChild(document.createTextNode(" " + data.title));
            }

            // Cập nhật nội dung giới thiệu
            if (container && data.contentHtml) {
                container.innerHTML = data.contentHtml;
                return; // đã load xong từ Firebase
            }
        }

        // Fallback: thử load từ intro.md nếu không có dữ liệu Firebase
        try {
            const response = await fetch('/content/intro.md');
            if (response.ok) {
                const markdown = await response.text();
                if (typeof marked !== 'undefined' && container) {
                    container.innerHTML = marked.parse(markdown);
                }
            }
        } catch (mdErr) {
            console.warn("[Form] Không tải được intro.md:", mdErr);
        }

    } catch (e) {
        console.warn("[Form] Lỗi tải intro từ Firebase:", e);
        // Fallback về intro.md
        try {
            const response = await fetch('/content/intro.md');
            if (response.ok) {
                const markdown = await response.text();
                const container = document.getElementById("intro-info-container");
                if (typeof marked !== 'undefined' && container) {
                    container.innerHTML = marked.parse(markdown);
                }
            }
        } catch (mdErr) {
            console.warn("[Form] Không tải được intro.md:", mdErr);
        }
    }
}

// ============================================================
// CẬP NHẬT PROGRESS BAR
// ============================================================
function updateProgressBar() {
    for (let i = 0; i <= totalSections; i++) {
        const el = document.getElementById(`step${i}`);
        if (el) el.className = 'step';
    }
    for (let i = 0; i < currentSection; i++) {
        const el = document.getElementById(`step${i}`);
        if (el) el.className = 'step completed';
    }
    const activeEl = document.getElementById(`step${currentSection}`);
    if (activeEl) activeEl.className = 'step active';
}

function restoreInterviewSchedule() {
    const saved = localStorage.getItem('enactus_form_data');
    if (!saved) return;
    try {
        const data = JSON.parse(saved);
        if (data.interview_schedule && Array.isArray(data.interview_schedule)) {
            document.querySelectorAll('#interview-schedule input[type="checkbox"]').forEach(cb => {
                if (data.interview_schedule.includes(cb.value)) {
                    cb.checked = true;
                    // Kích hoạt hiệu ứng
                    const item = cb.closest('.checkbox-item');
                    if (item) {
                        item.style.background = '#FEF3C7';
                        item.style.borderColor = '#F59E0B';
                    }
                }
            });
            updateInterviewSelectionCount();
        }
    } catch (e) {
        console.warn('[Form] Lỗi khôi phục lịch phỏng vấn:', e);
    }
}

// ============================================================
// HIỂN THỊ SECTION
// ============================================================
function showSection(sectionNumber) {
    const introSection = document.getElementById('sectionIntro');
    if (introSection) introSection.style.display = 'none';

    for (let i = 0; i <= totalSections; i++) {
        const section = document.getElementById(`section${i}`);
        if (section) section.style.display = 'none';
    }

    if (sectionNumber === -1) {
        if (introSection) introSection.style.display = 'block';
        currentSection = -1;
        return;
    }

    const target = document.getElementById(`section${sectionNumber}`);
    if (target) {
        target.style.display = 'block';
        currentSection = sectionNumber;
        updateProgressBar();

        if (sectionNumber === 4) {
            generateSummary();
            // LƯU DỮ LIỆU TRƯỚC KHI HIỂN THỊ SUMMARY
            simpleSaveFormData();
        }
        if (sectionNumber === 3) {
            // KHÔI PHỤC DỮ LIỆU TỪ LOCALSTORAGE
            restoreBanQuestionsDirectly();
            
            if (applicationType === 'interview') {
                const tabContainer = document.querySelector('.tab-container');
                if (tabContainer) tabContainer.style.display = 'none';
                const interviewSchedule = document.getElementById('interview-schedule');
                if (interviewSchedule) interviewSchedule.style.display = 'block';
                renderInterviewSchedule();
                setTimeout(() => {
                    setupInterviewCheckboxListeners();
                    updateInterviewSelectionCount();
                    // KHÔI PHỤC LỊCH PHỎNG VẤN ĐÃ CHỌN
                    restoreInterviewSchedule();
                }, 100);
            } else {
                const tabContainer = document.querySelector('.tab-container');
                if (tabContainer) tabContainer.style.display = 'block';
                const interviewSchedule = document.getElementById('interview-schedule');
                if (interviewSchedule) interviewSchedule.style.display = 'none';
                updatePositionNames();
                // KHÔI PHỤC CÂU HỎI BAN
                setTimeout(() => {
                    restoreBanQuestionsDirectly();
                }, 200);
            }
        }
    }
}

// ============================================================
// LỊCH PHỎNG VẤN
// ============================================================
function setupInterviewCheckboxListeners() {
    const interviewContainer = document.getElementById('interview-questions');
    if (interviewContainer) {
        interviewContainer.removeEventListener('change', handleInterviewCheckboxChange);
        interviewContainer.addEventListener('change', handleInterviewCheckboxChange);
    }
}

function handleInterviewCheckboxChange(e) {
    if (e.target.type === 'checkbox') {
        updateInterviewSelectionCount();
        simpleSaveFormData();
    }
}

function renderInterviewSchedule() {
    const container = document.getElementById('interview-questions');
    if (!container) return;
    container.innerHTML = '';

    const instruction = document.createElement('div');
    instruction.innerHTML = `
        <div style="background:#EFF6FF;padding:16px;border-radius:8px;margin-bottom:20px;border-left:4px solid #3B82F6;">
            <strong style="color:#1D4ED8;">Hướng dẫn chọn lịch phỏng vấn:</strong>
            <p style="margin:10px 0 0;color:#555;line-height:1.5;">
                Vui lòng chọn <strong style="color:#DC2626;">ít nhất 3 khung giờ</strong> mà bạn có thể tham gia.<br>
                Việc chọn nhiều khung giờ giúp ban tổ chức dễ dàng sắp xếp lịch phù hợp.
            </p>
        </div>
    `;
    container.appendChild(instruction);

    if (!interview || interview.length === 0) {
        const notice = document.createElement('div');
        notice.innerHTML = `<p style="color:#6B7280;font-size:14px;">Chưa có ca phỏng vấn nào được cấu hình. Vui lòng liên hệ ban tổ chức.</p>`;
        container.appendChild(notice);
        return;
    }

    // Lấy tất cả options từ interview
    const allOptions = [];
    interview.forEach(q => {
        if (q.options) {
            q.options.forEach(opt => {
                allOptions.push(opt);
            });
        }
    });

    if (allOptions.length === 0) {
        const notice = document.createElement('div');
        notice.innerHTML = `<p style="color:#6B7280;font-size:14px;">Chưa có ca phỏng vấn nào.</p>`;
        container.appendChild(notice);
        return;
    }

    // Nhóm các ca theo ngày
    const groupedSlots = {};
    allOptions.forEach(opt => {
        let dateKey = 'Khác';
        const dateMatch = opt.match(/(Thứ\s*\d+,\s*\d{2}\/\d{2}\/\d{4})|(\d{2}\/\d{2}\/\d{4})/);
        if (dateMatch) {
            dateKey = dateMatch[0];
        }
        if (!groupedSlots[dateKey]) {
            groupedSlots[dateKey] = [];
        }
        groupedSlots[dateKey].push(opt);
    });

    // Sắp xếp các ngày theo thứ tự thời gian
    const sortedDateKeys = Object.keys(groupedSlots).sort((a, b) => {
        const parseDate = (key) => {
            const match = key.match(/(\d{2})\/(\d{2})\/(\d{4})/);
            if (match) {
                return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
            }
            return new Date(0);
        };
        return parseDate(a) - parseDate(b);
    });

    // Tạo div cho từng ngày
    sortedDateKeys.forEach(dateKey => {
        const dateDiv = document.createElement('div');
        dateDiv.style.cssText = `
            margin-bottom: 16px;
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            overflow: hidden;
        `;
        
        // Header ngày
        const header = document.createElement('div');
        header.style.cssText = `
            background: #F9FAFB;
            padding: 10px 14px;
            font-weight: 700;
            font-size: 14px;
            color: #374151;
            border-bottom: 1px solid #E5E7EB;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        header.innerHTML = `
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="width:16px;height:16px;">
                <rect x="1.5" y="3.5" width="13" height="10" rx="1.5"/>
                <path d="M5.5 1.5v2M10.5 1.5v2M1.5 7h13"/>
            </svg>
            ${dateKey}
            <span style="font-weight:400;font-size:12px;color:var(--gray-500);">(${groupedSlots[dateKey].length} ca)</span>
        `;
        dateDiv.appendChild(header);
        
        // Danh sách ca trong ngày - SẮP XẾP THEO GIỜ
        const slotsContainer = document.createElement('div');
        slotsContainer.style.cssText = 'padding:10px 14px;background:white;';
        
        // Sắp xếp các ca trong ngày theo thời gian
        const sortedSlots = groupedSlots[dateKey].sort((a, b) => {
            const getTime = (str) => {
                const match = str.match(/\((\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\)/);
                if (match) return match[1];
                return '';
            };
            return getTime(a).localeCompare(getTime(b));
        });
        
        sortedSlots.forEach((opt, idx) => {
            const item = document.createElement('div');
            item.className = 'checkbox-item';
            item.style.cssText = `
                display: flex;
                align-items: center;
                padding: 8px 12px;
                border: 1px solid #E5E7EB;
                border-radius: 6px;
                background: #FAFAFA;
                margin-bottom: 8px;
                cursor: pointer;
                transition: all 0.2s;
            `;
            if (idx === sortedSlots.length - 1) {
                item.style.marginBottom = '0';
            }
            
            // SỐ THỨ TỰ CA TRONG NGÀY (bắt đầu từ 1)
            const caNumber = idx + 1;
            
            // Tạo ID duy nhất
            const optionId = `interview_${dateKey.replace(/[^a-zA-Z0-9]/g, '_')}_${idx}`;
            
            // LẤY THỜI GIAN TỪ LABEL (bỏ phần "Ca X")
            let displayText = opt;
            // Bỏ "Ca X (XX:XX - XX:XX)" -> chỉ lấy thời gian
            const timeMatch = opt.match(/\((\d{2}:\d{2}\s*-\s*\d{2}:\d{2})\)/);
            if (timeMatch) {
                displayText = timeMatch[1]; // Chỉ lấy "08:00 - 09:00"
            } else {
                // Nếu không match, bỏ phần ngày tháng
                displayText = opt.replace(/\s*[-–]\s*(Thứ\s*\d+,\s*\d{2}\/\d{2}\/\d{4}|\d{2}\/\d{2}\/\d{4})/, '').trim();
            }
            
            item.innerHTML = `
                <input type="checkbox" id="${optionId}" name="interview_schedule[]" value="${opt}" style="margin-right:10px;width:18px;height:18px;flex-shrink:0;">
                <label for="${optionId}" style="cursor:pointer;font-weight:500;color:#374151;font-size:13.5px;flex:1;">
                    <span style="display:inline-block;min-width:50px;font-weight:600;color:var(--gray-600);">Ca ${caNumber}</span>
                    ${displayText}
                </label>
            `;
            
            // Hover effect
            item.addEventListener('mouseenter', () => {
                item.style.background = '#F3F4F6';
                item.style.borderColor = '#D1D5DB';
            });
            item.addEventListener('mouseleave', () => {
                item.style.background = '#FAFAFA';
                item.style.borderColor = '#E5E7EB';
            });
            
            // Checked effect
            const checkbox = item.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    item.style.background = '#FEF3C7';
                    item.style.borderColor = '#F59E0B';
                } else {
                    item.style.background = '#FAFAFA';
                    item.style.borderColor = '#E5E7EB';
                }
                updateInterviewSelectionCount();
                simpleSaveFormData();
            });
            
            slotsContainer.appendChild(item);
        });
        
        dateDiv.appendChild(slotsContainer);
        container.appendChild(dateDiv);
    });

    // KHÔI PHỤC DỮ LIỆU ĐÃ CHỌN TỪ LOCALSTORAGE
    const saved = localStorage.getItem('enactus_form_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.interview_schedule && Array.isArray(data.interview_schedule)) {
                document.querySelectorAll('#interview-schedule input[type="checkbox"]').forEach(cb => {
                    if (data.interview_schedule.includes(cb.value)) {
                        cb.checked = true;
                        const item = cb.closest('.checkbox-item');
                        if (item) {
                            item.style.background = '#FEF3C7';
                            item.style.borderColor = '#F59E0B';
                        }
                    }
                });
            }
        } catch(e) {}
    }

    updateInterviewSelectionCount();
}

function updateInterviewSelectionCount() {
    const checkedCount = document.querySelectorAll('#interview-schedule input[type="checkbox"]:checked').length;
    let countElement = document.getElementById('interview-selection-count');

    if (!countElement) {
        countElement = document.createElement('div');
        countElement.id = 'interview-selection-count';
        countElement.style.cssText = `
            margin:15px 0;padding:12px 16px;background:#F9FAFB;
            border-radius:8px;font-weight:600;text-align:center;
            border:2px solid #E5E7EB;transition:all 0.3s ease;
        `;
        const interviewContainer = document.getElementById('interview-questions');
        if (interviewContainer) {
            interviewContainer.parentNode.insertBefore(countElement, interviewContainer);
        }
    }

    if (checkedCount < 3) {
        countElement.style.color = '#EF4444';
        countElement.style.borderColor = '#FEE2E2';
        countElement.innerHTML = `Đã chọn: ${checkedCount}/3 ca phỏng vấn <span style="font-size:0.9em;">(Cần chọn thêm ${3 - checkedCount} ca)</span>`;
    } else {
        countElement.style.color = '#10B981';
        countElement.style.borderColor = '#D1FAE5';
        countElement.innerHTML = `Đã chọn: ${checkedCount}/3 ca phỏng vấn </span>`;
    }
}

// ============================================================
// RENDER CÂU HỎI CHUNG
// ============================================================
function renderGeneralQuestions() {
    const container = document.getElementById('general-questions');
    if (!container) return;
    container.innerHTML = '';

    if (!generalQuestions || generalQuestions.length === 0) {
        container.innerHTML = '<p style="color:#9CA3AF;font-size:14px;">Chưa có câu hỏi chung nào.</p>';
        return;
    }

    generalQuestions.forEach(q => {
        const div = document.createElement('div');
        div.className = 'form-group question-item';

        const label = document.createElement('label');
        label.setAttribute('for', `general_${q.id}`);
        if (q.required) label.classList.add('required');

        const questionText = q.text || q.question || '';
        if (/\r?\n/.test(questionText)) {
            const lines = questionText.split(/\r?\n/);
            lines.forEach((line, idx) => {
                label.appendChild(document.createTextNode(line));
                if (idx < lines.length - 1) label.appendChild(document.createElement('br'));
            });
        } else {
            label.textContent = questionText;
        }
        div.appendChild(label);

        if (q.media) {
            const mediaWrap = document.createElement('div');
            mediaWrap.className = 'question-media';
            if (q.media.type === 'image') {
                const img = document.createElement('img');
                img.className = 'question-img';
                img.src = q.media.url;
                img.alt = q.media.alt || '';
                mediaWrap.appendChild(img);
            }
            div.appendChild(mediaWrap);
        }

        const inputEl = buildInputElement(q, `general_${q.id}`, `general_${q.id}`);
        if (Array.isArray(inputEl)) {
            inputEl.forEach(el => div.appendChild(el));
        } else {
            div.appendChild(inputEl);
        }

        container.appendChild(div);
    });
}

// ============================================================
// RENDER CÂU HỎI THEO BAN
// ============================================================
function renderBanQuestions(banCode, type) {
    const containerId = type === 'priority' ? 'ban-specific-questions' : 'secondary-ban-specific-questions';
    const questionsContainer = document.getElementById(containerId);
    if (!questionsContainer) return;
    questionsContainer.innerHTML = '';

    if (!banCode) {
        questionsContainer.innerHTML = '<p class="no-questions">Vui lòng chọn ban để hiển thị câu hỏi phù hợp.</p>';
        return;
    }

    // LƯU DỮ LIỆU HIỆN TẠI TRƯỚC KHI XÓA
    const currentData = {};
    questionsContainer.querySelectorAll('input, textarea, select').forEach(el => {
        const name = el.name || el.id;
        if (!name) return;
        if (el.type === 'checkbox') {
            if (el.checked) {
                if (!currentData[name]) currentData[name] = [];
                currentData[name].push(el.value);
            }
        } else if (el.type === 'radio') {
            if (el.checked) currentData[name] = el.value;
        } else {
            currentData[name] = el.value;
        }
    });

    if (banCode === 'MD') {
        const subIds = {
            priority: ['md_design', 'md_content'],
            secondary: ['md_design_secondary', 'md_content_secondary']
        };
        const subCheckboxIds = subIds[type] || subIds.priority;
        const subValues = { md_design: 'Design', md_content: 'Content', md_design_secondary: 'Design', md_content_secondary: 'Content' };

        const selected = subCheckboxIds
            .filter(id => document.getElementById(id)?.checked)
            .map(id => subValues[id]);

        if (selected.length === 0) {
            questionsContainer.innerHTML = '<p class="no-questions">Vui lòng chọn tiểu ban Design hoặc Content để hiển thị câu hỏi.</p>';
            return;
        }

        selected.forEach(sub => {
            const subtitle = document.createElement('div');
            subtitle.className = 'sub-section';
            subtitle.innerHTML = `<h3>Tiểu ban ${sub}</h3>`;
            questionsContainer.appendChild(subtitle);

            const questions = (banQuestions.MD && banQuestions.MD[sub]) || banQuestions[`MD-${sub}`] || [];
            questions.forEach(q => {
                const prefixedId = `${type}_${sub.toLowerCase()}_${q.id}`;
                const questionDiv = buildQuestionDiv(q, prefixedId);
                questionsContainer.appendChild(questionDiv);
            });
        });
    } else {
        const questions = banQuestions[banCode] || [];
        if (!questions.length) {
            questionsContainer.innerHTML = '<p class="no-questions">Không có câu hỏi cụ thể cho ban này.</p>';
            return;
        }

        questions.forEach(q => {
            const prefixedId = `${type}_${q.id}`;
            const questionDiv = buildQuestionDiv(q, prefixedId);
            questionsContainer.appendChild(questionDiv);
        });
    }

    // KHÔI PHỤC DỮ LIỆU ĐÃ LƯU
    questionsContainer.querySelectorAll('input, textarea, select').forEach(el => {
        const name = el.name || el.id;
        if (!name) return;
        if (currentData[name] !== undefined) {
            if (el.type === 'checkbox') {
                if (Array.isArray(currentData[name]) && currentData[name].includes(el.value)) {
                    el.checked = true;
                }
            } else if (el.type === 'radio') {
                if (el.value === currentData[name]) {
                    el.checked = true;
                }
            } else {
                el.value = currentData[name] || '';
            }
        }
    });

    // Gán sự kiện lưu tạm
    questionsContainer.querySelectorAll('input, select, textarea').forEach(el => {
        el.addEventListener('input', simpleSaveFormData);
        el.addEventListener('change', simpleSaveFormData);
    });

    // LƯU SAU KHI RENDER XONG
    setTimeout(simpleSaveFormData, 100);
}

// ============================================================
// KIỂM TRA CÂU HỎI BẮT BUỘC TRONG TẤT CẢ CÁC TAB
// ============================================================
function validateAllQuestions() {
    // Nếu chọn phỏng vấn thay đơn, chỉ kiểm tra lịch phỏng vấn
    if (applicationType === 'interview') {
        // Kiểm tra lịch phỏng vấn
        const checkedBoxes = document.querySelectorAll('#interview-schedule input[type="checkbox"]:checked');
        if (checkedBoxes.length < 3) {
            showSection(3);
            Swal.fire({
                icon: 'warning',
                title: 'Chưa đủ lịch phỏng vấn',
                html: `Bạn đã chọn <strong>${checkedBoxes.length}</strong> ca. Vui lòng chọn ít nhất <strong>3 ca phỏng vấn</strong> trước khi gửi.`,
                confirmButtonColor: '#3085d6'
            });
            return false;
        }
        return true;
    }

    // Kiểm tra câu hỏi chung (tab general) - CHỈ KHI CHỌN ĐIỀN ĐƠN
    const generalContainer = document.getElementById('tab-general');
    if (generalContainer) {
        const requiredInputs = generalContainer.querySelectorAll('input[required], select[required], textarea[required]');
        for (let input of requiredInputs) {
            if (input.type === 'radio' || input.type === 'checkbox') {
                const name = input.name;
                const checked = generalContainer.querySelectorAll(`input[name="${name}"]:checked`).length > 0;
                if (!checked) {
                    showTab('general');
                    const group = input.closest('.radio-group, .checkbox-group');
                    if (group) {
                        group.style.border = '2px solid #EF4444';
                        group.style.padding = '10px';
                        group.style.borderRadius = '8px';
                        group.style.background = '#FEF2F2';
                    }
                    Swal.fire({
                        icon: 'warning',
                        title: 'Vui lòng trả lời câu hỏi',
                        text: 'Bạn cần trả lời tất cả câu hỏi bắt buộc trong phần "Câu hỏi chung"',
                        confirmButtonColor: '#3085d6'
                    });
                    return false;
                }
            } else if (!input.value.trim()) {
                showTab('general');
                input.focus();
                input.style.borderColor = '#EF4444';
                input.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.2)';
                Swal.fire({
                    icon: 'warning',
                    title: 'Vui lòng trả lời câu hỏi',
                    text: 'Bạn cần trả lời tất cả câu hỏi bắt buộc trong phần "Câu hỏi chung"',
                    confirmButtonColor: '#3085d6'
                });
                return false;
            }
            input.style.borderColor = '';
            input.style.boxShadow = '';
            const group = input.closest('.radio-group, .checkbox-group');
            if (group) {
                group.style.border = '';
                group.style.padding = '';
                group.style.borderRadius = '';
                group.style.background = '';
            }
        }
    }

    // Kiểm tra câu hỏi ban ưu tiên (tab priority) - CHỈ KHI CHỌN ĐIỀN ĐƠN
    const priorityContainer = document.getElementById('tab-priority');
    if (priorityContainer) {
        const requiredInputs = priorityContainer.querySelectorAll('input[required], select[required], textarea[required]');
        for (let input of requiredInputs) {
            if (input.type === 'radio' || input.type === 'checkbox') {
                const name = input.name;
                const checked = priorityContainer.querySelectorAll(`input[name="${name}"]:checked`).length > 0;
                if (!checked) {
                    showTab('priority');
                    const group = input.closest('.radio-group, .checkbox-group');
                    if (group) {
                        group.style.border = '2px solid #EF4444';
                        group.style.padding = '10px';
                        group.style.borderRadius = '8px';
                        group.style.background = '#FEF2F2';
                    }
                    const banName = document.getElementById('ban-name')?.textContent || 'Nguyện vọng 1';
                    Swal.fire({
                        icon: 'warning',
                        title: 'Vui lòng trả lời câu hỏi',
                        text: `Bạn cần trả lời tất cả câu hỏi bắt buộc của ban ${banName}`,
                        confirmButtonColor: '#3085d6'
                    });
                    return false;
                }
            } else if (!input.value.trim()) {
                showTab('priority');
                input.focus();
                input.style.borderColor = '#EF4444';
                input.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.2)';
                const banName = document.getElementById('ban-name')?.textContent || 'Nguyện vọng 1';
                Swal.fire({
                    icon: 'warning',
                    title: 'Vui lòng trả lời câu hỏi',
                    text: `Bạn cần trả lời tất cả câu hỏi bắt buộc của ban ${banName}`,
                    confirmButtonColor: '#3085d6'
                });
                return false;
            }
            input.style.borderColor = '';
            input.style.boxShadow = '';
            const group = input.closest('.radio-group, .checkbox-group');
            if (group) {
                group.style.border = '';
                group.style.padding = '';
                group.style.borderRadius = '';
                group.style.background = '';
            }
        }
    }

    // Kiểm tra câu hỏi ban thứ 2 (tab secondary) - CHỈ KHI CHỌN ĐIỀN ĐƠN
    const secondaryTabBtn = document.getElementById('secondary-tab-btn');
    if (secondaryTabBtn && secondaryTabBtn.style.display !== 'none') {
        const secondaryContainer = document.getElementById('tab-secondary');
        if (secondaryContainer) {
            const requiredInputs = secondaryContainer.querySelectorAll('input[required], select[required], textarea[required]');
            for (let input of requiredInputs) {
                if (input.type === 'radio' || input.type === 'checkbox') {
                    const name = input.name;
                    const checked = secondaryContainer.querySelectorAll(`input[name="${name}"]:checked`).length > 0;
                    if (!checked) {
                        showTab('secondary');
                        const group = input.closest('.radio-group, .checkbox-group');
                        if (group) {
                            group.style.border = '2px solid #EF4444';
                            group.style.padding = '10px';
                            group.style.borderRadius = '8px';
                            group.style.background = '#FEF2F2';
                        }
                        const banName = document.getElementById('secondary-ban-name')?.textContent || 'Nguyện vọng 2';
                        Swal.fire({
                            icon: 'warning',
                            title: 'Vui lòng trả lời câu hỏi',
                            text: `Bạn cần trả lời tất cả câu hỏi bắt buộc của ban ${banName}`,
                            confirmButtonColor: '#3085d6'
                        });
                        return false;
                    }
                } else if (!input.value.trim()) {
                    showTab('secondary');
                    input.focus();
                    input.style.borderColor = '#EF4444';
                    input.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.2)';
                    const banName = document.getElementById('secondary-ban-name')?.textContent || 'Nguyện vọng 2';
                    Swal.fire({
                        icon: 'warning',
                        title: 'Vui lòng trả lời câu hỏi',
                        text: `Bạn cần trả lời tất cả câu hỏi bắt buộc của ban ${banName}`,
                        confirmButtonColor: '#3085d6'
                    });
                    return false;
                }
                input.style.borderColor = '';
                input.style.boxShadow = '';
                const group = input.closest('.radio-group, .checkbox-group');
                if (group) {
                    group.style.border = '';
                    group.style.padding = '';
                    group.style.borderRadius = '';
                    group.style.background = '';
                }
            }
        }
    }

    // Kiểm tra lịch phỏng vấn (chỉ khi chọn phỏng vấn)
    if (applicationType === 'interview') {
        const checkedBoxes = document.querySelectorAll('#interview-schedule input[type="checkbox"]:checked');
        if (checkedBoxes.length < 3) {
            showSection(3);
            Swal.fire({
                icon: 'warning',
                title: 'Chưa đủ lịch phỏng vấn',
                html: `Bạn đã chọn <strong>${checkedBoxes.length}</strong> ca. Vui lòng chọn ít nhất <strong>3 ca phỏng vấn</strong> trước khi gửi.`,
                confirmButtonColor: '#3085d6'
            });
            return false;
        }
    }

    return true;
}

// ============================================================
// XÂY DỰNG INPUT THEO LOẠI CÂU HỎI
// ============================================================
function buildQuestionDiv(q, prefixedId) {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'form-group question-item';

    const questionText = q.text || q.question || '';
    let labelHtml = '';
    if (/\r?\n/.test(questionText)) {
        labelHtml = questionText.split(/\r?\n/).join('<br>');
    } else {
        labelHtml = questionText;
    }

    // THÊM required vào label
    let html = `<label for="${prefixedId}" ${q.required ? 'class="required"' : ''}>${labelHtml}</label>`;

    if (q.media) {
        if (q.media.type === 'image') {
            html += `<div class="question-media"><img src="${q.media.url}" alt="${q.media.alt || ''}" class="question-img"></div>`;
        }
    }

    switch (q.type) {
        case 'textarea':
            // THÊM required vào textarea
            html += `<textarea id="${prefixedId}" name="${prefixedId}" rows="3" placeholder="${q.placeholder || ''}" ${q.required ? 'required' : ''}></textarea>`;
            break;
        case 'checkbox':
            html += `<div class="checkbox-group" id="${prefixedId}_group">`;
            (q.options || []).forEach((option, idx) => {
                const optionId = `${prefixedId}_${idx}`;
                // THÊM required cho checkbox (chỉ checkbox đầu tiên để group có required)
                const req = (q.required && idx === 0) ? 'required' : '';
                html += `<div class="checkbox-item"><input type="checkbox" id="${optionId}" name="${prefixedId}[]" value="${option}" ${req}><label for="${optionId}">${option}</label></div>`;
            });
            html += `</div>`;
            break;
        case 'radio':
            html += `<div class="radio-group" id="${prefixedId}_group">`;
            (q.options || []).forEach((option, idx) => {
                const optionId = `${prefixedId}_${idx}`;
                const req = (q.required && idx === 0) ? 'required' : '';
                html += `<div class="radio-item"><input type="radio" id="${optionId}" name="${prefixedId}" value="${option}" ${req}><label for="${optionId}">${option}</label></div>`;
            });
            html += `</div>`;
            break;
        case 'dropdown':
            html += `<select id="${prefixedId}" name="${prefixedId}" ${q.required ? 'required' : ''}><option value="">-- Chọn --</option>`;
            (q.options || []).forEach(opt => { html += `<option value="${opt}">${opt}</option>`; });
            html += `</select>`;
            break;
        case 'scale':
            const mid = Math.round(((q.min || 1) + (q.max || 5)) / 2);
            html += `<div class="scale-container">
                <input type="range" id="${prefixedId}" name="${prefixedId}" min="${q.min || 1}" max="${q.max || 5}" value="${mid}" ${q.required ? 'required' : ''}>
                <div class="scale-labels"><span>${q.min || 1}</span><span>${q.max || 5}</span></div>
                <output for="${prefixedId}" id="${prefixedId}_value">${mid}</output>
            </div>`;
            break;
        default:
            html += `<input type="text" id="${prefixedId}" name="${prefixedId}" placeholder="${q.placeholder || ''}" ${q.required ? 'required' : ''}>`;
    }

    questionDiv.innerHTML = html;

    // Xử lý scale range
    if (q.type === 'scale') {
        const range = questionDiv.querySelector(`#${prefixedId}`);
        const out = questionDiv.querySelector(`#${prefixedId}_value`);
        if (range && out) {
            range.addEventListener('input', () => { out.value = range.value; });
        }
    }

    // Gán sự kiện lưu
    questionDiv.querySelectorAll('input, select, textarea').forEach(el => {
        el.addEventListener('input', simpleSaveFormData);
        el.addEventListener('change', simpleSaveFormData);
        el.addEventListener('blur', simpleSaveFormData);
    });

    return questionDiv;
}

function buildInputElement(q, id, name) {
    const questionText = q.text || q.question || '';
    switch (q.type) {
        case 'textarea': {
            const ta = document.createElement('textarea');
            ta.id = id;
            ta.name = name;
            ta.rows = 3;
            if (q.placeholder) ta.placeholder = q.placeholder;
            if (q.required) ta.required = true;
            ta.addEventListener('input', simpleSaveFormData);
            return ta;
        }
        case 'text':
        case 'email':
        case 'tel':
        case 'date': {
            const inp = document.createElement('input');
            inp.type = q.type;
            inp.id = id;
            inp.name = name;
            if (q.placeholder) inp.placeholder = q.placeholder;
            if (q.required) inp.required = true;
            inp.addEventListener('input', simpleSaveFormData);
            return inp;
        }
        case 'radio': {
            const group = document.createElement('div');
            group.className = 'radio-group';
            (q.options || []).forEach((opt, idx) => {
                const optId = `${id}_${idx}`;
                const item = document.createElement('div');
                item.className = 'radio-item';
                item.innerHTML = `<input type="radio" id="${optId}" name="${name}" value="${opt}" ${q.required && idx === 0 ? 'required' : ''}><label for="${optId}">${opt}</label>`;
                item.querySelector('input').addEventListener('change', simpleSaveFormData);
                group.appendChild(item);
            });
            return group;
        }
        case 'checkbox': {
            const group = document.createElement('div');
            group.className = 'checkbox-group';
            (q.options || []).forEach((opt, idx) => {
                const optId = `${id}_${idx}`;
                const item = document.createElement('div');
                item.className = 'checkbox-item';
                item.innerHTML = `<input type="checkbox" id="${optId}" name="${name}[]" value="${opt}"><label for="${optId}">${opt}</label>`;
                item.querySelector('input').addEventListener('change', simpleSaveFormData);
                group.appendChild(item);
            });
            return group;
        }
        default: {
            const inp = document.createElement('input');
            inp.type = 'text';
            inp.id = id;
            inp.name = name;
            if (q.placeholder) inp.placeholder = q.placeholder;
            if (q.required) inp.required = true;
            inp.addEventListener('input', simpleSaveFormData);
            return inp;
        }
    }
}

// ============================================================
// CẬP NHẬT TÊN BAN VÀ TABS
// ============================================================
function updatePositionNames() {
    const prioritySelect = document.getElementById('priority_position');
    const secondarySelect = document.getElementById('secondary_position');
    if (!prioritySelect) return;

    const priorityPositionName = prioritySelect.options[prioritySelect.selectedIndex]?.text || '';
    const secondaryPositionName = secondarySelect?.options[secondarySelect.selectedIndex]?.text || '';

    const priorityTabBtn = document.getElementById('priority-tab-btn');
    if (priorityTabBtn) priorityTabBtn.textContent = `Câu hỏi dành cho ban ${priorityPositionName} (NV1)`;

    const secondaryTabBtn = document.getElementById('secondary-tab-btn');
    if (secondaryTabBtn) {
        if (secondarySelect?.value && secondarySelect.value !== "" && secondarySelect.value !== "None") {
            secondaryTabBtn.style.display = 'inline-block';
            secondaryTabBtn.textContent = `Câu hỏi dành cho ban ${secondaryPositionName} (NV2)`;
        } else {
            secondaryTabBtn.style.display = 'none';
            const savedData = JSON.parse(localStorage.getItem('enactus_form_data') || '{}');
            Object.keys(savedData).forEach(key => {
                if (key.startsWith("secondary_")) delete savedData[key];
            });
            localStorage.setItem('enactus_form_data', JSON.stringify(savedData));
        }
    }

    const banName = document.getElementById('ban-name');
    if (banName) banName.textContent = `${priorityPositionName} (NV1)`;

    const secondaryBanName = document.getElementById('secondary-ban-name');
    if (secondaryBanName) {
        secondaryBanName.textContent = (secondarySelect?.value && secondarySelect.value !== "None")
            ? `${secondaryPositionName} (NV2)`
            : 'vị trí nguyện vọng 2';
    }

    renderBanQuestions(prioritySelect.value, 'priority');
    if (secondarySelect?.value && secondarySelect.value !== "None") {
        renderBanQuestions(secondarySelect.value, 'secondary');
    }
}

function updateSecondaryOptions() {
    const prioritySelect = document.getElementById('priority_position');
    const secondarySelect = document.getElementById('secondary_position');
    if (!prioritySelect || !secondarySelect) return;

    const priorityValue = prioritySelect.value;
    Array.from(secondarySelect.options).forEach(opt => { opt.disabled = false; });

    if (priorityValue) {
        Array.from(secondarySelect.options).forEach(opt => {
            if (opt.value === priorityValue) {
                opt.disabled = true;
                if (secondarySelect.value === priorityValue) secondarySelect.value = "";
            }
        });
    }
}

function updateMDSubDepartments() {
    const prioritySelect = document.getElementById('priority_position');
    const secondarySelect = document.getElementById('secondary_position');
    const mdPrimary = document.getElementById('md-sub-departments');
    const mdSecondary = document.getElementById('md-sub-departments-secondary');

    if (mdPrimary) mdPrimary.style.display = (prioritySelect?.value === 'MD') ? 'block' : 'none';
    if (mdSecondary) mdSecondary.style.display = (secondarySelect?.value === 'MD') ? 'block' : 'none';
}

// ============================================================
// TABS CHI TIẾT ỨNG TUYỂN
// ============================================================
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));

    const tabContent = document.getElementById(`tab-${tabName}`);
    if (tabContent) tabContent.classList.add('active');

    const tabBtn = document.querySelector(`.tab-button[onclick="showTab('${tabName}')"]`);
    if (tabBtn) tabBtn.classList.add('active');

    // Khôi phục dữ liệu khi chuyển tab
    setTimeout(() => restoreBanQuestionsDirectly(), 200);
}

// ============================================================
// NAVIGATION
// ============================================================
function nextSection(current) {
    if (current === 0 && !applicationType) {
        Swal.fire({ icon: 'warning', title: 'Chưa chọn hình thức', text: 'Vui lòng chọn hình thức ứng tuyển.', confirmButtonText: 'OK' });
        return;
    }

    if (current === 3) {
        // KIỂM TRA TẤT CẢ CÂU HỎI BẮT BUỘC
        if (!validateAllQuestions()) {
            return;
        }

        if (applicationType === 'interview') {
            const checkedBoxes = document.querySelectorAll('#interview-schedule input[type="checkbox"]:checked');
            if (checkedBoxes.length < 3) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Chưa đủ lịch phỏng vấn',
                    html: `Bạn đã chọn <strong>${checkedBoxes.length}</strong> ca. Vui lòng chọn ít nhất <strong>3 ca phỏng vấn</strong> trước khi tiếp tục.`,
                    confirmButtonText: 'Đã hiểu'
                });
                return;
            }
            simpleSaveFormData();
            showSection(4);
            return;
        } else {
            simpleSaveFormData();
            showSection(4);
            return;
        }
    }

    let valid = true;
    const currentSectionEl = document.getElementById(`section${current}`);
    if (currentSectionEl) {
        const requiredInputs = currentSectionEl.querySelectorAll('input[required], select[required], textarea[required]');
        requiredInputs.forEach(input => {
            if (input.type === 'radio' || input.type === 'checkbox') {
                const name = input.name;
                const checked = currentSectionEl.querySelectorAll(`input[name="${name}"]:checked`).length > 0;
                if (!checked) {
                    valid = false;
                    const group = input.closest('.radio-group, .checkbox-group');
                    if (group) {
                        group.style.border = '1px solid #EF4444';
                        group.style.padding = '10px';
                        group.style.borderRadius = '8px';
                    }
                }
            } else if (!input.value) {
                valid = false;
                input.style.borderColor = '#EF4444';
                input.style.animation = 'shake 0.5s';
                setTimeout(() => { input.style.animation = ''; }, 500);
            } else {
                input.style.borderColor = '';
            }
        });
    }

    if (valid) {
        simpleSaveFormData();
        showSection(current + 1);
    } else {
        Swal.fire({ icon: 'warning', title: 'Thiếu thông tin', text: 'Vui lòng điền đầy đủ các thông tin bắt buộc.', confirmButtonText: 'OK' });
    }
}

function prevSection(current) {
    if (current === 0) { showSection(-1); return; }
    showSection(current - 1);
}

// ============================================================
// SUMMARY
// ============================================================
function generateSummary() {
    const form = document.getElementById('recruitmentForm');
    if (!form) return;

    const summaryDiv = document.getElementById('summary');
    if (!summaryDiv) return;

    const prioritySelect = form.priority_position;
    const secondarySelect = form.secondary_position;
    const priorityPositionText = prioritySelect?.options[prioritySelect?.selectedIndex]?.text || '';
    const secondaryPositionText = secondarySelect?.options[secondarySelect?.selectedIndex]?.text || '';

    let mdSubDepartments = [];
    document.querySelectorAll('input[name="md_sub_departments[]"]:checked').forEach(cb => mdSubDepartments.push(cb.value));

    let mdSubDepartmentsSecondary = [];
    document.querySelectorAll('input[name="md_sub_departments_secondary[]"]:checked').forEach(cb => mdSubDepartmentsSecondary.push(cb.value));

    let summaryHTML = `
        <p><strong>Hình thức ứng tuyển:</strong> ${applicationType === 'form' ? 'Điền đơn ứng tuyển' : 'Phỏng vấn thay đơn'}</p>
        <p><strong>Họ và tên:</strong> ${form.fullname?.value || ''}</p>
        <p><strong>Ngày/tháng/năm sinh:</strong> ${formatDateToVN(form.birthdate?.value || '')}</p>
        <p><strong>Giới tính:</strong> ${form.gender?.value || ''}</p>
        <p><strong>Trường:</strong> ${form.school?.value || ''}</p>
        <p><strong>Chuyên ngành:</strong> ${form.major?.value || ''}</p>
        <p><strong>Email:</strong> ${form.email?.value || ''}</p>
        <p><strong>Số điện thoại:</strong> ${form.phone?.value || ''}</p>
        <p><strong>Ban ưu tiên:</strong> ${priorityPositionText}</p>
    `;

    if (prioritySelect?.value === 'MD' && mdSubDepartments.length > 0) {
        summaryHTML += `<p><strong>Tiểu ban Truyền thông:</strong> ${mdSubDepartments.join(', ')}</p>`;
    }

    summaryHTML += `<p><strong>Ban dự bị:</strong> ${(secondarySelect?.value && secondarySelect.value !== 'None') ? secondaryPositionText : 'Không đăng ký'}</p>`;

    if (secondarySelect?.value === 'MD' && mdSubDepartmentsSecondary.length > 0) {
        summaryHTML += `<p><strong>Tiểu ban Truyền thông (NV2):</strong> ${mdSubDepartmentsSecondary.join(', ')}</p>`;
    }

    // THÊM HIỂN THỊ CA PHỎNG VẤN ĐÃ CHỌN
    if (applicationType === 'interview') {
        const checkedBoxes = document.querySelectorAll('#interview-schedule input[type="checkbox"]:checked');
        if (checkedBoxes.length > 0) {
            const selectedSlots = Array.from(checkedBoxes).map(cb => cb.value);
            summaryHTML += `<p><strong>Ca phỏng vấn đã chọn (${selectedSlots.length} ca):</strong></p>`;
            summaryHTML += `<ul style="margin:8px 0 0 20px;padding-left:10px;">`;
            selectedSlots.forEach(slot => {
                // Lấy số ca từ label (VD: "Ca 1 (08:00 - 09:00) - Thứ 6, 19/06/2026")
                // Hoặc lấy trực tiếp label đã có sẵn
                summaryHTML += `<li style="font-size:13px;color:var(--gray-700);">${slot}</li>`;
            });
            summaryHTML += `</ul>`;
        } else {
            summaryHTML += `<p><strong>Ca phỏng vấn:</strong> <span style="color:var(--red-500);">Chưa chọn ca nào</span></p>`;
        }
    }

    summaryDiv.innerHTML = summaryHTML;
}

function formatDateToVN(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// ============================================================
// THU THẬP DỮ LIỆU FORM
// ============================================================
function collectFormData() {
    const formData = {
        application_type: applicationType,
        fullname: document.getElementById('fullname')?.value || '',
        birthdate: document.getElementById('birthdate')?.value || '',
        gender: document.getElementById('gender')?.value || '',
        email: document.getElementById('email')?.value || '',
        phone: document.getElementById('phone')?.value || '',
        school: document.getElementById('school')?.value || '',
        major: document.getElementById('major')?.value || '',
        facebook: document.getElementById('facebook')?.value || '',
        priority_position: document.getElementById('priority_position')?.value || '',
        secondary_position: document.getElementById('secondary_position')?.value || '',
        md_sub_departments: Array.from(document.querySelectorAll('input[name="md_sub_departments[]"]:checked')).map(cb => cb.value),
        md_sub_departments_secondary: Array.from(document.querySelectorAll('input[name="md_sub_departments_secondary[]"]:checked')).map(cb => cb.value),
        timestamp: new Date().toISOString()
    };

    // CHỈ THU THẬP CÂU HỎI CHUNG + BAN KHI CHỌN ĐIỀN ĐƠN
    if (applicationType === 'form') {
        // Câu hỏi chung
        const generalContainer = document.getElementById('general-questions');
        if (generalContainer) {
            generalContainer.querySelectorAll('input, textarea, select').forEach(input => {
                const name = input.name || input.id;
                if (!name) return;
                if (input.type === 'checkbox') {
                    if (!formData[name]) formData[name] = [];
                    if (input.checked) formData[name].push(input.value);
                } else if (input.type === 'radio') {
                    if (input.checked) formData[name] = input.value;
                } else {
                    formData[name] = input.value || '';
                }
            });
        }

        // Câu hỏi phân ban - LƯU TẤT CẢ
        ['priority', 'secondary'].forEach(type => {
            const containerId = type === 'priority' ? 'ban-specific-questions' : 'secondary-ban-specific-questions';
            const container = document.getElementById(containerId);
            if (!container) return;

            container.querySelectorAll('input, textarea, select').forEach(input => {
                const name = input.name;
                if (!name || !name.startsWith(type + '_')) return;
                if (input.type === 'checkbox') {
                    if (!formData[name]) formData[name] = [];
                    if (input.checked) formData[name].push(input.value);
                } else if (input.type === 'radio') {
                    if (input.checked) formData[name] = input.value;
                } else {
                    formData[name] = input.value || '';
                }
            });
        });
    }

    // Lịch phỏng vấn (chỉ khi chọn phỏng vấn)
    if (applicationType === 'interview' && interview.length > 0) {
        const checkedBoxes = document.querySelectorAll('#interview-schedule input[type="checkbox"]:checked');
        if (checkedBoxes.length > 0) {
            formData.interview_schedule = Array.from(checkedBoxes).map(cb => cb.value);
        }
    }

    return formData;
}

// ============================================================
// LƯU TẠM VÀO LOCALSTORAGE
// ============================================================
function simpleSaveFormData() {
    try {
        const formData = collectFormData();
        localStorage.setItem('enactus_form_data', JSON.stringify(formData));
    } catch (error) {
        console.warn('[Form] Lỗi lưu tạm:', error);
    }
}

// ============================================================
// KHÔI PHỤC DỮ LIỆU
// ============================================================
function loadFormData() {
    try {
        const saved = localStorage.getItem('enactus_form_data');
        if (!saved) return;
        const data = JSON.parse(saved);

        if (data.application_type) selectApplicationType(data.application_type);
        if (data.fullname) document.getElementById('fullname').value = data.fullname;
        if (data.birthdate) document.getElementById('birthdate').value = data.birthdate;
        if (data.gender) document.getElementById('gender').value = data.gender;
        if (data.email) document.getElementById('email').value = data.email;
        if (data.phone) document.getElementById('phone').value = data.phone;
        if (data.school) document.getElementById('school').value = data.school;
        if (data.major) document.getElementById('major').value = data.major;
        if (data.facebook) document.getElementById('facebook').value = data.facebook;

        if (data.priority_position) {
            document.getElementById('priority_position').value = data.priority_position;
            updateSecondaryOptions();
            updateMDSubDepartments();
        }
        if (data.secondary_position) {
            document.getElementById('secondary_position').value = data.secondary_position;
        }

        if (data.md_sub_departments) {
            data.md_sub_departments.forEach(value => {
                const cb = document.querySelector(`input[name="md_sub_departments[]"][value="${value}"]`);
                if (cb) cb.checked = true;
            });
        }
        if (data.md_sub_departments_secondary) {
            data.md_sub_departments_secondary.forEach(value => {
                const cb = document.querySelector(`input[name="md_sub_departments_secondary[]"][value="${value}"]`);
                if (cb) cb.checked = true;
            });
        }

        // Câu hỏi chung
        Object.keys(data).forEach(key => {
            if (!key.startsWith('general_')) return;
            const value = data[key];
            const inputs = document.querySelectorAll(`[name="${key}"]`);
            inputs.forEach(input => {
                if (input.type === 'checkbox') {
                    if (Array.isArray(value) && value.includes(input.value)) input.checked = true;
                } else if (input.type === 'radio') {
                    if (value === input.value) input.checked = true;
                } else {
                    input.value = value || '';
                }
            });
        });

        // KHÔI PHỤC CÂU HỎI BAN
        updatePositionNames();
        setTimeout(() => {
            restoreBanQuestionsDirectly();
            // Khôi phục lịch phỏng vấn
            if (data.interview_schedule) {
                document.querySelectorAll('#interview-schedule input[type="checkbox"]').forEach(cb => {
                    if (data.interview_schedule.includes(cb.value)) {
                        cb.checked = true;
                        const item = cb.closest('.checkbox-item');
                        if (item) {
                            item.style.background = '#FEF3C7';
                            item.style.borderColor = '#F59E0B';
                        }
                    }
                });
                updateInterviewSelectionCount();
            }
        }, 500);

    } catch (error) {
        console.warn('[Form] Lỗi khôi phục:', error);
    }
}

function restoreBanQuestionsDirectly() {
    const saved = localStorage.getItem('enactus_form_data');
    if (!saved) return 0;
    const data = JSON.parse(saved);
    let count = 0;

    Object.keys(data).forEach(key => {
        if (!key.startsWith('priority_') && !key.startsWith('secondary_')) return;
        const value = data[key];
        const inputs = document.querySelectorAll(`[name="${key}"]`);
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                if (Array.isArray(value) && value.includes(input.value)) { input.checked = true; count++; }
            } else if (input.type === 'radio') {
                if (value === input.value) { input.checked = true; count++; }
            } else {
                if (input.value !== value) { input.value = value || ''; if (value) count++; }
            }
        });
    });

    return count;
}

function retryRestoreWithDelay(maxRetries = 8, delay = 500) {
    let retryCount = 0;
    const tryRestore = () => {
        const restored = restoreBanQuestionsDirectly();
        if (restored > 0 || retryCount >= maxRetries) return;
        retryCount++;
        setTimeout(tryRestore, delay);
    };
    tryRestore();
}

// ============================================================
// GỬI FORM
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('recruitmentForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // KIỂM TRA TẤT CẢ CÂU HỎI BẮT BUỘC TRƯỚC KHI GỬI
        if (!validateAllQuestions()) {
            return;
        }

        if (!document.getElementById('agree')?.checked) {
            Swal.fire({ icon: 'warning', title: 'Chưa xác nhận', text: 'Vui lòng xác nhận rằng tất cả thông tin bạn cung cấp là chính xác.', confirmButtonText: 'OK' });
            return;
        }

        const submitBtn = form.querySelector('.btn-submit');
        const originalText = submitBtn?.innerHTML;
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';
            submitBtn.disabled = true;
        }

        try {
            const formObject = collectFormData();

            if (applicationType === 'interview') {
                Object.keys(formObject).forEach(key => {
                    if ((key.startsWith('priority_') || key.startsWith('secondary_')) &&
                        key !== 'priority_position' && key !== 'secondary_position') {
                        delete formObject[key];
                    }
                });
            }

            formObject.all_departments = [
                formObject.priority_position,
                formObject.secondary_position
            ].filter(p => p && p !== "None");

            formObject.timestamp = firebase.firestore.FieldValue.serverTimestamp();
            delete formObject.timestamp; // Xóa ISO string, dùng serverTimestamp
            formObject.timestamp = firebase.firestore.FieldValue.serverTimestamp();

            await db.collection('applications').add(formObject);

            localStorage.removeItem('enactus_form_data');

            const successMessage = document.getElementById('successMessage');
            const redirectMsg = document.getElementById('redirectMsg');

            form.style.display = 'none';
            if (successMessage) successMessage.style.display = 'block';

            let countdown = 5;
            if (redirectMsg) {
                redirectMsg.innerHTML = `Chuyển hướng sau <strong>${countdown}</strong>s...`;
                const interval = setInterval(() => {
                    countdown--;
                    redirectMsg.innerHTML = `Chuyển hướng sau <strong>${countdown}</strong>s...`;
                    if (countdown <= 0) {
                        clearInterval(interval);
                        window.location.href = "/user/login.html";
                    }
                }, 1000);
            }

        } catch (error) {
            console.error('[Form] Lỗi gửi đơn:', error);
            Swal.fire({ icon: 'error', title: 'Có lỗi xảy ra', text: 'Không thể gửi đơn ứng tuyển. Vui lòng thử lại. Chi tiết: ' + error.message, confirmButtonText: 'OK' });
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }
    });
});

// ============================================================
// KHỞI ĐỘNG KHI DOM SẴN SÀNG
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
    // Tải dữ liệu từ Firebase trước
    await initFormData();

    // Kiểm tra availability
    checkFormAvailability();
    checkInterviewAvailability();

    // Hiện thông báo
    showNotification();

    // Load intro
    loadIntroFromMarkdown();

    // Render câu hỏi chung
    renderGeneralQuestions();

    // Khởi tạo UI
    updateSecondaryOptions();
    updateProgressBar();

    // Khôi phục dữ liệu tạm
    loadFormData();

    // Thiết lập auto-save
    document.addEventListener('input', () => setTimeout(simpleSaveFormData, 300));
    document.addEventListener('change', () => setTimeout(simpleSaveFormData, 300));
    document.addEventListener('click', e => {
        if (e.target.type === 'radio' || e.target.type === 'checkbox') {
            setTimeout(simpleSaveFormData, 200);
        }
    });
    window.addEventListener('beforeunload', simpleSaveFormData);
    setInterval(simpleSaveFormData, 30000);

    // Kiểm tra có dữ liệu cũ không
    const savedData = localStorage.getItem('enactus_form_data');
    if (savedData) {
        setTimeout(() => {
            Swal.fire({
                icon: 'info',
                title: 'Đã khôi phục dữ liệu',
                text: 'Dữ liệu chưa hoàn thành từ phiên trước đã được khôi phục.',
                timer: 3000,
                showConfirmButton: false
            });
        }, 500);
    }

    // Gán sự kiện cho tiểu ban MD
    ['md_design', 'md_content', 'md_design_secondary', 'md_content_secondary'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                renderBanQuestions(document.getElementById('priority_position')?.value, 'priority');
                renderBanQuestions(document.getElementById('secondary_position')?.value, 'secondary');
                simpleSaveFormData();
            });
        }
    });

    // Thêm shake animation CSS
    const style = document.createElement('style');
    style.textContent = `@keyframes shake { 0%,100%{transform:translateX(0)} 10%,30%,50%,70%,90%{transform:translateX(-5px)} 20%,40%,60%,80%{transform:translateX(5px)} }`;
    document.head.appendChild(style);

    // Override alert
    window.alert = function(message) {
        Swal.fire({ icon: 'warning', title: 'Cảnh báo', text: message, confirmButtonText: 'OK' });
    };

    // Retry khôi phục cuối
    setTimeout(() => restoreBanQuestionsDirectly(), 5000);
});