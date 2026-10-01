import { useState } from 'react'
import { ButtonLink } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { ErrorState } from '../../components/ErrorState'
import { FilterTabs } from '../../components/FilterTabs'
import { InterviewCard } from '../../components/interviews/InterviewCard'
import { LoadingState } from '../../components/LoadingState'
import { PageHeader } from '../../components/PageHeader'
import { useApi } from '../../hooks/useApi'
import { candidateService } from '../../services/candidateService'
import type { Interview } from '../../types/interview'

type Tab = 'upcoming' | 'past'

interface Split {
  upcoming: Interview[]
  past: Interview[]
}

async function loadInterviews(): Promise<Split> {
  const interviews = await candidateService.getInterviews()
  const now = Date.now()
  const isUpcoming = (i: Interview) => i.status === 'Scheduled' && new Date(i.interviewDate).getTime() >= now

  return {
    // Soonest first for upcoming, most recent first for past.
    upcoming: interviews.filter(isUpcoming).reverse(),
    past: interviews.filter((i) => !isUpcoming(i)),
  }
}

export default function MyInterviews() {
  const { data, error, isLoading, reload } = useApi(loadInterviews)
  const [tab, setTab] = useState<Tab>('upcoming')

  if (isLoading) return <LoadingState message="Loading your interviews…" />
  if (error || !data) return <ErrorState message={error ?? 'Could not load interviews.'} onRetry={reload} />

  const list = data[tab]

  return (
    <>
      <PageHeader title="My interviews" subtitle="Dates, meeting links and instructions from employers." />

      <div className="mb-5">
        <FilterTabs
          tabs={[
            { value: 'upcoming', label: 'Upcoming', count: data.upcoming.length },
            { value: 'past', label: 'Past & cancelled', count: data.past.length },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {list.length === 0 ? (
        <EmptyState
          title={tab === 'upcoming' ? 'No upcoming interviews' : 'No past interviews'}
          message={
            tab === 'upcoming'
              ? 'When an employer schedules an interview with you, it will appear here.'
              : undefined
          }
          action={tab === 'upcoming' ? <ButtonLink to="/candidate/applications">View my applications</ButtonLink> : undefined}
        />
      ) : (
        <div className="max-w-3xl space-y-4">
          {list.map((interview) => (
            <InterviewCard key={interview.id} interview={interview} perspective="candidate" />
          ))}
        </div>
      )}
    </>
  )
}
