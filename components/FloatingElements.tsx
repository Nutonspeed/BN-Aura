'use client';

import { motion } from 'framer-motion';

// Fixed particle positions to avoid hydration mismatch
const PARTICLE_POSITIONS = [
  { top: '15%', left: '10%' },
  { top: '35%', left: '85%' },
  { top: '55%', left: '25%' },
  { top: '75%', left: '70%' },
  { top: '25%', left: '50%' },
];

export default function FloatingElements() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Floating Sphere 1 - Top Right */}
      <motion.div
        className="absolute top-20 right-20 w-64 h-64 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 blur-3xl"
        animate={{
          y: [0, -30, 0],
          x: [0, 20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Floating Sphere 2 - Bottom Left */}
      <motion.div
        className="absolute bottom-20 left-20 w-80 h-80 rounded-full bg-gradient-to-br from-blue-500/15 to-primary/15 blur-3xl"
        animate={{
          y: [0, 40, 0],
          x: [0, -25, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />

      {/* Floating Sphere 3 - Center */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-3xl"
        animate={{
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />

      {/* Small Particles - Using fixed positions */}
      {PARTICLE_POSITIONS.map((pos, i) => (
        <motion.div
          key={i}
          className="absolute w-4 h-4 rounded-full bg-primary/30"
          style={{
            top: pos.top,
            left: pos.left,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 5 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5
          }}
        />
      ))}

      {/* Glassmorphism Orb - Top Left */}
      <motion.div
        className="absolute top-40 left-40 w-48 h-48 rounded-full"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        }}
        animate={{
          y: [0, -20, 0],
          x: [0, 15, 0],
          rotate: [0, 10, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <motion.div
          className="absolute inset-4 rounded-full bg-gradient-to-br from-white/10 to-transparent"
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </motion.div>

      {/* Glassmorphism Orb - Bottom Right */}
      <motion.div
        className="absolute bottom-40 right-40 w-56 h-56 rounded-full"
        style={{
          background: 'rgba(59, 130, 246, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          boxShadow: '0 8px 32px 0 rgba(59, 130, 246, 0.2)',
        }}
        animate={{
          y: [0, 30, 0],
          x: [0, -20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5
        }}
      >
        <motion.div
          className="absolute inset-6 rounded-full bg-gradient-to-br from-primary/20 to-transparent"
          animate={{
            rotate: [0, -360],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </motion.div>
    </div>
  );
}