'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { ReactNode } from 'react'
import clsx from 'clsx'

interface AnimatedCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  className?: string
  delay?: number
  hover?: boolean
  gradient?: boolean
}

export function AnimatedCard({
  children,
  className,
  delay = 0,
  hover = true,
  gradient = false,
  ...props
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.22, 1, 0.36, 1] // Custom easing for smooth animation
      }}
      whileHover={hover ? {
        y: -4,
        transition: { duration: 0.2 }
      } : undefined}
      className={clsx(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700',
        'shadow-sm hover:shadow-md dark:shadow-gray-900/30 transition-shadow duration-300',
        gradient && 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Variante para cards con glow effect
export function GlowCard({
  children,
  className,
  color = 'teal',
  delay = 0,
  ...props
}: AnimatedCardProps & { color?: 'teal' | 'blue' | 'purple' | 'green' | 'orange' }) {
  const glowColors = {
    teal: 'hover:shadow-teal-500/20',
    blue: 'hover:shadow-blue-500/20',
    purple: 'hover:shadow-purple-500/20',
    green: 'hover:shadow-green-500/20',
    orange: 'hover:shadow-orange-500/20',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.22, 1, 0.36, 1]
      }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className={clsx(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700',
        'shadow-lg hover:shadow-xl dark:shadow-gray-900/50 transition-all duration-300',
        glowColors[color],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Variante para listas con stagger
export function AnimatedList({
  children,
  className,
  staggerDelay = 0.1
}: {
  children: ReactNode[]
  className?: string
  staggerDelay?: number
}) {
  return (
    <div className={className}>
      {Array.isArray(children) && children.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.4,
            delay: index * staggerDelay,
            ease: [0.22, 1, 0.36, 1]
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  )
}
