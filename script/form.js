// ============================================================
// KHỞI TẠO FIREBASE - DÙNG CHUNG window.auth / window.db TỪ config.js
// (config.js phải được load TRƯỚC form.js trong file HTML, vd:
//  <script src="config.js"></script>
//  <script src="form.js"></script>
//
// LƯU Ý: KHÔNG khai báo lại `let/const db, auth` ở đây — config.js đã khai báo
// `const db`/`const auth` ở global scope, và let/const top-level của các thẻ
// <script> (non-module) DÙNG CHUNG một lexical scope trên cùng 1 trang, nên khai
// báo lại sẽ gây "SyntaxError: Identifier 'db' has already been declared" và làm
// TOÀN BỘ form.js dừng chạy ngay từ dòng đầu (form trống, không có gì hiện lên).
// ============================================================

if (typeof firebase !== 'undefined' && firebase.apps.length && window.db && window.auth) {
            } else {
    }

// ============================================================
// BIẾN TOÀN CỤC
// ============================================================
let applicationType = '';
let currentSection = 0;
const totalSections = 4;

// ============================================================
// TRẠNG THÁI "BỔ SUNG HỒ SƠ" (gộp Điền đơn + Phỏng vấn thay đơn
// vào chung 1 document applications/{id} thay vì tạo đơn mới)
// ============================================================
let mergeMode = false;               // true nếu đang bổ sung vào hồ sơ đã tồn tại
let existingApplicationId = null;    // id document applications/ đã tồn tại
let existingApplicationData = null;  // dữ liệu document đó
let existingApplicationTypes = [];   // hình thức đã có: ['form'] / ['interview'] / cả 2

// Dữ liệu câu hỏi - sẽ được tải từ Firebase
let generalQuestions = [];
let banQuestions = {};
let interview = [];
let formSettings = {};
let interviewSettings = {};
let notifySettings = {};

// ============================================================
// DANH SÁCH TRƯỜNG ĐH/HV NỔI TIẾNG Ở HÀ NỘI (cho dropdown #school)
// Trước đây #school là input text tự do -> dữ liệu bị gõ sai chính tả/viết tắt
// khác nhau ("ĐH Bách Khoa", "BKHN", "Bach Khoa HN"...), khó thống kê ở dashboard.
// Chuyển sang dropdown để chuẩn hoá; vẫn có "Khác" để không chặn ứng viên
// ngoài danh sách hoặc học ở tỉnh khác.
// ============================================================
const HANOI_SCHOOL_OPTIONS = [
    "Trường Đại học Ngoại thương (FTU) - Cơ sở Hà Nội",
    "Học viện Ngoại giao (DAV)",
    "Đại học Quốc gia Hà Nội (VNU)",
    "Trường Đại học Bách khoa Hà Nội (HUST)",
    "Trường Đại học Kinh tế Quốc dân (NEU)",
    "Học viện Ngân hàng",
    "Học viện Tài chính",
    "Học viện Công nghệ Bưu chính Viễn thông (PTIT)",
    "Học viện Báo chí và Tuyên truyền",
    "Học viện Nông nghiệp Việt Nam",
    "Học viện Chính sách và Phát triển",
    "Trường Đại học Thương mại (TMU)",
    "Trường Đại học Xây dựng Hà Nội (HUCE)",
    "Trường Đại học Giao thông Vận tải",
    "Trường Đại học Thủy lợi",
    "Trường Đại học Luật Hà Nội",
    "Trường Đại học Sư phạm Hà Nội (HNUE)",
    "Trường Đại học Y Hà Nội (HMU)",
    "Trường Đại học Dược Hà Nội",
    "Trường Đại học Công nghiệp Hà Nội (HaUI)",
    "Trường Đại học Mỏ - Địa chất",
    "Trường Đại học Thủ đô Hà Nội",
    "Trường Đại học Kinh doanh và Công nghệ Hà Nội",
    "Trường Đại học Hà Nội (HANU)",
    "Trường Đại học Văn hóa Hà Nội",
    "Trường Đại học Mở Hà Nội",
    "Trường Đại học Điện lực (EPU)",
    "Trường Đại học Lao động - Xã hội",
    "Trường Đại học FPT - Cơ sở Hà Nội",
    "Học viện Tòa án",
    "Học viện Phụ nữ Việt Nam",
    "Học viện Cảnh sát nhân dân",
    "Học viện An ninh nhân dân",
    "Học viện Kỹ thuật Quân sự"
];
const SCHOOL_OTHER_VALUE = "__other__";

