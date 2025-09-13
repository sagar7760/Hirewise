import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// Layout Components
import Layout from './components/layout/Layout.jsx'

// Global Pages
import HomePage from './pages/global/HomePage.jsx'
import LoginPage from './pages/global/LoginPage.jsx'
import SignupPage from './pages/global/SignupPage.jsx'
import NotFoundPage from './pages/global/NotFoundPage.jsx'
import UnauthorizedPage from './pages/global/UnauthorizedPage.jsx'

// Applicant Pages
import ApplicantDashboard from './pages/applicant/ApplicantDashboard.jsx'
import JobsPage from './pages/applicant/JobsPage.jsx'
import JobDetailsPage from './pages/applicant/JobDetailsPage.jsx'
import MyApplicationsPage from './pages/applicant/MyApplicationsPage.jsx'
import ProfilePage from './pages/applicant/ProfilePage.jsx'
import JobApplicationPage from './pages/applicant/JobApplicationPage.jsx'
import NotificationsPage from './pages/applicant/NotificationsPage.jsx'

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard.jsx'
import HRManagementPage from './pages/Admin/HRManagementPage.jsx'
import InterviewerManagementPage from './pages/Admin/InterviewerManagementPage.jsx'
import OrganizationSettingsPage from './pages/Admin/OrganizationSettingsPage.jsx'
import AllJobsPage from './pages/Admin/AllJobsPage.jsx'
import AdminProfile from './pages/Admin/AdminProfile.jsx'
import AdminNotifications from './pages/Admin/AdminNotifications.jsx'

// HR Pages
import HRDashboard from './pages/hr/HRDashboard.jsx'
import HRJobManagement from './pages/hr/HRJobManagement.jsx'
import HRApplicationManagement from './pages/hr/HRApplicationManagement.jsx'
import HRInterviewManagement from './pages/hr/HRInterviewManagement.jsx'
import HRProfile from './pages/hr/HRProfile.jsx'
import HRCreateJob from './pages/hr/HRCreateJob.jsx'
import HRNotifications from './pages/hr/HRNotifications.jsx'

// Interviewer Pages
import InterviewerDashboard from './pages/interviewer/InterviewerDashboard.jsx'
import TodaysInterviews from './pages/interviewer/TodaysInterviews.jsx'
import UpcomingInterviews from './pages/interviewer/UpcomingInterviews.jsx'
import PendingFeedback from './pages/interviewer/PendingFeedback.jsx'
import PastInterviews from './pages/interviewer/PastInterviews.jsx'

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes (Marketing Site) */}
        <Route path="/" element={
          <Layout>
            <HomePage />
          </Layout>
        } />
        <Route path="/login" element={
          <Layout showFooter={false}>
            <LoginPage />
          </Layout>
        } />
        <Route path="/signup" element={
          <Layout showFooter={false}>
            <SignupPage />
          </Layout>
        } />

        {/* Applicant Dashboard Routes */}
        <Route path="/dashboard" element={<ApplicantDashboard />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/:jobId" element={<JobDetailsPage />} />
        <Route path="/jobs/:jobId/apply" element={<JobApplicationPage />} />
        <Route path="/my-applications" element={<MyApplicationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/hr-management" element={<HRManagementPage />} />
        <Route path="/admin/interviewer-management" element={<InterviewerManagementPage />} />
        <Route path="/admin/jobs" element={<AllJobsPage />} />
        <Route path="/admin/organization" element={<OrganizationSettingsPage />} />
        <Route path="/admin/notifications" element={<AdminNotifications />} />
        <Route path="/admin/profile" element={<AdminProfile />} />

        {/* HR Routes */}
        <Route path="/hr" element={<HRDashboard />} />
        <Route path="/hr/dashboard" element={<HRDashboard />} />
        <Route path="/hr/jobs" element={<HRJobManagement />} />
        <Route path="/hr/jobs/create" element={<HRCreateJob />} />
        <Route path="/hr/applications" element={<HRApplicationManagement />} />
        <Route path="/hr/interviews" element={<HRInterviewManagement />} />
        <Route path="/hr/notifications" element={<HRNotifications />} />
        <Route path="/hr/profile" element={<HRProfile />} />

        {/* Interviewer Routes */}
        <Route path="/interviewer" element={<InterviewerDashboard />} />
        <Route path="/interviewer/dashboard" element={<InterviewerDashboard />} />
        <Route path="/interviewer/today" element={<TodaysInterviews />} />
        <Route path="/interviewer/upcoming" element={<UpcomingInterviews />} />
        <Route path="/interviewer/feedback" element={<PendingFeedback />} />
        <Route path="/interviewer/past" element={<PastInterviews />} />

        {/* Error Pages */}
        <Route path="/unauthorized" element={
          <Layout showFooter={false}>
            <UnauthorizedPage />
          </Layout>
        } />
        <Route path="*" element={
          <Layout showFooter={false}>
            <NotFoundPage />
          </Layout>
        } />
      </Routes>
    </Router>
  )
}

export default App
