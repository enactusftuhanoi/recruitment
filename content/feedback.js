// questions-feedback.js
// File chứa câu hỏi feedback - có thể chỉnh sửa dễ dàng

const feedbackQuestions = {
    // Phần 1: Reflect bản thân
    part1: {
        title: "🧠 Phần 1. Reflect bản thân",
        questions: [
            {
                id: "q1",
                type: "radio",
                question: "Tuần teamwork của bạn là…",
                options: [
                    "Một chuyến đi chill 😌",
                    "Một cơn lốc deadline 🌀", 
                    "Một bài học lớn 🎓",
                    "Một kỷ niệm đáng nhớ 💛",
                    "Một combo của tất cả những thứ trên 😅"
                ],
                required: true
            },
            {
                id: "q2",
                type: "text",
                question: "Bạn thấy mình 'level up' nhất ở điểm nào sau vòng này?",
                placeholder: "Câu ngắn (1 dòng)",
                maxLength: 100,
                required: true
            }
        ]
    },

    // Phần 2: Team Lead
    part2: {
        title: "👑 Phần 2. Team Lead",
        questions: [
            {
                id: "q3",
                type: "rating",
                question: "Nếu chấm điểm Team Lead của bạn trên thang 🌟1–5, bạn sẽ cho bao nhiêu?",
                maxRating: 5,
                required: true
            },
            {
                id: "q4", 
                type: "text",
                question: "Một điều bạn thích nhất ở Lead là gì?",
                placeholder: "Câu ngắn (optional)",
                maxLength: 100,
                required: false
            }
        ]
    },

    // Phần 3: Thành viên nhóm
    part3: {
        title: "👥 Phần 3. Thành viên nhóm", 
        questions: [
            {
                id: "q5",
                type: "radio",
                question: "Không khí làm việc của nhóm bạn là kiểu:",
                options: [
                    "😆 Năng lượng dồi dào",
                    "🤔 Tập trung và nghiêm túc", 
                    "😌 Chill và nhẹ nhàng",
                    "😭 Hỗn loạn nhưng đáng yêu"
                ],
                required: true
            },
            {
                id: "q6",
                type: "tag",
                question: "Hãy tag một người trong team mà bạn thấy đáng học hỏi nhất (và lý do nhỏ xíu nhé 💬)",
                placeholder: "Gõ @ để tag thành viên",
                required: false
            }
        ]
    },

    // Phần 4: Supporters
    part4: {
        title: "💬 Phần 4. Supporters",
        questions: [
            {
                id: "q7",
                type: "radio",
                question: "Supporters đã giúp team bạn thế nào?",
                options: [
                    "✅ Cực kỳ tận tâm",
                    "✅ Luôn sẵn sàng hỗ trợ",
                    "⚠️ Đôi khi hơi ít tương tác", 
                    "💭 Khác (viết thêm nếu muốn)"
                ],
                required: true
            }
        ]
    },

    // Phần 5: Trải lòng & góp ý
    part5: {
        title: "💌 Phần 5. Trải lòng & góp ý",
        questions: [
            {
                id: "q8",
                type: "textarea", 
                question: "Một câu 'trải lòng' ngắn về vòng 3 này nè 💬",
                placeholder: "Giới hạn 200 ký tự",
                maxLength: 200,
                required: true
            },
            {
                id: "q9",
                type: "checkbox",
                question: "Nếu BTC vòng 3 là một người bạn, bạn muốn gửi gì cho họ?",
                options: [
                    "❤️ Cảm ơn",
                    "💡 Góp ý nhỏ", 
                    "🌈 Cả hai"
                ],
                required: false
            }
        ]
    }
};

// Export để sử dụng trong các file khác
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { feedbackQuestions };
}