import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
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
import ResumeAnalysis from '../pages/candidate/ResumeAnalysis'
import ResumeUpload from '../pages/candidate/ResumeUpload'
import Applications from '../pages/recruiter/Applications'
import CandidateDetails from '../pages/recruiter/CandidateDetails'
import CompanyProfile from '../pages/recruiter/CompanyProfile'
import EditJob from '../pages/recruiter/EditJob'
import RecruiterDashboard from '../pages/recruiter/RecruiterDashboard'
import MyJobs from '../pages/recruiter/MyJobs'
import PostJob from '../pages/recruiter/PostJob'
import ScheduleInterview from '../pages/recruiter/ScheduleInterview'
import ForgotPassword from '../pages/ForgotPassword'
import Login from '../pages/Login'
import NotFound from '../pages/NotFound'
import Register from '../pages/Register'
import ResetPassword from '../pages/ResetPassword'
import Unauthorized from '../pages/Unauthorized'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicOnlyRoute } from './PublicOnlyRoute'
import { dashboardPathFor } from './rolePaths'

function HomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={user ? dashboardPathFor(user.role) : '/login'} replace />
}

/** Old /employer/... links (bookmarks, emails) open the same page under /recruiter. */
function LegacyEmployerRedirect() {
  const { pathname, search } = useLocation()
  return <Navigate to={pathname.replace(/^\/employer/, '/recruiter') + search} replace />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      {/* Any logged-in user gets the shared layout; each group then checks the role. */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/jobs" element={<ManageJobs />} />
            <Route path="/admin/users" element={<ManageUsers />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['Recruiter']} />}>
            <Route path="/recruiter" element={<RecruiterDashboard />} />
            <Route path="/recruiter/profile" element={<CompanyProfile />} />
            <Route path="/recruiter/jobs" element={<MyJobs />} />
            <Route path="/recruiter/jobs/new" element={<PostJob />} />
            <Route path="/recruiter/jobs/:id/edit" element={<EditJob />} />
            <Route path="/recruiter/applications" element={<Applications />} />
            <Route path="/recruiter/applications/:id" element={<CandidateDetails />} />
            <Route path="/recruiter/applications/:id/interview" element={<ScheduleInterview />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['Candidate']} />}>
            <Route path="/candidate" element={<CandidateDashboard />} />
            <Route path="/candidate/profile" element={<CandidateProfile />} />
            <Route path="/candidate/resume" element={<ResumeUpload />} />
            <Route path="/candidate/resume/analysis" element={<ResumeAnalysis />} />
            <Route path="/candidate/jobs" element={<JobList />} />
            <Route path="/candidate/jobs/:id" element={<JobDetails />} />
            <Route path="/candidate/applications" element={<MyApplications />} />
            <Route path="/candidate/interviews" element={<MyInterviews />} />
          </Route>
        </Route>
      </Route>

      <Route path="/employer/*" element={<LegacyEmployerRedirect />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
