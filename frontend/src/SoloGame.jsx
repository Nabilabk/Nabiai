import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, ArrowLeft, Star, Zap, Trophy, Volume2, VolumeX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { soundManager } from './utils/soundManager'
import Confetti from './components/Confetti'

const EMOTIONS = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']

const LEVELS = [
    { level: 1, name: "Débutant", targetScore: 300, combo: 1, time: 4 },
    { level: 2, name: "Acteur", targetScore: 300, combo: 2, time: 5 },
    { level: 3, name: "Star", targetScore: 300, combo: 3, time: 6 },
    { level: 4, name: "Légende", targetScore: 300, combo: 4, time: 7 }
]

const MESSAGES = {
    perfect: ["OSCAR-WORTHY!", "BROADWAY STAR!", "GENIUS!"],
    good: ["SOLID!", "NICE!", "ALMOST PERFECT!"],
    meh: ["OKAY...", "NEEDS MORE!", "TRY HARDER!"],
    wrong: ["NOPE!", "WRONG EMOTION!", "HAHA NO!"]
}

export default function SoloGame() {
    const [score, setScore] = useState(0)
    const [level, setLevel] = useState(1)
    const [round, setRound] = useState(0)
    const [targets, setTargets] = useState([])
    const [currentTargetIndex, setCurrentTargetIndex] = useState(0)
    const [gameState, setGameState] = useState('ready')
    const [countdown, setCountdown] = useState(3)
    const [feedback, setFeedback] = useState(null)
    const [streak, setStreak] = useState(0)
    const [roundScore, setRoundScore] = useState(0)
    const [gameComplete, setGameComplete] = useState(false)
    const [totalRounds, setTotalRounds] = useState(0)
    const [bestStreak, setBestStreak] = useState(0)
    const [totalScore, setTotalScore] = useState(0)
    const [soundEnabled, setSoundEnabled] = useState(true)
    const [showConfetti, setShowConfetti] = useState(false)
    const [screenShake, setScreenShake] = useState(false)
    const [showLevelComplete, setShowLevelComplete] = useState(false)
    const videoRef = useRef()
    const canvasRef = useRef()
    const timerRef = useRef(null)
    const captureTimerRef = useRef(null) // ADD CAPTURE TIMER REF
    const targetsRef = useRef([])
    const currentIndexRef = useRef(0)
    const processingRef = useRef(false) // ADD PROCESSING LOCK
    const gameStateRef = useRef('ready') // ADD GAME STATE REF
    const targetScoresRef = useRef([]) // TRACK INDIVIDUAL TARGET SCORES

    const currentLevel = LEVELS[level - 1] || LEVELS[0] // Fix: Use level-1 as array index

    // DEBUG: Track level changes
    useEffect(() => {
        console.log("🔥 LEVEL CHANGED TO:", level);
        console.log("🎯 Current level object:", currentLevel);
        console.log("📊 Current score:", score);
        console.log("🎪 Target score needed:", currentLevel.targetScore);
    }, [level]);

    // DEBUG: Track score changes  
    useEffect(() => {
        console.log("💰 SCORE CHANGED TO:", score);
        if (score >= currentLevel.targetScore) {
            console.log("⚠️ SCORE EXCEEDS TARGET! Should level up!");
        }
    }, [score]);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                if (videoRef.current) videoRef.current.srcObject = stream
            })
    }, [])

    const setGameStateWithLog = (newState) => {
        console.log("🎮 GAME STATE CHANGE:", gameState, "->", newState, "at", Date.now());
        console.trace("Stack trace for game state change");
        setGameState(newState);
        gameStateRef.current = newState; // UPDATE REF
    };

    const startRound = () => {
        const newTargets = Array(currentLevel.combo).fill().map(() =>
            EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)]
        )
        console.log("=== STARTROUND DEBUG ===");
        console.log("NEW TARGETS CREATED:", newTargets);

        setTargets(newTargets)
        targetsRef.current = newTargets

        setCurrentTargetIndex(0)
        currentIndexRef.current = 0
        targetScoresRef.current = [] // RESET TARGET SCORES

        setRound(r => r + 1)
        setTotalRounds(r => r + 1)
        setGameStateWithLog('countdown')
        setCountdown(3)

        // CLEAR ALL EXISTING TIMERS
        if (timerRef.current) clearInterval(timerRef.current)
        if (captureTimerRef.current) clearTimeout(captureTimerRef.current)
        
        timerRef.current = setInterval(() => {
            setCountdown(c => {
                console.log("⏰ COUNTDOWN:", c);
                if (c <= 1) {
                    clearInterval(timerRef.current)
                    soundManager.playCountdownGo(); // GO sound
                    console.log("🎬 COUNTDOWN FINISHED - SETTING GAME STATE TO 'acting'");
                    setGameStateWithLog('acting')
                    console.log("⏰ SCHEDULING FIRST CAPTURE in", currentLevel.time, "seconds");
                    captureTimerRef.current = setTimeout(capture, currentLevel.time * 1000)
                    return 3
                } else {
                    soundManager.playCountdown(); // Beep sound
                }
                return c - 1
            })
        }, 1000)
    }

    const capture = async () => {
        if (!videoRef.current || !canvasRef.current) return
        
        console.log("📸 CAPTURE CALLED - Game state:", gameState);
        console.log("📸 Processing ref:", processingRef.current);
        
        // PREVENT CAPTURE IF ALREADY PROCESSING
        if (processingRef.current) {
            console.log("🚫 CAPTURE BLOCKED - Already processing");
            return;
        }
        
        // SAFETY CHECK: Don't capture if we're out of bounds
        const currentTargets = targetsRef.current;
        if (!currentTargets || currentIndexRef.current >= currentTargets.length) {
            console.error("CAPTURE STOPPED: Out of bounds!", currentIndexRef.current, currentTargets.length);
            return;
        }
        
        const canvas = canvasRef.current
        const video = videoRef.current
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        canvas.getContext('2d').drawImage(video, 0, 0)
        const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg'))
        const form = new FormData()
        form.append('file', blob, 'frame.jpg')

        try {
            const res = await fetch('/predict', { method: 'POST', body: form })
            if (!res.ok) throw new Error("Predict failed")
            const data = await res.json()
            console.log("📡 PREDICTION RECEIVED:", data, "Game state:", gameState);
            handleResult(data)
        } catch (err) {
            console.error("Predict error:", err)
            setFeedback({ emotion: "NO FACE", confidence: 0, pts: 0, msg: "Show your face!" })
            setTimeout(() => {
                setFeedback(null)
                console.log("STOPPING CAPTURE DUE TO ERROR");
                setGameStateWithLog('ready');
            }, 3000)
        }
    }

    const handleResult = ({ emotion, confidence }) => {
        // PREVENT DUPLICATE PROCESSING
        if (processingRef.current) {
            console.log("🚫 DUPLICATE CALL BLOCKED - Already processing");
            return;
        }
        
        processingRef.current = true; // LOCK
        
        const currentTargets = targetsRef.current;
        const currentIndex = currentIndexRef.current;
        
        console.log("🚨 === HANDLE RESULT CALLED ===");
        console.log("🎯 Current emotion detected:", emotion);
        console.log("📊 Confidence:", confidence);
        console.log("🎪 Current index from REF:", currentIndex);
        console.log("🎭 Current target:", currentTargets[currentIndex]);
        console.log("⏰ Timestamp:", Date.now());
        console.log("🎮 Game state:", gameState);
        
        if (!currentTargets || currentIndex >= currentTargets.length) {
            console.error("HANDLE RESULT STOPPED: Out of bounds!", currentIndex, currentTargets.length);
            processingRef.current = false; // UNLOCK
            console.log("🔄 CHANGING GAME STATE TO 'ready' - OUT OF BOUNDS");
            setGameStateWithLog('ready');
            return;
        }

        const target = currentTargets[currentIndex];

        if (!target) {
            console.error("TARGET IS UNDEFINED!");
            processingRef.current = false; // UNLOCK
            console.log("🔄 CHANGING GAME STATE TO 'ready' - NO TARGET");
            setGameStateWithLog('ready');
            return;
        }
        
        const detected = emotion.toString().trim().charAt(0).toUpperCase() + emotion.toString().trim().slice(1).toLowerCase();
        const normalizedTarget = target.toString().trim().charAt(0).toUpperCase() + target.toString().trim().slice(1).toLowerCase();
        
        const match = detected === normalizedTarget;
        console.log("🎯 MATCH CHECK:", detected, "vs", normalizedTarget, "=", match);

        let pts = 0;
        let key = 'wrong';
        let newStreak = 0;

        if (match) {
            if (confidence >= 0.60) {
                pts = 100;
                key = 'perfect';
                newStreak = streak + 1;
                soundManager.playPerfect(); // Perfect sound
                setShowConfetti(true); // Show confetti
                setTimeout(() => setShowConfetti(false), 2000);
            }
            else if (confidence >= 0.45) {
                pts = 75;
                key = 'good';
                newStreak = streak + 1;
                soundManager.playCorrect(); // Good sound
            }
            else if (confidence >= 0.30) {
                pts = 50;
                key = 'meh';
                newStreak = 0;
                soundManager.playCorrect(); // Meh sound
            }
            else if (confidence >= 0.20) {
                pts = 25;
                key = 'meh';
                newStreak = 0;
                soundManager.playCorrect(); // Meh sound
            }
        } else {
            // WRONG EMOTION = GAME OVER
            newStreak = 0;
            console.log("❌ WRONG EMOTION - ENDING ROUND");
            soundManager.playWrong(); // Wrong sound
            setScreenShake(true); // Shake screen
            setTimeout(() => setScreenShake(false), 500);

            setStreak(0);
            const msg = MESSAGES[key][Math.floor(Math.random() * MESSAGES[key].length)];
            setFeedback({
                emotion: detected,
                confidence,
                pts: 0,
                msg,
                isLast: true // Mark as last to end round
            });
            
            setTimeout(() => {
                setRoundScore(0);
                setFeedback(null);
                console.log("🔄 CHANGING GAME STATE TO 'ready' - WRONG EMOTION");
                setGameStateWithLog('ready');
                processingRef.current = false;
                currentIndexRef.current = 0;
                targetScoresRef.current = []; // RESET SCORES
            }, 2000);
            return; // EXIT EARLY
        }

        if (newStreak >= 3) {
            pts += 50;
            soundManager.playStreak(); // Streak bonus sound
        }

        // STORE INDIVIDUAL TARGET SCORE
        targetScoresRef.current.push(pts);
        console.log("📊 Target scores so far:", targetScoresRef.current);

        // CALCULATE CURRENT AVERAGE FOR DISPLAY
        const currentAverage = targetScoresRef.current.reduce((a, b) => a + b, 0) / targetScoresRef.current.length;
        setRoundScore(Math.round(currentAverage));
        setStreak(newStreak);

        // Track best streak
        if (newStreak > bestStreak) {
            setBestStreak(newStreak);
        }

        const msg = MESSAGES[key][Math.floor(Math.random() * MESSAGES[key].length)];
        setFeedback({
            emotion: detected,
            confidence,
            pts,
            msg,
            isLast: currentIndex === currentTargets.length - 1
        });

        // Next target logic
        if (currentIndex < currentTargets.length - 1) {
            console.log("🔄 MOVING TO NEXT TARGET:", currentIndex, "->", currentIndex + 1);
            const nextIndex = currentIndex + 1;
            
            // UPDATE BOTH STATE AND REF
            setCurrentTargetIndex(nextIndex);
            currentIndexRef.current = nextIndex;
            
            setTimeout(() => {
                setFeedback(null);
                processingRef.current = false; // UNLOCK BEFORE NEXT CAPTURE
                console.log("🔓 UNLOCKED - Game state ref:", gameStateRef.current);
                if (gameStateRef.current === 'acting') {
                    console.log("🎬 SCHEDULING NEXT CAPTURE...");
                    captureTimerRef.current = setTimeout(capture, currentLevel.time * 1000);
                } else {
                    console.log("❌ NOT SCHEDULING - Game state is:", gameStateRef.current);
                }
            }, 2000);
        } else {
            console.log("🏁 ROUND FINISHED! STOPPING CAPTURE LOOP");

            // CALCULATE AVERAGE SCORE FOR THE ROUND
            const averageScore = targetScoresRef.current.reduce((a, b) => a + b, 0) / targetScoresRef.current.length;
            const roundFinalScore = Math.round(averageScore);
            console.log("📊 All target scores:", targetScoresRef.current);
            console.log("📊 Average score for round:", roundFinalScore);

            const finalScore = score + roundFinalScore;
            setScore(finalScore);
            setRoundScore(roundFinalScore);
            console.log("🔄 CHANGING GAME STATE TO 'ready' - ROUND FINISHED");
            setGameStateWithLog('ready');

            // Reset refs
            currentIndexRef.current = 0;
            processingRef.current = false; // UNLOCK
            
            // Level up logic...
            if (finalScore >= currentLevel.targetScore && level < LEVELS.length) {
                const nextLevel = level + 1;

                // First show the feedback for 2 seconds
                setTimeout(() => {
                    setFeedback(null); // Hide feedback
                    soundManager.playLevelUp(); // Level up sound
                    setShowConfetti(true); // Show confetti
                    setShowLevelComplete(true); // Show full-screen level complete

                    // Then show level complete for 4 seconds
                    setTimeout(() => {
                        setShowConfetti(false);
                        setShowLevelComplete(false);
                        setLevel(nextLevel);
                        setScore(0);
                        setRoundScore(0);
                        setTargets([]);
                        setCurrentTargetIndex(0);
                        targetsRef.current = [];
                        currentIndexRef.current = 0;
                        targetScoresRef.current = []; // RESET SCORES
                        setRound(0);
                        console.log("🔄 CHANGING GAME STATE TO 'ready' - LEVEL UP COMPLETE");
                        setGameStateWithLog('ready');
                    }, 4000);
                }, 2000);
            } else if (finalScore >= currentLevel.targetScore && level === LEVELS.length) {
                // GAME COMPLETE - VICTORY!
                console.log("🏆 GAME COMPLETE! VICTORY!");
                soundManager.playVictory(); // Victory sound
                setTotalScore(finalScore);
                setTimeout(() => {
                    setGameComplete(true);
                    setGameStateWithLog('victory');
                }, 2000);
            } else {
                setTimeout(() => {
                    setRoundScore(0);
                    setFeedback(null);
                    targetScoresRef.current = []; // RESET SCORES
                    console.log("🔄 CHANGING GAME STATE TO 'ready' - ROUND COMPLETE");
                    setGameStateWithLog('ready');
                }, 2000);
            }
        }
    };

    const restartGame = () => {
        setGameComplete(false);
        setLevel(1);
        setScore(0);
        setRound(0);
        setTotalRounds(0);
        setBestStreak(0);
        setTotalScore(0);
        setStreak(0);
        setRoundScore(0);
        setTargets([]);
        setCurrentTargetIndex(0);
        setFeedback(null);
        targetsRef.current = [];
        currentIndexRef.current = 0;
        targetScoresRef.current = [];
        processingRef.current = false;
        setGameStateWithLog('ready');
    };

    // VICTORY SCREEN
    if (gameComplete) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-cinema to-purple-900 p-6 flex items-center justify-center relative overflow-hidden">
                {/* Confetti for Victory */}
                <Confetti show={true} color="yellow-400" />

                {/* Animated Background Stars */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 opacity-20"
                >
                    <div className="text-9xl absolute top-10 left-10">⭐</div>
                    <div className="text-9xl absolute top-20 right-20">🎭</div>
                    <div className="text-9xl absolute bottom-20 left-20">🏆</div>
                    <div className="text-9xl absolute bottom-10 right-10">✨</div>
                </motion.div>

                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", duration: 1 }}
                    className="bg-gray-900 border-4 border-gold rounded-3xl p-12 max-w-2xl w-full text-center shadow-2xl relative z-10"
                    style={{
                        boxShadow: '0 0 50px rgba(255, 215, 0, 0.5)'
                    }}
                >
                    {/* Animated Trophy */}
                    <motion.div
                        animate={{
                            rotate: [0, 10, -10, 0],
                            scale: [1, 1.1, 1]
                        }}
                        transition={{
                            rotate: { repeat: Infinity, duration: 2 },
                            scale: { repeat: Infinity, duration: 1.5 }
                        }}
                    >
                        <Trophy className="text-gold mx-auto mb-6" size={120} />
                    </motion.div>

                    {/* Victory Title with Gradient */}
                    <motion.h1
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-7xl font-bold mb-4"
                        style={{
                            background: 'linear-gradient(45deg, #FFD700, #FFA500, #FFD700)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            textShadow: '0 0 30px rgba(255, 215, 0, 0.5)'
                        }}
                    >
                        VICTORY!
                    </motion.h1>
                    <motion.p
                        initial={{ y: -30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-4xl text-white mb-8"
                    >
                        🎭 EMOTION MASTER! 🎭
                    </motion.p>

                    <div className="bg-gray-800 rounded-2xl p-6 mb-8">
                        <h2 className="text-2xl text-gold mb-4">FINAL STATS</h2>
                        <div className="grid grid-cols-2 gap-4 text-left">
                            <div className="bg-gray-700 p-4 rounded-xl">
                                <p className="text-gray-400 text-sm">Total Score</p>
                                <p className="text-3xl font-bold text-gold">{totalScore}</p>
                            </div>
                            <div className="bg-gray-700 p-4 rounded-xl">
                                <p className="text-gray-400 text-sm">Rounds Played</p>
                                <p className="text-3xl font-bold text-white">{totalRounds}</p>
                            </div>
                            <div className="bg-gray-700 p-4 rounded-xl">
                                <p className="text-gray-400 text-sm">Best Streak</p>
                                <p className="text-3xl font-bold text-purple-400">{bestStreak}</p>
                            </div>
                            <div className="bg-gray-700 p-4 rounded-xl">
                                <p className="text-gray-400 text-sm">Levels Completed</p>
                                <p className="text-3xl font-bold text-green-400">{LEVELS.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={restartGame}
                            className="bg-gold text-cinema px-8 py-4 rounded-full font-bold text-xl hover:scale-105 transition shadow-lg flex items-center gap-2"
                        >
                            <Play size={24} /> PLAY AGAIN
                        </button>
                        <Link to="/">
                            <button className="bg-gray-700 text-white px-8 py-4 rounded-full font-bold text-xl hover:scale-105 transition shadow-lg flex items-center gap-2">
                                <ArrowLeft size={24} /> MENU
                            </button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <motion.div
            className="min-h-screen p-6 relative overflow-hidden"
            animate={screenShake ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.5 }}
            style={{
                background: 'radial-gradient(ellipse at top, #1a0000 0%, #0a0a0a 50%, #000000 100%)'
            }}
        >
            {/* Confetti Effect */}
            <Confetti show={showConfetti} />

            {/* Subtle Ambient Light */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 6, repeat: Infinity }}
                    className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl"
                    style={{
                        background: 'radial-gradient(circle, rgba(255,215,0,0.2) 0%, transparent 70%)'
                    }}
                />
            </div>

            {/* LEVEL COMPLETE OVERLAY */}
            <AnimatePresence>
                {showLevelComplete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
                    >
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", duration: 1, bounce: 0.5 }}
                            className="text-center"
                        >
                            {/* Glowing Star Burst */}
                            <motion.div
                                animate={{
                                    rotate: 360,
                                    scale: [1, 1.2, 1]
                                }}
                                transition={{
                                    rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                                    scale: { duration: 1.5, repeat: Infinity }
                                }}
                                className="text-9xl mb-6"
                            >
                                ⭐
                            </motion.div>

                            {/* Level Complete Text */}
                            <motion.h1
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-8xl font-bold mb-4"
                                style={{
                                    background: 'linear-gradient(45deg, #FFD700, #FFA500, #FFD700)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    textShadow: '0 0 30px rgba(255, 215, 0, 0.5)'
                                }}
                            >
                                LEVEL COMPLETE!
                            </motion.h1>

                            {/* Level Name */}
                            <motion.p
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-5xl text-white mb-8"
                            >
                                {currentLevel.name} Mastered! 🎭
                            </motion.p>

                            {/* Stats */}
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                className="flex gap-8 justify-center text-2xl"
                            >
                                <div className="bg-gold/20 px-6 py-3 rounded-xl border-2 border-gold">
                                    <p className="text-gray-400">Score</p>
                                    <p className="text-gold font-bold text-4xl">{score}</p>
                                </div>
                                <div className="bg-purple-500/20 px-6 py-3 rounded-xl border-2 border-purple-400">
                                    <p className="text-gray-400">Rounds</p>
                                    <p className="text-purple-400 font-bold text-4xl">{round}</p>
                                </div>
                                <div className="bg-green-500/20 px-6 py-3 rounded-xl border-2 border-green-400">
                                    <p className="text-gray-400">Streak</p>
                                    <p className="text-green-400 font-bold text-4xl">{bestStreak}</p>
                                </div>
                            </motion.div>

                            {/* Next Level Preview */}
                            <motion.p
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.9 }}
                                className="text-3xl text-yellow-400 mt-8"
                            >
                                Next: Level {level + 1} - {LEVELS[level]?.name || 'Final'} 🚀
                            </motion.p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Link to="/" className="fixed top-6 left-6 z-50">
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
                    <span className="text-white font-bold text-sm">BACK</span>
                </motion.div>
            </Link>

            {/* Sound Toggle Button */}
            <button
                onClick={() => {
                    const newState = soundManager.toggle();
                    setSoundEnabled(newState);
                }}
                className="fixed top-6 right-6 z-50"
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
                    {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
                </motion.div>
            </button>

            <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{
                    fontFamily: '"Bebas Neue", sans-serif',
                    background: 'linear-gradient(180deg, #FFD700 0%, #FFA500 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    LEVEL {level} — {currentLevel.name}
                </h1>
                <div className="flex justify-center gap-2 mb-4">
                    {LEVELS.map((_, i) => (
                        <div
                            key={i}
                            className="w-16 h-1.5 rounded-full transition-all duration-300"
                            style={{
                                background: i < level ? 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)' : 'rgba(255, 255, 255, 0.1)'
                            }}
                        />
                    ))}
                </div>
                <p className="text-lg text-gray-400">
                    Score: <span className="text-gold font-bold">{score}</span> / {currentLevel.targetScore}
                </p>
                {streak > 0 && (
                    <p className="text-gold flex items-center justify-center gap-1 mt-2">
                        <Zap size={18} /> STREAK x{streak}
                    </p>
                )}
            </div>

            <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6 relative z-10">
                <div className="md:col-span-2">
                    <div className="relative rounded-2xl overflow-hidden" style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(20px)',
                        border: '2px solid rgba(255, 215, 0, 0.2)',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
                    }}>
                        {/* Minimal Frame Corners */}
                        <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 z-20" style={{ borderColor: '#FFD700' }}></div>
                        <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 z-20" style={{ borderColor: '#FFD700' }}></div>
                        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 z-20" style={{ borderColor: '#FFD700' }}></div>
                        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 z-20" style={{ borderColor: '#FFD700' }}></div>

                        {/* Recording indicator */}
                        {gameState === 'acting' && (
                            <motion.div
                                animate={{ opacity: [1, 0.6, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="absolute top-4 right-4 px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-2 z-20"
                                style={{
                                    background: 'rgba(220, 20, 60, 0.9)',
                                    color: '#fff'
                                }}
                            >
                                <div className="w-2 h-2 bg-white rounded-full" />
                                REC
                            </motion.div>
                        )}

                        <video ref={videoRef} autoPlay muted playsInline className="w-full" />
                        <canvas ref={canvasRef} className="hidden" />

                        {gameState === 'countdown' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90 z-10">
                                <motion.div key={countdown} initial={{ scale: 2 }} animate={{ scale: 1 }} className="text-9xl font-bold text-yellow-400">
                                    {countdown}
                                </motion.div>
                            </motion.div>
                        )}

                        {gameState === 'acting' && (
                            <>
                                {/* Emotion Target */}
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="absolute bottom-6 left-6 px-8 py-4 rounded-xl font-bold text-3xl"
                                    style={{
                                        fontFamily: '"Bebas Neue", sans-serif',
                                        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                                        color: '#000',
                                        boxShadow: '0 10px 40px rgba(255, 215, 0, 0.4)'
                                    }}
                                >
                                    {targets[currentTargetIndex]}
                                </motion.div>

                                {/* Take Counter */}
                                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg font-bold text-sm"
                                    style={{
                                        background: 'rgba(0, 0, 0, 0.7)',
                                        color: '#FFD700',
                                        border: '1px solid rgba(255, 215, 0, 0.3)'
                                    }}
                                >
                                    {currentTargetIndex + 1}/{targets.length}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Score Display */}
                    <div className="rounded-xl p-6 text-center" style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 215, 0, 0.2)'
                    }}>
                        <div className="text-7xl font-bold mb-2" style={{
                            background: 'linear-gradient(180deg, #FFD700 0%, #FFA500 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>{score}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-4">Total Score</div>
                        <div className="space-y-2 pt-4 border-t border-gray-800">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Round</span>
                                <span className="text-white font-bold">{round}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Streak</span>
                                <span className="text-gold font-bold flex items-center gap-1">
                                    <Zap size={14} /> {streak}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="rounded-xl p-6 text-center" style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 215, 0, 0.2)'
                    }}>
                        <h3 className="text-2xl font-bold mb-4" style={{
                            fontFamily: '"Bebas Neue", sans-serif',
                            color: '#FFD700'
                        }}>
                            {gameState === 'ready' ? 'READY?' : `${targets[currentTargetIndex] || ''}`}
                        </h3>
                        {gameState === 'ready' && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startRound}
                                className="w-full px-6 py-3 rounded-lg font-bold text-lg flex items-center justify-center gap-2"
                                style={{
                                    fontFamily: '"Bebas Neue", sans-serif',
                                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                                    color: '#000'
                                }}
                            >
                                <Play size={20} fill="#000" />
                                START
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>

            <div
  key={score + '-' + Date.now()}
  className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-xl shadow-2xl text-sm font-mono z-50"
