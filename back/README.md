# 👕 Fashion Analysis AI Server

이 프로젝트는 패션 이미지를 분석하여 **스타일 분류(Classification)**와 **3D 시각화 좌표(Coordinates)**를 제공하는 AI 백엔드 서버입니다.
프론트엔드 팀원들의 이해를 돕기 위해 **서버의 구조와 코드 흐름**을 정리했습니다.

---

## 📚 목차
1. [기술 스택 및 개념 이해 (FastAPI란?)](#1-기술-스택-및-개념-이해-fastapi란)
2. [백엔드 구조: 관심사의 분리](#2-백엔드-구조-관심사의-분리)
3. [코드 상세 분석 (main.py)](#3-코드-상세-분석-mainpy)
4. [API 사용 가이드](#4-api-사용-가이드)

---

## 1. 기술 스택 및 개념 이해 (FastAPI란?)

우리는 **FastAPI**라는 파이썬 웹 프레임워크를 사용합니다.

### 🚀 FastAPI의 역할: "웨이터"
AI 모델은 맛있는 요리를 만드는 **'주방'**과 같고, 사용자는 **'손님'**입니다. 손님이 주방에 직접 들어갈 수 없으므로, **FastAPI(웨이터)**가 중간에서 주문을 받고 요리를 서빙합니다.

1. **Client (프론트엔드):** 이미지 파일을 서버로 보냅니다 (**Request**).
2. **Server (FastAPI):** 이미지를 받아 AI 모델로 분석합니다.
3. **Response:** 분석 결과(스타일, 좌표)를 JSON으로 돌려줍니다.

---

## 2. 백엔드 구조: "관심사의 분리"

코드를 한곳에 몰아넣지 않고, 역할에 따라 3가지 계층으로 나누었습니다. (회사 조직도와 비슷합니다!)

| 계층 (Layer) | 역할 | 비유 |
| :--- | :--- | :--- |
| **API 계층** | 요청을 받고 응답을 주는 창구 (`Endpoints`) | **안내 데스크** |
| **로직 계층** | 실제 이미지 처리 및 AI 분석 (`Functions`) | **실무 전문가** |
| **리소스 계층** | 모델 로딩 및 서버 설정 (`Lifespan`) | **시설 관리팀** |

---

## 3. 코드 상세 분석 (`app.py`)

실제 코드의 주요 부분이 어떤 역할을 하는지 설명합니다.

### ① 리소스 계층: 서버 준비 (Lifespan)
서버가 켜질 때 **딱 한 번** 실행됩니다. 무거운 AI 모델을 미리 켜두어 응답 속도를 높입니다.

```python
# 전역 변수: 모델을 담아둘 빈 상자
ai_models: Dict[str, Any] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_all_models() # 1. 서버 켤 때: 모델 로딩 (오래 걸림)
    yield
    ai_models.clear() # 2. 서버 끌 때: 정리
```

### ② 로직 계층: 요리사 (Helper Functions)
실제 데이터를 처리하는 핵심 함수들입니다.

* `process_image(image_bytes)`: 이미지를 받아 **배경을 제거**하고, AI가 이해할 수 있는 숫자로 변환합니다.
* `analyze_single_image(img_processed)`: 변환된 이미지를 모델에 넣어 **스타일**과 **좌표(x,y,z)**를 분석합니다.

### ③ API 계층: 주문 창구 (Endpoints)
프론트엔드에서 실제로 호출하는 주소입니다.

```python
@app.post("/predict/single")
async def predict_single(file: UploadFile = File(...)):
    # 1. 파일 읽기
    contents = await file.read()
    # 2. 전처리 (배경 제거 등)
    processed_img = process_image(contents)
    # 3. AI 분석
    result = analyze_single_image(processed_img)
    # 4. 결과 반환 (JSON)
    return result
```

---

## 4. API 사용 가이드

프론트엔드에서 요청을 보낼 때 참고하세요.

### 📍 1. 단일 이미지 분석
* **URL:** `POST /predict/single`
* **Body:** `FormData` (Key: `file`, Value: 이미지 파일)
* **Response (JSON):**
    ```json
    {
      "classification": {
        "category": "Casual",
        "confidence": 98.5
      },
      "kmeans": {
        "cluster_id": 3,
        "coordinates": { "x": 0.1, "y": -0.5, "z": 1.2 }
      }
    }
    ```

### 📍 2. 다중 이미지 분석 (Batch)
* **URL:** `POST /predict/batch`
* **Body:** `FormData` (Key: `files` - 여러 개 선택)
* **Response:** 전체 요약(`summary`)과 개별 결과(`individual_results`)를 포함합니다.

---
