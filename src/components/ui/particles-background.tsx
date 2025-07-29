"use client"

import { useEffect } from 'react'

export default function ParticlesBackground() {
  useEffect(() => {
    // Create particle container
    const container = document.createElement('div')
    container.className = 'fixed inset-0 pointer-events-none overflow-hidden'
    container.style.zIndex = '-1' // Behind everything
    document.body.appendChild(container)

    // Create particles
    const particleCount = 25
    const particles: HTMLElement[] = []

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div')
      particle.className = 'absolute rounded-full bg-teal-400/20'
      
      // Random size and position
      const size = Math.random() * 4 + 2
      particle.style.width = `${size}px`
      particle.style.height = `${size}px`
      particle.style.left = `${Math.random() * 100}%`
      particle.style.top = `${Math.random() * 100}%`
      
      // CSS animation
      particle.style.animation = `float ${10 + Math.random() * 20}s infinite linear`
      particle.style.animationDelay = `${Math.random() * 10}s`
      
      container.appendChild(particle)
      particles.push(particle)
    }

    // Add CSS animation keyframes
    if (!document.getElementById('particles-style')) {
      const style = document.createElement('style')
      style.id = 'particles-style'
      style.textContent = `
        @keyframes float {
          0% { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: 0; }
          10% { opacity: 0.4; }
          90% { opacity: 0.4; }
          100% { transform: translateY(-100vh) translateX(50px) rotate(360deg); opacity: 0; }
        }
      `
      document.head.appendChild(style)
    }

    // Cleanup function
    return () => {
      if (container && container.parentNode) {
        container.parentNode.removeChild(container)
      }
    }
  }, [])

  return null // This component doesn't render anything directly
}