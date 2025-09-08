import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// Layout Components
import Layout from './components/layout/Layout'

// Global Pages
import HomePage from './pages/global/HomePage'
import LoginPage from './pages/global/LoginPage'
import SignupPage from './pages/global/SignupPage'
import NotFoundPage from './pages/global/NotFoundPage'
import UnauthorizedPage from './pages/global/UnauthorizedPage'

// Applicant Pages
import ApplicantDashboard from './pages/applicant/ApplicantDashboard'
import JobsPage from './pages/applicant/JobsPage'
import JobDetailsPage from './pages/applicant/JobDetailsPage'
import MyApplicationsPage from './pages/applicant/MyApplicationsPage'
import ProfilePage from './pages/applicant/ProfilePage'
import JobApplicationPage from './pages/applicant/JobApplicationPage'
import NotificationsPage from './pages/applicant/NotificationsPage'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import HRManagementPage from './pages/admin/HRManagementPage'
import InterviewerManagementPage from './pages/admin/InterviewerManagementPage'
import OrganizationSettingsPage from './pages/admin/OrganizationSettingsPage'
import AllJobsPage from './pages/admin/AllJobsPage'
import AdminProfile from './pages/admin/AdminProfile'

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
        <Route path="/admin/profile" element={<AdminProfile />} />

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
