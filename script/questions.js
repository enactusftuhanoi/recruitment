// questions.js
// Chỉ chứa dữ liệu câu hỏi. KHÔNG chứa hàm render hay logic xử lý.

// Câu hỏi chung
const generalQuestions = [
          {
            type: 'text',
            id: 'intro',
            question: 'Giới thiệu bản thân',
            placeholder: 'Mô tả ngắn gọn về bản thân, tính cách, điểm mạnh và mong muốn của bạn...',
            required: true
          },
          // bạn có thể bổ sung các câu hỏi chung khác ở đây
        ];

// Định nghĩa bộ câu hỏi cho từng phân ban
       const banQuestions = {
            'MD': { // Ban Truyền thông phân ra 2 tiểu ban
              'Design': [
                {
                  type: 'textarea',
                  id: 'design_exp',
                  question: 'Bạn đã có kinh nghiệm với phần mềm thiết kế nào?',
                  placeholder: 'Mô tả kinh nghiệm với Photoshop, Illustrator, Figma, Canva...',
                  required: true
                },
                {
                  type: 'scale',
                  id: 'creativity',
                  question: 'Đánh giá khả năng sáng tạo của bạn (1-10)',
                  min: 1,
                  max: 10,
                  required: true
                },
                {
                  type: 'radio',
                  id: 'design_level',
                  question: 'Mức độ kinh nghiệm thiết kế của bạn?',
                  options: ['Mới bắt đầu', 'Có một ít kinh nghiệm', 'Khá thành thạo', 'Rất thành thạo'],
                  required: true
                }
              ],
              'Content': [
                {
                  type: 'checkbox',
                  id: 'platforms',
                  question: 'Bạn có kinh nghiệm với nền tảng mạng xã hội nào?',
                  options: ['Facebook', 'Instagram', 'TikTok', 'YouTube', 'LinkedIn'],
                  required: true
                },
                {
                  type: 'radio',
                  id: 'content_level',
                  question: 'Mức độ kinh nghiệm của bạn trong nội dung/truyền thông?',
                  options: ['Mới bắt đầu', 'Có một ít kinh nghiệm', 'Khá thành thạo', 'Rất thành thạo'],
                  required: true
                },
                {
                  type: 'scale',
                  id: 'research_skill',
                  question: 'Đánh giá khả năng nghiên cứu & lên ý tưởng nội dung (1-10)',
                  min: 1,
                  max: 10,
                  required: true
                }
              ]
            },
            'HR': [ // Ban Nhân sự
                {
                    type: 'textarea',
                    id: 'hr_organization',
                    question: 'Bạn đã từng tổ chức sự kiện nào chưa? Mô tả ngắn gọn.',
                    placeholder: 'Mô tả kinh nghiệm tổ chức sự kiện...',
                    required: false
                },
                {
                    type: 'dropdown',
                    id: 'hr_team_size',
                    question: 'Quy mô nhóm lớn nhất bạn từng quản lý?',
                    options: ['Dưới 5 người', '5-10 người', '10-20 người', 'Trên 20 người'],
                    required: true
                },
                {
                    type: 'checkbox',
                    id: 'hr_skills',
                    question: 'Kỹ năng nào bạn có thể đóng góp cho ban Nhân sự?',
                    options: ['Giao tiếp', 'Quản lý thời gian', 'Giải quyết vấn đề', 'Lập kế hoạch', 'Đàm phán'],
                    required: true
                }
            ],
            'ER': [ // Ban Đối ngoại
                {
                    type: 'textarea',
                    id: 'er_negotiation',
                    question: 'Kể về kinh nghiệm đàm phán/thương lượng của bạn',
                    placeholder: 'Mô tả tình huống bạn đã đàm phán thành công...',
                    required: true
                },
                {
                    type: 'radio',
                    id: 'er_partner_type',
                    question: 'Bạn muốn làm việc với đối tác thuộc lĩnh vực nào?',
                    options: ['Doanh nghiệp', 'Tổ chức giáo dục', 'Tổ chức phi chính phủ', 'Cá nhân influencers'],
                    required: true
                },
                {
                    type: 'date',
                    id: 'er_availability',
                    question: 'Bạn có thể bắt đầu tham gia từ khi nào?',
                    required: true
                }
            ],
            'PD': [ // Ban Nội dung
                {
                    type: 'textarea',
                    id: 'pd_writing_samples',
                    question: 'Mô tả các loại nội dung bạn đã từng sáng tạo',
                    placeholder: 'Bài blog, kịch bản video, nội dung MXH, bài PR...',
                    required: true
                },
                {
                    type: 'radio',
                    id: 'pd_content_type',
                    question: 'Bạn hứng thú nhất với loại nội dung nào?',
                    options: ['Nội dung viết (blog, article)', 'Nội dung hình ảnh (infographic)', 'Nội dung video', 'Nội dung truyền thông xã hội'],
                    required: true
                },
                {
                    type: 'scale',
                    id: 'pd_research_skill',
                    question: 'Đánh giá kỹ năng nghiên cứu và tổng hợp thông tin của bạn (1-10)',
                    min: 1,
                    max: 10,
                    required: true
                }
            ]
        };
