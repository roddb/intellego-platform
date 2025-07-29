"use client"

import React, { useEffect, useState } from 'react'

const LightParticles: React.FC = () => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    delay: number;
    duration: number;
    size: number;
    left: number;
    top: number;
  }>>([])

  useEffect(() => {
    // Generate particles only on client side to avoid hydration mismatch
    const newParticles = Array.from({ length: 77 }, (_, i) => ({
      id: i,
      delay: Math.random() * 20,
      duration: 15 + Math.random() * 10,
      size: 3 + Math.random() * 5,
      left: Math.random() * 100,
      top: Math.random() * 100,
    }))
    setParticles(newParticles)
  }, [])

  // Don't render anything on server side
  if (particles.length === 0) {
    return null
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -1 }}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: `radial-gradient(circle, #ffffff, rgba(255, 255, 255, 0.1))`,
            animation: `lightFloat ${particle.duration}s ease-in-out infinite`,
            animationDelay: `${particle.delay}s`,
            boxShadow: `0 0 ${particle.size * 4}px rgba(255, 255, 255, 0.6)`,
            opacity: 0.6,
          }}
        />
      ))}
    </div>
  )
}

export default LightParticles