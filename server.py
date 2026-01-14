from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import openai
import os

# Định nghĩa thư mục hiện tại là nơi chứa file html/js
current_directory = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, static_folder=current_directory)
CORS(app)

# --- PHẦN 1: CẤU HÌNH WEB SERVER (FRONTEND) ---

@app.route('/')
def index():
    return send_from_directory(current_directory, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(current_directory, path)

# --- PHẦN 2: CẤU HÌNH API AI (BACKEND) ---



@app.route('/ask-ai', methods=['POST'])
def ask_ai():
    # Nhận dữ liệu từ client (nếu cần)
    data = request.json
    user_question = data.get('question')
    chart_data = data.get('context_data')

    print(f"Nhận câu hỏi: {user_question}")

    # Trả về dữ liệu mockup cho user xem ngay
    # ... (các phần trên giữ nguyên) ...

    # Trả về dữ liệu mockup HTML có cấu trúc chuẩn
    mock_html = """
    <div class="analysis-report">
        <h5 class="report-title">Bug Control Chart Analysis Results</h5>

        <div class="section">
            <h6>1. Summary of Defect Detection Status</h6>
            <ul>
                <li>Total Bugs Found This Week: <b>16</b></li>
                <li>Fixed Bugs: <b>14</b></li>
                <li>Remaining Bugs: <b style="color: red;">2</b></li>
            </ul>
        </div>

        <div class="section">
            <h6>2. Trend Analysis</h6>
            <ul>
                <li>The number of bugs discovered was initially high, but decreased toward the end of testing.</li>
                <li>The lead time from discovery to fix was generally 1-2 days, and the fix cycle was also favorable.</li>
            </ul>
        </div>

        <div class="section">
            <h6>3. Future Concerns</h6>
            <ul>
                <li>Currently, many of the unfixed bugs are minor and are expected to be resolved by release.</li>
                <li>Continue to pay attention to the comprehensiveness of test cases and the trend of new bugs.</li>
            </ul>
        </div>
    </div>
    """
    return jsonify({"answer": mock_html})

if __name__ == '__main__':
    app.run(port=5000, debug=True)