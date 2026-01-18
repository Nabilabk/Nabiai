// TrainingMode.jsx - Professional Clean Version with Cinematic Difficulty Badges
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, RotateCcw, Eye, Clock, Target, Zap, ArrowLeft, Volume2, VolumeX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { soundManager } from './utils/soundManager'
import Confetti from './components/Confetti'

// FastAPI backend URL
const BACKEND_URL = window.location.hostname === 'localhost' 
  ? 'http://127.0.0.1:8000'
  : 'https://your-production-backend-url.com'

// Cinema-style emotion guides
const EMOTION_GUIDES = {
  Happy: {
    tips: ["Smile with both mouth and eyes", "Raise cheeks slightly", "Let joy radiate from your eyes"],
    practiceTime: 5000,
    difficulty: "Easy",
    icon: "😊",
    description: "The art of genuine happiness"
  },
  Sad: {
    tips: ["Droop eyelids gently", "Pull mouth corners down", "Let sorrow flow naturally"],
    practiceTime: 6000,
    difficulty: "Medium", 
    icon: "😢",
    description: "The depth of melancholy"
  },
  Angry: {
    tips: ["Furrow brow with intensity", "Narrow eyes sharply", "Tense jaw muscles"],
    practiceTime: 4000,
    difficulty: "Hard",
    icon: "😠",
    description: "The fire of righteous fury"
  },
  Surprise: {
    tips: ["Raise eyebrows dramatically", "Open mouth naturally", "Widen eyes with wonder"],
    practiceTime: 3000,
    difficulty: "Easy",
    icon: "😲",
    description: "The art of genuine astonishment"
  },
  Fear: {
    tips: ["Raise eyebrows with tension", "Open eyes wide", "Tense mouth corners"],
    practiceTime: 5000,
    difficulty: "Medium",
    icon: "😨",
    description: "The essence of vulnerability"
  },
  Disgust: {
    tips: ["Wrinkle nose subtly", "Raise upper lip", "Squint eyes with distaste"],
    practiceTime: 4000,
    difficulty: "Hard",
    icon: "🤢",
    description: "The sophistication of distaste"
  },
  Neutral: {
    tips: ["Relax all facial muscles", "Maintain natural expression", "Breathe normally"],
    practiceTime: 3000,
    difficulty: "Easy",
    icon: "😐",
    description: "The foundation of all emotions"
  }
}

