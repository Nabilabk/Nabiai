import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

export default function CurtainOpening({ onComplete }) {
    const [showCurtain, setShowCurtain] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowCurtain(false)
            setTimeout(() => {
                if (onComplete) onComplete()
            }, 2000)
        }, 1500)

        return () => clearTimeout(timer)
    }, [onComplete])

    return (
        <AnimatePresence>
            {showCurtain && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="fixed inset-0 z-[100]"
                    style={{ background: '#000' }}
                >
                    {/* Left Curtain Panel */}
                    <motion.div
                        initial={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ duration: 2, ease: [0.43, 0.13, 0.23, 0.96] }}
                        className="absolute top-0 left-0 bottom-0 w-1/2"
                        style={{
                            background: 'linear-gradient(to right, #4a0a1a 0%, #8B1538 20%, #a01850 40%, #8B1538 60%, #4a0a1a 100%)',
                            boxShadow: 'inset -40px 0 80px rgba(0,0,0,0.8), inset 0 0 100px rgba(255,182,193,0.1)'
                        }}
                    >
                        {/* Realistic Fabric Folds */}
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute top-0 bottom-0"
                                style={{
                                    left: `${i * 5}%`,
                                    width: '5%',
                                    background: i % 2 === 0
                                        ? 'linear-gradient(to right, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.4) 100%)'
                                        : 'linear-gradient(to right, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.05) 100%)',
                                    boxShadow: i % 2 === 0 ? 'inset 2px 0 4px rgba(0,0,0,0.5)' : 'inset -2px 0 4px rgba(255,255,255,0.1)'
                                }}
                            />
                        ))}

                        {/* Gold Rope Edge */}
                        <div
                            className="absolute top-0 bottom-0 right-0 w-3"
                            style={{
                                background: 'linear-gradient(to bottom, #DAA520 0%, #FFD700 50%, #DAA520 100%)',
                                boxShadow: '-2px 0 8px rgba(218, 165, 32, 0.8), inset -1px 0 2px rgba(0,0,0,0.3)'
                            }}
                        />
                    </motion.div>

                    {/* Right Curtain Panel */}
                    <motion.div
                        initial={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ duration: 2, ease: [0.43, 0.13, 0.23, 0.96] }}
                        className="absolute top-0 right-0 bottom-0 w-1/2"
                        style={{
                            background: 'linear-gradient(to left, #4a0a1a 0%, #8B1538 20%, #a01850 40%, #8B1538 60%, #4a0a1a 100%)',
                            boxShadow: 'inset 40px 0 80px rgba(0,0,0,0.8), inset 0 0 100px rgba(255,182,193,0.1)'
                        }}
                    >
                        {/* Realistic Fabric Folds */}
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute top-0 bottom-0"
                                style={{
                                    left: `${i * 5}%`,
                                    width: '5%',
                                    background: i % 2 === 0
                                        ? 'linear-gradient(to right, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.4) 100%)'
                                        : 'linear-gradient(to right, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.05) 100%)',
                                    boxShadow: i % 2 === 0 ? 'inset 2px 0 4px rgba(0,0,0,0.5)' : 'inset -2px 0 4px rgba(255,255,255,0.1)'
                                }}
                            />
                        ))}

                        {/* Gold Rope Edge */}
                        <div
                            className="absolute top-0 bottom-0 left-0 w-3"
                            style={{
                                background: 'linear-gradient(to bottom, #DAA520 0%, #FFD700 50%, #DAA520 100%)',
                                boxShadow: '2px 0 8px rgba(218, 165, 32, 0.8), inset 1px 0 2px rgba(0,0,0,0.3)'
                            }}
                        />
                    </motion.div>

                    {/* Top Valance */}
                    <div
                        className="absolute top-0 left-0 right-0 h-32 z-10"
                        style={{
                            background: 'linear-gradient(to bottom, #4a0a1a 0%, #8B1538 50%, #a01850 100%)',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.9), inset 0 -20px 40px rgba(255,182,193,0.1)'
                        }}
                    >
                        {/* Scalloped Bottom Edge */}
                        <div className="absolute bottom-0 left-0 right-0 flex">
                            {[...Array(30)].map((_, i) => (
                                <div
                                    key={i}
                                    className="flex-1"
                                    style={{
                                        height: '20px',
                                        background: '#8B1538',
                                        borderRadius: '0 0 50% 50%',
                                        boxShadow: '0 4px 8px rgba(0,0,0,0.5)'
                                    }}
                                />
                            ))}
                        </div>

                        {/* Gold Trim */}
                        <div
                            className="absolute bottom-0 left-0 right-0 h-2"
                            style={{
                                background: 'linear-gradient(to right, #DAA520 0%, #FFD700 50%, #DAA520 100%)',
                                boxShadow: '0 2px 8px rgba(218, 165, 32, 0.8)'
                            }}
                        />
                    </div>

                    {/* Dramatic Spotlight */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.4, 0.2] }}
                        transition={{ duration: 1.5 }}
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: 'radial-gradient(ellipse at center, rgba(255,248,220,0.3) 0%, rgba(255,215,0,0.1) 30%, transparent 70%)'
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    )
}

