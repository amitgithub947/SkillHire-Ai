import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { useAuth } from '../context/useAuth'
import AdminDashboard from '../pages/admin/AdminDashboard'
import ManageJobs from '../pages/admin/ManageJobs'
import ManageUsers from '../pages/admin/ManageUsers'
import CandidateDashboard from '../pages/candidate/CandidateDashboard'
import CandidateProfile from '../pages/candidate/CandidateProfile'
import JobDetails from '../pages/candidate/JobDetails'
import JobList from '../pages/candidate/JobList'
import MyApplications from '../pages/candidate/MyApplications'
import MyInterviews from '../pages/candidate/MyInterviews'
import ResumeUpload from '../pages/candidate/ResumeUpload'
import Applications from '../pages/employer/Applications'
import CandidateDetails from '../pages/employer/CandidateDetails'
import CompanyProfile from '../pages/employer/CompanyProfile'
import EditJob from '../pages/employer/EditJob'
import EmployerDashboard from '../pages/employer/EmployerDashboard'
import MyJobs from '../pages/employer/MyJobs'
import PostJob from '../pages/employer/PostJob'
import ScheduleInterview from '../pages/employer/ScheduleInterview'
import Login from '../pages/Login'
import NotFound from '../pages/NotFound'
import Register from '../pages/Register'
import Unauthorized from '../pages/Unauthorized'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicOnlyRoute } from './PublicOnlyRoute'
import { dashboardPathFor } from './rolePaths'

function HomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={user ? dashboardPathFor(user.role) : '/login'} replace />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Any logged-in user gets the shared layout; each group then checks the role. */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/jobs" element={<ManageJobs />} />
            <Route path="/admin/users" element={<ManageUsers />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['Employer']} />}>
            <Route path="/employer" element={<EmployerDashboard />} />
            <Route path="/employer/profile" element={<CompanyProfile />} />
            <Route path="/employer/jobs" element={<MyJobs />} />
            <Route path="/employer/jobs/new" element={<PostJob />} />
            <Route path="/employer/jobs/:id/edit" element={<EditJob />} />
            <Route path="/employer/applications" element={<Applications />} />
            <Route path="/employer/applications/:id" element={<CandidateDetails />} />
            <Route path="/employer/applications/:id/interview" element={<ScheduleInterview />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['Candidate']} />}>
            <Route path="/candidate" element={<CandidateDashboard />} />
            <Route path="/candidate/profile" element={<CandidateProfile />} />
            <Route path="/candidate/resume" element={<ResumeUpload />} />
            <Route path="/candidate/jobs" element={<JobList />} />
            <Route path="/candidate/jobs/:id" element={<JobDetails />} />
            <Route path="/candidate/applications" element={<MyApplications />} />
            <Route path="/candidate/interviews" element={<MyInterviews />} />
          </Route>
        </Route>
      </Route>

      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
