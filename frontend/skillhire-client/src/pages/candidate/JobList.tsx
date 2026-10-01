import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { ErrorState } from '../../components/ErrorState'
import { FormField } from '../../components/FormField'
import { JobListingCard } from '../../components/jobs/JobListingCard'
import { LoadingState } from '../../components/LoadingState'
import { PageHeader } from '../../components/PageHeader'
import { Pagination } from '../../components/Pagination'
import { useApi } from '../../hooks/useApi'
import { candidateService } from '../../services/candidateService'
import type { JobSearchFilters } from '../../types/job'

type FilterField = Exclude<keyof JobSearchFilters, 'page'>

const EMPTY: Record<FilterField, string> = { search: '', location: '', experience: '', skills: '' }

// Filters live in the URL so Back from a job page returns to the same results.
function readFilters(params: URLSearchParams): JobSearchFilters {
  return {
    search: params.get('search') ?? '',
    location: params.get('location') ?? '',
    experience: params.get('experience') ?? '',
    skills: params.get('skills') ?? '',
    page: Math.max(1, Number(params.get('page')) || 1),
  }
}

export default function JobList() {
  const [params, setParams] = useSearchParams()
  const filters = readFilters(params)
  const [draft, setDraft] = useState<Record<FilterField, string>>({
    search: filters.search,
    location: filters.location,
    experience: filters.experience,
    skills: filters.skills,
  })
  const [experienceError, setExperienceError] = useState<string>()

  const { data, error, isLoading, reload } = useApi(() => candidateService.searchJobs(filters), params.toString())
  const { data: profile } = useApi(() => candidateService.getProfile())

  const apply = (next: Record<FilterField, string>, page = 1) => {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(next)) {
      if (value.trim()) search.set(key, value.trim())
    }
    if (page > 1) search.set('page', String(page))
    setParams(search)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const years = draft.experience.trim()
    if (years && (!/^\d+$/.test(years) || Number(years) > 50)) {
      setExperienceError('Enter whole years between 0 and 50.')
      return
    }
    setExperienceError(undefined)
    apply(draft)
  }

  const clear = () => {
    setDraft(EMPTY)
    setExperienceError(undefined)
    apply(EMPTY)
  }

  const fillFromProfile = () => {
    if (!profile) return
    const next = { ...draft, experience: String(profile.experienceYears), location: profile.location ?? '' }
    setDraft(next)
    apply(next)
  }

  const setField = (field: FilterField) => (e: ChangeEvent<HTMLInputElement>) =>
    setDraft((prev) => ({ ...prev, [field]: e.target.value }))

  const hasFilters = Object.values(draft).some((value) => value !== '') || params.toString() !== ''

  return (
    <>
      <PageHeader title="Find jobs" subtitle="Browse approved openings and apply in a couple of clicks." />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        role="search"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FormField
            label="Keyword"
            name="search"
            type="search"
            placeholder="Title, company or keyword"
            value={draft.search}
            onChange={setField('search')}
          />
          <FormField
            label="Location"
            name="location"
            placeholder="e.g. Pune or Remote"
            value={draft.location}
            onChange={setField('location')}
          />
          <FormField
            label="Your experience (years)"
            name="experience"
            type="number"
            min={0}
            max={50}
            placeholder="Any"
            value={draft.experience}
            onChange={setField('experience')}
            error={experienceError}
          />
          <FormField
            label="Skills"
            name="skills"
            placeholder="e.g. React, SQL"
            value={draft.skills}
            onChange={setField('skills')}
          />
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Experience shows jobs needing that many years or fewer. With several skills, a job must match all of them.
          </p>
          <div className="flex flex-wrap gap-2">
            {profile && (
              <Button variant="ghost" size="sm" onClick={fillFromProfile}>
                Use my profile
              </Button>
            )}
            {hasFilters && (
              <Button variant="secondary" size="sm" onClick={clear}>
                Clear
              </Button>
            )}
            <Button type="submit" size="sm">
              Search
            </Button>
          </div>
        </div>
      </form>

      {isLoading ? (
        <LoadingState message="Finding jobs…" />
      ) : error || !data ? (
        <ErrorState message={error ?? 'Could not load jobs.'} onRetry={reload} />
      ) : data.items.length === 0 ? (
        <EmptyState
          title="No jobs match your search"
          message="Try fewer skills, a different location or clear the filters."
          action={
            <Button variant="secondary" onClick={clear}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-slate-600">
            <span className="font-semibold text-brand-navy">{data.totalCount}</span>{' '}
            {data.totalCount === 1 ? 'job' : 'jobs'} found
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {data.items.map((job) => (
              <JobListingCard key={job.id} job={job} mySkills={profile?.skills} />
            ))}
          </div>
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onChange={(page) => {
              apply(
                { search: filters.search, location: filters.location, experience: filters.experience, skills: filters.skills },
                page,
              )
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        </>
      )}
    </>
  )
}
