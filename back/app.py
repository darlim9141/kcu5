# === 1. Imports ===
import os
import json
import numpy as np
import joblib  # K-means 모델(.pkl) 로드를 위해 필요
from PIL import Image
import io  # 이미지 스트림 처리를 위해 필요
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from tensorflow.keras.models import load_model
from collections import Counter  # 배치 요약 기능에 필요

# === 2. Model & Preprocessing Functions ===

def load_all_models():
    """
    앱 시작 시 모든 모델을 로드하여 Flask의 'g' (global context) 객체에 저장합니다.
    이 함수는 앱 실행 시 한 번만 호출됩니다.
    
    Input: 
        - 없음 (서버 내의 'models/' 폴더 경로에서 직접 로드)
    Output: 
        - 없음 (대신 g.vgg_model, g.kmeans_model, g.class_names 등에 객체가 저장됨)
    """
    try:
        # # 예시 로직 (경로는 실제에 맞게 수정 필요)
        # model_path = os.path.join('models', 'vgg16', 'model.keras') # 또는 'vgg16_model.h5'
        # kmeans_path = os.path.join('models', 'kmeans', 'kmeans_model.pkl')
        # feature_extractor_path = os.path.join('models', 'vgg16', 'feature_extractor.h5') # K-means용 특징 추출기
        # pca_path = os.path.join('models', 'kmeans', 'pca_3d.pkl') # 3D 좌표 변환기
        
        # # g 객체에 모델 저장
        # g.vgg_model = load_model(model_path)
        # g.kmeans_model = joblib.load(kmeans_path)
        # g.feature_extractor = load_model(feature_extractor_path)
        # g.pca_model = joblib.load(pca_path)
        
        # # 클래스 이름 (노트북 기반)
        # g.class_names = ['amekaji', 'casual', 'minimal', 'street']
        
        print(" * All models loaded and stored in 'g' context.")
        pass # <--- 여기에 실제 모델 로드 코드 구현
    
    except Exception as e:
        print(f"ERROR: Failed to load models: {e}")
        pass

def preprocess_image_for_classification(image_file_storage):
    """
    Flask의 FileStorage 객체를 VGG16 분류 모델 입력에 맞게 전처리합니다.
    (work_space.ipynb의 ImageDataGenerator(rescale=1./255) 로직 재현)
    
    Input: 
        - image_file_storage (werkzeug.FileStorage): request.files['image']로 받은 원본 이미지
    Output: 
        - np.array: (1, 224, 224, 3) 형태의 정규화된 Numpy 배열
    """
    # # 예시 로직
    # img = Image.open(image_file_storage.stream).convert('RGB')
    # img = img.resize((224, 224))
    # img_array = np.array(img)
    # img_array = img_array / 255.0  # work_space.ipynb의 rescale=1./255
    # img_batch = np.expand_dims(img_array, axis=0)
    # return img_batch
    pass # <--- 여기에 PIL과 Numpy를 사용한 전처리 코드 구현

def get_classification_prediction(image_batch):
    """
    전처리된 이미지 배치를 VGG16 모델에 넣어 예측 결과를 반환합니다.

    Input: 
        - image_batch (np.array): (1, 224, 224, 3) 형태의 Numpy 배열
    Output: 
        - dict: {"category": "casual", "confidence": 0.85} 형태의 딕셔너리
    """
    # # 예시 로직
    # model = g.get('vgg_model')
    # class_names = g.get('class_names')
    
    # probs = model.predict(image_batch)[0]
    # pred_index = np.argmax(probs)
    # category = class_names[pred_index]
    # confidence = float(probs[pred_index])
    
    # return {"category": category, "confidence": confidence}
    pass # <--- 여기에 model.predict() 및 후처리 코드 구현

def extract_features_for_kmeans(image_batch):
    """
    전처리된 이미지 배치를 K-means용 특징 추출기 모델에 넣어 특징 벡터를 반환합니다.
    (K-means 학습 시 사용한 전처리/특징추출 모델과 동일해야 함)

    Input: 
        - image_batch (np.array): (1, 224, 224, 3) 형태의 Numpy 배열
    Output: 
        - np.array: (1, N) 형태의 1D 특징 벡터 (예: (1, 4096))
    """
    # # 예시 로직
    # # K-means용 전처리가 VGG16 분류와 다를 경우, 여기서 별도 전처리 필요
    # extractor = g.get('feature_extractor')
    # features = extractor.predict(image_batch)
    # return features
    pass # <--- 여기에 특징 추출 코드 구현

