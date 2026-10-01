interface SkillTagsProps {
  skills: string[]
  /** Skills to highlight (e.g. ones the candidate also has). Compared case-insensitively. */
  highlight?: string[]
  /** Show at most this many, then "+N more". */
  max?: number
}

export function SkillTags({ skills, highlight = [], max }: SkillTagsProps) {
  if (skills.length === 0) return null

  const highlighted = new Set(highlight.map((s) => s.toLowerCase()))
  const shown = max ? skills.slice(0, max) : skills
  const hidden = skills.length - shown.length

  return (
    <ul className="flex flex-wrap gap-1.5">
      {shown.map((skill) => (
        <li
          key={skill}
          className={`rounded-md px-2 py-0.5 text-xs font-medium ${
            highlighted.has(skill.toLowerCase())
              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          {skill}
        </li>
      ))}
      {hidden > 0 && <li className="px-1 py-0.5 text-xs text-slate-500">+{hidden} more</li>}
    </ul>
  )
}
