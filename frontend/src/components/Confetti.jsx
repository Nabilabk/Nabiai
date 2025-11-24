import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function Confetti({ show, color = 'gold' }) {
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        if (show) {
            // Generate random particles
            const newParticles = Array.from({ length: 30 }, (_, i) => ({
                id: i,
                x: Math.random() * 100,
                y: -10,
                rotation: Math.random() * 360,
                delay: Math.random() * 0.3,
                duration: 1 + Math.random() * 0.5,
                size: 8 + Math.random() * 8,
            }));
            setParticles(newParticles);
        }
    }, [show]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    className={`absolute bg-${color} rounded-full`}
                    style={{
                        left: `${particle.x}%`,
                        width: particle.size,
                        height: particle.size,
                    }}
                    initial={{
                        y: particle.y,
                        opacity: 1,
                        rotate: 0,
                    }}
                    animate={{
                        y: window.innerHeight + 50,
                        opacity: 0,
                        rotate: particle.rotation,
                    }}
                    transition={{
                        duration: particle.duration,
                        delay: particle.delay,
                        ease: 'easeIn',
                    }}
                />
            ))}
        </div>
    );
}

