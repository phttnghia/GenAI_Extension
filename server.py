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
    mock_html = """
    <div class='analysis-report'>
        <h5 style='color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px; margin-bottom: 15px;'>Bug Management Analysis</h5>
        <div class='section'>
            <h6 style='color: #e74c3c; font-weight: bold;'>1. Defect Detection</h6>
            <p><i>Summary</i></p>
            <ul>
                <li>Total bugs found this week: <b>16</b></li>
                <li>Fixed bugs: <b>14</b></li>
                <li>Remaining issues: <b>2</b></li>
            </ul>
        </div>
        <div class='section'>
            <h6 style='color: #e67e22; font-weight: bold;'>2. Trend Analysis</h6>
            <ul>
                <li>Bug detection was high initially but decreased toward the latter half of testing</li>
                <li>Lead time from discovery to fix averaged 1-2 days, with good fix cycle</li>
            </ul>
        </div>
        <div class='section'>
            <h6 style='color: #27ae60; font-weight: bold;'>3. Future Concerns</h6>
            <ul>
                <li>Currently unfixed bugs are mostly minor and expected to be resolved by release</li>
                <li>Continued attention needed on test case coverage and new bug trends</li>
            </ul>
        </div>
    </div>
    """
    return jsonify({"answer": mock_html})

if __name__ == '__main__':
    app.run(port=5000, debug=True)