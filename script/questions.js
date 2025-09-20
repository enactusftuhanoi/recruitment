// questions.js
// Chỉ chứa dữ liệu câu hỏi. KHÔNG chứa hàm render hay logic xử lý.

// Câu hỏi chung
const generalQuestions = [
          {
            type: 'textarea',
            id: 'gq1', //generalQuestions1
            question: 'Câu 1: Đâu là lý do khiến bạn mong muốn trở thành một mảnh ghép của đại gia đình Nhà E ở Gen 18.0?',
            placeholder: 'Hãy chia sẻ những thông tin mà bạn biết về CLB Enactus FTU Hanoi',
            required: true
          },
          {
            type: 'textarea',
            id: 'gq2', //generalQuestions1
            question: 'Câu 2: Hãy chia sẻ về một trải nghiệm ngoại khóa, tình nguyện hoặc hoạt động tập thể mà bạn cảm thấy tự hào nhất. Trong trải nghiệm đó, bạn đã đảm nhận vai trò gì, đạt được kết quả gì hoặc gặp phải khó khăn nào? Bạn rút ra được bài học gì và bài học đó sẽ giúp ích như thế nào cho quá trình hoạt động tại CLB?',
            placeholder: '',
            required: true
          },
          {
            type: 'textarea',
            id: 'gq4', //generalQuestions1
            question: `Câu 3: Năm 2025, thế giới thay đổi nhanh chóng, kéo theo nhiều vấn đề xã hội đáng lo ngại. Nếu có một "cây đũa thần" để thay đổi duy nhất một vấn đề xã hội nổi bật trong năm 2025 thì bạn sẽ giải quyết vấn đề gì?

          Hãy chia sẻ lý do khiến bạn trăn trở và muốn ưu tiên vấn đề ấy. 

          Bạn biết vấn đề này qua đâu, và hiện nay mọi người đang giải quyết vấn đề này như thế nào?

          Bạn có đồng tình với cách giải quyết này không? Nếu có, hãy chia sẻ lý do tại sao. Nếu không, hãy đề xuất giải pháp tối ưu hơn.`,
            placeholder: '',
            required: true
          },
          {
              type: 'textarea',
              id: 'gq5',
              question: 'Câu 4: Hãy nêu cảm nhận của bạn về hình ảnh này?',
              required: true,
              placeholder: 'Hãy nêu cảm nhận về bức ảnh trên',
              media: {
                type: 'image',
                url: '/assets/vsic2024.png',
              }
          },
        ];

