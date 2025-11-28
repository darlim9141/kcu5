import os
import json
import pickle
import io
import re
import base64
import numpy as np
from pillow_heif import register_heif_opener

# Register HEIF opener
register_heif_opener()
from typing import List, Dict, Any
from collections import Counter
from contextlib import asynccontextmanager

# Image processing libraries
from PIL import Image
from rembg import remove
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Machine Learning libraries
import tensorflow as tf
from tensorflow.keras.models import load_model, Model
from tensorflow.keras.applications.resnet50 import preprocess_input
from tensorflow.keras.preprocessing.image import img_to_array

# Gemini
import google.generativeai as genai
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# === Configuration & Constants ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, 'models')

# Global dictionary to store loaded models
ai_models: Dict[str, Any] = {}

# === Helper Functions ===

def get_brand_recommendations(style: str):
    """
    스타일별 브랜드 추천을 Gemini로 생성.
    실패하거나 키가 없으면 빈 리스트 반환.
    """
    if not GEMINI_API_KEY:
        return []
    prompt = f"""
    너는 패션 큐레이터야. 스타일: {style}.
    한국/글로벌 브랜드 5개를 JSON 배열로만 응답해.
    예: ["Brand1","Brand2","Brand3","Brand4","Brand5"]
    """
    try:
        model = genai.GenerativeModel("models/gemini-2.5-flash")
        resp = model.generate_content(prompt)
        txt = resp.text or ""
        m = re.search(r"\[.*\]", txt, re.S)
        if m:
            return json.loads(m.group(0))
    except Exception as e:
        print(f"Gemini recs failed: {e}")
    return []

def get_accessory_recommendations(style: str):
    """
    스타일별 악세사리 구매 링크(HTTPS) 5개를 Gemini로 생성.
    실패하거나 키가 없으면 빈 리스트 반환.
    """
    if not GEMINI_API_KEY:
        return []
    prompt = f"""
    너는 패션 큐레이터야. 스타일: {style}.
    이 스타일과 잘 어울리는 악세사리 5개의 구매 링크만 HTTPS URL로 답해.
    JSON 배열 형태로만 응답해.
    예: ["https://brand.com/item1","https://brand.com/item2","https://brand.com/item3","https://brand.com/item4","https://brand.com/item5"]
    """
    try:
        model = genai.GenerativeModel("models/gemini-2.5-flash")
        resp = model.generate_content(prompt)
        txt = resp.text or ""
        m = re.search(r"\[.*\]", txt, re.S)
        if m:
            return json.loads(m.group(0))
    except Exception as e:
        print(f"Gemini accessories failed: {e}")
    return []

def load_all_models():
    """
    Load all necessary AI models into memory during server startup.
    This includes the ResNet50 classifier, feature extractor, PCA, and KMeans models.
    """
    print("Loading AI models...")
    
    # 1. Load ResNet50 Classifier
    model_path = os.path.join(MODEL_DIR, 'resnet50', 'model.keras')
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: {model_path}")
        
    full_model = load_model(model_path)
    
    # 2. Create Feature Extractor
    # Extract the layer used for feature vectors (usually GlobalAveragePooling2D)
    try:
        feature_layer = full_model.get_layer('avg_pool')
    except ValueError:
        # Fallback to the third-to-last layer if 'avg_pool' is not named explicitly
        feature_layer = full_model.layers[-3]
        
    feature_extractor = Model(inputs=full_model.input, outputs=feature_layer.output)
    
    ai_models['classifier'] = full_model
    ai_models['feature_extractor'] = feature_extractor
    
    # 3. Load Scikit-Learn Models (PCA & KMeans)
    pca_path = os.path.join(MODEL_DIR, 'resnet50', 'pca_model.pkl')
    kmeans_path = os.path.join(MODEL_DIR, 'resnet50', 'kmeans_model.pkl')
    
    with open(pca_path, 'rb') as f:
        ai_models['pca'] = pickle.load(f)
    with open(kmeans_path, 'rb') as f:
        ai_models['kmeans'] = pickle.load(f)
        
    # 4. Load Class Names
    class_path = os.path.join(MODEL_DIR, 'resnet50', 'class_names.json')
    with open(class_path, 'r') as f:
        ai_models['class_names'] = json.load(f)
        
    print("All models loaded successfully.")

def process_image(image_bytes: bytes) -> np.ndarray:
    """
    Process the input image bytes:
    1. Remove background using rembg.
    2. Resize to 224x224 (ResNet50 input size).
    3. Convert to Numpy array and apply preprocessing.
    """
    # Convert bytes to PIL Image
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    
    # Remove background
    image_no_bg = remove(image)
    image_rgb = image_no_bg.convert('RGB') # Convert transparent background to black/white
    
    # Resize
    target_size = (224, 224)
    image_resized = image_rgb.resize(target_size)
    
    # Convert to array and preprocess
    img_array = img_to_array(image_resized)
    img_array = np.expand_dims(img_array, axis=0) # Shape: (1, 224, 224, 3)
    img_processed = preprocess_input(img_array)
    
    return img_processed

