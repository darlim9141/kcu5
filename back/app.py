# back/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from back.model_utils import predict_single_image

app = Flask(__name__)
CORS(app)  # React 등 외부 요청 허용

# === 설정 부분 ===
MODEL_PATH = "back/models/vgg16_model.h5"  # ✅ 사용할 VGG16 모델
CLASS_NAMES = ["amekaji", "casual", "minimal", "street"]  # 네 데이터셋 클래스 순서

print("🔹 Loading VGG16 model from:", MODEL_PATH)
model = load_model(MODEL_PATH)
print("✅ Model loaded successfully!")

# === API 라우트 ===

@app.get("/health")
def health_check():
    """서버 연결 테스트용"""
    return jsonify({"ok": True, "message": "Flask server running (VGG16 model)"})

@app.post("/predict")
def predict():
    """이미지 예측 API"""
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    result = predict_single_image(model, file, CLASS_NAMES)
    return jsonify(result)

# === 서버 실행 ===
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
