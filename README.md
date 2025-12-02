# KCU5 – AI Outfit Styler (모입)

사용자가 전신 사진을 업로드하면 AI가 스타일(Street, Casual, Minimal, Classic)을 분석하고, 어울리는 브랜드와 악세사리를 추천해주는 패션 큐레이션 서비스입니다.

## 핵심 기능

- **📸 스타일 분석**: 업로드한 사진의 스타일을 4가지 카테고리(Street, Casual, Minimal, Classic)로 분류하고 확률을 제공합니다.
- **🤖 AI 추천**: Google Gemini AI를 활용하여 해당 스타일에 어울리는 브랜드와 악세사리 구매 링크를 추천합니다.
- **🗺️ 3D 스타일 맵**: K-means 클러스터링과 PCA를 통해 내 스타일이 패션 지도 상 어디에 위치하는지 3D로 시각화합니다.
- **📊 통계 및 갤러리**: 업로드한 사진들을 갤러리에서 관리하고, 나만의 스타일 통계를 확인할 수 있습니다.
- **✨ 배경 제거**: `rembg`를 사용하여 업로드한 사진의 배경을 자동으로 제거하고 분석 정확도를 높입니다.

## 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| **Frontend** | React 19, Vite, TypeScript, MUI, Framer Motion, Plotly.js |
| **Backend** | FastAPI, Python 3.11+, TensorFlow/Keras (ResNet50), Google Gemini API, rembg |
| **AI/ML** | ResNet50 (Feature Extraction & Classification), Scikit-learn (KMeans, PCA) |

## 디렉터리 구조

```
.
├── back/              # FastAPI 서버, AI 모델 및 로직
│   ├── models/        # 학습된 모델 (ResNet50, PCA, KMeans)
│   ├── app.py         # 메인 애플리케이션 파일
│   └── requirements.txt
├── frontend/          # React 웹 애플리케이션
│   ├── src/
│   │   ├── components/ # 재사용 가능한 UI 컴포넌트
│   │   ├── features/   # 주요 기능 페이지 (Gallery, Results, Statistic 등)
│   │   └── ...
│   └── package.json
├── image/             # 학습 및 테스트용 이미지 데이터
├── cnn/               # CNN 모델 학습 노트
├── kmeans/            # KMeans 클러스터링 실험 노트
└── README.md
```

## 시작하기 (Getting Started)

### 1. 필수 요건
- Python 3.10 이상
- Node.js 20 LTS 이상
- Google Gemini API Key (환경 변수 설정 필요)

### 2. 백엔드 설정 (FastAPI)

```bash
cd back

# 가상환경 생성 및 활성화
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정 (.env 파일 생성)
# GEMINI_API_KEY=your_api_key_here

# 서버 실행
python app.py
# 또는
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```
서버는 `http://localhost:8000`에서 실행됩니다.

### 3. 프런트엔드 설정 (React)

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```
웹 앱은 `http://localhost:5173`에서 실행됩니다.

## API 엔드포인트

- `POST /predict/single`: 단일 이미지 분석, 스타일 분류, 좌표 반환, Gemini 추천.
- `POST /predict/batch`: 다중 이미지 일괄 분석 및 통계 요약.
- `POST /convert/preview`: 이미지 썸네일 미리보기 생성 (HEIC 지원).