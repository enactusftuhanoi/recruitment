
      
        // Biến toàn cục để lưu hình thức ứng tuyển
        let applicationType = '';
        let currentSection = 0;
        const totalSections = 4;
        
        // Hàm chọn hình thức ứng tuyển
        function selectApplicationType(type) {
            if (type === 'interview') {
                Swal.fire({
                    icon: 'warning',
                    title: '⚠️ Cảnh báo',
                    html: `
                            <p style="text-align:center; line-height:1.6; white-space:normal;">
                                Hình thức <b>Phỏng vấn thay đơn</b> đã đóng
                                <br>
                                Vui lòng chọn hình thức <b>Điền đơn</b>.
                            </p>`,
                });
                return; // không cho chọn
            }

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

        // Thiết lập sự kiện cho các checkbox phỏng vấn
        function setupInterviewCheckboxListeners() {
            const interviewContainer = document.getElementById('interview-questions');
            if (interviewContainer) {
                // Xóa sự kiện cũ nếu có
                interviewContainer.removeEventListener('change', handleInterviewCheckboxChange);
                
                // Thêm sự kiện mới
                interviewContainer.addEventListener('change', handleInterviewCheckboxChange);
            }
        }

        // Xử lý khi checkbox thay đổi
        function handleInterviewCheckboxChange(e) {
            if (e.target.type === 'checkbox') {
                updateInterviewSelectionCount();
                saveFormDataComprehensive();
                
                // Highlight visual feedback
                const checkedCount = document.querySelectorAll('#interview-schedule input[type="checkbox"]:checked').length;
                const checkboxGroups = document.querySelectorAll('.interview-checkbox-group');
                
                checkboxGroups.forEach(group => {
                    if (checkedCount < 3) {
                        group.style.border = '2px solid #ffcdd2';
                        group.style.backgroundColor = '#ffebee';
                    } else {
                        group.style.border = '2px solid #c8e6c9';
                        group.style.backgroundColor = '#e8f5e8';
                    }
                });
            }
        }

        function renderInterviewSchedule() {
            const container = document.getElementById('interview-questions');
            container.innerHTML = '';

            // Thêm hướng dẫn chi tiết
            const instruction = document.createElement('div');
            instruction.className = 'interview-instruction';
            instruction.innerHTML = `
                <div style="background: #e3f2fd; padding: 16px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2196f3;">
                    <strong style="color: #1976d2;"> Hướng dẫn chọn lịch phỏng vấn:</strong>
                    <p style="margin: 10px 0 0 0; color: #555; line-height: 1.5;">
                        • Vui lòng chọn <strong style="color: #d32f2f;">ít nhất 3 khung giờ</strong> phỏng vấn mà bạn có thể tham gia<br>
                        • Việc chọn nhiều khung giờ giúp BTC dễ dàng sắp xếp lịch phỏng vấn phù hợp<br>
                        • Bạn có thể chọn nhiều hơn 3 ca nếu có thể sắp xếp thời gian
                    </p>
                </div>
            `;
            container.appendChild(instruction);

            // Render các câu hỏi phỏng vấn
            interview.forEach(q => {
                const div = document.createElement('div');
                div.className = 'form-group question-item';

                const label = document.createElement('label');
                label.innerHTML = q.question;
                div.appendChild(label);

                const group = document.createElement('div');
                group.className = 'checkbox-group interview-checkbox-group';
                q.options.forEach((opt, idx) => {
                    const optionId = `${q.id}_${idx}`;
                    const item = document.createElement('div');
                    item.className = 'checkbox-item';
                    item.innerHTML = `
                        <input type="checkbox" id="${optionId}" name="${q.id}[]" value="${opt}">
                        <label for="${optionId}">${opt}</label>
                    `;
                    group.appendChild(item);
                });
                div.appendChild(group);
                container.appendChild(div);
            });

            // Khởi tạo đếm số lượng
            updateInterviewSelectionCount();
        }

        // Thêm CSS cho phần phỏng vấn
        const interviewStyle = document.createElement('style');
        interviewStyle.textContent = `
            .interview-instruction {
                margin-bottom: 20px;
            }
            
            #interview-selection-count {
                transition: all 0.3s ease;
                font-size: 1.1em;
            }
            
            .interview-checkbox-group {
                transition: all 0.3s ease;
                padding: 12px;
                border-radius: 8px;
                border: 2px solid transparent;
            }
            
            /* Hiệu ứng khi hover */
            .interview-checkbox-group:hover {
                background-color: #f5f5f5 !important;
            }
            
            /* Style cho checkbox items */
            #interview-schedule .checkbox-item {
                margin: 8px 0;
                padding: 8px 12px;
                border-radius: 6px;
                transition: background-color 0.2s;
            }
            
            #interview-schedule .checkbox-item:hover {
                background-color: #e3f2fd;
            }
            
            #interview-schedule .checkbox-item input[type="checkbox"]:checked + label {
                font-weight: 600;
                color: #1976d2;
            }
            
            /* Progress indicator */
            .interview-progress {
                height: 6px;
                background: #e0e0e0;
                border-radius: 3px;
                margin: 10px 0;
                overflow: hidden;
            }
            
            .interview-progress-bar {
                height: 100%;
                background: #4caf50;
                transition: width 0.3s ease;
            }
        `;
        document.head.appendChild(interviewStyle);

        // Helper: chuyển newline -> <p> và <br>, giữ paragraph
        function formatQuestionText(str) {
        if (!str) return '';
        // Chia thành các đoạn cách nhau bởi 1 dòng trống -> mỗi đoạn thành <p>...</p>
        const paragraphs = String(str).split(/\n\s*\n/).map(p => {
            // trong 1 đoạn, các newline liên tiếp -> <br>
            return '<p>' + p.trim().replace(/\n+/g, '<br>') + '</p>';
        });
        return paragraphs.join('');
        }

        // Hàm hiển thị câu hỏi chung
        function renderGeneralQuestions() {
            const container = document.getElementById('general-questions');
            if (!container) {
                console.warn('renderGeneralQuestions: missing #general-questions element');
                return;
            }
            container.innerHTML = '';

            generalQuestions.forEach(q => {
                const div = document.createElement('div');
                div.className = 'form-group question-item';

                // label
                const label = document.createElement('label');
                label.setAttribute('for', `general_${q.id}`);
                if (q.required) label.classList.add('required');

                const questionText = q.question || '';

                // chỉ xử lý xuống dòng khi có \n
                if (/\r?\n/.test(questionText)) {
                const lines = questionText.split(/\r?\n/);
                lines.forEach((line, idx) => {
                    label.appendChild(document.createTextNode(line));
                    if (idx < lines.length - 1) label.appendChild(document.createElement('br'));
                });
                } else {
                // ko có xuống dòng -> đặt text đơn thuần (an toàn)
                label.textContent = questionText;
                }

                div.appendChild(label);

                // media (image/video)
                if (q.media) {
                const mediaWrap = document.createElement('div');
                mediaWrap.className = 'question-media';
                if (q.media.type === 'image') {
                    const img = document.createElement('img');
                    img.className = 'question-img';
                    img.src = q.media.url;
                    img.alt = q.media.alt || '';
                    mediaWrap.appendChild(img);
                } else if (q.media.type === 'video') {
                    // nếu có thumbnail dùng img, ngược lại dùng <video>
                    if (q.media.thumbnail) {
                    const img = document.createElement('img');
                    img.className = 'question-img';
                    img.src = q.media.thumbnail;
                    img.alt = q.media.alt || '';
                    mediaWrap.appendChild(img);
                    } else {
                    const video = document.createElement('video');
                    video.className = 'question-img';
                    video.src = q.media.url;
                    video.controls = true;
                    mediaWrap.appendChild(video);
                    }
                }
                div.appendChild(mediaWrap);
                }

                // input / textarea
                let inputEl;
                switch (q.type) {
                case 'textarea':
                    inputEl = document.createElement('textarea');
                    inputEl.rows = 3;
                    break;
                case 'email':
                case 'tel':
                case 'date':
                case 'text':
                    inputEl = document.createElement('input');
                    inputEl.type = q.type;
                    break;
                default:
                    inputEl = document.createElement('input');
                    inputEl.type = 'text';
                }
                inputEl.id = `general_${q.id}`;
                inputEl.name = `general_${q.id}`;
                if (q.placeholder) inputEl.placeholder = q.placeholder;
                if (q.required) inputEl.required = true;

                div.appendChild(inputEl);
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
        
                let labelHtml = '';
                if (/\r?\n/.test(q.question)) {
                const lines = q.question.split(/\r?\n/);
                lines.forEach((line, idx) => {
                    labelHtml += line;
                    if (idx < lines.length - 1) labelHtml += '<br>';
                });
                } else {
                labelHtml = q.question;
                }

                let html = `<label for="${prefixedId}" ${q.required ? 'class="required"' : ''}>${labelHtml}</label>`;

                // Nếu có media kèm theo
                if (q.media) {
                    if (q.media.type === 'image') {
                        html += `<div class="question-media">
                                    <img src="${q.media.url}" alt="${q.media.alt || ''}" class="question-img">
                                </div>`;
                    } else if (q.media.type === 'video') {
                        html += `<div class="question-media">
                                    <video src="${q.media.url}" controls class="question-video"></video>
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
        
                // Trong hàm renderQuestion(), sửa phần gán sự kiện:
                questionDiv.innerHTML = html;
                questionsContainer.appendChild(questionDiv);

                // Gán sự kiện lưu tạm cho input mới render - CẢI TIẾN
                questionDiv.querySelectorAll('input, select, textarea').forEach(el => {
                    el.addEventListener('input', saveFormDataComprehensive);
                    el.addEventListener('change', saveFormDataComprehensive);
                    el.addEventListener('blur', saveFormDataComprehensive);
                });
        
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
                if (sectionNumber === 3) {
                    if (applicationType === 'interview') {
                        document.querySelector('.tab-container').style.display = 'none';
                        document.getElementById('interview-schedule').style.display = 'block';
                        renderInterviewSchedule();
                        
                        // Thiết lập sự kiện và cập nhật số lượng
                        setTimeout(() => {
                            setupInterviewCheckboxListeners();
                            updateInterviewSelectionCount();
                        }, 100);
                    } else {
                        document.querySelector('.tab-container').style.display = 'block';
                        document.getElementById('interview-schedule').style.display = 'none';
                        updatePositionNames();
                    }
                }
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
            if (priorityTabBtn) priorityTabBtn.textContent = `Câu hỏi dành cho ban ${priorityPositionName} (NV1)`;
        
            // Tab dự bị
            const secondaryTabBtn = document.getElementById('secondary-tab-btn');
            if (secondarySelect.value && secondarySelect.value !== "" && secondarySelect.value !== "None") {
                if (secondaryTabBtn) {
                    secondaryTabBtn.style.display = 'inline-block';
                    secondaryTabBtn.textContent = `Câu hỏi dành cho ban ${secondaryPositionName} (NV2)`;
                }
            } else {
                if (secondaryTabBtn) secondaryTabBtn.style.display = 'none';

                // 🧹 Xóa dữ liệu tạm của ban dự bị trong localStorage khi không chọn
                const savedData = JSON.parse(localStorage.getItem('enactus_form_data')) || {};
                Object.keys(savedData).forEach(key => {
                    if (key.startsWith("secondary_")) {
                        delete savedData[key];
                    }
                });
                localStorage.setItem('enactus_form_data', JSON.stringify(savedData));
            }
        
            // Update header inside các sub-section
            document.getElementById('ban-name').textContent = `${priorityPositionName} (NV1)`;
            document.getElementById('secondary-ban-name').textContent = secondarySelect.value && secondarySelect.value !== "None" ? `${secondaryPositionName} (NV2)` : 'vị trí nguyện vọng 2';
        
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

        // Hàm cập nhật số lượng ca đã chọn và hiển thị
        function updateInterviewSelectionCount() {
            const checkedCount = document.querySelectorAll('#interview-schedule input[type="checkbox"]:checked').length;
            const countElement = document.getElementById('interview-selection-count') || createInterviewCountElement();
            
            countElement.textContent = `Đã chọn: ${checkedCount}/3 ca phỏng vấn`;
            
            if (checkedCount < 3) {
                countElement.style.color = 'var(--error)';
                countElement.innerHTML += ' <span style="font-size: 0.9em;">(Cần chọn thêm ' + (3 - checkedCount) + ' ca)</span>';
            } else {
                countElement.style.color = 'var(--success)';
                countElement.innerHTML += ' <span style="font-size: 0.9em;">✓ Đã đủ điều kiện</span>';
            }
        }

        // Hàm tạo phần tử hiển thị số lượng
        function createInterviewCountElement() {
            const countElement = document.createElement('div');
            countElement.id = 'interview-selection-count';
            countElement.style.cssText = `
                margin: 15px 0;
                padding: 12px 16px;
                background: #f8f9fa;
                border-radius: 8px;
                font-weight: 600;
                text-align: center;
                border: 2px solid #e9ecef;
                transition: all 0.3s ease;
            `;
            
            const interviewContainer = document.getElementById('interview-questions');
            if (interviewContainer) {
                interviewContainer.parentNode.insertBefore(countElement, interviewContainer);
            }
            
            return countElement;
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
            
            if (current === 3) {
                if (applicationType === 'interview') {
                    // validate chọn lịch phỏng vấn - YÊU CẦU ÍT NHẤT 3 CA
                    const checkedBoxes = document.querySelectorAll('#interview-schedule input[type="checkbox"]:checked');
                    if (checkedBoxes.length < 3) {
                        // Sử dụng SweetAlert2 thay vì alert thông thường
                        Swal.fire({
                            icon: 'warning',
                            title: 'Chưa đủ lịch phỏng vấn',
                            html: `Bạn đã chọn <strong>${checkedBoxes.length}</strong> ca. Vui lòng chọn ít nhất <strong>3 ca phỏng vấn</strong> trước khi tiếp tục.`,
                            confirmButtonText: 'Đã hiểu'
                        });
                        return;
                    }
                    showSection(4);
                    return;
                } else {
                    // validate như cũ cho form
                    const tabs = ['general', 'priority', 'secondary'];
                    for (let tab of tabs) {
                        const tabContent = document.getElementById(`tab-${tab}`);
                        if (tabContent && tabContent.style.display !== 'none') {
                            const requiredInputs = tabContent.querySelectorAll('input[required], select[required], textarea[required]');
                            for (let input of requiredInputs) {
                                if (!input.value) {
                                    input.style.borderColor = 'var(--error)';
                                    input.style.animation = 'shake 0.5s';
                                    setTimeout(() => { input.style.animation = ''; }, 500);
                                    showTab(tab);
                                    alert('Vui lòng điền đầy đủ các thông tin trong tab này trước khi tiếp tục.');
                                    return;
                                } else {
                                    input.style.borderColor = 'var(--border)';
                                }
                            }
                        }
                    }
                    showSection(4);
                    return;
                }
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
                saveFormData();
                showSection(current + 1);
            } else {
                alert('Vui lòng điền đầy đủ các thông tin bắt buộc.');
            }
        }
        
        function prevSection(current) {
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
                <p><strong>Hình thức ứng tuyển:</strong> ${applicationType === 'form' ? 'Điền đơn ứng tuyển' : 'Phỏng vấn thay đơn'}</p>
                <p><strong>Họ và tên:</strong> ${form.fullname.value}</p>
                <p><strong>Ngày/tháng/năm sinh:</strong> ${formatDateToVN(form.birthdate.value)}</p>
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
                summaryHTML += `<p><strong>Tiểu ban Truyền thông (NV2):</strong> ${mdSubDepartmentsSecondary.join(', ')}</p>`;
            }
            
            summaryDiv.innerHTML = summaryHTML;
        }
        
        // Hàm thu thập tất cả dữ liệu form - PHIÊN BẢN CẢI TIẾN
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

                // Câu hỏi chung - TÁCH RIÊNG để dễ khôi phục
                general_questions: collectGeneralQuestions(),

                // Tiểu ban truyền thông
                md_sub_departments: Array.from(document.querySelectorAll('input[name="md_sub_departments[]"]:checked')).map(cb => cb.value),
                md_sub_departments_secondary: Array.from(document.querySelectorAll('input[name="md_sub_departments_secondary[]"]:checked')).map(cb => cb.value),

                // Câu hỏi phân ban ưu tiên
                ...collectBanQuestions('priority'),

                // Câu hỏi phân ban dự bị
                ...collectBanQuestions('secondary'),

                // Timestamp
                timestamp: new Date(),
                last_saved: new Date()
            };

            // Nếu chọn phỏng vấn thay đơn → lưu lịch phỏng vấn
            if (applicationType === 'interview') {
                if (typeof interview !== "undefined" && Array.isArray(interview)) {
                    interview.forEach(q => {
                        const checked = Array.from(document.querySelectorAll(`input[name="${q.id}[]"]:checked`))
                            .map(cb => cb.value);
                        if (checked.length > 0) {
                            formObject[q.id] = checked;
                        }
                    });
                }
            }

            return formObject;
        }

        function collectGeneralQuestions() {
            const data = {};
            const container = document.getElementById('general-questions');
            if (!container) return data;

            const inputs = container.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                const key = input.name || input.id;
                if (!key) return;

                if (input.type === 'checkbox') {
                    if (!data[key]) data[key] = [];
                    if (input.checked) data[key].push(input.value);
                } else if (input.type === 'radio') {
                    if (input.checked) data[key] = input.value;
                } else {
                    data[key] = input.value;
                }
            });

            return data;
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

        function formatDateToVN(dateString) {
            if (!dateString) return "";
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        }
        
        // Hàm khôi phục dữ liệu từ localStorage - PHIÊN BẢN CẢI TIẾN
        function loadFormData() {
            try {
                const savedData = localStorage.getItem('enactus_form_data');
                if (savedData) {
                    const formData = JSON.parse(savedData);
                    
                    console.log('📁 Đang khôi phục dữ liệu từ localStorage:', formData);
                    
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
                    
                    // Cập nhật tên phân ban và câu hỏi
                    updatePositionNames();

                    // KHÔI PHỤC CÂU HỎI CHUNG - CẢI TIẾN
                    if (formData.general_questions) {
                        Object.keys(formData.general_questions).forEach(key => {
                            const value = formData.general_questions[key];
                            const input = document.querySelector(`[name="${key}"]`);
                            
                            if (input) {
                                if (input.type === 'checkbox') {
                                    // Xử lý checkbox group
                                    if (Array.isArray(value)) {
                                        value.forEach(val => {
                                            const cb = document.querySelector(`[name="${key}"][value="${val}"]`);
                                            if (cb) cb.checked = true;
                                        });
                                    }
                                } else if (input.type === 'radio') {
                                    // Xử lý radio button
                                    const radio = document.querySelector(`[name="${key}"][value="${value}"]`);
                                    if (radio) radio.checked = true;
                                } else {
                                    // Input thường
                                    input.value = value;
                                }
                            }
                        });
                    }

                    // KHÔI PHỤC CÂU HỎI PHÂN BAN - QUAN TRỌNG!
                    setTimeout(() => {
                        // Đảm bản câu hỏi đã được render trước khi khôi phục
                        Object.keys(formData).forEach(key => {
                            // Xử lý câu hỏi priority_
                            if (key.startsWith("priority_")) {
                                const value = formData[key];
                                const inputs = document.querySelectorAll(`[name="${key}"]`);
                                
                                if (inputs.length > 0) {
                                    inputs.forEach(input => {
                                        if (input.type === 'checkbox') {
                                            if (Array.isArray(value) && value.includes(input.value)) {
                                                input.checked = true;
                                            }
                                        } else if (input.type === 'radio') {
                                            if (value === input.value) {
                                                input.checked = true;
                                            }
                                        } else {
                                            input.value = value;
                                        }
                                    });
                                }
                            }
                            
                            // Xử lý câu hỏi secondary_
                            if (key.startsWith("secondary_")) {
                                const value = formData[key];
                                const inputs = document.querySelectorAll(`[name="${key}"]`);
                                
                                if (inputs.length > 0) {
                                    inputs.forEach(input => {
                                        if (input.type === 'checkbox') {
                                            if (Array.isArray(value) && value.includes(input.value)) {
                                                input.checked = true;
                                            }
                                        } else if (input.type === 'radio') {
                                            if (value === input.value) {
                                                input.checked = true;
                                            }
                                        } else {
                                            input.value = value;
                                        }
                                    });
                                }
                            }
                        });
                        
                        console.log('✅ Khôi phục dữ liệu thành công');
                    }, 500); // Delay để đảm bảo câu hỏi đã render xong
                }
            } catch (error) {
                console.error('❌ Lỗi khi khôi phục dữ liệu:', error);
            }
        }
        
        // Handle form submission
        document.getElementById('recruitmentForm').addEventListener('submit', async function (e) {
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
                    delete formObject.intro;

                    Object.keys(formObject).forEach(key => {
                        if ((key.startsWith('priority_') || key.startsWith('secondary_'))
                            && key !== 'priority_position' && key !== 'secondary_position') {
                            delete formObject[key];
                        }
                    });

                    if (Array.isArray(formObject.md_sub_departments) && formObject.md_sub_departments.length === 0) {
                        delete formObject.md_sub_departments;
                    }
                    if (Array.isArray(formObject.md_sub_departments_secondary) && formObject.md_sub_departments_secondary.length === 0) {
                        delete formObject.md_sub_departments_secondary;
                    }
                }

                // Thêm danh sách ban đã chọn
                formObject.all_departments = [
                    formObject.priority_position,
                    formObject.secondary_position
                ].filter(p => p && p !== "None");

                // Save to Firebase
                await db.collection('applications').add(formObject);

                // ✅ Xóa dữ liệu tạm sau khi gửi thành công
                localStorage.removeItem('enactus_form_data');

                // ✅ Hiện thông báo thành công + redirect
                form.style.display = 'none';
                successMessage.style.display = 'block';

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
        
        // Khi submit thành công (sau khi lưu Firebase + xoá localStorage), thì ẩn form, hiện success, redirect
        function showSuccessAndRedirect() {
            const form = document.getElementById("recruitmentForm");
            const successMessage = document.getElementById("successMessage");
            const redirectMsg = document.getElementById("redirectMsg");

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
        }
        
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

        // === CẢI THIỆN CHỨC NĂNG LƯU DỮ LIỆU ===

        // Hàm lưu dữ liệu toàn diện
        function saveFormDataComprehensive() {
            try {
                const formData = collectFormData();
                localStorage.setItem('enactus_form_data', JSON.stringify(formData));
                console.log('✅ Form data saved successfully');
            } catch (error) {
                console.error('❌ Error saving form data:', error);
            }
        }

        // Lưu dữ liệu khi chuyển section
        function enhancedNextSection(current) {
            // Lưu dữ liệu trước khi chuyển section
            saveFormDataComprehensive();
            
            // Gọi hàm nextSection gốc
            nextSection(current);
        }

        // Lưu dữ liệu khi chuyển tab
        function enhancedShowTab(tabName) {
            // Lưu dữ liệu trước khi chuyển tab
            saveFormDataComprehensive();
            
            // Gọi hàm showTab gốc
            showTab(tabName);
        }

        // Lưu dữ liệu định kỳ (dự phòng)
        let autoSaveInterval;
        function startAutoSave() {
            // Lưu mỗi 30 giây
            autoSaveInterval = setInterval(saveFormDataComprehensive, 30000);
        }

        function stopAutoSave() {
            if (autoSaveInterval) {
                clearInterval(autoSaveInterval);
            }
        }

        // Lưu dữ liệu khi rời trang
        function setupBeforeUnload() {
            window.addEventListener('beforeunload', function(e) {
                saveFormDataComprehensive();
            });
        }

        // Cải thiện hàm collectFormData để thu thập đầy đủ hơn
        function enhancedCollectFormData() {
            const formObject = {
                application_type: applicationType,

                // Thông tin cá nhân
                fullname: document.getElementById('fullname')?.value || '',
                birthdate: document.getElementById('birthdate')?.value || '',
                gender: document.getElementById('gender')?.value || '',
                email: document.getElementById('email')?.value || '',
                phone: document.getElementById('phone')?.value || '',
                school: document.getElementById('school')?.value || '',
                major: document.getElementById('major')?.value || '',
                facebook: document.getElementById('facebook')?.value || '',

                // Vị trí ứng tuyển
                priority_position: document.getElementById('priority_position')?.value || '',
                secondary_position: document.getElementById('secondary_position')?.value || '',

                // Câu hỏi chung (cải tiến)
                ...enhancedCollectGeneralQuestions(),

                // Tiểu ban truyền thông
                md_sub_departments: Array.from(document.querySelectorAll('input[name="md_sub_departments[]"]:checked')).map(cb => cb.value),
                md_sub_departments_secondary: Array.from(document.querySelectorAll('input[name="md_sub_departments_secondary[]"]:checked')).map(cb => cb.value),

                // Câu hỏi phân ban
                ...enhancedCollectBanQuestions('priority'),
                ...enhancedCollectBanQuestions('secondary'),

                // Timestamp
                timestamp: new Date().toISOString(),
                last_saved: new Date().toISOString()
            };

            // Lưu lịch phỏng vấn nếu có
            if (applicationType === 'interview') {
                if (typeof interview !== "undefined" && Array.isArray(interview)) {
                    interview.forEach(q => {
                        const checked = Array.from(document.querySelectorAll(`input[name="${q.id}[]"]:checked`))
                            .map(cb => cb.value);
                        formObject[q.id] = checked.length > 0 ? checked : [];
                    });
                }
            }

            return formObject;
        }

        // Cải thiện thu thập câu hỏi chung
        function enhancedCollectGeneralQuestions() {
            const data = {};
            const container = document.getElementById('general-questions');
            if (!container) return data;

            // Lấy tất cả input elements
            const inputs = container.querySelectorAll('input, textarea, select');
            
            inputs.forEach(input => {
                const key = input.name || input.id;
                if (!key) return;

                if (input.type === 'checkbox') {
                    // Xử lý checkbox group
                    if (!data[key]) data[key] = [];
                    if (input.checked) {
                        data[key].push(input.value);
                    }
                } else if (input.type === 'radio') {
                    // Xử lý radio buttons - chỉ lấy giá trị checked
                    if (input.checked) {
                        data[key] = input.value;
                    }
                } else {
                    // Input thường, textarea, select
                    data[key] = input.value;
                }
            });

            return data;
        }

        // Cải thiện thu thập câu hỏi phân ban
        function enhancedCollectBanQuestions(type) {
            const prefix = `${type}_`;
            const questionsData = {};
            
            const containerId = type === 'priority' ? 'ban-specific-questions' : 'secondary-ban-specific-questions';
            const container = document.getElementById(containerId);
            
            if (!container) return questionsData;
            
            // Lấy tất cả các input trong container
            const allInputs = container.querySelectorAll('input, select, textarea');
            
            allInputs.forEach(input => {
                if (!input.name || !input.name.startsWith(prefix) || input.name.endsWith('_required')) {
                    return;
                }
                
                const key = input.name;
                
                if (input.type === 'checkbox') {
                    if (!questionsData[key]) questionsData[key] = [];
                    if (input.checked) {
                        questionsData[key].push(input.value);
                    }
                } else if (input.type === 'radio') {
                    if (input.checked) {
                        questionsData[key] = input.value;
                    }
                } else {
                    questionsData[key] = input.value;
                }
            });
            
            return questionsData;
        }

        // === GHI ĐÈ CÁC HÀM GỐC ===

        // Lưu hàm gốc để gọi lại
        const originalNextSection = nextSection;
        const originalShowTab = showTab;
        const originalCollectFormData = collectFormData;

        // Ghi đè hàm nextSection
        nextSection = function(current) {
            saveFormDataComprehensive();
            originalNextSection(current);
        };

        // Ghi đè hàm showTab
        showTab = function(tabName) {
            saveFormDataComprehensive();
            originalShowTab(tabName);
        };

        // Ghi đè hàm collectFormData
        collectFormData = enhancedCollectFormData;

        // === KHỞI TẠO ===

        // Thêm sự kiện lưu toàn diện
        function setupEnhancedSaveListeners() {
            // Lưu khi có bất kỳ thay đổi nào
            document.querySelectorAll('input, select, textarea').forEach(element => {
                element.addEventListener('input', saveFormDataComprehensive);
                element.addEventListener('change', saveFormDataComprehensive);
                element.addEventListener('blur', saveFormDataComprehensive);
            });
            
            // Lưu khi click các nút (phòng trường hợp không có sự kiện input)
            document.querySelectorAll('button').forEach(button => {
                button.addEventListener('click', function() {
                    setTimeout(saveFormDataComprehensive, 100);
                });
            });
            
            // Lưu khi thay đổi radio/checkbox (bổ sung thêm)
            document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
                input.addEventListener('click', saveFormDataComprehensive);
            });
        }

        // Cập nhật DOMContentLoaded
        document.addEventListener("DOMContentLoaded", () => {
            // Các hàm khởi tạo ban đầu
            loadIntroFromMarkdown();
            renderGeneralQuestions();
            updateSecondaryOptions();
            
            // Load dữ liệu tạm - QUAN TRỌNG: phải load trước khi render câu hỏi phân ban
            loadFormData();
            
            // Khởi tạo chức năng lưu nâng cao
            setupEnhancedSaveListeners();
            setupBeforeUnload();
            startAutoSave();
            
            // Hiển thị thông báo nếu có dữ liệu đã lưu
            const savedData = localStorage.getItem('enactus_form_data');
            if (savedData) {
                console.log('📁 Đã tải dữ liệu đã lưu từ phiên trước');
                
                // Hiển thị thông báo cho người dùng
                Swal.fire({
                    icon: 'info',
                    title: 'Đã khôi phục dữ liệu',
                    text: 'Dữ liệu chưa hoàn thành của bạn đã được khôi phục.',
                    timer: 3000,
                    showConfirmButton: false
                });
            }
            
            // Cập nhật position names nếu có
            const prioritySelect = document.getElementById('priority_position');
            if (prioritySelect.value) {
                updatePositionNames();
            }
        });

        // Hàm kiểm tra dữ liệu đã lưu
        function checkSavedData() {
            const saved = localStorage.getItem('enactus_form_data');
            if (saved) {
                const data = JSON.parse(saved);
                console.log('🔍 Dữ liệu đang được lưu:', data);
                
                // Đếm số lượng câu hỏi đã lưu
                const priorityQuestions = Object.keys(data).filter(key => key.startsWith('priority_')).length;
                const secondaryQuestions = Object.keys(data).filter(key => key.startsWith('secondary_')).length;
                const generalQuestions = data.general_questions ? Object.keys(data.general_questions).length : 0;
                
                console.log(`📊 Thống kê: ${generalQuestions} câu hỏi chung, ${priorityQuestions} câu hỏi NV1, ${secondaryQuestions} câu hỏi NV2`);
            } else {
                console.log('❌ Không có dữ liệu được lưu');
            }
        }

        // === GIẢI PHÁP ĐƠN GIẢN - FIX LỖI KHÔI PHỤC CÂU HỎI PHÂN BAN ===

        // 1. HÀM KHÔI PHỤC CÂU HỎI PHÂN BAN TRỰC TIẾP
        function restoreBanQuestionsDirectly() {
            const saved = localStorage.getItem('enactus_form_data');
            if (!saved) return;
            
            const data = JSON.parse(saved);
            console.log('🔄 Đang khôi phục câu hỏi phân ban trực tiếp...');
            
            let restoredCount = 0;
            
            // Khôi phục tất cả các field bắt đầu bằng priority_ và secondary_
            Object.keys(data).forEach(key => {
                if (key.startsWith('priority_') || key.startsWith('secondary_')) {
                    const value = data[key];
                    const inputs = document.querySelectorAll(`[name="${key}"]`);
                    
                    if (inputs.length > 0) {
                        inputs.forEach(input => {
                            if (input.type === 'checkbox') {
                                if (Array.isArray(value) && value.includes(input.value)) {
                                    input.checked = true;
                                    restoredCount++;
                                }
                            } else if (input.type === 'radio') {
                                if (value === input.value) {
                                    input.checked = true;
                                    restoredCount++;
                                }
                            } else {
                                // Text, textarea, select
                                if (input.value !== value) {
                                    input.value = value || '';
                                    if (value) restoredCount++;
                                }
                            }
                        });
                    }
                }
            });
            
            console.log(`✅ Đã khôi phục ${restoredCount} câu hỏi phân ban`);
            return restoredCount;
        }

        // 2. HÀM RETRY NHIỀU LẦN
        function retryRestoreWithDelay(maxRetries = 10, delay = 500) {
            let retryCount = 0;
            
            const tryRestore = () => {
                const restored = restoreBanQuestionsDirectly();
                
                if (restored > 0 || retryCount >= maxRetries) {
                    console.log(`✅ Hoàn thành sau ${retryCount} lần thử`);
                    return;
                }
                
                retryCount++;
                console.log(`🔄 Thử lại lần ${retryCount}...`);
                setTimeout(tryRestore, delay);
            };
            
            tryRestore();
        }

        // 3. GHI ĐÈ HÀM RENDER BAN QUESTIONS MỘT CÁCH AN TOÀN
        if (typeof window._banQuestionsRestorePatched === 'undefined') {
            window._banQuestionsRestorePatched = true;
            
            const originalRenderFunction = renderBanQuestions;
            renderBanQuestions = function(banCode, type) {
                originalRenderFunction(banCode, type);
                
                // Khôi phục dữ liệu sau khi render
                setTimeout(() => {
                    restoreBanQuestionsDirectly();
                }, 100);
            };
        }

        // 4. GHI ĐÈ HÀM SHOW TAB MỘT CÁCH AN TOÀN
        if (typeof window._showTabPatched === 'undefined') {
            window._showTabPatched = true;
            
            const originalShowTabFunction = showTab;
            showTab = function(tabName) {
                originalShowTabFunction(tabName);
                
                // Khôi phục dữ liệu khi chuyển tab
                setTimeout(() => {
                    restoreBanQuestionsDirectly();
                }, 200);
            };
        }

        // 5. GHI ĐÈ HÀM UPDATE POSITION NAMES
        if (typeof window._updatePositionNamesPatched === 'undefined') {
            window._updatePositionNamesPatched = true;
            
            const originalUpdateFunction = updatePositionNames;
            updatePositionNames = function() {
                originalUpdateFunction();
                
                // Khôi phục dữ liệu sau khi update position
                setTimeout(() => {
                    restoreBanQuestionsDirectly();
                }, 300);
            };
        }

        // 6. HÀM KHÔI PHỤC DỮ LIỆU HOÀN CHỈNH
        function enhancedLoadFormData() {
            try {
                const saved = localStorage.getItem('enactus_form_data');
                if (!saved) return;

                const data = JSON.parse(saved);
                console.log('📁 Đang khôi phục dữ liệu...');

                // Khôi phục thông tin cơ bản
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
                if (data.secondary_position) document.getElementById('secondary_position').value = data.secondary_position;
                
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

                // Khôi phục câu hỏi chung
                Object.keys(data).forEach(key => {
                    if (key.startsWith('general_')) {
                        const value = data[key];
                        const inputs = document.querySelectorAll(`[name="${key}"]`);
                        
                        inputs.forEach(input => {
                            if (input.type === 'checkbox') {
                                if (Array.isArray(value) && value.includes(input.value)) {
                                    input.checked = true;
                                }
                            } else if (input.type === 'radio') {
                                if (value === input.value) {
                                    input.checked = true;
                                }
                            } else {
                                input.value = value || '';
                            }
                        });
                    }
                });

                console.log('✅ Đã khôi phục thông tin cơ bản');

                // Bắt đầu retry khôi phục câu hỏi phân ban
                setTimeout(() => {
                    retryRestoreWithDelay();
                }, 1000);

            } catch (error) {
                console.error('❌ Lỗi khôi phục dữ liệu:', error);
            }
        }

        // 7. HÀM LƯU DỮ LIỆU ĐƠN GIẢN
        function simpleSaveFormData() {
            try {
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

                // Thu thập câu hỏi chung
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

                // Thu thập câu hỏi phân ban
                ['priority', 'secondary'].forEach(type => {
                    const containerId = type === 'priority' ? 'ban-specific-questions' : 'secondary-ban-specific-questions';
                    const container = document.getElementById(containerId);
                    
                    if (container) {
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
                    }
                });

                localStorage.setItem('enactus_form_data', JSON.stringify(formData));
                console.log('💾 Đã lưu dữ liệu');

            } catch (error) {
                console.error('❌ Lỗi khi lưu dữ liệu:', error);
            }
        }

        // 8. THIẾT LẬP AUTO-SAVE
        function setupSimpleAutoSave() {
            // Lưu khi thay đổi
            document.addEventListener('input', function(e) {
                setTimeout(simpleSaveFormData, 300);
            });
            
            document.addEventListener('change', function(e) {
                setTimeout(simpleSaveFormData, 300);
            });
            
            // Lưu khi click radio/checkbox
            document.addEventListener('click', function(e) {
                if (e.target.type === 'radio' || e.target.type === 'checkbox') {
                    setTimeout(simpleSaveFormData, 200);
                }
            });
            
            // Lưu khi rời trang
            window.addEventListener('beforeunload', simpleSaveFormData);
            
            // Lưu định kỳ
            setInterval(simpleSaveFormData, 30000);
        }

        // 9. GHI ĐÈ HÀM NEXT SECTION
        if (typeof window._nextSectionPatched === 'undefined') {
            window._nextSectionPatched = true;
            
            const originalNextSection = nextSection;
            nextSection = function(current) {
                simpleSaveFormData();
                originalNextSection(current);
            };
        }

        // 10. KHỞI TẠO FORM
        document.addEventListener("DOMContentLoaded", function() {
            console.log('🚀 Khởi tạo form...');
            
            // Khởi tạo ban đầu
            loadIntroFromMarkdown();
            renderGeneralQuestions();
            updateSecondaryOptions();
            
            // Khôi phục dữ liệu
            enhancedLoadFormData();
            
            // Thiết lập auto-save
            setupSimpleAutoSave();
            
            console.log('✅ Form đã sẵn sàng');
            
            // Retry cuối cùng sau 5 giây
            setTimeout(() => {
                console.log('⏰ Khôi phục lần cuối...');
                restoreBanQuestionsDirectly();
            }, 5000);
        });

document.addEventListener("DOMContentLoaded", () => {
  const now = new Date();

  // Vòng đơn
  const formStart = new Date("2026-03-01T00:00:00+07:00"); 
  const formEnd   = new Date("2026-03-28T23:59:59+07:00"); 

  let allowedType = null;

  // Kiểm tra thời gian hiện tại có nằm trong khoảng không
  if (now >= formStart && now <= formEnd) {
    allowedType = "form"; // mở form
  }

  const formEl = document.getElementById("recruitmentForm");

  if (!allowedType) {
    // Ẩn form
    formEl.style.display = "none";

    // Thông báo
    const msgBox = document.createElement("div");
    msgBox.className =
      "max-w-lg mx-auto mt-20 p-6 bg-white shadow-lg rounded-2xl text-center";
    msgBox.innerHTML = `
        <h2 class="text-xl font-semibold mb-2">❗Hiện đã kết thúc thời gian mở đơn</h2>
        <p class="text-gray-600">Đơn đã đóng vào lúc <b>23h59 ngày 21/10/2025</b>. Vui lòng quay lại sau !</p>
    `;
    formEl.parentNode.insertBefore(msgBox, formEl);
  }
});
