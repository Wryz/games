'use client'

import type { CategoryRadarAxis } from '@/lib/radar'

interface CategoryRadarProps {
  axes: CategoryRadarAxis[]
  selectedKey: string | null
  onSelect: (key: string) => void
  className?: string
}

const CHART = 340
const PAD = 48
const VIEW = CHART + PAD * 2
const CENTER = VIEW / 2
const RADIUS = 122
const LABEL_RADIUS = RADIUS + 44
const RINGS = [0.25, 0.5, 0.75, 1]

function polarToCartesian(angleRad: number, radius: number) {
  return {
    x: CENTER + radius * Math.sin(angleRad),
    y: CENTER - radius * Math.cos(angleRad),
  }
}

export default function CategoryRadar({
  axes,
  selectedKey,
  onSelect,
  className = '',
}: CategoryRadarProps) {
  const n = axes.length
  if (n === 0) return null

  const angleStep = (Math.PI * 2) / n

  const ringPolygons = RINGS.map(scale => {
    const points = axes
      .map((_, i) => {
        const { x, y } = polarToCartesian(i * angleStep, RADIUS * scale)
        return `${x},${y}`
      })
      .join(' ')
    return points
  })

  const spokeLines = axes.map((_, i) => {
    const end = polarToCartesian(i * angleStep, RADIUS)
    return { x2: end.x, y2: end.y }
  })

  const dataPoints = axes.map((axis, i) => {
    const r = (Math.min(100, Math.max(0, axis.value)) / 100) * RADIUS
    return polarToCartesian(i * angleStep, r)
  })

  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        className="w-full max-w-lg mx-auto aspect-square overflow-visible"
        role="img"
        aria-label="Category progress radar"
      >
        {/* Grid rings */}
        {ringPolygons.map((points, i) => (
          <polygon
            key={`ring-${i}`}
            points={points}
            fill="none"
            className="stroke-gray-200 dark:stroke-gray-800"
            strokeWidth={1}
          />
        ))}

        {/* Spokes */}
        {spokeLines.map((line, i) => (
          <line
            key={`spoke-${i}`}
            x1={CENTER}
            y1={CENTER}
            x2={line.x2}
            y2={line.y2}
            className="stroke-gray-200 dark:stroke-gray-800"
            strokeWidth={1}
          />
        ))}

        {/* Data polygon */}
        <polygon
          points={dataPolygon}
          strokeWidth={2}
          strokeLinejoin="round"
          className="fill-signal-600/15 stroke-signal-600 dark:fill-volt/15 dark:stroke-volt"
        />

        {/* Data points */}
        {dataPoints.map((point, i) => {
          const selected = axes[i].key === selectedKey
          return (
            <circle
              key={`point-${axes[i].key}`}
              cx={point.x}
              cy={point.y}
              r={selected ? 6 : 4}
              fill={axes[i].color}
              stroke={selected ? 'currentColor' : 'transparent'}
              strokeWidth={2}
              className="cursor-pointer text-gray-950 dark:text-white"
              onClick={() => onSelect(axes[i].key)}
            />
          )
        })}

        {/* Axis labels */}
        {axes.map((axis, i) => {
          const { x, y } = polarToCartesian(i * angleStep, LABEL_RADIUS)
          const selected = axis.key === selectedKey
          return (
            <g
              key={`label-${axis.key}`}
              className="cursor-pointer"
              onClick={() => onSelect(axis.key)}
            >
              <text
                x={x}
                y={y - 4}
                textAnchor="middle"
                className={`text-[11px] font-semibold fill-gray-800 dark:fill-gray-100 ${
                  selected ? 'opacity-100' : 'opacity-80'
                }`}
                style={{ fontSize: 11 }}
              >
                {axis.label}
              </text>
              <text
                x={x}
                y={y + 10}
                textAnchor="middle"
                className="fill-gray-500 font-mono dark:fill-gray-400"
                style={{ fontSize: 10 }}
              >
                {Math.round(axis.value)}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Legend chips */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {axes.map(axis => {
          const selected = axis.key === selectedKey
          return (
            <button
              key={axis.key}
              type="button"
              onClick={() => onSelect(axis.key)}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all border ${
                selected
                  ? 'border-gray-950 bg-gray-950 text-gray-50 dark:border-gray-50 dark:bg-gray-50 dark:text-gray-950'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300'
              }`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: axis.color }}
              />
              {axis.label}
              <span className="font-mono tabular-nums opacity-70">{Math.round(axis.value)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
