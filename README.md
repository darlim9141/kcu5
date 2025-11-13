# KCU5 – AI Outfit Styler

사용자가 전신 사진을 업로드하면 스트릿, 캐주얼, 미니멀, 클래식 룩별 확률을 계산해 보여주는 AI/머신러닝 기반 패션 진단 서비스입니다. VGG 계열 분류 모델과 K-means 기반 스타일 맵을 결합해 보정된 확률, 군집 위치, 3D 임베딩 등을 제공하는 것을 목표로 합니다.

## 핵심 기능
- ✅ 한 장의 전신샷에서 4가지 스타일(Street / Casual / Minimal / Classic) 확률 계산
- ✅ 다중 이미지 업로드 시 평균/최다 스타일 통계 제공 (설계 완료, 구현 진행 중)
- ✅ K-means + PCA + t-SNE를 이용한 시각적 스타일 맵 실험 자산 포함
- ✅ React + Vite 기반의 웹 프런트엔드, Flask 기반의 백엔드 API

## 기술 스택
| 영역 | 사용 기술 |
| --- | --- |
| Frontend | Vite, React 19, TypeScript, React Router, MUI |
| Backend | Python 3.11+, Flask, Flask-CORS, TensorFlow/Keras, NumPy, Pillow, joblib |
| ML Experiment | scikit-learn (KMeans, PCA, TSNE), Jupyter Notebook |

## 디렉터리 구조
```
.
├── back/              # Flask API, 모델 유틸리티
├── front/             # Vite + React + TS 웹 앱
├── image/             # 스타일별 원본 이미지와 전처리 스크립트
├── kmeans/            # K-means 실험 스크립트 및 .npy 특징 벡터
├── cnn/               # 분류 모델 학습/실험 노트북
├── presentation/      # 발표 자료 (ppt.md 등)
└── README.md
```

## 빠른 시작
### 1. 필수 요건
- Python 3.11 이상 (TensorFlow 호환 버전)
- Node.js 20 LTS 이상
- (선택) GPU가 장착된 환경에서 모델 추론/학습 수행

### 2. 백엔드 API (Flask)
```bash
cd back
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt  # 없으면 아래 직접 설치
pip install flask flask-cors tensorflow pillow numpy joblib scikit-learn
python app.py  # http://localhost:5000
```
> `back/app.py`의 모델 로딩/전처리 함수는 템플릿 상태입니다. 실제 경로(`models/`), 이미지 전처리, `g` 컨텍스트 저장, 예측 로직을 채워 넣어야 합니다.

### 3. 프런트엔드 (Vite + React)
```bash
cd front
npm install
npm run dev  # 기본 포트: http://localhost:5173
```
필요 시 `.env`에 `VITE_API_BASE_URL=http://localhost:5000` 등을 정의해 API 통신 주소를 제어하세요.

## API 개요
`back/app.py`에 정의된 엔드포인트 설계는 다음과 같습니다.

### `POST /predict/single`
- Form-data 키: `image` (단일 전신샷)
- Response 예시
```json
{
  "classification": { "category": "street", "confidence": 0.82 },
  "kmeans": { "cluster_id": 2, "coordinates_3d": [10.1, -5.5, 3.2] }
}
```

### `POST /predict/batch`
- Form-data 키: `images` (다중 파일)
- Response 예시
```json
{
  "individual_results": [
    { "filename": "look1.jpg", "classification": { "category": "minimal", "confidence": 0.73 }},
    { "filename": "look2.jpg", "classification": { "category": "street", "confidence": 0.64 }}
  ],
  "summary": {
    "most_common_category": "minimal",
    "count": 1,
    "average_confidence": 0.685
  }
}
```
> 배치 요약(`summarize_batch_results`)과 전처리 함수 역시 템플릿이므로 실제 로직을 구현해야 합니다.

## 데이터 & 학습 리소스
- `image/` 폴더: `street`, `casual`, `minimal`, `classic`, `amekaji`, `new_minimal` 등 스타일별 이미지와 `organize_dataset.py`(데이터 정리/리네이밍 스크립트)를 보관합니다.
- `cnn/` 폴더: VGG 기반 분류 모델 학습 과정을 기록한 Jupyter 노트북(`work_space.ipynb` 등).
- `kmeans/` 폴더: 추출된 특징(`image_features.npy`), 라벨(`image_labels.npy`), `kmeans.py`, t-SNE 시각화 PNG 2종을 포함합니다.

## 앞으로의 작업
1. `back/app.py`의 TODO 채우기: 모델 로드, 전처리, 예측, K-means 좌표 계산.
2. 프런트엔드 UI 연결: 업로드 컴포넌트, 결과 그래프, 온보딩 페이지 구현(`features/onboarding`).
3. 모델 배포용 경량화: SavedModel/TF Lite 변환 및 추론 속도 개선.
4. 데이터 확장과 검증: 스타일 라벨 품질 재검토, 추가 클래스(아메카지 등) 실험.