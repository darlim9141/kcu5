import os
import json
import math
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras import layers, models, Model
from tensorflow.keras.applications import VGG16, ResNet50
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.metrics import classification_report, accuracy_score

# 전처리 함수 가져오기
from tensorflow.keras.applications.resnet50 import preprocess_input as resnet_preprocess
from tensorflow.keras.applications.vgg16 import preprocess_input as vgg_preprocess

# === 1. 설정 ===
DATA_DIR = '../image'   # 데이터셋 경로 확인 필요
IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32
VAL_SPLIT = 0.20
SEED = 42
EPOCHS = 25
CLASS_NAMES = ['casual', 'classic', 'minimal', 'street']
NUM_CLASSES = len(CLASS_NAMES)
SAVE_DIR_BASE = 'models'

# === 2. 데이터 로더 (전처리 수정됨) ===
def load_data(arch='resnet50'):
    print(f"Loading data from: {DATA_DIR} for {arch}")
    
    # 아키텍처에 맞는 전처리 함수 선택 (Rescale 1/255 사용 안함!)
    if arch == 'resnet50':
        pre_func = resnet_preprocess
    else:
        pre_func = vgg_preprocess

    datagen = ImageDataGenerator(
        preprocessing_function=pre_func,  # <--- 핵심 변경 사항
        rotation_range=20, 
        width_shift_range=0.2, 
        height_shift_range=0.2,
        shear_range=0.2, 
        zoom_range=0.2, 
        horizontal_flip=True, 
        fill_mode='nearest',
        validation_split=VAL_SPLIT
    )

    train_gen = datagen.flow_from_directory(
        DATA_DIR, 
        target_size=IMAGE_SIZE, 
        batch_size=BATCH_SIZE,
        classes=CLASS_NAMES, 
        class_mode='categorical',
        subset='training', 
        shuffle=True, 
        seed=SEED
    )

    valid_gen = datagen.flow_from_directory(
        DATA_DIR, 
        target_size=IMAGE_SIZE, 
        batch_size=BATCH_SIZE,
        classes=CLASS_NAMES, 
        class_mode='categorical',
        subset='validation', 
        shuffle=False, 
        seed=SEED
    )

    return train_gen, valid_gen

# === 3. 모델 빌더 ===
def build_model(arch='resnet50'):
    input_shape = (*IMAGE_SIZE, 3)
    
    if arch == 'vgg16':
        base = VGG16(include_top=False, weights='imagenet', input_shape=input_shape)
    else:
        base = ResNet50(include_top=False, weights='imagenet', input_shape=input_shape)

    # 파인튜닝 설정 (기존 학습된 특징을 유지하기 위해 base는 freeze)
    base.trainable = False 
    
    inputs = layers.Input(shape=input_shape)
    x = base(inputs, training=False)
    x = layers.GlobalAveragePooling2D(name='avg_pool')(x) # 이름 지정 (나중에 찾기 쉽게)
    x = layers.Dropout(0.5)(x)
    x = layers.Dense(1024, activation='relu')(x)
    outputs = layers.Dense(NUM_CLASSES, activation='softmax')(x)
    
    model = Model(inputs, outputs)

    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-4),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    return model

# === 4. 저장 및 실행 로직 ===
if __name__ == "__main__":
    # 성능이 더 좋은 ResNet50 하나에 집중
    target_arch = 'resnet50' 
    
    # 1. 데이터 로드
    train_gen, valid_gen = load_data(arch=target_arch)

    print(f"\n=== Training {target_arch.upper()} ===")
    
    # 2. 모델 생성 및 학습
    model = build_model(arch=target_arch)
    
    callbacks = [
        EarlyStopping(monitor='val_accuracy', patience=5, restore_best_weights=True)
    ]

    model.fit(
        train_gen,
        validation_data=valid_gen,
        epochs=EPOCHS,
        callbacks=callbacks
    )

    # 3. 평가
    print("\n--- Evaluation ---")
    valid_gen.reset()
    preds = model.predict(valid_gen)
    y_pred = np.argmax(preds, axis=1)
    print(classification_report(valid_gen.classes, y_pred, target_names=CLASS_NAMES))

    # 4. 모델 저장
    save_path = os.path.join(SAVE_DIR_BASE, target_arch)
    os.makedirs(save_path, exist_ok=True)
    model.save(os.path.join(save_path, 'model.keras'))
    print(f"Model saved to {save_path}/model.keras")

    # 클래스 이름 저장
    with open(os.path.join(save_path, 'class_names.json'), 'w') as f:
        json.dump(CLASS_NAMES, f)