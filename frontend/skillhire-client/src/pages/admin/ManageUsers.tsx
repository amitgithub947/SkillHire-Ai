import { useState, type ReactNode } from 'react'
import { CompanyLogo } from '../../components/CompanyLogo'
import { EmptyState } from '../../components/EmptyState'
import { ErrorState } from '../../components/ErrorState'
import { FilterTabs, type FilterTab } from '../../components/FilterTabs'
import { LoadingState } from '../../components/LoadingState'
import { PageHeader } from '../../components/PageHeader'
import { SearchInput } from '../../components/SearchInput'
import { useApi } from '../../hooks/useApi'
import { adminService } from '../../services/adminService'
import type { AdminCandidate, AdminEmployer, AdminUser } from '../../types/admin'
import { formatDate } from '../../utils/format'

type Tab = 'users' | 'employers' | 'candidates'

const TABS: FilterTab<Tab>[] = [
  { value: 'users', label: 'All users' },
  { value: 'employers', label: 'Recruiters' },
  { value: 'candidates', label: 'Candidates' },
]

const ROLE_BADGE: Record<AdminUser['role'], string> = {
  Admin: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30',
  Recruiter: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/30',
  Candidate: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30',
}

export default function ManageUsers() {
  const [tab, setTab] = useState<Tab>('users')
  const [search, setSearch] = useState('')

  return (
    <>
      <PageHeader eyebrow="Admin console" title="Manage users" subtitle="Everyone registered on SkillHire AI." />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <FilterTabs tabs={TABS} value={tab} onChange={setTab} />
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, email or company" />
      </div>

      {tab === 'users' && <UsersTable search={search} />}
      {tab === 'employers' && <EmployersTable search={search} />}
      {tab === 'candidates' && <CandidatesTable search={search} />}
    </>
  )
}

function matches(term: string, ...values: (string | null)[]) {
  const t = term.trim().toLowerCase()
  return !t || values.some((v) => v?.toLowerCase().includes(t))
}

function UsersTable({ search }: { search: string }) {
  const { data, error, isLoading, reload } = useApi(() => adminService.getUsers())
  const rows = (data ?? []).filter((u) => matches(search, u.name, u.email))

  return (
    <ListState isLoading={isLoading} error={error} onRetry={reload} isEmpty={rows.length === 0} label="users">
      <Table headers={['Name', 'Email', 'Role', 'Joined']}>
        {rows.map((u) => (
          <tr key={u.id}>
            <Td strong>{u.name}</Td>
            <Td>{u.email}</Td>
            <Td>
              <span className={`rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${ROLE_BADGE[u.role]}`}>{u.role}</span>
            </Td>
            <Td muted>{formatDate(u.createdAt)}</Td>
          </tr>
        ))}
      </Table>
    </ListState>
  )
}

function EmployersTable({ search }: { search: string }) {
  const { data, error, isLoading, reload } = useApi(() => adminService.getEmployers())
  const rows = (data ?? []).filter((e: AdminEmployer) => matches(search, e.companyName, e.contactName, e.email))

  return (
    <ListState isLoading={isLoading} error={error} onRetry={reload} isEmpty={rows.length === 0} label="recruiters">
      <Table headers={['Company', 'Contact', 'Location', 'Website', 'Jobs', 'Joined']}>
        {rows.map((e) => (
          <tr key={e.employerId}>
            <Td>
              <div className="flex items-center gap-3">
                <CompanyLogo name={e.companyName} logoUrl={e.logoUrl} />
                <span className="font-semibold text-brand-navy dark:text-slate-100">{e.companyName}</span>
              </div>
            </Td>
            <Td>
              <p className="font-medium text-slate-700 dark:text-slate-200">{e.contactName}</p>
              <p className="text-slate-500 dark:text-slate-400">{e.email}</p>
            </Td>
            <Td>{e.location ?? '—'}</Td>
            <Td>
              {e.website ? (
                <a href={e.website} target="_blank" rel="noreferrer" className="link">
                  {e.website.replace(/^https?:\/\//, '')}
                </a>
              ) : (
                '—'
              )}
            </Td>
            <Td>{e.jobCount}</Td>
            <Td muted>{formatDate(e.createdAt)}</Td>
          </tr>
        ))}
      </Table>
    </ListState>
  )
}

function CandidatesTable({ search }: { search: string }) {
  const { data, error, isLoading, reload } = useApi(() => adminService.getCandidates())
  const rows = (data ?? []).filter((c: AdminCandidate) => matches(search, c.name, c.email))

  return (
    <ListState isLoading={isLoading} error={error} onRetry={reload} isEmpty={rows.length === 0} label="candidates">
      <Table headers={['Name', 'Email', 'Phone', 'Location', 'Skills', 'Joined']}>
        {rows.map((c) => (
          <tr key={c.candidateId}>
            <Td strong>{c.name}</Td>
            <Td>{c.email}</Td>
            <Td>{c.phone ?? '—'}</Td>
            <Td>{c.location ?? '—'}</Td>
            <Td wrap>
              <span className="line-clamp-2 max-w-xs">{c.skills ?? 'Not added yet'}</span>
            </Td>
            <Td muted>{formatDate(c.createdAt)}</Td>
          </tr>
        ))}
      </Table>
    </ListState>
  )
}

interface ListStateProps {
  isLoading: boolean
  error: string | null
  onRetry: () => void
  isEmpty: boolean
  label: string
  children: ReactNode
}

function ListState({ isLoading, error, onRetry, isEmpty, label, children }: ListStateProps) {
  if (isLoading) return <LoadingState message={`Loading ${label}…`} />
  if (error) return <ErrorState message={error} onRetry={onRetry} />
  if (isEmpty) return <EmptyState title={`No ${label} found`} />
  return <>{children}</>
}

function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="card overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

interface TdProps {
  children: ReactNode
  strong?: boolean
  muted?: boolean
  wrap?: boolean
}

function Td({ children, strong, muted, wrap }: TdProps) {
  const tone = strong ? 'font-medium text-brand-navy dark:text-slate-100' : muted ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-200'
  return <td className={`${wrap ? '' : 'whitespace-nowrap'} align-middle ${tone}`}>{children}</td>
}
