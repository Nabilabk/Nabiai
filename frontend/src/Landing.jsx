import { motion } from 'framer-motion'
import { Play, Users, Film, Clapperboard } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import CurtainOpening from './components/CurtainOpening'

export default function Landing() {
  const [curtainComplete, setCurtainComplete] = useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{
      background: 'radial-gradient(ellipse at center, #1a0000 0%, #0a0a0a 50%, #000000 100%)'
    }}>
      {/* Curtain Opening Animation */}
      <CurtainOpening onComplete={() => setCurtainComplete(true)} />

      {/* Subtle Spotlight Effects */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 left-1/3 w-[600px] h-[600px] rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)'
          }}
        />
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, delay: 4 }}
          className="absolute bottom-1/4 right-1/3 w-[600px] h-[600px] rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(139,0,0,0.2) 0%, transparent 70%)'
          }}
        />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-center max-w-5xl relative z-10"
      >
        <motion.h1
          className="text-9xl md:text-[12rem] font-bold mb-8 leading-none"
          style={{
            fontFamily: '"Bebas Neue", sans-serif',
            background: 'linear-gradient(180deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 60px rgba(255, 215, 0, 0.4))'
          }}
        >
          ACTING AI
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-2xl md:text-3xl text-gray-400 mb-16 tracking-wide"
          style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 300 }}
        >
          Master the art of emotion through AI
        </motion.p>

        <div className="flex flex-col md:flex-row gap-6 justify-center">
          <Link to="/solo">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="px-16 py-5 rounded-lg font-bold text-xl flex items-center justify-center gap-3 relative overflow-hidden group"
              style={{
                fontFamily: '"Bebas Neue", sans-serif',
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                boxShadow: '0 10px 40px rgba(255, 215, 0, 0.3)',
                color: '#000'
              }}
            >
              <Play size={28} fill="#000" />
              SOLO MODE
              <motion.div
                className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20"
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          </Link>

          <Link to="/multi">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="px-16 py-5 rounded-lg font-bold text-xl flex items-center justify-center gap-3 relative overflow-hidden group"
              style={{
                fontFamily: '"Bebas Neue", sans-serif',
                background: 'linear-gradient(135deg, #8B0000 0%, #DC143C 100%)',
                boxShadow: '0 10px 40px rgba(139, 0, 0, 0.4)',
                color: '#fff'
              }}
            >
              <Users size={28} />
              MULTIPLAYER
              <motion.div
                className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10"
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          </Link>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-20 text-gray-600 text-sm tracking-widest"
        >
          CREATED BY <span className="text-gold">NABIAI</span>
        </motion.p>
      </motion.div>
    </div>
  )
}