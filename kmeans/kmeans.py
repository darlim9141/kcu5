import os
import numpy as np
import matplotlib.pyplot as plt

# 딥러닝 및 머신러닝 라이브러리 임포트
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE

# load_and_preprocess_images 함수와 extract_features 함수는 삭제

# --- 3. 시각화 함수 ---
def visualize_clusters(tsne_results, labels, title):
    plt.figure(figsize=(10, 8))
    unique_labels = np.unique(labels)
    for label in unique_labels:
        indices = [i for i, l in enumerate(labels) if l == label]
        plt.scatter(tsne_results[indices, 0], tsne_results[indices, 1], label=label, alpha=0.7)
    plt.title(title)
    plt.xlabel("t-SNE Component 1")
    plt.ylabel("t-SNE Component 2")
    plt.legend()
    plt.grid(True)
    plt.show()

# --- 메인 실행 코드 ---
if __name__ == "__main__":
    
    # 1. 데이터 준비 (새로운 방식)
    print("1. .npy 파일로부터 특징 벡터와 라벨을 로드합니다...")
    # 현재 스크립트 파일이 있는 폴더의 절대 경로를 가져오기
    script_path = os.path.dirname(os.path.abspath(__file__))

    # 파일의 전체 경로(절대 경로)를 만들오기
    features_path = os.path.join(script_path, 'image_features.npy')
    labels_path = os.path.join(script_path, 'image_labels.npy')

    # 전체 경로를 사용해서 파일을 불러오기.
    features = np.load(features_path)
    true_labels = np.load(labels_path)
    
    print(f"총 {len(features)}개의 특징 벡터를 로드했습니다.")
    print(f"로드된 특징 벡터의 형태(shape): {features.shape}")

    # 2. VGG16 모델 준비 및 특징 추출 단계는 건너뛰기

    # 3. PCA로 차원 축소 
    print("\n3. PCA를 사용하여 특징 벡터의 차원을 축소합니다...")
    # K-means의 성능과 안정성을 위해 주성분 50개로 차원을 축소
    pca = PCA(n_components=50, random_state=42)
    # 바로 features 변수를 사용
    features_pca = pca.fit_transform(features)
    print(f"PCA로 축소된 특징 벡터의 형태: {features_pca.shape}")

    # 4. K-means 클러스터링 실행
    print("\n4. K-means 클러스터링을 진행합니다...")
    kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
    cluster_labels = kmeans.fit_predict(features_pca)

    # 5. t-SNE로 시각화를 위한 2차원 축소
    print("\n5. t-SNE를 사용하여 시각화를 위해 2차원으로 축소합니다...")
    tsne = TSNE(n_components=2, random_state=42, perplexity=30, n_iter=1000)
    features_tsne = tsne.fit_transform(features_pca)
    print(f"t-SNE로 축소된 벡터의 형태: {features_tsne.shape}")

    # 6. 결과 시각화
    print("\n6. 결과를 시각화합니다...")
    visualize_clusters(features_tsne, true_labels, 't-SNE Visualization with True Labels')
    
    kmeans_labels_str = [f'Cluster {label}' for label in cluster_labels]
    visualize_clusters(features_tsne, kmeans_labels_str, 't-SNE Visualization with K-means Clusters')
    
    print("\n모든 작업이 완료되었습니다.")