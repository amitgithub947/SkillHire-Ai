export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'dangerOutline' | 'success' | 'ghost'
export type ButtonSize = 'sm' | 'md'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-blue text-white shadow-xs hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500',
  secondary:
    'border border-slate-300 bg-white text-slate-700 shadow-xs hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800',
  danger: 'bg-red-600 text-white shadow-xs hover:bg-red-700',
  dangerOutline:
    'border border-red-300 bg-white text-red-700 shadow-xs hover:bg-red-50 dark:border-red-500/40 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-500/10',
  success: 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
}

/** Button styling for elements that can't use <Button>, such as file-input labels and download links. */
export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', extra = '') {
  return `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${extra}`
}
