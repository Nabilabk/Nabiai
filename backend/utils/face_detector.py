import cv2
import numpy as np

def detect_and_crop_face(image_bytes):
    print(f"Received image bytes: {len(image_bytes)} bytes")
    
    nparr = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if frame is None: 
        print("ERROR: Could not decode image")
        return None
        
    print(f"Image decoded successfully: {frame.shape}")
    
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = cascade.detectMultiScale(gray, 1.1, 5, minSize=(60,60))
    
    print(f"Faces detected: {len(faces)}")
    
    if len(faces) == 0: 
        print("No faces found in image")
        return None
        
    x, y, w, h = max(faces, key=lambda r: r[2]*r[3])
    print(f"Using face at: x={x}, y={y}, w={w}, h={h}")
    
    roi = gray[y:y+h, x:x+w]
    roi = cv2.resize(roi, (48,48)).astype('float32')/255.0
    return np.expand_dims(roi, axis=[0,-1])