def get_kmeans_location(feature_vector):
    """
    추출된 특징 벡터를 K-means와 PCA 모델에 넣어 클러스터 ID와 3D 좌표를 반환합니다.

    Input: 
        - feature_vector (np.array): (1, N) 형태의 1D 특징 벡터
    Output: 
        - dict: {"cluster_id": 2, "coordinates_3d": [10.1, -5.5, 3.2]} 형태의 딕셔너리
    """
    # # 예시 로직
    # kmeans = g.get('kmeans_model')
    # pca = g.get('pca_model')
    
    # cluster_id = kmeans.predict(feature_vector)[0]
    # coordinates_3d = pca.transform(feature_vector)[0]
    
    # return {"cluster_id": int(cluster_id), "coordinates_3d": coordinates_3d.tolist()}
    pass # <--- 여기에 K-means, PCA 예측 코드 구현

def summarize_batch_results(results_list):
    """
    배치 예측(분류) 결과 리스트를 받아 요약 정보를 생성합니다.

    Input: 
        - results_list (list): [{"category": "casual", "confidence": 0.8}, ...] 형태의 딕셔너리 리스트
    Output: 
        - dict: {"most_common_category": "casual", "count": 2, "average_confidence": 0.78} 형태의 딕셔너리
    """
    # # 예시 로직
    # categories = [r['category'] for r in results_list]
    # confidences = [r['confidence'] for r in results_list]
    # if not categories:
    #     return {"most_common_category": "N/A", "count": 0, "average_confidence": 0.0}
    
    # most_common = Counter(categories).most_common(1)[0]
    # avg_confidence = np.mean(confidences)
    
    # return {
    #     "most_common_category": most_common[0],
    #     "count": most_common[1],
    #     "average_confidence": float(avg_confidence)
    # }
    pass # <--- 여기에 리스트 요약 로직 구현


# === 3. Flask App Factory & API Routes ===
# API 엔드포인트를 정의하고 위 함수들을 '조립'합니다.

def create_app():
    """
    Flask 앱 인스턴스를 생성하고, API 라우트를 설정합니다.
    """
    app = Flask(__name__)
    
    # React 앱과의 통신을 위해 CORS 설정 (포트는 React 포트에 맞게 수정)
    CORS(app, resources={r"/predict/*": {"origins": ["http://localhost:3000", "http://localhost:5173"]}})

    with app.app_context():
        # 앱 컨텍스트 내에서 모델 로드 함수를 호출합니다.
        load_all_models()

    @app.route('/predict/single', methods=['POST'])
    def predict_single():
        """
        API: 단일 이미지를 받아 [스타일 분류]와 [K-means 위치]를 반환합니다.
        
        Input (form-data): 
            - 'image': 이미지 파일 1장
        Output (JSON): 
            - {
                "classification": {"category": "casual", "confidence": 0.85},
                "kmeans": {"cluster_id": 2, "coordinates_3d": [10.1, -5.5, 3.2]}
              }
        """
        # --- 아래 함수들을 호출하여 API 로직 완성 ---
        # 1. 파일 수신 (request.files)
        # 2. preprocess_image_for_classification() 호출
        # 3. get_classification_prediction() 호출
        # 4. 파일 포인터 리셋 (file.stream.seek(0))
        # 5. extract_features_for_kmeans() 호출 (필요시 별도 전처리)
        # 6. get_kmeans_location() 호출
        # 7. 결과 조합하여 jsonify()로 반환
        pass 

    @app.route('/predict/batch', methods=['POST'])
    def predict_batch():
        """
        API: 여러 장의 이미지를 받아 [개별 분류 결과]와 [요약 정보]를 반환합니다.
        
        Input (form-data): 
            - 'images': 이미지 파일 리스트 (여러 장)
        Output (JSON): 
            - {
                "individual_results": [
                    {"filename": "img1.jpg", "classification": {"category": "casual", ...}},
                    {"filename": "img2.jpg", "classification": {"category": "street", ...}}
                ],
                "summary": { ... }
              }
        """
        # --- [팀원 작업] 아래 함수들을 호출하여 API 로직 완성 ---
        # 1. 파일 리스트 수신 (request.files.getlist)
        # 2. for 루프로 각 파일을 처리:
        #    - preprocess_image_for_classification() 호출
        #    - get_classification_prediction() 호출
        #    - 개별 결과 리스트에 저장
        # 3. summarize_batch_results() 호출
        # 4. 결과 조합하여 jsonify()로 반환
        pass

    return app

# === 4. App Execution ===
if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)