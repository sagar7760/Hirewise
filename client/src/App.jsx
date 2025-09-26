import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// Context Providers
import { AuthProvider } from './contexts/AuthContext.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'

// Debug utilities (only in development)
if (process.env.NODE_ENV === 'development') {
  import('./utils/debugAuth.js');
}

// Layout Components
import Layout from './components/layout/Layout.jsx'
import ProtectedRoute from './components/common/ProtectedRoute.jsx'

// Global Pages
import HomePage from './pages/global/HomePage.jsx'
import LoginPage from './pages/global/LoginPage.jsx'
import SignupPage from './pages/global/SignupPage.jsx'
import CompanySignupPage from './pages/global/CompanySignupPage.jsx'
import CompanyVerificationPage from './pages/global/CompanyVerificationPage.jsx'
import NotFoundPage from './pages/global/NotFoundPage.jsx'
import UnauthorizedPage from './pages/global/UnauthorizedPage.jsx'

// Applicant Pages
import ApplicantDashboard from './pages/applicant/ApplicantDashboard.jsx'
import JobsPage from './pages/applicant/JobsPage.jsx'
import JobDetailsPage from './pages/applicant/JobDetailsPage.jsx'
import ApplicationsPage from './pages/applicant/ApplicationsPage.jsx'
import SavedJobsPage from './pages/applicant/SavedJobsPage.jsx'
import ProfilePage from './pages/applicant/ProfilePage.jsx'
import JobApplicationPage from './pages/applicant/JobApplicationPage.jsx'
import NotificationsPage from './pages/applicant/MessagesPage.jsx'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import HRManagementPage from './pages/admin/HRManagementPage.jsx'
import InterviewerManagementPage from './pages/admin/InterviewerManagementPage.jsx'
import OrganizationSettingsPage from './pages/admin/OrganizationSettingsPage.jsx'
import AllJobsPage from './pages/admin/AllJobsPage.jsx'
import AdminProfile from './pages/admin/AdminProfile.jsx'
import AdminNotifications from './pages/admin/AdminNotifications.jsx'

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
import InterviewManagement from './pages/interviewer/InterviewManagement.jsx'
import PendingFeedback from './pages/interviewer/PendingFeedback.jsx'
import InterviewerNotifications from './pages/interviewer/InterviewerNotifications.jsx'
import InterviewerProfile from './pages/interviewer/InterviewerProfile.jsx'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
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
          <Route path="/company/signup" element={
            <Layout showFooter={false}>
              <CompanySignupPage />
            </Layout>
          } />
          <Route path="/company/verification-sent" element={
            <Layout showFooter={false}>
              <CompanyVerificationPage />
            </Layout>
          } />

          {/* Applicant Dashboard Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute roles={['applicant']}>
              <ApplicantDashboard />
            </ProtectedRoute>
          } />
          <Route path="/jobs" element={
            <ProtectedRoute roles={['applicant']}>
              <JobsPage />
            </ProtectedRoute>
          } />
          <Route path="/jobs/:jobId" element={
            <ProtectedRoute roles={['applicant']}>
              <JobDetailsPage />
            </ProtectedRoute>
          } />
          <Route path="/jobs/:jobId/apply" element={
            <ProtectedRoute roles={['applicant']}>
              <JobApplicationPage />
            </ProtectedRoute>
          } />
          <Route path="/applicant/applications" element={
            <ProtectedRoute roles={['applicant']}>
              <ApplicationsPage />
            </ProtectedRoute>
          } />
          <Route path="/saved-jobs" element={
            <ProtectedRoute roles={['applicant']}>
              <SavedJobsPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute roles={['applicant']}>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute roles={['applicant']}>
              <NotificationsPage />
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']} requireCompany={true}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute roles={['admin']} requireCompany={true}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/hr-management" element={
            <ProtectedRoute roles={['admin']} requireCompany={true} requireCompanyAdmin={true}>
              <HRManagementPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/interviewer-management" element={
            <ProtectedRoute roles={['admin']} requireCompany={true} requireCompanyAdmin={true}>
              <InterviewerManagementPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/jobs" element={
            <ProtectedRoute roles={['admin']} requireCompany={true}>
              <AllJobsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/organization" element={
            <ProtectedRoute roles={['admin']} requireCompany={true} requireCompanyAdmin={true}>
              <OrganizationSettingsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/notifications" element={
            <ProtectedRoute roles={['admin']} requireCompany={true}>
              <AdminNotifications />
            </ProtectedRoute>
          } />
          <Route path="/admin/profile" element={
            <ProtectedRoute roles={['admin']} requireCompany={true}>
              <AdminProfile />
            </ProtectedRoute>
          } />

          {/* HR Routes */}
          <Route path="/hr" element={
            <ProtectedRoute roles={['hr']} requireCompany={true}>
              <HRDashboard />
            </ProtectedRoute>
          } />
          <Route path="/hr/dashboard" element={
            <ProtectedRoute roles={['hr']} requireCompany={true}>
              <HRDashboard />
            </ProtectedRoute>
          } />
          <Route path="/hr/jobs" element={
            <ProtectedRoute roles={['hr']} requireCompany={true}>
              <HRJobManagement />
            </ProtectedRoute>
          } />
          <Route path="/hr/jobs/create" element={
            <ProtectedRoute roles={['hr']} requireCompany={true}>
              <HRCreateJob />
            </ProtectedRoute>
          } />
          <Route path="/hr/applications" element={
            <ProtectedRoute roles={['hr']} requireCompany={true}>
              <HRApplicationManagement />
            </ProtectedRoute>
          } />
          <Route path="/hr/interviews" element={
            <ProtectedRoute roles={['hr']} requireCompany={true}>
              <HRInterviewManagement />
            </ProtectedRoute>
          } />
          <Route path="/hr/notifications" element={
            <ProtectedRoute roles={['hr']} requireCompany={true}>
              <HRNotifications />
            </ProtectedRoute>
          } />
          <Route path="/hr/profile" element={
            <ProtectedRoute roles={['hr']} requireCompany={true}>
              <HRProfile />
            </ProtectedRoute>
          } />

          {/* Interviewer Routes */}
          <Route path="/interviewer" element={
            <ProtectedRoute roles={['interviewer']} requireCompany={true}>
              <InterviewerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/interviewer/dashboard" element={
            <ProtectedRoute roles={['interviewer']} requireCompany={true}>
              <InterviewerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/interviewer/interviews" element={
            <ProtectedRoute roles={['interviewer']} requireCompany={true}>
              <InterviewManagement />
            </ProtectedRoute>
          } />
          <Route path="/interviewer/feedback" element={
            <ProtectedRoute roles={['interviewer']} requireCompany={true}>
              <PendingFeedback />
            </ProtectedRoute>
          } />
          <Route path="/interviewer/notifications" element={
            <ProtectedRoute roles={['interviewer']} requireCompany={true}>
              <InterviewerNotifications />
            </ProtectedRoute>
          } />
          <Route path="/interviewer/profile" element={
            <ProtectedRoute roles={['interviewer']} requireCompany={true}>
              <InterviewerProfile />
            </ProtectedRoute>
          } />

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
    </AuthProvider>
    </ThemeProvider>
  )
}

export default App
