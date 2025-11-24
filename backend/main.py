from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import numpy as np
from utils.face_detector import detect_and_crop_face

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = tf.keras.models.load_model("checkpoints/best_fer_model.keras")
EMOTIONS = ['Angry','Disgust','Fear','Happy','Sad','Surprise','Neutral']

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    data = await file.read()
    tensor = detect_and_crop_face(data)
    if tensor is None:
        raise HTTPException(400, "No face")
    pred = model.predict(tensor, verbose=0)[0]
    idx = int(np.argmax(pred))
    return {"emotion": EMOTIONS[idx], "confidence": float(pred[idx])}