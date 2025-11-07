# back/model_utils.py
import numpy as np
from tensorflow.keras.preprocessing import image

def predict_single_image(model, src, class_names, target_size=(224,224)):
    """
    하나의 이미지를 받아서 모델이 어떤 클래스인지 예측합니다.
    반환값은 JSON(dict) 형태입니다.
    """
    # 업로드된 파일(Flask) 또는 파일 경로 모두 처리 가능
    if hasattr(src, "read"):
        img = image.load_img(src, target_size=target_size)
    else:
        img = image.load_img(str(src), target_size=target_size)

    # numpy array 변환 + 전처리
    x = image.img_to_array(img)
    x = np.expand_dims(x, 0) / 255.0

    # 예측 수행
    probs = model.predict(x, verbose=0)[0]
    label = class_names[int(np.argmax(probs))]

    # 결과 JSON 형태로 반환
    return {
        "label": label,
        "probs": {class_names[i]: float(p) for i, p in enumerate(probs)}
    }
