import { useNavigate } from 'react-router-dom'
import { JobForm } from '../../components/jobs/JobForm'
import { PageHeader } from '../../components/PageHeader'
import { employerService } from '../../services/employerService'
import type { JobInput } from '../../types/job'

export default function PostJob() {
  const navigate = useNavigate()

  const handleSubmit = async (input: JobInput) => {
    const job = await employerService.createJob(input)
    navigate('/employer/jobs', {
      state: { message: `"${job.title}" was submitted and is waiting for admin approval.` },
    })
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Post a job"
        subtitle="New jobs are reviewed by an admin before candidates can see them."
      />
      <JobForm submitLabel="Submit for review" onSubmit={handleSubmit} onCancel={() => navigate('/employer/jobs')} />
    </div>
  )
}