>

</div>

            <AnimatePresence>
                {feedback && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-gray-900 border-4 border-yellow-400 rounded-3xl p-10 text-center max-w-md">
                            {feedback.isLevelUp ? (
                                <>
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="text-8xl mb-4"
                                    >
                                        🏆
                                    </motion.div>
                                    <h2 className="text-6xl font-bold text-gold mb-4">LEVEL COMPLETE!</h2>
                                    <p className="text-3xl text-green-400 mb-4">{feedback.msg}</p>
                                    <p className="text-2xl text-yellow-400">NEXT LEVEL UNLOCKED!</p>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-6xl font-bold text-yellow-400 mb-4">{feedback.emotion}</h2>

                                    {/* Confidence Meter */}
                                    <div className="w-full max-w-md mx-auto mb-4">
                                        <div className="flex justify-between text-sm text-gray-400 mb-2">
                                            <span>Confidence</span>
                                            <span>{(feedback.confidence * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full h-6 bg-gray-700 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${feedback.confidence * 100}%` }}
                                                transition={{ duration: 0.5, ease: "easeOut" }}
                                                className={`h-full ${
                                                    feedback.confidence >= 0.6 ? 'bg-green-500' :
                                                    feedback.confidence >= 0.45 ? 'bg-yellow-500' :
                                                    feedback.confidence >= 0.3 ? 'bg-orange-500' :
                                                    'bg-red-500'
                                                }`}
                                            />
                                        </div>
                                    </div>

                                    <p className="text-4xl font-bold text-red-600 mb-2">{feedback.msg}</p>
                                    <p className="text-2xl text-yellow-400">+{feedback.pts} pts</p>
                                    {feedback.isLast && <p className="text-gold mt-4 text-xl">ROUND TERMINÉ !</p>}
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}