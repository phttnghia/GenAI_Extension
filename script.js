// Khởi tạo Extension khi load
tableau.extensions.initializeAsync().then(function () {
    console.log("Extension initialized!");
});

// Add message to message list; sender = 'user' or 'ai'
function addMessage(text, sender) {
    const messages = document.getElementById('messages');
    const el = document.createElement('div');
    el.className = 'message ' + (sender === 'user' ? 'user' : 'ai');
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
}

// Handle Enter to send (Shift+Enter -> newline)
document.addEventListener('DOMContentLoaded', () => {
    const q = document.getElementById('question');
    const btn = document.getElementById('sendBtn');
    btn.addEventListener('click', askAI);
    q.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            askAI();
        }
    });
});

async function askAI() {
    const questionEl = document.getElementById('question');
    const question = questionEl.value.trim();
    const loadingDiv = document.getElementById('loading');

    if (!question) return;

    // Append user message on the right
    addMessage(question, 'user');
    questionEl.value = '';
    loadingDiv.style.display = 'block';

    try {
        // 1. Lấy dữ liệu từ Dashboard
        const dashboard = tableau.extensions.dashboardContent.dashboard;
        const worksheet = dashboard.worksheets.find(w => w.name === "Line_Chart");
        let dataJson = null;
        if (worksheet) {
            const summaryData = await worksheet.getSummaryDataAsync();
            dataJson = convertTableauDataToJson(summaryData);
        }

        // 2. Gửi sang Backend Python
        const res = await fetch("http://localhost:5000/ask-ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                question: question,
                context_data: dataJson ? JSON.stringify(dataJson) : null
            })
        });

        const result = await res.json();

        // Append AI reply on the left
        addMessage(result.answer, 'ai');

    } catch (err) {
        addMessage('Error: ' + (err.message || err), 'ai');
    } finally {
        loadingDiv.style.display = 'none';
    }
}

// Convert Tableau data to simple JSON
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
    return data.slice(0, 50);
}