// ============================================================
// KHỞI TẠO - TẢI DỮ LIỆU TỪ FIREBASE
// ============================================================
async function initFormData() {
    try {
        // KIỂM TRA DB TRƯỚC KHI DÙNG
        if (typeof db === 'undefined' || db === null) {
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
                "MD-General": raw["MD-General"] || raw["md-general"] || [],
                MD: {
                    General: raw["MD-General"] || raw["md-general"] || [],
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

    } catch (error) {
        // Fallback: không có câu hỏi nào
        generalQuestions = [];
        banQuestions = {};
        interview = [];
    }
}

function buildInterviewFromSlots(slots) {
    if (!slots || !Array.isArray(slots) || slots.length === 0) {
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
        id: "application_interview_slots",
        question: "Vui lòng chọn các khung giờ phỏng vấn bạn có thể tham gia (chọn ít nhất 3 ca)",
        options: options
    };

        return [interviewQuestion];
}

// ============================================================
// KIỂM TRA THỜI GIAN VÀ THÔNG BÁO
// ============================================================
function checkFormAvailability() {
    const now = new Date();
    const formEl = document.getElementById("recruitmentForm");
    if (!formEl) return; // DOM chưa render kịp #recruitmentForm -> tránh crash toàn hàm

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
                    : "Hình thức phỏng vấn thay đơn hiện chưa được mở. Vui lòng chọn hình thức điền đơn.",
                confirmButtonColor: '#FBBF24'
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
// GHI LOG HOẠT ĐỘNG (hiển thị ở tab "Lịch sử" bên Dashboard)
// applications/{id}/activity_log/{autoId}
// ============================================================
async function logActivity(applicationId, action, detail) {
    if (!applicationId || typeof db === 'undefined' || !db) return;
    try {
        const actor = (auth && auth.currentUser) ? auth.currentUser.email : ((detail && detail.email) || 'ẩn danh');
        await db.collection('applications').doc(applicationId)
            .collection('activity_log').add({
                action: action,
                detail: detail || {},
                actor: actor,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
    } catch (err) {
            }
}

// ============================================================
// KIỂM TRA EMAIL TRÙNG + CHẶN GHI ĐÈ DỮ LIỆU NGƯỜI KHÁC
// - Chưa đăng nhập + email đã tồn tại -> bắt đăng nhập, KHÔNG cho đi tiếp
// - Đăng nhập nhưng email khác tài khoản -> chặn
// - Đăng nhập đúng chủ hồ sơ -> chuyển sang chế độ BỔ SUNG (mergeMode)
//   để gộp "Điền đơn" + "Phỏng vấn thay đơn" vào 1 application duy nhất
// Gọi hàm này khi rời Section 1 (thông tin cá nhân), TRƯỚC khi cho
// sang Section 2 (chọn ban) — vì mergeMode cần khoá lựa chọn ban ở đó.
// ============================================================
async function checkEmailDuplicateGate() {
    const emailInput = document.getElementById('email');
    const email = (emailInput?.value || '').trim().toLowerCase();
    if (!email || typeof db === 'undefined' || !db) return true;

    // Đã xác định mergeMode cho đúng email này rồi thì khỏi hỏi lại
    if (mergeMode && existingApplicationData &&
        (existingApplicationData.email_lower || (existingApplicationData.email || '').toLowerCase()) === email) {
        return true;
    }

    try {
        const snap = await db.collection('applications').where('email_lower', '==', email).limit(1).get();

        if (snap.empty) {
            // Không trùng -> reset về chế độ tạo mới bình thường
            mergeMode = false;
            existingApplicationId = null;
            existingApplicationData = null;
            existingApplicationTypes = [];
            return true;
        }

        const docSnap = snap.docs[0];
        const data = docSnap.data();
        const types = data.application_types || (data.application_type ? [data.application_type] : []);
        const currentUser = auth ? auth.currentUser : null;

        // 1) Chưa đăng nhập -> KHÔNG cho tự chọn "điền lại", bắt đăng nhập trước
        if (!currentUser) {
            await Swal.fire({
                icon: 'warning',
                title: 'Email đã tồn tại',
                html: 'Email này đã có đơn ứng tuyển trong hệ thống.<br>Để bảo vệ dữ liệu ứng tuyển, vui lòng <b>đăng nhập</b> bằng đúng email đó để tiếp tục.',
                confirmButtonText: 'Đăng nhập ngay',
                confirmButtonColor: '#FBBF24',
                showCancelButton: true,
                cancelButtonText: 'Để sau'
            }).then((res) => {
                if (res.isConfirmed) {
                    window.location.href = '/user/login.html';
                }
            });
            return false;
        }

        // 2) Đăng nhập nhưng khác chủ email -> chặn, không cho xoá/ghi đè dữ liệu người khác
        if ((currentUser.email || '').toLowerCase() !== email) {
            Swal.fire({
                icon: 'error',
                title: 'Email không khớp tài khoản',
                text: 'Email bạn nhập không trùng với tài khoản Google đang đăng nhập. Vui lòng nhập đúng email đã đăng ký hoặc đăng nhập đúng tài khoản.',
                confirmButtonText: 'Đã hiểu',
                confirmButtonColor: '#FBBF24'
            });
            return false;
        }

        // 3) Đúng chủ hồ sơ, nhưng đã đủ cả 2 hình thức rồi
        if (types.includes('form') && types.includes('interview')) {
            await Swal.fire({
                icon: 'info',
                title: 'Hồ sơ đã hoàn tất',
                text: 'Bạn đã hoàn tất cả "Điền đơn" lẫn "Phỏng vấn thay đơn" cho hồ sơ này. Không thể nộp thêm.',
                confirmButtonText: 'Xem hồ sơ của tôi',
                confirmButtonColor: '#FBBF24'
            });
            window.location.href = '/user/profile.html';
            return false;
        }

        // 4) Đúng chủ hồ sơ, còn thiếu 1 hình thức -> chuyển sang chế độ BỔ SUNG
        mergeMode = true;
        existingApplicationId = docSnap.id;
        existingApplicationData = data;
        existingApplicationTypes = types;

        applyMergeModeRestrictions();

        await Swal.fire({
            icon: 'info',
            title: 'Bổ sung hồ sơ ứng tuyển',
            html: `Bạn đã có hồ sơ với hình thức <b>${types.includes('form') ? 'Điền đơn' : 'Phỏng vấn thay đơn'}</b>.<br>Lần này hệ thống sẽ gộp thêm hình thức còn lại vào <b>cùng một hồ sơ</b> của bạn.`,
            confirmButtonText: 'Đã hiểu',
            confirmButtonColor: '#FBBF24'
        });

        return true;
    } catch (err) {
                Swal.fire({ icon: 'error', title: 'Lỗi hệ thống', text: 'Không thể kiểm tra email lúc này. Vui lòng thử lại.', confirmButtonText: 'OK', confirmButtonColor: '#FBBF24' });
        return false;
    }
}

// ============================================================
// ÁP DỤNG GIỚI HẠN KHI Ở CHẾ ĐỘ BỔ SUNG HỒ SƠ (mergeMode)
// - Ẩn hình thức đã có ở Section 0, chỉ còn hình thức cần bổ sung
// - Khoá (readonly) thông tin cá nhân đã có sẵn, tránh lệch dữ liệu
// - Nếu hồ sơ gốc có "Điền đơn": khoá 2 ban đúng theo đơn gốc,
//   không cho chọn ban khác khi đăng ký "Phỏng vấn thay đơn"
// ============================================================
function applyMergeModeRestrictions() {
    if (!mergeMode || !existingApplicationData) return;

    const remaining = ['form', 'interview'].filter(t => !existingApplicationTypes.includes(t));

    document.querySelectorAll('.application-type').forEach(el => {
        const t = el.id.replace('type-', '');
        el.style.display = remaining.includes(t) ? '' : 'none';
        el.style.opacity = remaining.includes(t) ? '' : '0.4';
    });

    if (remaining.length === 1) {
        selectApplicationType(remaining[0]);
    }

    // Prefill + khoá thông tin cá nhân đã có, tránh sửa lệch với hồ sơ gốc
    ['fullname', 'birthdate', 'gender', 'phone', 'major', 'facebook'].forEach(id => {
        const el = document.getElementById(id);
        if (el && existingApplicationData[id]) {
            el.value = existingApplicationData[id];
            el.setAttribute('readonly', 'readonly');
            if (el.tagName === 'SELECT') el.setAttribute('disabled', 'disabled');
            el.style.background = '#F3F4F6';
        }
    });

    // #school là dropdown (select + ô "Khác") nên xử lý riêng, không gán el.value
    // trực tiếp như input thường (xem setupSchoolDropdown()/setSchoolValue()).
    if (existingApplicationData.school) {
        setSchoolValue(existingApplicationData.school);
        const schoolSelect = document.getElementById('school');
        const schoolOther = document.getElementById('school_other');
        [schoolSelect, schoolOther].forEach(el => {
            if (!el) return;
            el.setAttribute('readonly', 'readonly');
            if (el.tagName === 'SELECT') el.setAttribute('disabled', 'disabled');
            el.style.background = '#F3F4F6';
        });
    }

    // Nếu hồ sơ gốc đã có sẵn priority_position/secondary_position (dù đến từ
    // "Điền đơn" hay "Phỏng vấn thay đơn") -> khoá ban theo đúng dữ liệu gốc.
    // Trước đây chỉ khoá khi existingApplicationTypes có 'form', nên trường hợp
    // bổ sung "Điền đơn" vào hồ sơ đã có PVTĐ không bị khoá ban, cho phép chọn
    // ban khác — nhưng updatePayload lại luôn xoá priority_position/secondary_position
    // nên lựa chọn mới không được lưu, trong khi câu hỏi riêng-ban vẫn lưu theo ban
    // mới chọn -> lệch dữ liệu. Khoá 2 chiều để tránh tình huống này.
    if (existingApplicationData.priority_position || existingApplicationData.secondary_position) {
        lockBanSelectionToExisting();
    }
}

// mergeAllowedBans: danh sách mã ban mà ứng viên được phép chọn khi bổ sung hồ sơ
// (null = không giới hạn). Dùng chung với updateSecondaryOptions() để giữ giới hạn
// này mỗi khi người dùng đổi lựa chọn (thay vì reset về mở toàn bộ 4 ban).
let mergeAllowedBans = null;

function lockBanSelectionToExisting() {
    const priorityExisting = existingApplicationData.priority_position;
    const secondaryExisting = existingApplicationData.secondary_position;

    const prioritySel = document.getElementById('priority_position');
    const secondarySel = document.getElementById('secondary_position');

    if (priorityExisting && secondaryExisting) {
        // CASE 1: Đơn gốc đã điền đủ 2 ban (NV1 + NV2).
        // -> Không khoá cứng nữa: cho phép ứng viên đổi chỗ giữa 2 ban đã nộp
        //    (đổi ban nào là NV1/NV2), hoặc chỉ giữ lại 1 ban (PVTĐ 1 ban) bằng
        //    cách để trống NV2. Chỉ không cho chọn sang một ban thứ 3 hoàn toàn khác.
        mergeAllowedBans = [priorityExisting, secondaryExisting];

        [prioritySel, secondarySel].forEach(sel => {
            if (!sel) return;
            Array.from(sel.options).forEach(opt => {
                if (!opt.value) return; // giữ nguyên option rỗng "-- Chọn vị trí --"
                opt.disabled = !mergeAllowedBans.includes(opt.value);
            });
            sel.removeAttribute('disabled');
        });

        if (prioritySel) prioritySel.value = priorityExisting;
        if (secondarySel) secondarySel.value = secondaryExisting;
    } else if (priorityExisting) {
        // CASE 2: Đơn gốc chỉ điền 1 ban (NV1) -> NV1 đó phải giữ nguyên,
        // nhưng NV2 để hoàn toàn tự do, cho ứng viên bổ sung thêm 1 ban bất kỳ.
        mergeAllowedBans = null;

        if (prioritySel) {
            Array.from(prioritySel.options).forEach(opt => {
                if (!opt.value) return;
                opt.disabled = opt.value !== priorityExisting;
            });
            prioritySel.value = priorityExisting;
            prioritySel.setAttribute('disabled', 'disabled');
        }
        if (secondarySel) {
            Array.from(secondarySel.options).forEach(opt => { opt.disabled = false; });
            secondarySel.removeAttribute('disabled');
        }
    }

    if (typeof updateSecondaryOptions === 'function') updateSecondaryOptions();
    if (typeof updateMDSubDepartments === 'function') updateMDSubDepartments();
    if (typeof updatePositionNames === 'function') updatePositionNames();
}

// ============================================================
// LOAD INTRO TỪ FIREBASE (thay thế loadIntroFromMarkdown)
// ============================================================
async function loadIntroFromMarkdown() {
    try {
        if (typeof db === 'undefined' || db === null) {
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
                    }

    } catch (e) {
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
        if (data.application_interview_slots && Array.isArray(data.application_interview_slots)) {
            document.querySelectorAll('#interview-schedule input[type="checkbox"]').forEach(cb => {
                if (data.application_interview_slots.includes(cb.value)) {
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
        const dateMatch = opt.match(/((?:Thứ\s*\d+|Chủ\s*nhật),\s*\d{2}\/\d{2}\/\d{4})|(\d{2}\/\d{2}\/\d{4})/);
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
                <input type="checkbox" id="${optionId}" name="application_interview_slots[]" value="${opt}" style="margin-right:10px;width:18px;height:18px;flex-shrink:0;">
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
            if (data.application_interview_slots && Array.isArray(data.application_interview_slots)) {
                document.querySelectorAll('#interview-schedule input[type="checkbox"]').forEach(cb => {
                    if (data.application_interview_slots.includes(cb.value)) {
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

    // LƯU DỮ LIỆU HIỆN TẠI TRƯỚC KHI XÓA — merge với localStorage để không mất dữ liệu khi tab chưa render
    let currentData = {};
    try {
        const saved = localStorage.getItem('enactus_form_data');
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.keys(parsed).forEach(k => {
                if (k.startsWith(type + '_')) currentData[k] = parsed[k];
            });
        }
    } catch(e) {}
    // Override bằng giá trị DOM hiện tại (nếu đang hiển thị)
    questionsContainer.querySelectorAll('input, textarea, select').forEach(el => {
        const name = el.name || el.id;
        if (!name) return;
        if (el.type === 'checkbox') {
            if (el.checked) {
                if (!currentData[name]) currentData[name] = [];
                if (!currentData[name].includes(el.value)) currentData[name].push(el.value);
            }
        } else if (el.type === 'radio') {
            if (el.checked) currentData[name] = el.value;
        } else if (el.value) {
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

        // CÂU HỎI CHUNG CỦA BAN TRUYỀN THÔNG — hiện luôn, bất kể chọn tiểu ban Design/Content nào
        const mdGeneralQuestions = (banQuestions.MD && banQuestions.MD.General) || banQuestions['MD-General'] || [];
        if (mdGeneralQuestions.length > 0) {
            const generalSubtitle = document.createElement('div');
            generalSubtitle.className = 'sub-section';
            generalSubtitle.innerHTML = `<h3>Câu hỏi chung - Ban Truyền thông</h3>`;
            questionsContainer.appendChild(generalSubtitle);

            mdGeneralQuestions.forEach(q => {
                // Dùng CHUNG pattern "type_general_qid" như Design/Content (type_design_qid)
                // để response.js (getAnswer) tự khớp được theo sub="General".
                const prefixedId = `${type}_general_${q.id}`;
                const questionDiv = buildQuestionDiv(q, prefixedId, type === 'secondary');
                questionsContainer.appendChild(questionDiv);
            });
        }

        selected.forEach(sub => {
            const subtitle = document.createElement('div');
            subtitle.className = 'sub-section';
            subtitle.innerHTML = `<h3>Tiểu ban ${sub}</h3>`;
            questionsContainer.appendChild(subtitle);

            const questions = (banQuestions.MD && banQuestions.MD[sub]) || banQuestions[`MD-${sub}`] || [];
            questions.forEach(q => {
                const prefixedId = `${type}_${sub.toLowerCase()}_${q.id}`;
                const questionDiv = buildQuestionDiv(q, prefixedId, type === 'secondary');
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
            const questionDiv = buildQuestionDiv(q, prefixedId, type === 'secondary');
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
                confirmButtonColor: '#FBBF24'
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
                        confirmButtonColor: '#FBBF24'
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
                    confirmButtonColor: '#FBBF24'
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
                        confirmButtonColor: '#FBBF24'
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
                    confirmButtonColor: '#FBBF24'
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
                            confirmButtonColor: '#FBBF24'
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
                        confirmButtonColor: '#FBBF24'
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
                confirmButtonColor: '#FBBF24'
            });
            return false;
        }
    }

    return true;
}

// ============================================================
// XÂY DỰNG INPUT THEO LOẠI CÂU HỎI
// ============================================================
function buildQuestionDiv(q, prefixedId, isSecondary = false) {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'form-group question-item';

    const questionText = q.text || q.question || '';
    let labelHtml = '';
    if (/\r?\n/.test(questionText)) {
        labelHtml = questionText.split(/\r?\n/).join('<br>');
    } else {
        labelHtml = questionText;
    }

    // NV2 không bắt buộc — bỏ dấu * và thuộc tính required
    const effectiveRequired = isSecondary ? false : q.required;
    let html = `<label for="${prefixedId}" ${effectiveRequired ? 'class="required"' : ''}>${labelHtml}</label>`;

    if (q.media) {
        if (q.media.type === 'image') {
            html += `<div class="question-media"><img src="${q.media.url}" alt="${q.media.alt || ''}" class="question-img"></div>`;
        }
    }

    switch (q.type) {
        case 'textarea':
            html += `<textarea id="${prefixedId}" name="${prefixedId}" rows="3" placeholder="${q.placeholder || ''}" ${effectiveRequired ? 'required' : ''}></textarea>`;
            break;
        case 'checkbox':
            html += `<div class="checkbox-group" id="${prefixedId}_group">`;
            (q.options || []).forEach((option, idx) => {
                const optionId = `${prefixedId}_${idx}`;
                const req = (effectiveRequired && idx === 0) ? 'required' : '';
                html += `<div class="checkbox-item"><input type="checkbox" id="${optionId}" name="${prefixedId}[]" value="${option}" ${req}><label for="${optionId}">${option}</label></div>`;
            });
            html += `</div>`;
            break;
        case 'radio':
            html += `<div class="radio-group" id="${prefixedId}_group">`;
            (q.options || []).forEach((option, idx) => {
                const optionId = `${prefixedId}_${idx}`;
                const req = (effectiveRequired && idx === 0) ? 'required' : '';
                html += `<div class="radio-item"><input type="radio" id="${optionId}" name="${prefixedId}" value="${option}" ${req}><label for="${optionId}">${option}</label></div>`;
            });
            html += `</div>`;
            break;
        case 'dropdown':
            // NV2: không có option rỗng (không bắt buộc chọn)
            html += `<select id="${prefixedId}" name="${prefixedId}" ${effectiveRequired ? 'required' : ''}>`;
            if (!isSecondary) html += `<option value="">-- Chọn --</option>`;
            (q.options || []).forEach(opt => { html += `<option value="${opt}">${opt}</option>`; });
            html += `</select>`;
            break;
        case 'scale':
            const mid = Math.round(((q.min || 1) + (q.max || 5)) / 2);
            html += `<div class="scale-container">
                <input type="range" id="${prefixedId}" name="${prefixedId}" min="${q.min || 1}" max="${q.max || 5}" value="${mid}" ${effectiveRequired ? 'required' : ''}>
                <div class="scale-labels"><span>${q.min || 1}</span><span>${q.max || 5}</span></div>
                <output for="${prefixedId}" id="${prefixedId}_value">${mid}</output>
            </div>`;
            break;
        default:
            html += `<input type="text" id="${prefixedId}" name="${prefixedId}" placeholder="${q.placeholder || ''}" ${effectiveRequired ? 'required' : ''}>`;
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
        case 'tel': {
            const inp = document.createElement('input');
            inp.type = q.type;
            inp.id = id;
            inp.name = name;
            if (q.placeholder) inp.placeholder = q.placeholder;
            if (q.required) inp.required = true;
            inp.addEventListener('input', simpleSaveFormData);
            return inp;
        }
        case 'date': {
            // Dùng text input thay vì input[type=date] để người dùng nhập dd/mm/yyyy
            const inp = document.createElement('input');
            inp.type = 'text';
            inp.id = id;
            inp.name = name;
            inp.placeholder = 'dd/mm/yyyy';
            inp.maxLength = 10;
            inp.autocomplete = 'off';
            if (q.required) inp.required = true;
            // Auto-mask: tự chèn dấu / sau ngày và tháng
            inp.addEventListener('input', function(e) {
                let v = e.target.value.replace(/\D/g, '');
                if (v.length > 8) v = v.slice(0, 8);
                if (v.length >= 5) v = v.slice(0,2) + '/' + v.slice(2,4) + '/' + v.slice(4);
                else if (v.length >= 3) v = v.slice(0,2) + '/' + v.slice(2);
                e.target.value = v;
                simpleSaveFormData();
            });
            inp.addEventListener('blur', function(e) {
                validateDateInput(e.target);
                simpleSaveFormData();
            });
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
    Array.from(secondarySelect.options).forEach(opt => {
        if (!opt.value) return; // giữ nguyên option rỗng "-- Chọn vị trí --"
        // Nếu đang ở chế độ bổ sung hồ sơ (mergeMode) và có giới hạn danh sách ban
        // (mergeAllowedBans), giữ nguyên giới hạn đó thay vì mở lại toàn bộ 4 ban
        opt.disabled = (typeof mergeAllowedBans !== 'undefined' && mergeAllowedBans)
            ? !mergeAllowedBans.includes(opt.value)
            : false;
    });

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
async function nextSection(current) {
    if (current === 0 && !applicationType) {
        Swal.fire({ icon: 'warning', title: 'Chưa chọn hình thức', text: 'Vui lòng chọn hình thức ứng tuyển.', confirmButtonText: 'OK', confirmButtonColor: '#FBBF24' });
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
                    confirmButtonText: 'Đã hiểu',
                    confirmButtonColor: '#FBBF24'
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

    if (!valid) {
        Swal.fire({ icon: 'warning', title: 'Thiếu thông tin', text: 'Vui lòng điền đầy đủ các thông tin bắt buộc.', confirmButtonText: 'OK', confirmButtonColor: '#FBBF24' });
        return;
    }

    // Kiểm tra ngày sinh / email / số điện thoại đúng quy tắc (không chỉ "có nhập"
    // như required-check ở trên) trước khi cho sang section kế
    const birthdateEl = currentSectionEl?.querySelector('#birthdate');
    if (birthdateEl && !validateBirthdateInput(birthdateEl)) {
        return;
    }
    const emailElNext = currentSectionEl?.querySelector('#email');
    if (emailElNext && !validateEmailInput(emailElNext)) {
        return;
    }
    const phoneElNext = currentSectionEl?.querySelector('#phone');
    if (phoneElNext && !validatePhoneInput(phoneElNext)) {
        return;
    }
    const schoolElNext = currentSectionEl?.querySelector('#school');
    if (schoolElNext && !validateSchoolInput()) {
        return;
    }

    // Rời Section 1 (thông tin cá nhân) -> kiểm tra email trùng trước khi
    // cho sang Section 2 (chọn ban), vì mergeMode cần khoá ban ở đó.
    if (current === 1) {
        const canProceed = await checkEmailDuplicateGate();
        if (!canProceed) return;
    }

    simpleSaveFormData();
    showSection(current + 1);
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
        <p><strong>Trường:</strong> ${getSchoolValue()}</p>
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

function validateDateInput(inp) {
    const v = inp.value.trim();
    if (!v) return true; // empty, required sẽ bắt
    const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) {
        inp.style.borderColor = '#EF4444';
        inp.title = 'Định dạng không hợp lệ, vui lòng nhập dd/mm/yyyy';
        return false;
    }
    const day = parseInt(m[1]), month = parseInt(m[2]), year = parseInt(m[3]);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day
        || year < 1900 || year > new Date().getFullYear()) {
        inp.style.borderColor = '#EF4444';
        inp.title = 'Ngày không hợp lệ';
        return false;
    }
    inp.style.borderColor = '';
    inp.title = '';
    return true;
}

function formatDateToVN(dateString) {
    if (!dateString) return "";
    // Đã là dd/mm/yyyy (người dùng nhập trực tiếp) — trả về luôn
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return dateString;
    // Legacy: yyyy-mm-dd từ input[type=date] cũ
    const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
    return dateString;
}

// ============================================================
// KIỂM TRA NGÀY SINH HỢP LỆ
// Trước đây chỉ regex /^\d{2}\/\d{2}\/\d{4}$/ (đúng ĐỊNH DẠNG), nên các ngày
// như 31/02/2003, 00/13/2000 vẫn "hợp lệ" và được lưu vào hồ sơ. Hàm này kiểm
// tra thêm: ngày có thật trên lịch không, không ở tương lai, và tuổi nằm trong
// khoảng hợp lý (15-100) để bắt các lỗi gõ nhầm rõ ràng.
// ============================================================
function parseVNBirthdate(str) {
    const m = (str || '').trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    const year = parseInt(m[3], 10);
    const date = new Date(year, month - 1, day);
    // Roundtrip check: nếu Date "tự sửa" ngày (VD 31/02 -> 03/03) thì ngày gốc không có thật
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
    }
    return date;
}

function validateBirthdateInput(input, { silent = false } = {}) {
    if (!input) return true;
    const raw = input.value.trim();
    if (!raw) return true; // để required-check khác xử lý trường hợp bỏ trống

    const date = parseVNBirthdate(raw);
    let errorMsg = '';
    if (!date) {
        errorMsg = 'Ngày sinh không hợp lệ. Vui lòng kiểm tra lại (định dạng dd/mm/yyyy).';
    } else {
        const now = new Date();
        if (date > now) {
            errorMsg = 'Ngày sinh không thể ở tương lai.';
        } else {
            const age = (now - date) / (365.25 * 24 * 60 * 60 * 1000);
            if (age < 15 || age > 100) {
                errorMsg = 'Ngày sinh không hợp lệ. Vui lòng kiểm tra lại.';
            }
        }
    }

    if (errorMsg) {
        input.style.borderColor = '#EF4444';
        input.title = errorMsg;
        if (!silent) {
            Swal.fire({
                icon: 'warning',
                title: 'Ngày sinh không hợp lệ',
                html: `${errorMsg}<br><span style="color:#9CA3AF;font-size:13px;">Định dạng đúng: <b>dd/mm/yyyy</b> (VD: 15/03/2003)</span>`,
                confirmButtonText: 'Đã hiểu',
                confirmButtonColor: '#FBBF24'
            });
        }
        return false;
    }

    input.style.borderColor = '';
    input.title = '';
    return true;
}

// ============================================================
// KIỂM TRA EMAIL HỢP LỆ
// Trước đây #email không có validate định dạng nào ở form.js (chỉ dựa vào
// type="email" của trình duyệt, có thể bị bỏ qua/khác nhau tuỳ trình duyệt,
// và không chặn được các lỗi như thiếu "@", thiếu domain, khoảng trắng...).
// ============================================================
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmailInput(input, { silent = false } = {}) {
    if (!input) return true;
    const raw = input.value.trim();
    if (!raw) return true; // để required-check khác xử lý trường hợp bỏ trống

    if (!EMAIL_REGEX.test(raw)) {
        input.style.borderColor = '#EF4444';
        input.title = 'Email không hợp lệ. Vui lòng nhập đúng định dạng (VD: ten@example.com).';
        if (!silent) {
            Swal.fire({
                icon: 'warning',
                title: 'Email không hợp lệ',
                html: `Địa chỉ email bạn nhập chưa đúng định dạng.<br><span style="color:#9CA3AF;font-size:13px;">VD hợp lệ: <b>ten@example.com</b></span>`,
                confirmButtonText: 'Đã hiểu',
                confirmButtonColor: '#FBBF24'
            });
        }
        return false;
    }

    input.style.borderColor = '';
    input.title = '';
    return true;
}

// ============================================================
// KIỂM TRA SỐ ĐIỆN THOẠI HỢP LỆ (VN)
// Trước đây #phone không có validate nào — chấp nhận cả chữ, ký tự đặc biệt,
// độ dài bất kỳ. Quy tắc: số điện thoại VN sau khi bỏ khoảng trắng/dấu gạch
// phải là 0xxxxxxxxx (10 số, bắt đầu bằng 0) hoặc +84xxxxxxxxx (dạng quốc tế).
// ============================================================
const PHONE_REGEX = /^(0\d{9}|\+84\d{9})$/;

function validatePhoneInput(input, { silent = false } = {}) {
    if (!input) return true;
    const raw = input.value.replace(/[\s.-]/g, '').trim();
    if (!raw) return true; // để required-check khác xử lý trường hợp bỏ trống

    if (!PHONE_REGEX.test(raw)) {
        input.style.borderColor = '#EF4444';
        input.title = 'Số điện thoại không hợp lệ. Định dạng đúng: 0xxxxxxxxx (10 số) hoặc +84xxxxxxxxx.';
        if (!silent) {
            Swal.fire({
                icon: 'warning',
                title: 'Số điện thoại không hợp lệ',
                html: `Vui lòng kiểm tra lại số điện thoại.<br><span style="color:#9CA3AF;font-size:13px;">Định dạng đúng: <b>0xxxxxxxxx</b> (10 số) hoặc <b>+84xxxxxxxxx</b></span>`,
                confirmButtonText: 'Đã hiểu',
                confirmButtonColor: '#FBBF24'
            });
        }
        return false;
    }

    input.style.borderColor = '';
    input.title = '';
    return true;
}

// ============================================================
// DROPDOWN TRƯỜNG ĐH/HV (#school) + Ô "Khác" TỰ DO
// Biến input#school (text tự do) thành select#school (giữ nguyên id/name để
// không phá code khác đang gọi document.getElementById('school')) + thêm ô
// text #school_other chỉ hiện khi chọn "Khác". getSchoolValue()/setSchoolValue()
// là điểm chung để đọc/ghi giá trị "trường" thực tế (không phải giá trị select thô).
// ============================================================
function setupSchoolDropdown() {
    const oldInput = document.getElementById('school');
    if (!oldInput || oldInput.tagName === 'SELECT') return; // đã là select rồi, hoặc không tìm thấy field

    const select = document.createElement('select');
    select.id = 'school';
    select.name = oldInput.name || 'school';
    if (oldInput.hasAttribute('required')) select.setAttribute('required', 'required');
    select.className = oldInput.className;

    const placeholderOpt = document.createElement('option');
    placeholderOpt.value = '';
    placeholderOpt.textContent = '-- Chọn trường --';
    select.appendChild(placeholderOpt);

    HANOI_SCHOOL_OPTIONS.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
    });

    const otherOpt = document.createElement('option');
    otherOpt.value = SCHOOL_OTHER_VALUE;
    otherOpt.textContent = 'Khác (trường không có trong danh sách)';
    select.appendChild(otherOpt);

    const otherInput = document.createElement('input');
    otherInput.type = 'text';
    otherInput.id = 'school_other';
    otherInput.name = 'school_other';
    otherInput.placeholder = 'Nhập tên trường của bạn';
    otherInput.className = oldInput.className;
    otherInput.style.marginTop = '8px';
    otherInput.style.display = 'none';

    oldInput.replaceWith(select);
    select.insertAdjacentElement('afterend', otherInput);

    select.addEventListener('change', () => {
        otherInput.style.display = select.value === SCHOOL_OTHER_VALUE ? '' : 'none';
        simpleSaveFormData();
    });
    otherInput.addEventListener('input', simpleSaveFormData);
}

// Gán giá trị "trường" (chuỗi bất kỳ, kể cả không có trong danh sách) vào
// select#school + input#school_other. Dùng khi khôi phục localStorage hoặc
// prefill dữ liệu hồ sơ gốc (mergeMode) — dữ liệu cũ trước khi có dropdown
// này có thể là chuỗi tự do bất kỳ, không nằm trong HANOI_SCHOOL_OPTIONS.
function setSchoolValue(value) {
    const select = document.getElementById('school');
    const otherInput = document.getElementById('school_other');
    if (!select) return;
    if (!value) return;

    if (HANOI_SCHOOL_OPTIONS.includes(value)) {
        select.value = value;
        if (otherInput) otherInput.style.display = 'none';
    } else {
        select.value = SCHOOL_OTHER_VALUE;
        if (otherInput) {
            otherInput.value = value;
            otherInput.style.display = '';
        }
    }
}

// Đọc giá trị "trường" thực tế: nếu chọn "Khác" thì lấy từ ô nhập tự do
function getSchoolValue() {
    const select = document.getElementById('school');
    if (!select) return '';
    if (select.value === SCHOOL_OTHER_VALUE) {
        return (document.getElementById('school_other')?.value || '').trim();
    }
    return select.value || '';
}

// Kiểm tra: nếu chọn "Khác" thì ô nhập tên trường không được để trống
function validateSchoolInput({ silent = false } = {}) {
    const select = document.getElementById('school');
    if (!select) return true;
    if (select.value !== SCHOOL_OTHER_VALUE) return true;

    const otherInput = document.getElementById('school_other');
    if (otherInput && !otherInput.value.trim()) {
        otherInput.style.borderColor = '#EF4444';
        if (!silent) {
            Swal.fire({
                icon: 'warning',
                title: 'Thiếu tên trường',
                html: `Bạn đã chọn "Khác" nhưng chưa nhập tên trường.<br><span style="color:#9CA3AF;font-size:13px;">Vui lòng nhập đầy đủ tên trường bạn đang theo học.</span>`,
                confirmButtonText: 'Đã hiểu',
                confirmButtonColor: '#FBBF24'
            });
        }
        return false;
    }
    if (otherInput) otherInput.style.borderColor = '';
    return true;
}

// ============================================================
// THU THẬP DỮ LIỆU FORM
// ============================================================
function collectFormData() {
    const formData = {
        application_type: applicationType,
        fullname: document.getElementById('fullname')?.value || '',
        birthdate: formatDateToVN(document.getElementById('birthdate')?.value || ''),
        gender: document.getElementById('gender')?.value || '',
        email: (document.getElementById('email')?.value || '').trim(),
        email_lower: (document.getElementById('email')?.value || '').trim().toLowerCase(),
        phone: document.getElementById('phone')?.value || '',
        school: getSchoolValue(),
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
            formData.application_interview_slots = Array.from(checkedBoxes).map(cb => cb.value);
        }
    }

    // FIX: Ghi lại CHÍNH XÁC (những) ban mà ứng viên đăng ký "Phỏng vấn thay đơn"
    // (application_type === 'interview'), tách biệt khỏi priority_position/secondary_position
    // chung của hồ sơ. Lý do: khi merge (VD hồ sơ gốc đã "Điền đơn" 2 ban, giờ bổ sung PVTĐ
    // chỉ 1 ban), form.js đang loại priority_position/secondary_position khỏi updatePayload
    // để tránh ghi đè đơn gốc -> nếu không lưu riêng field này, interview-arrangement.html
    // sẽ không biết ứng viên chỉ đăng ký PVTĐ 1 ban, và xếp lịch nhầm cho cả 2 ban.
    if (applicationType === 'interview') {
        formData.interview_departments = [formData.priority_position, formData.secondary_position]
            .filter(p => p && p !== 'None');
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
        if (data.school) setSchoolValue(data.school);
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
            if (data.application_interview_slots) {
                document.querySelectorAll('#interview-schedule input[type="checkbox"]').forEach(cb => {
                    if (data.application_interview_slots.includes(cb.value)) {
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

        // Kiểm tra lại ngày sinh / email / số điện thoại lần cuối trước khi gửi
        // (phòng trường hợp field được điền qua localStorage restore hoặc
        // mergeMode readonly mà chưa từng đi qua nextSection() để validate)
        if (!validateBirthdateInput(document.getElementById('birthdate'))) {
            return;
        }
        if (!validateEmailInput(document.getElementById('email'))) {
            return;
        }
        if (!validatePhoneInput(document.getElementById('phone'))) {
            return;
        }
        if (!validateSchoolInput()) {
            return;
        }

        if (!document.getElementById('agree')?.checked) {
            Swal.fire({ icon: 'warning', title: 'Chưa xác nhận', text: 'Vui lòng xác nhận rằng tất cả thông tin bạn cung cấp là chính xác.', confirmButtonText: 'OK', confirmButtonColor: '#FBBF24' });
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

            delete formObject.timestamp; // Xóa ISO string, dùng serverTimestamp

            let savedAppId;

            if (mergeMode && existingApplicationId) {
                // ---- BỔ SUNG VÀO HỒ SƠ ĐÃ TỒN TẠI (gộp form + interview) ----
                const freshDoc = await db.collection('applications').doc(existingApplicationId).get();
                const freshData = freshDoc.exists ? freshDoc.data() : {};
                const freshTypes = freshData.application_types || (freshData.application_type ? [freshData.application_type] : []);
                if (freshTypes.includes(applicationType)) {
                    throw new Error('Hình thức này đã được ghi nhận trước đó cho hồ sơ của bạn. Vui lòng tải lại trang.');
                }

                const updatePayload = { ...formObject };
                // Không ghi đè các trường định danh gốc của hồ sơ
                ['application_type', 'email', 'email_lower', 'fullname', 'birthdate', 'gender',
                 'phone', 'school', 'major', 'facebook', 'priority_position', 'secondary_position']
                    .forEach(k => delete updatePayload[k]);

                // all_departments cũng phải được GỘP với dữ liệu gốc, không ghi đè.
                // Lý do: all_departments vừa tính ở trên chỉ phản ánh priority/secondary_position
                // của LẦN SUBMIT NÀY (VD ở case lock "chỉ khoá NV1, NV2 tự do" trong
                // lockBanSelectionToExisting(), ứng viên PVTĐ có thể chọn thêm 1 ban mới cho
                // NV2). Nếu ghi đè trực tiếp, all_departments của hồ sơ sẽ MẤT ban đã ghi nhận
                // ở lần submit trước đó (dashboard lọc theo ban sẽ bị sai).
                const existingDepartments = Array.isArray(freshData.all_departments) ? freshData.all_departments : [];
                updatePayload.all_departments = Array.from(new Set([...existingDepartments, ...updatePayload.all_departments]));

                updatePayload.application_types = firebase.firestore.FieldValue.arrayUnion(applicationType);
                updatePayload.updated_at = firebase.firestore.FieldValue.serverTimestamp();

                await db.collection('applications').doc(existingApplicationId).update(updatePayload);
                savedAppId = existingApplicationId;

                const mergeLogDetail = {
                    added_type: applicationType,
                    note: `Ứng viên bổ sung hình thức "${applicationType === 'interview' ? 'Phỏng vấn thay đơn' : 'Điền đơn'}" vào hồ sơ hiện có.`
                };
                // Ghi rõ (những) ban đăng ký PVTĐ vào log, để tab "Lịch sử" bên Dashboard xem được
                // chính xác ứng viên đăng ký ban nào (không chỉ biết "có bổ sung PVTĐ").
                // Lưu ý: Firestore không cho phép field `undefined`, nên chỉ gán khi có giá trị.
                if (applicationType === 'interview') {
                    mergeLogDetail.interview_departments = formObject.interview_departments || [];
                }
                await logActivity(savedAppId, 'merge_application_type', mergeLogDetail);
            } else {
                // ---- TẠO HỒ SƠ MỚI: kiểm tra trùng lần cuối để tránh race-condition ----
                const dupCheck = await db.collection('applications')
                    .where('email_lower', '==', formObject.email_lower)
                    .limit(1).get();
                if (!dupCheck.empty) {
                    throw new Error('Email này vừa được ghi nhận đơn ứng tuyển. Vui lòng tải lại trang và đăng nhập để tiếp tục.');
                }

                formObject.application_types = [applicationType];
                formObject.timestamp = firebase.firestore.FieldValue.serverTimestamp();
                formObject.created_at = firebase.firestore.FieldValue.serverTimestamp();

                const newDocRef = await db.collection('applications').add(formObject);
                savedAppId = newDocRef.id;

                await logActivity(savedAppId, 'created', {
                    application_type: applicationType,
                    note: 'Ứng viên nộp đơn ứng tuyển lần đầu.'
                });
            }

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
                        Swal.fire({ icon: 'error', title: 'Có lỗi xảy ra', text: 'Không thể gửi đơn ứng tuyển. Vui lòng thử lại. Chi tiết: ' + error.message, confirmButtonText: 'OK', confirmButtonColor: '#FBBF24' });
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

    // Chuyển #school thành dropdown trường ĐH/HV (phải chạy TRƯỚC loadFormData()
    // vì loadFormData() gọi setSchoolValue() dựa vào select đã tồn tại)
    setupSchoolDropdown();

    // Khôi phục dữ liệu tạm
    loadFormData();

    // Thiết lập auto-save (debounce đúng cách: mỗi lần gõ/đổi giá trị chỉ giữ
    // lại 1 timer duy nhất bằng cách clearTimeout cái cũ trước khi set cái mới,
    // tránh gõ nhanh tạo hàng chục timer chồng nhau -> ghi localStorage thừa)
    let autoSaveTimer = null;
    const scheduleAutoSave = (delay) => {
        if (autoSaveTimer) clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(simpleSaveFormData, delay);
    };
    document.addEventListener('input', () => scheduleAutoSave(300));
    document.addEventListener('change', () => scheduleAutoSave(300));
    document.addEventListener('click', e => {
        if (e.target.type === 'radio' || e.target.type === 'checkbox') {
            scheduleAutoSave(200);
        }
    });
    window.addEventListener('beforeunload', simpleSaveFormData);
    setInterval(simpleSaveFormData, 30000);

    // Mask nhập ngày sinh
    const birthdateInput = document.getElementById('birthdate');
    if (birthdateInput) {
        birthdateInput.addEventListener('input', function(e) {
            let v = e.target.value.replace(/\D/g, '');
            if (v.length > 8) v = v.slice(0, 8);
            if (v.length >= 5) v = v.slice(0,2) + '/' + v.slice(2,4) + '/' + v.slice(4);
            else if (v.length >= 3) v = v.slice(0,2) + '/' + v.slice(2);
            e.target.value = v;
        });
        birthdateInput.addEventListener('blur', function(e) {
            validateBirthdateInput(e.target, { silent: true });
        });
    }

    // Validate realtime khi rời khỏi ô email / số điện thoại
    const emailInputEl = document.getElementById('email');
    if (emailInputEl) {
        emailInputEl.addEventListener('blur', function(e) {
            validateEmailInput(e.target, { silent: true });
        });
    }
    const phoneInputEl = document.getElementById('phone');
    if (phoneInputEl) {
        phoneInputEl.addEventListener('blur', function(e) {
            validatePhoneInput(e.target, { silent: true });
        });
    }

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

    // Chặn Enter nhảy trang — chỉ cho phép Enter trong textarea (xuống dòng)
    document.getElementById('recruitmentForm')?.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    });

    // Override alert
    window.alert = function(message) {
        Swal.fire({ icon: 'warning', title: 'Cảnh báo', text: message, confirmButtonText: 'OK', confirmButtonColor: '#FBBF24' });
    };

    // Retry khôi phục cuối
    setTimeout(() => restoreBanQuestionsDirectly(), 5000);
});