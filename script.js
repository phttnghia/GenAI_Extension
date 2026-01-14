// --- 1. CREATE EXTENSION ---
tableau.extensions.initializeAsync().then(function () {
    console.log("Extension initialized!");
});

// --- 2. FUNCTION DISPLAY MESSAGE (Fixed HTML rendering) ---
function addMessage(text, sender) {
    const messages = document.getElementById('messages');
    const el = document.createElement('div');
    
    el.className = 'message ' + (sender === 'user' ? 'user' : 'ai');

    if (sender === 'ai') {
        el.innerHTML = text; 
    } else {
        el.textContent = text;
    }

    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
}

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

// --- 4. CALL SERVER
async function askAI() {
    const questionEl = document.getElementById('question');
    const question = questionEl.value.trim();
    const loadingDiv = document.getElementById('loading');

    if (!question) return;

    addMessage(question, 'user');
    questionEl.value = ''; // Delete question box
    loadingDiv.style.display = 'block'; // Display Thinking...

    try {
        const dashboard = tableau.extensions.dashboardContent.dashboard;
        
        const worksheet = dashboard.worksheets.find(w => w.name === "Line_Chart");
        
        let dataJson = null;
        if (worksheet) {
            // Get data from chart
            const summaryData = await worksheet.getSummaryDataAsync();
            dataJson = convertTableauDataToJson(summaryData);
        } else {
            console.warn("Không tìm thấy worksheet: Line_Chart");
        }

        // 3. Send to Backend Python
        const res = await fetch("http://localhost:5000/ask-ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                question: question,
                context_data: dataJson ? JSON.stringify(dataJson) : "No data context"
            })
        });

        const result = await res.json();

        // 4. Display respond AI (Dạng HTML)
        addMessage(result.answer, 'ai');

    } catch (err) {
        console.error(err);
        addMessage('Lỗi: ' + (err.message || "Không kết nối được server"), 'ai');
    } finally {
        loadingDiv.style.display = 'none';
    }
}

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

// Initialize Tableau extension
tableau.extensions.initializeAsync().then(() => {
    console.log('Tableau extension initialized');
});

// Toggle for report button
document.getElementById('showReportBtn').addEventListener('click', () => {
    const reportDiv = document.getElementById('report');
    const wrapper = document.querySelector('.ai-wrapper');
    const messagesDiv = document.getElementById('messages');
    const loadingDiv = document.getElementById('loading');
    const inputWrap = document.querySelector('.input-wrap');
    // Always close chatbox if open
    messagesDiv.style.display = 'none';
    loadingDiv.style.display = 'none';
    inputWrap.style.display = 'none';
    wrapper.classList.remove('chatbox-mode');
    wrapper.classList.remove('expanded');
    if (reportDiv.style.display === 'none') {
        // Fetch and show report
        fetch('/ask-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: 'Show bug analysis', context_data: {} })
        })
        .then(response => response.json())
        .then(data => {
            reportDiv.innerHTML = data.answer;
            reportDiv.style.display = 'block';
            // Let wrapper auto-size
            wrapper.classList.add('expanded');
        })
        .catch(error => console.error('Error fetching report:', error));
    } else {
        reportDiv.style.display = 'none';
        wrapper.classList.remove('expanded');
    }
});

// Toggle for chatbox button
document.getElementById('showChatBtn').addEventListener('click', () => {
    const messagesDiv = document.getElementById('messages');
    const loadingDiv = document.getElementById('loading');
    const inputWrap = document.querySelector('.input-wrap');
    const wrapper = document.querySelector('.ai-wrapper');
    const reportDiv = document.getElementById('report');
    const isHidden = messagesDiv.style.display === 'none';
    // Always close report if open
    reportDiv.style.display = 'none';
    wrapper.classList.remove('expanded');
    messagesDiv.style.display = isHidden ? 'flex' : 'none';
    loadingDiv.style.display = isHidden ? 'block' : 'none';
    inputWrap.style.display = isHidden ? 'flex' : 'none';
    if (isHidden) {
        wrapper.classList.add('chatbox-mode');
        wrapper.classList.add('expanded');
    } else {
        wrapper.classList.remove('chatbox-mode');
        wrapper.classList.remove('expanded');
    }
});

// Existing chat functionality (if any) can be added here
// For example, handling the send button
document.getElementById('sendBtn').addEventListener('click', () => {
    const question = document.getElementById('question').value;
    if (question.trim()) {
        // Add user message to chat
        const messagesDiv = document.getElementById('messages');
        const userMessage = document.createElement('div');
        userMessage.className = 'message user';
        userMessage.textContent = question;
        messagesDiv.appendChild(userMessage);

        // Show loading
        document.getElementById('loading').style.display = 'block';

        // Send to API
        fetch('/ask-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: question, context_data: {} })
        })
        .then(response => response.json())
        .then(data => {
            // Hide loading
            document.getElementById('loading').style.display = 'none';

            // Add AI response
            const aiMessage = document.createElement('div');
            aiMessage.className = 'message ai';
            aiMessage.innerHTML = data.answer;
            messagesDiv.appendChild(aiMessage);

            // Scroll to bottom
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        })
        .catch(error => {
            document.getElementById('loading').style.display = 'none';
            console.error('Error:', error);
        });

        // Clear input
        document.getElementById('question').value = '';
    }
});