// Định nghĩa bộ câu hỏi cho từng phân ban
       const banQuestions = {
            'MD': { // Ban Truyền thông phân ra 2 tiểu ban
              'Design': [
                {
                  type: 'textarea',
                  id: 'md_qs1',
                  question: 'Câu 1: Nếu một ngày em có thể quay về quá khứ và thay đổi một quyết định của bản thân, em sẽ chọn khoảnh khắc nào? Vì sao?',
                  placeholder: '',
                  required: true
                },
                {
                  type: 'textarea',
                  id: 'md_qs2',
                  question: 'Câu 2: Hãy tưởng tượng sau 1 năm tham gia Ban Truyền thông, em muốn mọi người nhớ đến em là một người như thế nào?',
                  placeholder: '',
                  required: true
                },
                {
                  type: 'textarea',
                  id: 'md_qs3',
                  question: 'Câu 3: ',
                  placeholder: '',
                  required: true
                },
                {
                  type: 'textarea',
                  id: 'md_qs4',
                  question: 'Câu 4: Hãy chia sẻ một chiến dịch truyền thông để lại cho em nhiều ấn tượng nhất. Tại sao em yêu thích chiến dịch đó?',
                  placeholder: '',
                  required: true
                },
              ],
              'Content': [
                {
                  type: 'textarea',
                  id: 'md_qs1',
                  question: 'Câu 1: Nếu một ngày em có thể quay về quá khứ và thay đổi một quyết định của bản thân, em sẽ chọn khoảnh khắc nào? Vì sao?',
                  placeholder: '',
                  required: true
                },
                {
                  type: 'textarea',
                  id: 'md_qs2',
                  question: 'Câu 2: Hãy tưởng tượng sau 1 năm tham gia Ban Truyền thông, em muốn mọi người nhớ đến em là một người như thế nào?',
                  placeholder: '',
                  required: true
                },
                {
                  type: 'textarea',
                  id: 'md_qs3',
                  question: 'Câu 3: ',
                  placeholder: '',
                  required: true
                },
                {
                  type: 'textarea',
                  id: 'md_qs4',
                  question: 'Câu 4: Hãy chia sẻ một chiến dịch truyền thông để lại cho em nhiều ấn tượng nhất. Tại sao em yêu thích chiến dịch đó?',
                  placeholder: '',
                  required: true
                },
                {
                  type: 'textarea',
                  id: 'md_content_qs1',
                  question: 'Câu 5: Những năm gần đây, công nghệ và AI phát triển mạnh với nhiều công cụ hỗ trợ học tập, làm việc như ChatGPT, Gemini hay Copilot. Điều này tạo ra hai luồng ý kiến: một bên cho rằng AI giúp cuộc sống tiện lợi, tiết kiệm thời gian, một bên lại lo ngại con người mất dần tư duy sáng tạo và ngày càng phụ thuộc. Em đồng ý với quan điểm nào? Hãy giải thích lý do.',
                  placeholder: '',
                  required: true
                },
                {
                  type: 'textarea',
                  id: 'md_content_qs2',
                  question: 'Câu 6: ',
                  placeholder: '',
                  required: true
                },
              ]
            },
            'HR': [ // Ban Nhân sự
                {
                    type: 'textarea',
                    id: 'hr_qs1',
                    question: `Câu 1: Bạn hãy kể về những trải nghiệm, hoạt động ngoại khóa mà bạn đã từng tham gia trước đây. Sau những trải nghiệm, hoạt động đó, bạn đã rút ra được những bài học gì cho bản thân và điều gì khiến bạn tâm đắc nhất?
                    
                    VD:
                    - Nội dung chính của hoạt động là gì?
                    - Bạn tham gia với vai trò gì?
                    - Bạn học được những gì và bạn tâm đắc nhất điều gì?
                    - …`,
                    placeholder: '',
                    required: true
                },
                {
                    type: 'textarea',
                    id: 'hr_qs2',
                    question: 'Câu 2: Bạn hiểu như thế nào về vai trò của ban Nhân sự - Sự Kiện trong Enactus FTU Hanoi. Bạn nghĩ mình có những đặc điểm gì phù hợp với ban Nhân sự - Sự kiện?',
                    placeholder: '',
                    required: true
                },
                {
                    type: 'textarea',
                    id: 'hr_qs3',
                    question: 'Câu 3: Trong một tập thể, bạn nghĩ điều gì quan trọng hơn: sự đồng đều giữa các thành viên hay sự khác biệt để bổ sung lẫn nhau? Nếu là một phần của tập thể, bạn mong muốn mình sẽ đóng vai trò là leader hay member?',
                    placeholder: '',
                    required: true
                },
                {
                    type: 'textarea',
                    id: 'hr_qs4',
                    question: 'Câu 4: Giả sử bạn là thành viên ban Nhân sự – Sự kiện, hãy chia sẻ góc nhìn của mình về mối liên hệ giữa sự gắn kết của các thành viên và chiếc điện thoại theo hai chiều hướng: tích cực và tiêu cực.',
                    placeholder: '',
                    required: true
                },
                {
                    type: 'textarea',
                    id: 'hr_qs5',
                    question: 'Câu 5: Tại một sự kiện offline của CLB, bất ngờ số lượng khách tham gia đông hơn dự kiến (gấp rưỡi). Khiến người tham dự phải xếp hàng dài và bắt đầu than phiền. Nếu bạn là người điều phối nhân sự ở khu vực này, bạn sẽ xử lý tình huống thế nào để vừa hiệu quả, vừa giữ hình ảnh chuyên nghiệp của CLB?',
                    placeholder: '',
                    required: true
                },
                {
                    type: 'textarea',
                    id: 'hr_qs6',
                    question: 'Câu 6: Giả sử trong quá trình làm việc, nhận thấy các thành viên đang dần đuối sức, cảm thấy mệt mỏi với một khối lượng công việc rất lớn, thậm chí có thành viên muốn out khỏi team, là một thành viên của ban Nhân sự - Sự kiện, bạn sẽ làm gì?',
                    placeholder: '',
                    required: true
                }
            ],
            'ER': [ // Ban Đối ngoại
                {
                    type: 'textarea',
                    id: 'er_qs1',
                    question: 'Câu 1: Theo bạn, ban Đối ngoại đóng vai trò gì trong câu lạc bộ nói chung cũng như Enactus FTU Hanoi nói riêng? ',
                    placeholder: '',
                    required: true
                },
                {
                    type: 'textarea',
                    id: 'er_qs2',
                    question: 'Câu 2: Hãy chia sẻ lý do khiến bạn chọn ban Đối ngoại của Enactus FTU Hanoi làm điểm đến trong hành trình những năm Đại học sắp tới?',
                    placeholder: '',
                    required: true
                },
                {
                    type: 'textarea',
                    id: 'er_qs3',
                    question: 'Câu 3: Nêu 3 điểm mạnh và 3 điểm yếu của bạn liên quan đến nghiệp vụ Đối ngoại. Bạn sẽ làm gì để có thể phát huy những điểm mạnh và khắc phục các điểm yếu ấy? ',
                    placeholder: '',
                    required: true
                },
                {
                    type: 'textarea',
                    id: 'er_qs4',
                    question: 'Câu 4: Giả sử sắp tới bạn có một cuộc gặp mặt với đối tác để đàm phán về hợp đồng. Hãy nêu các bước chuẩn bị trước khi tới buổi gặp mặt đó. ',
                    placeholder: '',
                    required: true
                },
                {
                  type: 'textarea',
                  id: 'er_qs5', 
                  question: `Câu 5: Được biết thử thách Sáng tạo Xã hội Việt Nam - Vietnam Social Innovation Challenge (VSIC) 2025 là cuộc thi khởi nghiệp xã hội dành cho người trẻ trên toàn quốc nhằm tìm kiếm và hỗ trợ hiện thực hóa các ý tưởng khởi nghiệp hướng đến giải quyết các vấn đề xã hội và nâng cao chất lượng cuộc sống ở Việt Nam; với định hướng là trung gian kết nối các dự án khởi nghiệp tạo tác động xã hội với các nguồn lực cần thiết, hỗ trợ hoàn thiện sản phẩm trong cuộc thi, kết nối Mentor cho đội thi trong cuộc thi và kết nối các đội thi xuất sắc với các hệ sinh thái khởi nghiệp sau cuộc thi để hiện thực hóa ý tưởng, cải thiện chất lượng dự án, từ đó nâng cao chất lượng cuộc sống của hàng nghìn đối tượng hưởng lợi. 

                Bạn hiểu một “nhà tài trợ tiềm năng” là như thế nào? Hãy nêu những tiêu chí để chọn ra “nhà tài trợ tiềm năng”? Đưa ra một ví dụ về Doanh nghiệp tiềm năng cho VSIC và đề xuất 3 quyền lợi cho họ. `,
                  placeholder: '',
                  required: true
                }
            ],
            'PD': [ // Ban Nội dung
                {
                    type: 'textarea',
                    id: 'pd_qs1',
                    question: 'Câu 1: Tại sao bạn lựa chọn ứng tuyển vào Ban Dự án của CLB Enactus FTU Hanoi? Hãy kể tên 03 phẩm chất mà bạn nghĩ là cần thiết cho một thành viên Ban Dự án?',
                    placeholder: '',
                    required: true
                },
                {
                    type: 'textarea',
                    id: 'pd_qs2',
                    question: 'Câu 2: Theo bạn, sự khác biệt cốt lõi giữa kinh doanh thông thường và kinh doanh xã hội là gì? Dựa vào sự khác biệt đó, đâu là yếu tố quan trọng nhất để một dự án khởi nghiệp xã hội có thể tồn tại bền vững và phát triển lâu dài trên thị trường? Là một thành viên Ban Dự án, bạn sẽ ưu tiên 03 tiêu chí nào nhất khi đánh giá tiềm năng phát triển của một dự án xã hội?',
                    placeholder: '',
                    required: true
                },
                {
                  type: 'textarea',
                  id: 'pd_qs3_1', 
                  question: `Câu 3: Một dự án xã hội của CLB Enactus FTU Hanoi thử nghiệm chương trình giáo dục giới tính cơ bản cho học sinh THCS tại một số trường ở Hà Nội. Tuy nhiên, do phụ huynh lo ngại chủ đề này quá “nhạy cảm” và chưa phù hợp với lứa tuổi khiến một số trường tỏ ra e ngại và chưa sẵn sàng hợp tác.

                Trong vai trò thành viên Ban Dự án, phụ trách xây dựng nội dung và giáo án: 

                1. Bạn sẽ ưu tiên nguyên tắc nào khi thiết kế nội dung: nhượng bộ để chương trình dễ triển khai, hay kiên định giữ thông điệp gốc? Vì sao?`,
                  placeholder: '',
                  required: true
                },
                {
                  type: 'textarea',
                  id: 'pd_qs3_1', 
                  question: `2. Bạn sẽ định hình cách tiếp cận thế nào để vừa trấn an lo lắng của phụ huynh, vừa đảm bảo học sinh tiếp nhận được thông điệp giáo dục giới tính một cách phù hợp, hiệu quả?`,
                  placeholder: '',
                  required: true
                }
            ]
        };
