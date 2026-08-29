/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ProfileEdit from './pages/ProfileEdit';
import Logout from './pages/Logout';
import PublicProfile from './pages/PublicProfile';
import Social from './pages/social/Social';
import SocialDiscover from './pages/social/SocialDiscover';
import Community from './pages/Community';
import GroupPage from './pages/GroupPage';
import CreateGroupPost from './pages/CreateGroupPost';
import GroupSearch from './pages/GroupSearch';
import AdminDashboard from './pages/AdminDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import FacultyClassPage from './pages/FacultyClassPage';
import ClassExtrasPage from './pages/ClassExtrasPage';
import HomeworkCreatePage from './pages/HomeworkCreatePage';
import FacultyHomeworkSubmissionsPage from './pages/FacultyHomeworkSubmissionsPage';
import StudentClassesPage from './pages/StudentClassesPage';
import StudentClassPage from './pages/StudentClassPage';
import StudentHomeworkViewer from './pages/StudentHomeworkViewer';
import DashboardLayout from './components/dashboard/DashboardLayout';
import ClassLayout from './components/dashboard/ClassLayout';
import PageLoader from './components/PageLoader';
import Calendar from './pages/Calendar';
import Events from './pages/Events';

import NotFound from './pages/NotFound';
import CodeOfConduct from './pages/CodeOfConduct';
import Onboarding from './pages/Onboarding';
import OfflineOverlay from './components/OfflineOverlay';

function AppRoutes() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      // Freeze the route for 200ms while the loader slides up
      const timer = setTimeout(() => {
        setDisplayLocation(location);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [location, displayLocation.pathname]);

  return (
    <>
      <OfflineOverlay />
      <PageLoader />
      <Routes location={displayLocation}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/coc" element={<CodeOfConduct />} />
        <Route path="/code-of-conduct" element={<Navigate to="/coc" replace />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/u/:rollno" element={<PublicProfile />} />
        
        <Route path="/dash" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="class" element={<StudentClassesPage />} />
          <Route path="class/:classId" element={<StudentClassPage />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/edit" element={<ProfileEdit />} />
          <Route path="calendar/:year" element={<Calendar />} />
          <Route path="calender/:year" element={<Navigate to="../calendar/2026-27" replace />} />
          <Route path="events" element={<Events />} />
          <Route path="community" element={<Community />} />
          <Route path="community/:groupId" element={<Navigate to="announcements" replace />} />
          <Route path="community/:groupId/create" element={<CreateGroupPost />} />
          <Route path="community/:groupId/search" element={<GroupSearch />} />
          <Route path="community/:groupId/:tab" element={<GroupPage />} />
          <Route path="social" element={<Social />} />
          <Route path="social/discover" element={<SocialDiscover />} />
        </Route>
        
        {/* Distraction-Free Homework Viewer (No Sidebar) */}
        <Route path="/dash/class/:classId/homework/:homeworkId" element={<StudentHomeworkViewer />} />

        <Route path="/admindash" element={<DashboardLayout />}>
          <Route index element={<Navigate to="users" replace />} />
          <Route path="users" element={<AdminDashboard />} />
          <Route path="faculty" element={<AdminDashboard />} />
          <Route path="groups" element={<AdminDashboard />} />
          <Route path="classes" element={<AdminDashboard />} />
        </Route>

        <Route path="/faculty" element={<DashboardLayout />}>
          <Route index element={<FacultyDashboard />} />
        </Route>

        <Route path="/faculty/class/:classId" element={<ClassLayout />}>
          <Route index element={<FacultyClassPage />} />
          <Route path="extras" element={<ClassExtrasPage />} />
          <Route path="homework/create" element={<HomeworkCreatePage />} />
          <Route path="homework/:homeworkId/edit" element={<HomeworkCreatePage />} />
          <Route path="homework/:homeworkId/submissions" element={<FacultyHomeworkSubmissionsPage />} />
        </Route>

        <Route path="/logout" element={<Logout />} />
        
        {/* Catch-all route for 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

