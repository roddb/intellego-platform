'use client'

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { motion } from 'framer-motion'
import { AnimatedCard } from './AnimatedCard'

interface ChartData {
  name: string
  value: number
  [key: string]: string | number
}

interface ProgressChartProps {
  data: ChartData[]
  title: string
  type?: 'line' | 'bar' | 'radar'
  dataKey?: string
  xAxisKey?: string
  color?: string
  delay?: number
}

export function ProgressChart({
  data,
  title,
  type = 'line',
  dataKey = 'value',
  xAxisKey = 'name',
  color = '#14b8a6',
  delay = 0
}: ProgressChartProps) {
  const chartColors = {
    primary: color,
    grid: '#e2e8f0',
    gridDark: '#475569',
    text: '#64748b',
    textDark: '#cbd5e1'
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3">
          <p className="text-slate-900 dark:text-slate-100 font-semibold">{payload[0].payload[xAxisKey]}</p>
          <p className="text-teal-600 dark:text-teal-400">
            {dataKey}: <span className="font-bold">{payload[0].value}</span>
          </p>
        </div>
      )
    }
    return null
  }

  const renderChart = () => {
    if (type === 'radar') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={data}>
            <PolarGrid stroke={chartColors.grid} className="dark:stroke-slate-600" />
            <PolarAngleAxis dataKey={xAxisKey} className="text-xs" stroke={chartColors.text} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} stroke={chartColors.text} />
            <Radar
              name={dataKey}
              dataKey={dataKey}
              stroke={chartColors.primary}
              fill={chartColors.primary}
              fillOpacity={0.6}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      )
    }

    if (type === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} className="dark:stroke-slate-700" />
            <XAxis
              dataKey={xAxisKey}
              stroke={chartColors.text}
              className="dark:stroke-slate-400 text-xs"
            />
            <YAxis
              stroke={chartColors.text}
              className="dark:stroke-slate-400 text-xs"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey={dataKey} fill={chartColors.primary} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )
    }

    // Default: line chart
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} className="dark:stroke-slate-700" />
          <XAxis
            dataKey={xAxisKey}
            stroke={chartColors.text}
            className="dark:stroke-slate-400 text-xs"
          />
          <YAxis
            stroke={chartColors.text}
            className="dark:stroke-slate-400 text-xs"
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={chartColors.primary}
            strokeWidth={3}
            dot={{ fill: chartColors.primary, r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  return (
    <AnimatedCard delay={delay} className="p-6">
      <motion.h3
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: delay + 0.1 }}
        className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4"
      >
        {title}
      </motion.h3>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.2 }}
      >
        {renderChart()}
      </motion.div>
    </AnimatedCard>
  )
}

// Specialized component for skills metrics
interface SkillsRadarProps {
  skills: {
    skill: string
    level: number
  }[]
  title?: string
  delay?: number
}

export function SkillsRadar({ skills, title = "Habilidades", delay = 0 }: SkillsRadarProps) {
  const data = skills.map(s => ({
    skill: s.skill,
    nivel: s.level
  }))

  return (
    <AnimatedCard delay={delay} className="p-6">
      <motion.h3
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: delay + 0.1 }}
        className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4"
      >
        {title}
      </motion.h3>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: delay + 0.2 }}
      >
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart data={data}>
            <PolarGrid stroke="#e2e8f0" className="dark:stroke-slate-600" />
            <PolarAngleAxis
              dataKey="skill"
              tick={{ fill: '#64748b', fontSize: 12 }}
              className="dark:fill-slate-400"
            />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b' }} />
            <Radar
              name="Nivel"
              dataKey="nivel"
              stroke="#14b8a6"
              fill="#14b8a6"
              fillOpacity={0.6}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3">
                      <p className="text-slate-900 dark:text-slate-100 font-semibold">
                        {payload[0].payload.skill}
                      </p>
                      <p className="text-teal-600 dark:text-teal-400">
                        Nivel: <span className="font-bold">{payload[0].value}/100</span>
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </motion.div>
    </AnimatedCard>
  )
}
