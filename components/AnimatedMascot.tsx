'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function AnimatedMascot() {
  return (
    <div className="relative w-64 h-64">
      {/* Main Orb - "Aura" Character */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          y: [0, -20, 0],
          rotate: [0, 5, 0, -5, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Outer Glow */}
        <motion.div
          className="absolute w-64 h-64 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Main Body - Glassmorphism */}
        <motion.div
          className="relative w-48 h-48 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(147, 51, 234, 0.3) 100%)',
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), inset 0 0 20px rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Inner Shine */}
          <motion.div
            className="absolute inset-4 rounded-full bg-gradient-to-br from-white/20 to-transparent"
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          {/* Face - Eyes */}
          <div className="relative z-10 flex flex-col items-center gap-8">
            <div className="flex gap-8">
              {/* Left Eye */}
              <motion.div
                className="w-6 h-12 bg-white rounded-full"
                animate={{
                  scaleY: [1, 0.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
              />
              
              {/* Right Eye */}
              <motion.div
                className="w-6 h-12 bg-white rounded-full"
                animate={{
                  scaleY: [1, 0.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
              />
            </div>

            {/* Smile - Optional */}
            <motion.div
              className="w-16 h-8 border-b-4 border-white rounded-b-full"
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>

          {/* Sparkle Effect */}
          <motion.div
            className="absolute -top-2 -right-2"
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            <Sparkles className="w-6 h-6 text-primary" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Floating Particles Around */}
      {[...Array(8)].map((_, i) => {
        const angle = (i * 360) / 8;
        const radius = 100;
        const x = Math.cos((angle * Math.PI) / 180) * radius;
        const y = Math.sin((angle * Math.PI) / 180) * radius;

        return (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/60"
            style={{
              left: '50%',
              top: '50%',
            }}
            animate={{
              x: [0, x, 0],
              y: [0, y, 0],
              opacity: [0.3, 1, 0.3],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2,
            }}
          />
        );
      })}

      {/* Bottom Shadow */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-4 bg-black/20 rounded-full blur-xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
}
