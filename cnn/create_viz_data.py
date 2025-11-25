import os
import json
import numpy as np
import pickle
import tensorflow as tf
from tensorflow.keras.models import load_model, Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications.resnet50 import preprocess_input
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans

# === 설정 ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, '../image')
SAVE_DIR = os.path.join(BASE_DIR, 'models/resnet50')
MODEL_PATH = os.path.join(SAVE_DIR, 'model.keras')

IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32
N_CLUSTERS = 4

def create_visualization_data():
    if not os.path.exists(MODEL_PATH):
        print(f"❌ 모델 없음: {MODEL_PATH}")
        return

    # 1. 모델 로드
    print(f"1. Loading trained model...")
    full_model = load_model(MODEL_PATH)

    try:
        feature_layer = full_model.get_layer('avg_pool')
    except ValueError:
        feature_layer = full_model.layers[-3]
    
    feature_extractor = Model(inputs=full_model.input, outputs=feature_layer.output)

    # 2. 데이터 로더
    print("2. Preparing data...")
    datagen = ImageDataGenerator(preprocessing_function=preprocess_input)
    generator = datagen.flow_from_directory(
        DATA_DIR,
        target_size=IMAGE_SIZE,
        batch_size=BATCH_SIZE,
        class_mode=None,
        shuffle=False 
    )

    # 3. 특징 추출
    print("3. Extracting features...")
    features = feature_extractor.predict(generator, verbose=1)
    
    # [!!! 핵심 해결책 !!!]
    # 학습 데이터를 저장하기 전에 무조건 float64(Double)로 변환합니다.
    # 이렇게 하면 PCA와 KMeans가 "Double형 모델"로 생성됩니다.
    print(f"   Original dtype: {features.dtype}")
    features = features.astype(np.float64)
    print(f"   Converted dtype: {features.dtype} (Fixed for Mac/Scikit-learn)")

    # 4. PCA
    print("4. Running PCA (3 components)...")
    pca = PCA(n_components=3)
    pca_features = pca.fit_transform(features) # float64 입력 -> float64 모델 생성

    # 5. K-Means
    print(f"5. Running K-Means ({N_CLUSTERS} clusters)...")
    kmeans = KMeans(n_clusters=N_CLUSTERS, random_state=42, n_init=10)
    clusters = kmeans.fit_predict(pca_features) # float64 입력 -> float64 모델 생성

    # 6. JSON 저장
    print("6. Saving JSON...")
    filenames = generator.filenames
    results = []
    for i, filename in enumerate(filenames):
        clean_filename = filename.replace('\\', '/')
        label_guess = clean_filename.split('/')[0]
        results.append({
            "id": i,
            "filename": clean_filename,
            "x": round(float(pca_features[i][0]), 4),
            "y": round(float(pca_features[i][1]), 4),
            "z": round(float(pca_features[i][2]), 4),
            "cluster": int(clusters[i]),
            "original_label": label_guess
        })

    with open(os.path.join(SAVE_DIR, 'web_graph_data.json'), 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    # 7. PKL 파일 저장
    print("7. Saving Pickles...")
    with open(os.path.join(SAVE_DIR, 'pca_model.pkl'), 'wb') as f:
        pickle.dump(pca, f)
    with open(os.path.join(SAVE_DIR, 'kmeans_model.pkl'), 'wb') as f:
        pickle.dump(kmeans, f)

    print("\n🎉 'float64'로 타입 고정된 새로운 모델들이 저장되었습니다!")

if __name__ == "__main__":
    create_visualization_data()