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
import AdminDashboard from './pages/AdminDashboard';
import DashboardLayout from './components/dashboard/DashboardLayout';
import PageLoader from './components/PageLoader';

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
      <PageLoader />
      <Routes location={displayLocation}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/u/:rollno" element={<PublicProfile />} />
        
        <Route path="/dash" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/edit" element={<ProfileEdit />} />
          <Route path="community" element={<Community />} />
          <Route path="community/:groupId" element={<GroupPage />} />
          <Route path="social" element={<Social />} />
          <Route path="social/discover" element={<SocialDiscover />} />
        </Route>

        <Route path="/admindash" element={<DashboardLayout />}>
          <Route index element={<Navigate to="users" replace />} />
          <Route path="users" element={<AdminDashboard />} />
          <Route path="faculty" element={<AdminDashboard />} />
          <Route path="groups" element={<AdminDashboard />} />
        </Route>

        <Route path="/logout" element={<Logout />} />
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

