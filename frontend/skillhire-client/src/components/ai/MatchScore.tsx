import { matchTier } from '../../utils/ai'

interface MatchScoreProps {
  percent: number
  size?: 'sm' | 'lg'
  /** Show "Strong match" etc. under the ring. */
  showLabel?: boolean
}

const SIZES = {
  sm: { box: 56, stroke: 5, text: 'text-sm' },
  lg: { box: 104, stroke: 8, text: 'text-2xl' },
}

/** A ring that fills up to the match percentage. */
export function MatchScore({ percent, size = 'sm', showLabel = false }: MatchScoreProps) {
  const tier = matchTier(percent)
  const { box, stroke, text } = SIZES[size]
  const radius = (box - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(100, Math.max(0, percent)) / 100)

  return (
    <div className="flex shrink-0 flex-col items-center">
      <div className="relative" style={{ width: box, height: box }}>
        <svg width={box} height={box} className="-rotate-90" aria-hidden="true">
          <circle cx={box / 2} cy={box / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-slate-100 dark:stroke-slate-800" />
          <circle
            cx={box / 2}
            cy={box / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`${tier.ring} transition-[stroke-dashoffset] duration-700`}
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center font-bold ${text} ${tier.text}`}>
          {percent}%
        </span>
      </div>
      <span className="sr-only">{`${percent}% match, ${tier.label}`}</span>
      {showLabel && <span className={`mt-2 text-sm font-semibold ${tier.text}`}>{tier.label}</span>}
    </div>
  )
}