export default function TrainingMode() {
  const [selectedEmotion, setSelectedEmotion] = useState(null)
  const [trainingPhase, setTrainingPhase] = useState('select')
  const [practiceScore, setPracticeScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [timer, setTimer] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)
  
  const videoRef = useRef(null)
  const visibleVideoRef = useRef(null)
  const canvasRef = useRef(null)
  const timerRef = useRef(null)
  const streamRef = useRef(null)

  // Initialize camera
  const initCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      
    } catch (err) {
      console.error("Camera error:", err)
    }
  }

  useEffect(() => {
    initCamera()
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (trainingPhase === 'practice' && visibleVideoRef.current && streamRef.current) {
      visibleVideoRef.current.srcObject = streamRef.current
    }
  }, [trainingPhase])

  const startTraining = (emotion) => {
    setSelectedEmotion(emotion)
    setTrainingPhase('guide')
    setPracticeScore(0)
    setAttempts(0)
  }

  const startPractice = () => {
    if (!videoRef.current) {
      alert('Camera not ready. Please ensure camera access is allowed.')
      return
    }

    setTrainingPhase('practice')
    setIsRecording(true)
    setTimer(EMOTION_GUIDES[selectedEmotion].practiceTime / 1000)
    
    if (timerRef.current) clearInterval(timerRef.current)
    
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          analyzePerformance()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const analyzePerformance = async () => {
    setTrainingPhase('analyze')
    setIsRecording(false)
    
    const canvas = canvasRef.current
    const video = videoRef.current
    
    if (!video || !canvas) {
      setAnalysis({
        score: 0,
        feedback: "Camera not available.",
        detectedEmotion: "Error",
        confidence: 0,
        improvements: EMOTION_GUIDES[selectedEmotion]?.tips || [],
        targetEmotion: selectedEmotion,
        isDemoMode: true
      })
      return
    }
    
    let videoWidth = 640
    let videoHeight = 480
    
    if (video.videoWidth && video.videoHeight) {
      videoWidth = video.videoWidth
      videoHeight = video.videoHeight
    }
    
    canvas.width = videoWidth
    canvas.height = videoHeight
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      setAnalysis({
        score: 0,
        feedback: "Technical error.",
        detectedEmotion: "Error",
        confidence: 0,
        improvements: EMOTION_GUIDES[selectedEmotion]?.tips || [],
        targetEmotion: selectedEmotion,
        isDemoMode: true
      })
      return
    }
    
    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    } catch (err) {
      console.error("Error drawing video:", err)
    }
    
    try {
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          blob ? resolve(blob) : reject(new Error('Failed to create blob'))
        }, 'image/jpeg', 0.8)
      })

      const form = new FormData()
      form.append('file', blob, 'frame.jpg')

      const res = await fetch(`${BACKEND_URL}/predict`, { 
        method: 'POST', 
        body: form,
        signal: AbortSignal.timeout(8000)
      })
      
      if (res.ok) {
        const data = await res.json()
        processAnalysisResult(data, true)
      } else {
        throw new Error('Backend error')
      }
      
    } catch (err) {
      console.log("Using demo mode")
      const demoResult = generateDemoResult()
      processAnalysisResult(demoResult, false)
    }
  }

  const processAnalysisResult = (data, isRealBackend) => {
    const targetEmotion = selectedEmotion
    const detectedEmotion = data.emotion || data.predicted_emotion || 'Unknown'
    const confidence = data.confidence || data.probability || 0
    
    let score = 0
    let feedback = ""
    let improvements = []
    
    if (detectedEmotion.toLowerCase() === targetEmotion.toLowerCase()) {
      if (confidence >= 0.85) {
        score = 100
        feedback = "🎭 OSCAR-WORTHY! Pure cinema magic!"
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)
        soundManager.playPerfect?.()
      } else if (confidence >= 0.70) {
        score = 85
        feedback = "🌟 BROADWAY STAR! Brilliant performance!"
        soundManager.playCorrect?.()
      } else if (confidence >= 0.55) {
        score = 70
        feedback = "🎬 SOLID ACTING! You're getting there!"
        soundManager.playCorrect?.()
      } else if (confidence >= 0.40) {
        score = 55
        feedback = "💫 SHOWING POTENTIAL! Keep practicing!"
        soundManager.playCorrect?.()
      } else {
        score = 40
        feedback = "🎭 NEEDS MORE EMOTION! Dig deeper!"
        soundManager.playWrong?.()
      }
    } else {
      score = Math.max(0, confidence * 25)
      feedback = `🎬 WRONG EMOTION! You showed ${detectedEmotion}. Focus on ${targetEmotion} features.`
      improvements = EMOTION_GUIDES[targetEmotion].tips
      soundManager.playWrong?.()
    }
    
    setPracticeScore(score)
    setAttempts(prev => prev + 1)
    if (score > bestScore) setBestScore(score)
    
    setAnalysis({
      score,
      feedback,
      detectedEmotion,
      confidence,
      improvements,
      targetEmotion,
      isDemoMode: !isRealBackend
    })
  }

  const generateDemoResult = () => {
    const emotions = Object.keys(EMOTION_GUIDES)
    const targetEmotion = selectedEmotion
    const isCorrect = Math.random() < 0.7
    const detectedEmotion = isCorrect ? targetEmotion : emotions.find(e => e !== targetEmotion) || 'Neutral'
    const confidence = isCorrect ? Math.random() * 0.4 + 0.6 : Math.random() * 0.3
    
    return {
      emotion: detectedEmotion,
      confidence: confidence,
      predicted_emotion: detectedEmotion,
      probability: confidence
    }
  }

  const resetTraining = () => {
    setTrainingPhase('select')
    setSelectedEmotion(null)
    setAnalysis(null)
    clearInterval(timerRef.current)
    setShowConfetti(false)
  }

  return (
    <div className="min-h-screen p-4 md:p-6 relative overflow-hidden" style={{
      background: 'radial-gradient(ellipse at top, #1a0000 0%, #0a0a0a 50%, #000000 100%)'
    }}>
      <Confetti show={showConfetti} />

      <Link to="/" className="fixed top-4 md:top-6 left-4 md:left-6 z-50">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="px-4 py-2 rounded-lg flex items-center gap-2"
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <ArrowLeft className="text-white" size={20} />
          <span className="text-white font-bold text-sm hidden sm:inline">BACK</span>
        </motion.div>
      </Link>

      <button
        onClick={() => {
          const newState = soundManager.toggle()
          setSoundEnabled(newState)
        }}
        className="fixed top-4 md:top-6 right-4 md:right-6 z-50"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="p-3 rounded-lg"
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: soundEnabled ? '#FFD700' : '#666'
          }}
        >
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </motion.div>
      </button>

      <div className="max-w-6xl mx-auto pt-16 md:pt-0">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 md:mb-12"
        >
          <motion.h1 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4"
            style={{
              fontFamily: '"Bebas Neue", sans-serif',
              background: 'linear-gradient(180deg, #FFD700 0%, #FFA500 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 30px rgba(255, 215, 0, 0.5))'
            }}
          >
            ACTING STUDIO
          </motion.h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-400 tracking-wide px-2">Master emotional expression through immersive practice</p>
        </motion.div>

        <div className="fixed top-0 left-0 -z-50 opacity-0 w-1 h-1 overflow-hidden">
          <video ref={videoRef} autoPlay muted playsInline />
          <canvas ref={canvasRef} />
        </div>

        <AnimatePresence mode="wait">
          {trainingPhase === 'select' && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="mb-8 md:mb-12 px-2"
            >
              <motion.h2 
                className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8"
                style={{ fontFamily: '"Bebas Neue", sans-serif', color: '#FFD700' }}
              >
                CHOOSE YOUR EMOTION
              </motion.h2>
              
              {/* Responsive emotion grid */}
              <div className="space-y-6 md:space-y-8">
                {/* First row - 4 on desktop, 2 per row on mobile */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {['Happy', 'Sad', 'Angry', 'Surprise'].map((emotion, index) => {
                    const guide = EMOTION_GUIDES[emotion]
                    return (
                      <motion.button
                        key={emotion}
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => startTraining(emotion)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative group overflow-hidden rounded-xl md:rounded-2xl border border-gold/20 bg-gradient-to-br from-gray-900 to-black p-4 md:p-6 text-white transition-all duration-300 hover:border-gold/50 hover:shadow-xl md:hover:shadow-2xl hover:shadow-gold/20 min-h-[140px] md:min-h-[180px]"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        <div className="text-center relative z-10 h-full flex flex-col justify-between">
                          <div>
                            <div className="text-3xl md:text-4xl mb-2 md:mb-3">{guide.icon}</div>
                            <div className="text-lg md:text-xl font-bold mb-1 md:mb-2" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
                              {emotion}
                            </div>
                            <div className="text-xs text-gray-400 hidden md:block">{guide.description}</div>
                          </div>
                          
                          {/* Original filmstrip-style difficulty badge */}
                          <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                            guide.difficulty === 'Easy' ? 'border-green-400/50 text-green-400' :
                            guide.difficulty === 'Medium' ? 'border-yellow-400/50 text-yellow-400' :
                            'border-red-400/50 text-red-400'
                          }`}>
                            {guide.difficulty}
                          </div>
                        </div>

                        <motion.div
                          className="absolute inset-0 border-2 border-gold/0 rounded-xl md:rounded-2xl"
                          whileHover={{ borderColor: 'rgba(255, 215, 0, 0.5)' }}
                          transition={{ duration: 0.3 }}
                        />
                      </motion.button>
                    )
                  })}
                </div>
                
                {/* Second row - 3 centered on desktop, 2 per row on mobile */}
                <div className="grid grid-cols-2 md:flex md:justify-center gap-4 md:gap-6">
                  {['Fear', 'Disgust', 'Neutral'].map((emotion, index) => {
                    const guide = EMOTION_GUIDES[emotion]
                    return (
                      <motion.button
                        key={emotion}
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => startTraining(emotion)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className={`relative group overflow-hidden rounded-xl md:rounded-2xl border border-gold/20 bg-gradient-to-br from-gray-900 to-black p-4 md:p-6 text-white transition-all duration-300 hover:border-gold/50 hover:shadow-xl md:hover:shadow-2xl hover:shadow-gold/20 min-h-[140px] md:min-h-[180px]
                          ${index === 2 ? 'md:col-span-1' : ''}
                          ${index === 2 ? 'md:w-[200px]' : ''}
                        `}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        <div className="text-center relative z-10 h-full flex flex-col justify-between">
                          <div>
                            <div className="text-3xl md:text-4xl mb-2 md:mb-3">{guide.icon}</div>
                            <div className="text-lg md:text-xl font-bold mb-1 md:mb-2" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
                              {emotion}
                            </div>
                            <div className="text-xs text-gray-400 hidden md:block">{guide.description}</div>
                          </div>
                          
                          {/* Original filmstrip-style difficulty badge */}
                          <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                            guide.difficulty === 'Easy' ? 'border-green-400/50 text-green-400' :
                            guide.difficulty === 'Medium' ? 'border-yellow-400/50 text-yellow-400' :
                            'border-red-400/50 text-red-400'
                          }`}>
                            {guide.difficulty}
                          </div>
                        </div>

                        <motion.div
                          className="absolute inset-0 border-2 border-gold/0 rounded-xl md:rounded-2xl"
                          whileHover={{ borderColor: 'rgba(255, 215, 0, 0.5)' }}
                          transition={{ duration: 0.3 }}
                        />
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {trainingPhase === 'guide' && selectedEmotion && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="mb-8 md:mb-12"
            >
              <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-gold/30 bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4 md:p-8 shadow-xl md:shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-purple/5" />
                
                <div className="relative z-10">
                  <div className="text-center mb-6 md:mb-8">
                    <motion.h2 
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-3xl md:text-5xl font-bold mb-4"
                      style={{
                        fontFamily: '"Bebas Neue", sans-serif',
                        background: 'linear-gradient(180deg, #FFD700 0%, #FFA500 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
                      MASTERING {selectedEmotion.toUpperCase()}
                    </motion.h2>
                    <p className="text-gray-400 text-base md:text-lg">{EMOTION_GUIDES[selectedEmotion].description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-black/50 rounded-xl md:rounded-2xl p-4 md:p-6 border border-gold/20"
                    >
                      <h3 className="text-xl md:text-2xl text-white mb-4 flex items-center gap-2">
                        <Target className="text-gold" size={20} /> 
                        DIRECTOR'S NOTES
                      </h3>
                      <ul className="space-y-3 md:space-y-4">
                        {EMOTION_GUIDES[selectedEmotion].tips.map((tip, index) => (
                          <motion.li
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                            className="text-gray-300 flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg text-sm md:text-base"
                          >
                            <span className="text-gold mt-1 font-bold">{index + 1}.</span>
                            {tip}
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-black/50 rounded-xl md:rounded-2xl p-4 md:p-6 border border-gold/20"
                    >
                      <h3 className="text-xl md:text-2xl text-white mb-4 flex items-center gap-2">
                        <Clock className="text-gold" size={20} /> 
                        SCENE DETAILS
                      </h3>
                      <div className="space-y-3 md:space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                          <span className="text-gray-400 text-sm md:text-base">Duration</span>
                          <span className="text-gold font-bold text-sm md:text-base">{EMOTION_GUIDES[selectedEmotion].practiceTime/1000}s</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                          <span className="text-gray-400 text-sm md:text-base">Difficulty</span>
                          <span className={`font-bold text-sm md:text-base ${
                            EMOTION_GUIDES[selectedEmotion].difficulty === 'Easy' ? 'text-green-400' :
                            EMOTION_GUIDES[selectedEmotion].difficulty === 'Medium' ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {EMOTION_GUIDES[selectedEmotion].difficulty}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                          <span className="text-gray-400 text-sm md:text-base">Attempts</span>
                          <span className="text-white font-bold text-sm md:text-base">{attempts}</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={startPractice}
                      className="px-6 md:px-10 py-3 md:py-4 rounded-lg md:rounded-xl font-bold text-lg md:text-xl relative overflow-hidden group"
                      style={{
                        fontFamily: '"Bebas Neue", sans-serif',
                        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                        color: '#000',
                        boxShadow: '0 10px 40px rgba(255, 215, 0, 0.4)'
                      }}
                    >
                      <div className="relative z-10 flex items-center justify-center gap-2">
                        <Play size={20} fill="#000" />
                        START SCENE
                      </div>
                      <motion.div
                        className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20"
                        transition={{ duration: 0.3 }}
                      />
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={resetTraining}
                      className="px-6 md:px-10 py-3 md:py-4 bg-gray-800/80 backdrop-blur-sm border border-gray-600/50 text-white rounded-lg md:rounded-xl font-bold text-lg md:text-xl relative overflow-hidden group"
                      style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                    >
                      <div className="relative z-10 flex items-center justify-center gap-2">
                        <RotateCcw size={20} />
                        CHANGE SCENE
                      </div>
                      <motion.div
                        className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10"
                        transition={{ duration: 0.3 }}
                      />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {trainingPhase === 'practice' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-gold/30 bg-gradient-to-br from-gray-900 to-black p-4 md:p-8 shadow-xl md:shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-purple/10" />
                
                <div className="relative z-10">
                  <motion.h2 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl md:text-5xl font-bold mb-6"
                    style={{
                      fontFamily: '"Bebas Neue", sans-serif',
                      background: 'linear-gradient(180deg, #FFD700 0%, #FFA500 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    SCENE: {selectedEmotion}
                  </motion.h2>

                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="text-6xl md:text-8xl font-bold text-white mb-8"
                    style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                  >
                    {timer}s
                  </motion.div>

                  <div className="relative max-w-lg mx-auto mb-6 md:mb-8">
                    <div className="relative rounded-xl md:rounded-2xl overflow-hidden border-2 md:border-4 border-gold/30 shadow-xl md:shadow-2xl bg-black">
                      <video 
                        ref={visibleVideoRef} 
                        autoPlay 
                        muted 
                        playsInline 
                        className="w-full"
                        style={{
                          minHeight: '300px',
                          objectFit: 'cover',
                          background: '#000'
                        }}
                      />
                      
                      {isRecording && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute top-2 md:top-4 right-2 md:right-4 flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-full font-bold text-xs md:text-sm backdrop-blur-sm"
                          style={{
                            background: 'rgba(220, 20, 60, 0.9)',
                            color: '#fff'
                          }}
                        >
                          <motion.div
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-2 h-2 bg-white rounded-full"
                          />
                          REC
                        </motion.div>
                      )}
                    </div>
                    
                    <div className="absolute top-0 left-0 w-8 h-8 md:w-12 md:h-12 border-t-2 md:border-t-4 border-l-2 md:border-l-4 border-gold/50" />
                    <div className="absolute top-0 right-0 w-8 h-8 md:w-12 md:h-12 border-t-2 md:border-t-4 border-r-2 md:border-r-4 border-gold/50" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 md:w-12 md:h-12 border-b-2 md:border-b-4 border-l-2 md:border-l-4 border-gold/50" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 md:w-12 md:h-12 border-b-2 md:border-b-4 border-r-2 md:border-r-4 border-gold/50" />
                  </div>

                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-gray-400 text-base md:text-lg mb-6"
                  >
                    "Channel your inner {selectedEmotion}... Action!"
                  </motion.p>
                </div>
              </div>
            </motion.div>
          )}

          {trainingPhase === 'analyze' && analysis && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative"
            >
              <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-gold/30 bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4 md:p-8 shadow-xl md:shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-purple/10" />
                
                <div className="relative z-10">
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-6 md:mb-8"
                  >
                    <h2 className="text-3xl md:text-5xl font-bold mb-4"
                      style={{
                        fontFamily: '"Bebas Neue", sans-serif',
                        background: 'linear-gradient(180deg, #FFD700 0%, #FFA500 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
                      SCENE REVIEW
                    </h2>
                    
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 15, delay: 0.2 }}
                      className="text-7xl md:text-9xl font-bold mb-4"
                      style={{
                        color: analysis.score >= 85 ? '#10B981' : 
                               analysis.score >= 70 ? '#F59E0B' : '#EF4444',
                        fontFamily: '"Bebas Neue", sans-serif',
                        filter: 'drop-shadow(0 0 20px currentColor)'
                      }}
                    >
                      {analysis.score}%
                    </motion.div>
                    
                    <p className="text-xl md:text-2xl text-white font-bold">{analysis.feedback}</p>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-black/50 rounded-xl md:rounded-2xl p-4 md:p-6 border border-gold/20"
                    >
                      <h3 className="text-xl md:text-2xl text-white mb-4 flex items-center gap-2">
                        <Eye className="text-gold" size={20} /> 
                        PERFORMANCE ANALYSIS
                      </h3>
                      
                      <div className="space-y-3 md:space-y-4">
                        <div className="flex justify-between items-center p-3 md:p-4 bg-gray-800/50 rounded-lg">
                          <span className="text-gray-400 text-sm md:text-base">Target Emotion</span>
                          <span className="text-gold font-bold text-sm md:text-lg">{analysis.targetEmotion}</span>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 md:p-4 bg-gray-800/50 rounded-lg">
                          <span className="text-gray-400 text-sm md:text-base">Detected Emotion</span>
                          <span className="text-white font-bold text-sm md:text-lg">{analysis.detectedEmotion}</span>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm text-gray-400 mb-2">
                            <span>Confidence Level</span>
                            <span>{(analysis.confidence * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-3 md:h-4 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${analysis.confidence * 100}%` }}
                              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-gold"
                              transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    
                    {analysis.improvements.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-black/50 rounded-xl md:rounded-2xl p-4 md:p-6 border border-gold/20"
                      >
                        <h3 className="text-xl md:text-2xl text-white mb-4 flex items-center gap-2">
                          <Target className="text-gold" size={20} /> 
                          DIRECTOR'S NOTES
                        </h3>
                        <ul className="space-y-2 md:space-y-3">
                          {analysis.improvements.map((tip, index) => (
                            <motion.li
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.4 + index * 0.1 }}
                              className="text-gray-300 flex items-start gap-2 md:gap-3 p-2 md:p-3 bg-gray-800/50 rounded-lg text-sm md:text-base"
                            >
                              <span className="text-gold font-bold text-sm">{index + 1}.</span>
                              {tip}
                            </motion.li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={startPractice}
                      className="px-6 md:px-10 py-3 md:py-4 rounded-lg md:rounded-xl font-bold text-lg md:text-xl relative overflow-hidden group"
                      style={{
                        fontFamily: '"Bebas Neue", sans-serif',
                        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                        color: '#000',
                        boxShadow: '0 10px 40px rgba(255, 215, 0, 0.4)'
                      }}
                    >
                      <div className="relative z-10 flex items-center justify-center gap-2">
                        <Zap className="inline" size={20} />
                        RETAKE SCENE
                      </div>
                      <motion.div
                        className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20"
                        transition={{ duration: 0.3 }}
                      />
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={resetTraining}
                      className="px-6 md:px-10 py-3 md:py-4 bg-gray-800/80 backdrop-blur-sm border border-gray-600/50 text-white rounded-lg md:rounded-xl font-bold text-lg md:text-xl relative overflow-hidden group"
                      style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                    >
                      <div className="relative z-10 flex items-center justify-center gap-2">
                        <RotateCcw className="inline" size={20} />
                        NEW SCENE
                      </div>
                      <motion.div
                        className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10"
                        transition={{ duration: 0.3 }}
                      />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}