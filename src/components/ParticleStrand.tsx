"use client"

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  baseX: number  // Original grid position
  baseY: number  // Original grid position
  size: number
  opacity: number
  delay: number
}

interface WaveConfig {
  amplitude: number
  frequency: number
  speed: number
  direction: 'horizontal' | 'vertical' | 'diagonal'
  offset: number
}

interface ParticleStrandProps {
  particleCount?: number
  connectionDistance?: number
  className?: string
}

export default function ParticleStrand({ 
  particleCount = 36, // Grid 6x6 for uniform distribution
  connectionDistance = 120,
  className = "" 
}: ParticleStrandProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number>()
  const startTimeRef = useRef<number>(Date.now())
  
  // Wave configurations for multiple overlapping waves
  const waves: WaveConfig[] = [
    { amplitude: 30, frequency: 0.02, speed: 0.002, direction: 'horizontal', offset: 0 },
    { amplitude: 20, frequency: 0.015, speed: 0.0015, direction: 'vertical', offset: Math.PI / 2 },
    { amplitude: 15, frequency: 0.025, speed: 0.001, direction: 'diagonal', offset: Math.PI }
  ]

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    // Initialize particles in a grid pattern
    const particles: Particle[] = []
    const gridSize = Math.sqrt(particleCount)
    const cellWidth = width / gridSize
    const cellHeight = height / gridSize
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const baseX = (j + 0.5) * cellWidth
        const baseY = (i + 0.5) * cellHeight
        
        particles.push({
          x: baseX,
          y: baseY,
          baseX: baseX,
          baseY: baseY,
          size: Math.random() * 2 + 3,
          opacity: Math.random() * 0.4 + 0.4,
          delay: (i * gridSize + j) * 100 // Staggered delay for wave effect
        })
      }
    }
    particlesRef.current = particles

    // Create particle elements
    particles.forEach((particle, index) => {
      const element = document.createElement('div')
      element.className = 'particle'
      element.style.cssText = `
        left: ${particle.x}px;
        top: ${particle.y}px;
        width: ${particle.size}px;
        height: ${particle.size}px;
        opacity: ${particle.opacity};
        animation-delay: ${particle.delay}ms;
        background: linear-gradient(45deg, #2d3748, #4a5568);
        box-shadow: 0 0 ${particle.size * 2}px rgba(45, 55, 72, 0.6);
      `
      container.appendChild(element)
    })

    // Create SVG for connections
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('class', 'strand-svg')
    svg.setAttribute('width', width.toString())
    svg.setAttribute('height', height.toString())
    
    // Add gradient definition
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient')
    gradient.setAttribute('id', 'waveGradient')
    gradient.setAttribute('x1', '0%')
    gradient.setAttribute('y1', '0%')
    gradient.setAttribute('x2', '100%')
    gradient.setAttribute('y2', '100%')
    
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
    stop1.setAttribute('offset', '0%')
    stop1.setAttribute('stop-color', '#4a5568')
    stop1.setAttribute('stop-opacity', '0.8')
    
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
    stop2.setAttribute('offset', '50%')
    stop2.setAttribute('stop-color', '#2d3748')
    stop2.setAttribute('stop-opacity', '0.6')
    
    const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
    stop3.setAttribute('offset', '100%')
    stop3.setAttribute('stop-color', '#1a202c')
    stop3.setAttribute('stop-opacity', '0.4')
    
    gradient.appendChild(stop1)
    gradient.appendChild(stop2)
    gradient.appendChild(stop3)
    defs.appendChild(gradient)
    svg.appendChild(defs)
    container.appendChild(svg)

    // Function to calculate wave displacement
    const calculateWavePosition = (particle: Particle, time: number) => {
      let offsetX = 0
      let offsetY = 0
      
      waves.forEach(wave => {
        const adjustedTime = time * wave.speed
        
        switch (wave.direction) {
          case 'horizontal':
            offsetY += Math.sin(particle.baseX * wave.frequency + adjustedTime + wave.offset) * wave.amplitude
            break
          case 'vertical':
            offsetX += Math.sin(particle.baseY * wave.frequency + adjustedTime + wave.offset) * wave.amplitude
            break
          case 'diagonal':
            const diagonalPos = (particle.baseX + particle.baseY) * 0.5
            offsetX += Math.sin(diagonalPos * wave.frequency + adjustedTime + wave.offset) * wave.amplitude * 0.7
            offsetY += Math.cos(diagonalPos * wave.frequency + adjustedTime + wave.offset) * wave.amplitude * 0.7
            break
        }
      })
      
      return {
        x: particle.baseX + offsetX,
        y: particle.baseY + offsetY
      }
    }

    // Animation loop
    const animate = () => {
      const currentTime = Date.now() - startTimeRef.current
      const elements = container.querySelectorAll('.particle')
      
      particles.forEach((particle, index) => {
        // Calculate new position based on wave functions
        const newPos = calculateWavePosition(particle, currentTime + particle.delay)
        particle.x = newPos.x
        particle.y = newPos.y
        
        // Calculate wave height for visual effects
        const waveHeight = Math.abs(Math.sin(currentTime * 0.001 + particle.delay * 0.001))
        const dynamicOpacity = 0.3 + waveHeight * 0.5
        const dynamicSize = particle.size * (0.8 + waveHeight * 0.4)

        // Update element position and properties
        const element = elements[index] as HTMLElement
        if (element) {
          element.style.left = `${particle.x}px`
          element.style.top = `${particle.y}px`
          element.style.opacity = dynamicOpacity.toString()
          element.style.width = `${dynamicSize}px`
          element.style.height = `${dynamicSize}px`
        }
      })

      // Draw connections
      svg.innerHTML = ''
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < connectionDistance) {
            const opacity = (1 - distance / connectionDistance) * 0.3
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
            
            // Create wave-influenced curved path
            const midX = (particles[i].x + particles[j].x) / 2
            const midY = (particles[i].y + particles[j].y) / 2
            const waveInfluence = Math.sin(Date.now() * 0.002) * 10
            
            const pathData = `M ${particles[i].x} ${particles[i].y} Q ${midX + waveInfluence} ${midY + waveInfluence} ${particles[j].x} ${particles[j].y}`
            
            path.setAttribute('d', pathData)
            path.setAttribute('stroke', `rgba(74, 85, 104, ${opacity})`)
            path.setAttribute('stroke-width', '1')
            path.setAttribute('fill', 'none')
            path.setAttribute('class', 'strand-path')
            
            svg.appendChild(path)
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      container.innerHTML = ''
    }
  }, [particleCount, connectionDistance])

  return (
    <div 
      ref={containerRef}
      className={`particle-strand-container ${className}`}
    />
  )
}