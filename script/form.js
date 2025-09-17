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
      
        // Biến toàn cục để lưu hình thức ứng tuyển
        let applicationType = '';
        let currentSection = 0;
        const totalSections = 4;
        
        // Hàm chọn hình thức ứng tuyển
        function selectApplicationType(type) {

            applicationType = type;
            document.getElementById('application_type').value = type;
            
            // Cập nhật giao diện
            document.querySelectorAll('.application-type').forEach(el => {
                el.classList.remove('selected');
            });
            document.getElementById(`type-${type}`).classList.add('selected');
        }

        async function loadIntroFromMarkdown() {
        try {
            const response = await fetch('/content/intro.md');
            const markdown = await response.text();
            const html = marked.parse(markdown);
            document.getElementById("intro-info-container").innerHTML = html; // ✅ chỉ intro
        } catch (err) {
            console.error("Không thể load intro.md:", err);
        }
        }

        document.addEventListener("DOMContentLoaded", () => {
        loadIntroFromMarkdown();
        });

        // Hàm hiển thị câu hỏi chung
        function renderGeneralQuestions() {
          const container = document.getElementById('general-questions');
          container.innerHTML = '';
        
          generalQuestions.forEach(q => {
            const div = document.createElement('div');
            div.className = 'form-group question-item';
            let html = `<label for="general_${q.id}" ${q.required ? 'class="required"' : ''}>${q.question}</label>`;
        
            switch (q.type) {
              case 'textarea':
                html += `<textarea id="general_${q.id}" name="general_${q.id}" rows="3" placeholder="${q.placeholder || ''}" ${q.required ? 'required' : ''}></textarea>`;
                break;
        
              case 'email':
              case 'tel':
              case 'date':
              case 'text':
                html += `<input type="${q.type}" id="general_${q.id}" name="general_${q.id}" placeholder="${q.placeholder || ''}" ${q.required ? 'required' : ''}>`;
                break;
        
              default:
                html += `<input type="text" id="general_${q.id}" name="general_${q.id}" placeholder="${q.placeholder || ''}" ${q.required ? 'required' : ''}>`;
            }
        
            div.innerHTML = html;
            container.appendChild(div);
          });
        }

        // Hàm hiển thị câu hỏi theo phân ban
        function renderBanQuestions(banCode, type) {
            // container: 'priority' -> ban-specific-questions ; 'secondary' -> secondary-ban-specific-questions
            const containerId = type === 'priority' ? 'ban-specific-questions' : 'secondary-ban-specific-questions';
            const questionsContainer = document.getElementById(containerId);
            questionsContainer.innerHTML = '';
        
            if (!banCode) {
                questionsContainer.innerHTML = '<p class="no-questions">Vui lòng chọn ban để hiển thị câu hỏi phù hợp.</p>';
                return;
            }
        
            // Helper để render 1 câu hỏi (q) với prefixedId
            function renderQuestion(q, prefixedId) {
                const questionDiv = document.createElement('div');
                questionDiv.className = 'form-group question-item';
        
                let html = `<label for="${prefixedId}" ${q.required ? 'class="required"' : ''}>${q.question}</label>`;

                // Nếu có media kèm theo
                if (q.media) {
                    if (q.media.type === 'image') {
                        html += `<div class="question-media">
                                    <img src="${q.media.url}" alt="${q.media.alt || ''}" style="max-width:300px; margin:10px 0; display:block;">
                                 </div>`;
                    } else if (q.media.type === 'video') {
                        html += `<div class="question-media">
                                    <video src="${q.media.url}" controls style="max-width:400px; margin:10px 0; display:block;"></video>
                                 </div>`;
                    }
                }
                
                switch (q.type) {
                    case 'textarea':
                        html += `<textarea id="${prefixedId}" name="${prefixedId}" rows="3" placeholder="${q.placeholder || ''}" ${q.required ? 'required' : ''}></textarea>`;
                        break;
        
                    case 'checkbox':
                        html += `<div class="checkbox-group" id="${prefixedId}_group">`;
                        q.options.forEach((option, idx) => {
                            const optionId = `${prefixedId}_${idx}`;
                            // Thêm required vào checkbox đầu tiên nếu câu hỏi là bắt buộc
                            const requiredAttr = (q.required && idx === 0) ? 'required' : '';
                            html += `<div class="checkbox-item">
                                        <input type="checkbox" id="${optionId}" name="${prefixedId}[]" value="${option}" ${requiredAttr}>
                                        <label for="${optionId}">${option}</label>
                                    </div>`;
                        });
                        html += `</div>`;
                        break;
        
                    case 'radio':
                        html += `<div class="radio-group" id="${prefixedId}_group">`;
                        q.options.forEach((option, idx) => {
                            const optionId = `${prefixedId}_${idx}`;
                            // Thêm required vào radio đầu tiên nếu câu hỏi là bắt buộc
                            const requiredAttr = (q.required && idx === 0) ? 'required' : '';
                            html += `<div class="radio-item">
                                        <input type="radio" id="${optionId}" name="${prefixedId}" value="${option}" ${requiredAttr}>
                                        <label for="${optionId}">${option}</label>
                                    </div>`;
                        });
                        html += `</div>`;
                        break;

        
                    case 'dropdown':
                        html += `<select id="${prefixedId}" name="${prefixedId}" ${q.required ? 'required' : ''}>`;
                        html += `<option value="">-- Chọn --</option>`;
                        q.options.forEach(opt => {
                            html += `<option value="${opt}">${opt}</option>`;
                        });
                        html += `</select>`;
                        break;
        
                    case 'scale':
                        const mid = Math.round((q.min + q.max) / 2);
                        html += `<div class="scale-container">
                                    <input type="range" id="${prefixedId}" name="${prefixedId}" min="${q.min}" max="${q.max}" value="${mid}" ${q.required ? 'required' : ''}>
                                    <div class="scale-labels"><span>${q.min}</span><span>${q.max}</span></div>
                                    <output for="${prefixedId}" id="${prefixedId}_value">${mid}</output>
                                 </div>`;
                        break;
        
                    case 'date':
                        html += `<input type="date" id="${prefixedId}" name="${prefixedId}" ${q.required ? 'required' : ''}>`;
                        break;
        
                    default:
                        html += `<input type="text" id="${prefixedId}" name="${prefixedId}" placeholder="${q.placeholder || ''}" ${q.required ? 'required' : ''}>`;
                }
        
                questionDiv.innerHTML = html;
                questionsContainer.appendChild(questionDiv);
        
                // Nếu là scale, add listener để cập nhật output
                if (q.type === 'scale') {
                    const range = document.getElementById(prefixedId);
                    const out = document.getElementById(`${prefixedId}_value`);
                    if (range && out) {
                        range.addEventListener('input', () => { out.value = range.value; });
                    }
                }
            }
        
            // --- Nếu ban là MD: dùng tiểu ban (Design / Content) để quyết định bộ câu hỏi ---
            if (banCode === 'MD') {
                const designCheckbox = document.getElementById(type === 'priority' ? 'md_design' : 'md_design_secondary');
                const contentCheckbox = document.getElementById(type === 'priority' ? 'md_content' : 'md_content_secondary');
        
                const selected = [];
                if (designCheckbox && designCheckbox.checked) selected.push('Design');
                if (contentCheckbox && contentCheckbox.checked) selected.push('Content');
        
                if (selected.length === 0) {
                    questionsContainer.innerHTML = '<p class="no-questions">Vui lòng chọn tiểu ban Design hoặc Content để hiển thị câu hỏi.</p>';
                    return;
                }
        
                selected.forEach(sub => {
                    // tiêu đề phụ cho từng tiểu ban
                    const subtitle = document.createElement('div');
                    subtitle.className = 'sub-section';
                    subtitle.innerHTML = `<h3>Tiểu ban ${sub}</h3>`;
                    questionsContainer.appendChild(subtitle);
        
                    const questions = (banQuestions['MD'] && banQuestions['MD'][sub]) || [];
                    questions.forEach(q => {
                        // prefixedId: "priority_design_design_exp" hoặc "secondary_content_platforms", tránh trùng
                        const prefixedId = `${type}_${sub.toLowerCase()}_${q.id}`;
                        renderQuestion(q, prefixedId);
                    });
                });
        
                return; // xong MD
            }
        
            // --- Non-MD: render như cũ (mỗi ban có 1 mảng câu hỏi) ---
            const questions = banQuestions[banCode] || [];
            if (!questions.length) {
                questionsContainer.innerHTML = '<p class="no-questions">Không có câu hỏi cụ thể cho phân ban này.</p>';
                return;
            }
        
            questions.forEach(q => {
                const prefixedId = `${type}_${q.id}`;
                renderQuestion(q, prefixedId);
            });
        }
        
        function updateProgressBar() {
            // Reset all steps
            for (let i = 0; i <= totalSections; i++) {
                document.getElementById(`step${i}`).className = 'step';
            }
            
            // Mark previous steps as completed and current as active
            for (let i = 0; i < currentSection; i++) {
                document.getElementById(`step${i}`).className = 'step completed';
            }
            
            document.getElementById(`step${currentSection}`).className = 'step active';
        }
        
        function showSection(sectionNumber) {
            // Ẩn Intro
            const introSection = document.getElementById('sectionIntro');
            if (introSection) introSection.style.display = 'none';

            // Ẩn tất cả section số (0..totalSections)
            for (let i = 0; i <= totalSections; i++) {
                const section = document.getElementById(`section${i}`);
                if (section) {
                section.style.display = 'none';
                }
            }

            // Nếu muốn hiển thị Intro
            if (sectionNumber === -1) {
                if (introSection) introSection.style.display = 'block';
                currentSection = -1;
                return;
            }

            // Hiển thị sectionNumber
            const target = document.getElementById(`section${sectionNumber}`);
            if (target) {
                target.style.display = 'block';
                currentSection = sectionNumber;
                updateProgressBar();

                if (sectionNumber === 4) generateSummary();
                if (sectionNumber === 3) updatePositionNames();
            }
        }
        
        function updateSecondaryOptions() {
            const prioritySelect = document.getElementById('priority_position');
            const secondarySelect = document.getElementById('secondary_position');
            const priorityValue = prioritySelect.value;
            
            // Enable all options first
            for (let i = 0; i < secondarySelect.options.length; i++) {
                secondarySelect.options[i].disabled = false;
            }
            
            // Disable the selected priority option in secondary select
            if (priorityValue) {
                for (let i = 0; i < secondarySelect.options.length; i++) {
                    if (secondarySelect.options[i].value === priorityValue) {
                        secondarySelect.options[i].disabled = true;
                        if (secondarySelect.value === priorityValue) {
                            secondarySelect.value = "";
                        }
                        break;
                    }
                }
            }
        }
        
        // Hàm cập nhật hiển thị lựa chọn tiểu ban cho Ban Truyền thông
        function updateMDSubDepartments() {
            const prioritySelect = document.getElementById('priority_position');
            const secondarySelect = document.getElementById('secondary_position');
            
            // Hiển thị/ẩn tiểu ban cho vị trí ưu tiên
            if (prioritySelect.value === 'MD') {
                document.getElementById('md-sub-departments').style.display = 'block';
            } else {
                document.getElementById('md-sub-departments').style.display = 'none';
            }
            
            // Hiển thị/ẩn tiểu ban cho vị trí dự bị
            if (secondarySelect.value === 'MD') {
                document.getElementById('md-sub-departments-secondary').style.display = 'block';
            } else {
                document.getElementById('md-sub-departments-secondary').style.display = 'none';
            }
        }
        
        function updatePositionNames() {
            const prioritySelect = document.getElementById('priority_position');
            const secondarySelect = document.getElementById('secondary_position');
        
            const priorityPositionName = prioritySelect.options[prioritySelect.selectedIndex].text;
            const secondaryPositionName = secondarySelect.options[secondarySelect.selectedIndex].text;
        
            // UPDATE: đổi label của các tab
            // Tab chung
            const generalTabBtn = document.querySelector(`.tab-button[onclick="showTab('general')"]`);
            if (generalTabBtn) generalTabBtn.textContent = 'Câu hỏi chung';
        
            // Tab ưu tiên
            const priorityTabBtn = document.getElementById('priority-tab-btn');
            if (priorityTabBtn) priorityTabBtn.textContent = `Câu hỏi dành cho ban ${priorityPositionName} (Ưu tiên)`;
        
            // Tab dự bị
            const secondaryTabBtn = document.getElementById('secondary-tab-btn');
            if (secondarySelect.value && secondarySelect.value !== "None") {
                if (secondaryTabBtn) {
                    secondaryTabBtn.style.display = 'inline-block';
                    secondaryTabBtn.textContent = `Câu hỏi dành cho ban ${secondaryPositionName} (Dự bị)`;
                }
            } else {
                if (secondaryTabBtn) secondaryTabBtn.style.display = 'none';
            }
        
            // Update header inside các sub-section
            document.getElementById('ban-name').textContent = `${priorityPositionName} (Ưu tiên)`;
            document.getElementById('secondary-ban-name').textContent = secondarySelect.value && secondarySelect.value !== "None" ? `${secondaryPositionName} (Dự bị)` : 'vị trí dự bị';
        
            // Render câu hỏi tương ứng
            renderBanQuestions(prioritySelect.value, 'priority');
            if (secondarySelect.value && secondarySelect.value !== "None") {
                renderBanQuestions(secondarySelect.value, 'secondary');
            }
        }

        
        // Hàm hiển thị tab
        function showTab(tabName) {
            // Ẩn tất cả các tab content
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Hiển thị tab được chọn
            document.getElementById(`tab-${tabName}`).classList.add('active');
            
            // Cập nhật trạng thái active của các nút tab
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            document.querySelector(`.tab-button[onclick="showTab('${tabName}')"]`).classList.add('active');
        }
        
        // Hàm validation tùy chỉnh cho checkbox và radio groups
        function validateFormSection(section) {
            let isValid = true;
            
            // Tìm tất cả các hidden required fields
            const requiredHiddenInputs = section.querySelectorAll('input[type="hidden"][name$="_required"]');
            
            requiredHiddenInputs.forEach(hiddenInput => {
                const fieldName = hiddenInput.name.replace('_required', '');
                const fieldType = hiddenInput.name.includes('checkbox') ? 'checkbox' : 'radio';
                
                // Kiểm tra xem có ít nhất một checkbox/radio được chọn không
                let isChecked = false;
                if (fieldType === 'checkbox') {
                    const checkboxes = section.querySelectorAll(`input[type="checkbox"][name="${fieldName}[]"]`);
                    isChecked = Array.from(checkboxes).some(cb => cb.checked);
                } else {
                    const radios = section.querySelectorAll(`input[type="radio"][name="${fieldName}"]`);
                    isChecked = Array.from(radios).some(radio => radio.checked);
                }
                
                if (!isChecked) {
                    isValid = false;
                    // Highlight nhóm
                    const group = section.querySelector(`#${fieldName}_group`);
                    if (group) {
                        group.style.border = '1px solid var(--error)';
                        group.style.padding = '10px';
                        group.style.borderRadius = '8px';
                    }
                }
            });
            
            // Validate các trường required thông thường
            const requiredInputs = section.querySelectorAll('input[required], select[required], textarea[required]');
            
            requiredInputs.forEach(input => {
                if (input.offsetParent !== null && !input.value) { // Chỉ validate các trường visible
                    isValid = false;
                    input.style.borderColor = 'var(--error)';
                    input.style.animation = 'shake 0.5s';
                    setTimeout(() => {
                        input.style.animation = '';
                    }, 500);
                } else {
                    input.style.borderColor = 'var(--border)';
                }
            });
            
            return isValid;
        }
        
        function nextSection(current) {
            // Kiểm tra nếu chưa chọn hình thức ứng tuyển
            if (current === 0 && !applicationType) {
                alert('Vui lòng chọn hình thức ứng tuyển.');
                return;
            }
            
            // Nếu chọn phỏng vấn thay đơn, bỏ qua section 3
            if (current === 2 && applicationType === 'interview') {
                showSection(4);
                return;
            }
            
            if (current === 3) {
                const section = document.getElementById('section3');
                const tabs = ['general', 'priority', 'secondary'];
                for (let tab of tabs) {
                    const tabContent = document.getElementById(`tab-${tab}`);
                    if (tabContent && tabContent.style.display !== 'none') {
                        const requiredInputs = tabContent.querySelectorAll('input[required], select[required], textarea[required]');
                        for (let input of requiredInputs) {
                            if (!input.value) {
                                // Nếu có lỗi -> highlight + chuyển tab
                                input.style.borderColor = 'var(--error)';
                                input.style.animation = 'shake 0.5s';
                                setTimeout(() => { input.style.animation = ''; }, 500);
                                showTab(tab);
                                alert('Vui lòng điền đầy đủ các thông tin trong tab này trước khi tiếp tục.');
                                return; // Dừng không sang section 4
                            } else {
                                input.style.borderColor = 'var(--border)';
                            }
                        }
                    }
                }
                // Nếu qua hết vòng lặp mà không lỗi → sang section 4
                showSection(4);
                return;
            }

            // Basic validation
            let valid = true;
            const currentSection = document.getElementById(`section${current}`);
            const requiredInputs = currentSection.querySelectorAll('input[required], select[required], textarea[required]');
            
            requiredInputs.forEach(input => {
                // Kiểm tra radio buttons và checkboxes
                if (input.type === 'radio' || input.type === 'checkbox') {
                    const name = input.name;
                    const checked = currentSection.querySelectorAll(`input[name="${name}"]:checked`).length > 0;
                    
                    if (!checked) {
                        valid = false;
                        // Highlight nhóm câu hỏi
                        const group = input.closest('.radio-group, .checkbox-group');
                        if (group) {
                            group.style.border = '1px solid var(--error)';
                            group.style.padding = '10px';
                            group.style.borderRadius = '8px';
                        }
                    }
                } 
                // Kiểm tra các input khác
                else if (!input.value) {
                    valid = false;
                    input.style.borderColor = 'var(--error)';
                    // Add shake animation for error
                    input.style.animation = 'shake 0.5s';
                    setTimeout(() => {
                        input.style.animation = '';
                    }, 500);
                } else {
                    input.style.borderColor = 'var(--border)';
                }
            });
            
            if (valid) {
                showSection(current + 1);
            } else {
                alert('Vui lòng điền đầy đủ các thông tin bắt buộc.');
            }
        }
        
        function prevSection(current) {
            // Nếu chọn phỏng vấn thay đơn và đang ở section 4, quay lại section 2
            if (current === 4 && applicationType === 'interview') {
                showSection(2);
                return;
            }

            // Nếu đang ở section 0 thì quay lại Intro
            if (current === 0) {
                showSection(-1);
                return;
            }

            // Ngược lại, quay về section trước đó
            showSection(current - 1);
        }
        
        function generateSummary() {
            const form = document.getElementById('recruitmentForm');
            const summaryDiv = document.getElementById('summary');
            
            // Get position names from options
            const priorityPositionText = form.priority_position.options[form.priority_position.selectedIndex].text;
            const secondaryPositionText = form.secondary_position.options[form.secondary_position.selectedIndex].text;
            
            // Get selected MD sub-departments
            let mdSubDepartments = [];
            document.querySelectorAll('input[name="md_sub_departments[]"]:checked').forEach(cb => {
                mdSubDepartments.push(cb.value);
            });
            
            let mdSubDepartmentsSecondary = [];
            document.querySelectorAll('input[name="md_sub_departments_secondary[]"]:checked').forEach(cb => {
                mdSubDepartmentsSecondary.push(cb.value);
            });
            
            let summaryHTML = `
                <p><strong>Hình thức ứng tuyển:</strong> ${applicationType === 'form' ? 'Điền đơn ứng tuyển' : 'Phỏng vấn trực tiếp'}</p>
                <p><strong>Họ và tên:</strong> ${form.fullname.value}</p>
                <p><strong>Ngày/tháng/năm sinh:</strong> ${form.birthdate.value}</p>
                <p><strong>Giới tính:</strong> ${form.gender.value}</p>
                <p><strong>Trường:</strong> ${form.school.value}</p>
                <p><strong>Khóa/Chuyên ngành đang theo học:</strong> ${form.major.value}</p>
                <p><strong>Email:</strong> ${form.email.value}</p>
                <p><strong>Số điện thoại:</strong> ${form.phone.value}</p>
                <p><strong>Bạn muốn đăng ký vào ban:</strong> ${priorityPositionText}</p>
            `;
            
            // Thêm thông tin tiểu ban nếu là Ban Truyền thông
            if (form.priority_position.value === 'MD' && mdSubDepartments.length > 0) {
                summaryHTML += `<p><strong>Tiểu ban Truyền thông:</strong> ${mdSubDepartments.join(', ')}</p>`;
            }
            
            summaryHTML += `<p><strong>Bạn có nguyện vọng đăng ký vào ban:</strong> ${secondaryPositionText === "-- Chọn vị trí --" ? "Không chọn" : secondaryPositionText}</p>`;
            
            // Thêm thông tin tiểu ban dự bị nếu là Ban Truyền thông
            if (form.secondary_position.value === 'MD' && mdSubDepartmentsSecondary.length > 0) {
                summaryHTML += `<p><strong>Tiểu ban Truyền thông (dự bị):</strong> ${mdSubDepartmentsSecondary.join(', ')}</p>`;
            }
            
            summaryDiv.innerHTML = summaryHTML;
        }
        
        // Hàm thu thập tất cả dữ liệu form
        function collectFormData() {
            const formObject = {
                application_type: applicationType,
        
                // Thông tin cá nhân
                fullname: document.getElementById('fullname').value,
                birthdate: document.getElementById('birthdate').value,
                gender: document.getElementById('gender').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                school: document.getElementById('school').value,
                major: document.getElementById('major').value,
                facebook: document.getElementById('facebook').value,
        
                // Vị trí ứng tuyển
                priority_position: document.getElementById('priority_position').value,
                secondary_position: document.getElementById('secondary_position').value,
                availability: document.getElementById('availability').value,
        
                // Câu hỏi chung
                general_intro: document.getElementById('general_intro')?.value || '',
        
                // Tiểu ban truyền thông
                md_sub_departments: Array.from(document.querySelectorAll('input[name="md_sub_departments[]"]:checked')).map(cb => cb.value),
                md_sub_departments_secondary: Array.from(document.querySelectorAll('input[name="md_sub_departments_secondary[]"]:checked')).map(cb => cb.value),
        
                // Câu hỏi phân ban ưu tiên
                ...collectBanQuestions('priority'),
        
                // Câu hỏi phân ban dự bị
                ...collectBanQuestions('secondary'),
        
                // Timestamp
                timestamp: new Date()
            };
        
            return formObject;
        }

        // Hàm thu thập câu hỏi theo phân ban
        function collectBanQuestions(type) {
            const prefix = `${type}_`;
            const questionsData = {};
            
            const containerId = type === 'priority' ? 'ban-specific-questions' : 'secondary-ban-specific-questions';
            const container = document.getElementById(containerId);
            
            if (!container) return questionsData;
            
            const inputs = container.querySelectorAll('input, select, textarea');
            
            inputs.forEach(input => {
                // Bỏ qua các hidden required fields
                if (input.name && input.name.startsWith(prefix) && !input.name.endsWith('_required')) {
                    const key = input.name;
                    
                    if (input.type === 'checkbox') {
                        // Xử lý checkbox
                        if (!questionsData[key]) questionsData[key] = [];
                        if (input.checked) {
                            questionsData[key].push(input.value);
                        }
                    } else if (input.type === 'radio') {
                        // Xử lý radio - chỉ lấy giá trị được chọn
                        if (input.checked) {
                            questionsData[key] = input.value;
                        }
                    } else {
                        // Xử lý các input khác
                        questionsData[key] = input.value;
                    }
                }
            });
            
            return questionsData;
        }
        
        // Hàm lưu dữ liệu tạm vào localStorage
        function saveFormData() {
            try {
                const formData = collectFormData();
                localStorage.setItem('enactus_form_data', JSON.stringify(formData));
                console.log('Form data saved temporarily');
            } catch (error) {
                console.error('Error saving form data:', error);
            }
        }
        
        // Hàm khôi phục dữ liệu từ localStorage
        function loadFormData() {
            try {
                const savedData = localStorage.getItem('enactus_form_data');
                if (savedData) {
                    const formData = JSON.parse(savedData);
                    
                    // Khôi phục hình thức ứng tuyển
                    if (formData.application_type) {
                        selectApplicationType(formData.application_type);
                    }
                    
                    // Khôi phục thông tin cá nhân
                    if (formData.fullname) document.getElementById('fullname').value = formData.fullname;
                    if (formData.birthdate) document.getElementById('birthdate').value = formData.birthdate;
                    if (formData.gender) document.getElementById('gender').value = formData.gender;
                    if (formData.email) document.getElementById('email').value = formData.email;
                    if (formData.phone) document.getElementById('phone').value = formData.phone;
                    if (formData.school) document.getElementById('school').value = formData.school;
                    if (formData.major) document.getElementById('major').value = formData.major;
                    if (formData.facebook) document.getElementById('facebook').value = formData.facebook;
                    
                    // Khôi phục vị trí ứng tuyển
                    if (formData.priority_position) {
                        document.getElementById('priority_position').value = formData.priority_position;
                        updateSecondaryOptions();
                        updateMDSubDepartments();
                    }
                    if (formData.secondary_position) document.getElementById('secondary_position').value = formData.secondary_position;
                    if (formData.availability) document.getElementById('availability').value = formData.availability;
                    
                    // Khôi phục tiểu ban Truyền thông
                    if (formData.md_sub_departments) {
                        formData.md_sub_departments.forEach(value => {
                            const checkbox = document.querySelector(`input[name="md_sub_departments[]"][value="${value}"]`);
                            if (checkbox) checkbox.checked = true;
                        });
                    }
                    
                    if (formData.md_sub_departments_secondary) {
                        formData.md_sub_departments_secondary.forEach(value => {
                            const checkbox = document.querySelector(`input[name="md_sub_departments_secondary[]"][value="${value}"]`);
                            if (checkbox) checkbox.checked = true;
                        });
                    }
                    
                    // Khôi phục chi tiết ứng tuyển
                    if (formData.intro) document.getElementById('intro').value = formData.intro;
                    
                    // Cập nhật tên phân ban và câu hỏi
                    updatePositionNames();
                    
                    console.log('Form data loaded from temporary storage');
                }
            } catch (error) {
                console.error('Error loading form data:', error);
            }
        }
        
        // Handle form submission
        document.getElementById('recruitmentForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Check if agreement is checked
            if (!document.getElementById('agree').checked) {
                alert('Vui lòng xác nhận rằng tất cả thông tin bạn cung cấp là chính xác.');
                return;
            }
            
            const form = document.getElementById('recruitmentForm');
            const successMessage = document.getElementById('successMessage');
            const redirectMsg = document.getElementById('redirectMsg');
            
            // Show loading state
            const submitBtn = form.querySelector('.btn-submit');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';
            submitBtn.disabled = true;
            
            try {
                // Lấy tất cả dữ liệu từ form
                const formObject = collectFormData();
                
                // Nếu là hình thức phỏng vấn, xóa dữ liệu section 3
                if (applicationType === 'interview') {
                    // Chỉ xoá phần intro và các câu hỏi chi tiết theo phân ban,
                    // nhưng giữ lại lựa chọn ban (priority_position, secondary_position).
                    delete formObject.intro;

                    Object.keys(formObject).forEach(key => {
                        if ((key.startsWith('priority_') || key.startsWith('secondary_'))
                            && key !== 'priority_position' && key !== 'secondary_position') {
                            delete formObject[key];
                        }
                    });

                    // (Không bắt buộc) nếu bạn muốn chắc chắn không gửi các trường rỗng
                    if (Array.isArray(formObject.md_sub_departments) && formObject.md_sub_departments.length === 0) {
                        delete formObject.md_sub_departments;
                    }
                    if (Array.isArray(formObject.md_sub_departments_secondary) && formObject.md_sub_departments_secondary.length === 0) {
                        delete formObject.md_sub_departments_secondary;
                    }
                }
                
                // Trước khi lưu vào Firebase
                formObject.all_departments = [
                    formObject.priority_position,
                    formObject.secondary_position
                ].filter(p => p && p !== "None");

                // Save to Firebase
                await db.collection('applications').add(formObject);

                // Xóa dữ liệu tạm sau khi gửi thành công
                localStorage.removeItem('enactus_form_data');
                
                // Hide form and show success message
                form.style.display = 'none';
                successMessage.style.display = 'block';
                
                // Countdown redirect
                let countdown = 5;
                redirectMsg.innerHTML = `Chuyển hướng sau <strong>${countdown}</strong>s...`;
                const interval = setInterval(() => {
                    countdown--;
                    redirectMsg.innerHTML = `Chuyển hướng sau <strong>${countdown}</strong>s...`;
                    if (countdown <= 0) {
                        clearInterval(interval);
                        window.location.href = "/user/login.html";
                    }
                }, 1000);
                
                console.log('Application submitted successfully:', formObject);
            } catch (error) {
                console.error('Error submitting application:', error);
                alert('Có lỗi xảy ra khi gửi đơn ứng tuyển. Vui lòng thử lại sau. Chi tiết lỗi: ' + error.message);
                
                // Reset button state
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
        
        // Thêm sự kiện lưu dữ liệu khi người dùng rời khỏi trang
        window.addEventListener('beforeunload', function(e) {
            saveFormData();
        });
        
        // Thêm sự kiện lưu dữ liệu khi người dùng thay đổi thông tin
        document.querySelectorAll('input, select, textarea').forEach(element => {
            element.addEventListener('input', saveFormData);
            element.addEventListener('change', saveFormData);
        });
        
        // Khi tick/un-tick tiểu ban trong MD thì render lại câu hỏi tương ứng
        ['md_design','md_content','md_design_secondary','md_content_secondary'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', () => {
                    // render lại cả hai vị trí ưu tiên/dự bị nếu cần
                    renderBanQuestions(document.getElementById('priority_position').value, 'priority');
                    renderBanQuestions(document.getElementById('secondary_position').value, 'secondary');
                    saveFormData();
                });
            }
        });

        // Update position names when they change
        document.getElementById('priority_position').addEventListener('change', updatePositionNames);
        document.getElementById('secondary_position').addEventListener('change', updatePositionNames);
        
        // Initialize the form
        updateProgressBar();
        updateSecondaryOptions();
        
        // Tải dữ liệu đã lưu khi trang được tải
        window.addEventListener('DOMContentLoaded', function() {
            // Render general questions first so their elements exist
            renderGeneralQuestions();
        
            // Set up secondary options display depending on select (no harm)
            updateSecondaryOptions();
        
            // Load saved data (khôi phục select + sẽ gọi updatePositionNames() bên trong)
            loadFormData();
        
            // Nếu cần, cập nhật hiển thị tab/tiểu ban
            const prioritySelect = document.getElementById('priority_position');
            if (prioritySelect.value) {
                updatePositionNames();
            }
        });

        document.addEventListener("DOMContentLoaded", () => {
            const successMessage = document.getElementById("successMessage");
            const form = document.getElementById("recruitmentForm");
            const redirectMsg = document.getElementById("redirectMsg");

            form.addEventListener("submit", function(e) {
                e.preventDefault();

                // Ẩn form + hiện success message
                form.style.display = "none";
                successMessage.style.display = "block";

                let countdown = 5;
                redirectMsg.textContent = `Chuyển hướng sau ${countdown}s...`;

                const interval = setInterval(() => {
                countdown--;
                redirectMsg.textContent = `Chuyển hướng sau ${countdown}s...`;

                if (countdown <= 0) {
                    clearInterval(interval);
                    window.location.href = "/user/login.html";
                }
                }, 1000);
            });
        });
        
        // Add shake animation for error states
        const style = document.createElement('style');
        style.textContent = `
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                20%, 40%, 60%, 80% { transform: translateX(5px); }
            }
        `;
        document.head.appendChild(style);
        
        // Ghi đè alert bằng SweetAlert2
        window.alert = function(message) {
          Swal.fire({
            icon: 'warning',
            title: '⚠️ Cảnh báo',
            text: message,
            confirmButtonText: 'OK'
        });
        };



