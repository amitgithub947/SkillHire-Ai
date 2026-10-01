import { RoleDashboard, type DashboardCard } from '../../components/RoleDashboard'

const CARDS: DashboardCard[] = [
  { title: 'My profile & resume', description: 'Add your details and upload a PDF resume.' },
  { title: 'Find jobs', description: 'Search approved jobs and see your skill match.' },
  { title: 'My applications', description: 'Track application status and upcoming interviews.' },
]

export default function CandidateDashboard() {
  return <RoleDashboard heading="Candidate dashboard" cards={CARDS} />
}