def analyze_single_image(img_processed: np.ndarray) -> Dict[str, Any]:
    """
    Perform inference on a single processed image.
    Returns classification result, 3D coordinates, and cluster ID.
    """
    # 1. Classification
    probs = ai_models['classifier'].predict(img_processed, verbose=0)
    probs_arr = probs[0]

    class_idx = int(np.argmax(probs_arr))
    class_name = ai_models['class_names'][class_idx]
    confidence = float(probs_arr[class_idx])

    # Build full probability map for all categories
    all_confidences = {
        ai_models['class_names'][i]: round(float(prob) * 100, 2)
        for i, prob in enumerate(probs_arr)
    }
    
    # 2. Feature Extraction
    # Keras returns float32 by default
    features_raw = ai_models['feature_extractor'].predict(img_processed, verbose=0)
    
    # Ensure data type is float64 and contiguous for Scikit-Learn compatibility (Critical for macOS)
    features = np.ascontiguousarray(features_raw, dtype=np.float64)
    
    # 3. PCA Transformation (High dim -> 3D)
    pca_result_raw = ai_models['pca'].transform(features)
    pca_result = np.ascontiguousarray(pca_result_raw, dtype=np.float64)
    pca_coord = pca_result[0]
    
    # 4. KMeans Clustering
    cluster_id = ai_models['kmeans'].predict(pca_result)[0]
    
    return {
        "classification": {
            "category": class_name,
            "confidence": round(confidence * 100, 2),
            "all_confidences": all_confidences
        },
        "kmeans": {
            "cluster_id": int(cluster_id),
            "coordinates": {
                "x": float(pca_coord[0]),
                "y": float(pca_coord[1]),
                "z": float(pca_coord[2])
            }
        }
    }

def summarize_batch_results(results_list: List[Dict]) -> Dict[str, Any]:
    """
    Summarize analysis results from multiple images.
    Returns the dominant style and average confidence.
    """
    if not results_list:
        return {}
        
    categories = [r['classification']['category'] for r in results_list]
    confidences = [r['classification']['confidence'] for r in results_list]
    
    # Find most common category
    count_data = Counter(categories)
    most_common = count_data.most_common(1)[0]
    
    return {
        "total_images": len(results_list),
        "dominant_style": most_common[0],
        "style_count": most_common[1],
        "avg_confidence": round(np.mean(confidences), 2),
        "style_breakdown": dict(count_data)
    }

# === FastAPI Application Setup ===

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application lifecycle.
    Load models before the server starts accepting requests.
    """
    try:
        load_all_models()
    except Exception as e:
        print(f"Error loading models: {e}")
        raise e
    yield
    # Cleanup resources on shutdown (if needed)
    ai_models.clear()

app = FastAPI(lifespan=lifespan)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === API Endpoints ===

@app.get("/")
def read_root():
    """Health check endpoint."""
    return {"status": "ok", "message": "Fashion Analysis AI Server is running."}

@app.post("/predict/single")
async def predict_single(file: UploadFile = File(...)):
    """
    Endpoint for single image analysis.
    """
    try:
        contents = await file.read()
        processed_img = process_image(contents)
        result = analyze_single_image(processed_img)
        style = result["classification"]["category"]
        result["recommendations"] = get_brand_recommendations(style)
        result["accessories"] = get_accessory_recommendations(style)
        return result
    except Exception as e:
        print(f"Error processing single image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/convert/preview")
async def convert_preview(file: UploadFile = File(...)):
    """
    Endpoint to generate a thumbnail preview for HEIC (and other) images.
    Returns a base64 encoded JPEG string.
    """
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Resize for thumbnail (e.g., max 500px) to save bandwidth
        image.thumbnail((500, 500))
        
        # Convert to RGB (in case of RGBA or others)
        if image.mode != 'RGB':
            image = image.convert('RGB')
            
        # Save to buffer as JPEG
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=70)
        buffer.seek(0)
        
        # Encode to base64
        img_str = base64.b64encode(buffer.getvalue()).decode('utf-8')
        return {"preview": f"data:image/jpeg;base64,{img_str}"}
        
    except Exception as e:
        print(f"Error generating preview: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/batch")
async def predict_batch(files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")
    """
    Endpoint for batch image analysis.
    Returns individual results and a summary.
    """
    individual_results = []
    errors = []
    try:
        for file in files:
            contents = await file.read()
            processed_img = process_image(contents)
            result = analyze_single_image(processed_img)
            style = result["classification"]["category"]
            result["recommendations"] = get_brand_recommendations(style)
            result["accessories"] = get_accessory_recommendations(style)
            result['filename'] = file.filename
            individual_results.append(result)   

        summary = summarize_batch_results(individual_results)
        
        return {
            "summary": summary,
            "individual_results": individual_results,
            "errors": errors
        }
        
    except Exception as e:
        print(f"Error processing batch: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)


#[1. 라이브러리 임포트]
#   ↓
#[2. 설정 및 전역 변수] (경로 설정, 모델 담을 변수 등)
#   ↓
#[3. 핵심 로직 함수들] (배경 제거, 모델 예측 등 순수 파이썬 함수)
#   ↓
#[4. Lifespan 정의] (모델 로딩 시점 정의)
#   ↓
#[5. 앱(app) 생성 및 CORS 설정]
#   ↓
#[6. API 엔드포인트(@app.get, @app.post)] (실제 접속 주소)
