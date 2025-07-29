"use client"

import React from 'react'

const GradientOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-2]">
      {/* Main gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.02) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.01) 0%, transparent 50%)
          `
        }}
      />
      
      {/* Subtle light shapes overlay */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute top-10 left-10 w-64 h-64 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%)',
            filter: 'blur(30px)'
          }}
        />
        <div 
          className="absolute bottom-20 right-20 w-48 h-48 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%)',
            filter: 'blur(25px)'
          }}
        />
      </div>
    </div>
  )
}

export default GradientOverlay