// --- 1. KHỞI TẠO EXTENSION ---
tableau.extensions.initializeAsync().then(function () {
    console.log("Extension initialized!");
});

// --- 2. HÀM HIỂN THỊ TIN NHẮN (Đã sửa lỗi hiển thị HTML) ---
function addMessage(text, sender) {
    const messages = document.getElementById('messages');
    const el = document.createElement('div');
    
    // Gán class để CSS biết là tin nhắn của user hay ai
    el.className = 'message ' + (sender === 'user' ? 'user' : 'ai');

    if (sender === 'ai') {
        // QUAN TRỌNG: Dùng innerHTML để render thẻ <b>, <ul>, <li> từ Python gửi sang
        el.innerHTML = text; 
    } else {
        // Với User thì dùng textContent để bảo mật (tránh lỗi XSS nếu user nhập code)
        el.textContent = text;
    }

    messages.appendChild(el);
    // Tự động cuộn xuống dòng cuối cùng
    messages.scrollTop = messages.scrollHeight;
}

// --- 3. XỬ LÝ SỰ KIỆN CLICK VÀ ENTER ---
document.addEventListener('DOMContentLoaded', () => {
    const q = document.getElementById('question');
    const btn = document.getElementById('sendBtn');

    // Sự kiện click nút Send
    btn.addEventListener('click', askAI);

    // Sự kiện ấn phím Enter (giữ Shift+Enter để xuống dòng)
    q.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Chặn xuống dòng mặc định
            askAI();
        }
    });
});

// --- 4. HÀM LOGIC CHÍNH (GỌI SERVER) ---
async function askAI() {
    const questionEl = document.getElementById('question');
    const question = questionEl.value.trim();
    const loadingDiv = document.getElementById('loading');

    if (!question) return;

    // 1. Hiển thị câu hỏi của User lên màn hình
    addMessage(question, 'user');
    questionEl.value = ''; // Xóa ô nhập liệu
    loadingDiv.style.display = 'block'; // Hiện chữ Thinking...

    try {
        // 2. Lấy dữ liệu từ Dashboard Tableau
        const dashboard = tableau.extensions.dashboardContent.dashboard;
        
        // !!! LƯU Ý: Thay "Line_Chart" bằng tên Sheet thật của bạn trong Tableau
        const worksheet = dashboard.worksheets.find(w => w.name === "Line_Chart");
        
        let dataJson = null;
        if (worksheet) {
            // Lấy dữ liệu summary (dữ liệu đã aggregate trên chart)
            const summaryData = await worksheet.getSummaryDataAsync();
            dataJson = convertTableauDataToJson(summaryData);
        } else {
            console.warn("Không tìm thấy worksheet: Line_Chart");
        }

        // 3. Gửi sang Backend Python
        const res = await fetch("http://localhost:5000/ask-ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                question: question,
                context_data: dataJson ? JSON.stringify(dataJson) : "No data context"
            })
        });

        const result = await res.json();

        // 4. Hiển thị câu trả lời từ AI (Dạng HTML)
        addMessage(result.answer, 'ai');

    } catch (err) {
        console.error(err);
        addMessage('Lỗi: ' + (err.message || "Không kết nối được server"), 'ai');
    } finally {
        loadingDiv.style.display = 'none'; // Ẩn chữ Thinking...
    }
}

// --- 5. HÀM PHỤ TRỢ: CHUYỂN DATA TABLEAU SANG JSON ---
function convertTableauDataToJson(dataTable) {
    if (!dataTable || !dataTable.columns) return [];
    
    let headers = dataTable.columns.map(c => c.fieldName);
    let data = [];
    
    dataTable.data.forEach(row => {
        let rowData = {};
        row.forEach((cell, index) => {
            rowData[headers[index]] = cell.value;
        });
        data.push(rowData);
    });

    // Chỉ lấy 50 dòng đầu để demo cho nhanh
    return data.slice(0, 50);
}