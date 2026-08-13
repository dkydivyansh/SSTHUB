/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Logout from './pages/Logout';
import DashboardLayout from './components/dashboard/DashboardLayout';
import PageLoader from './components/PageLoader';

function AppRoutes() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      // Freeze the route for 700ms while the loader slides up
      const timer = setTimeout(() => {
        setDisplayLocation(location);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [location, displayLocation.pathname]);

  return (
    <>
      <PageLoader />
      <Routes location={displayLocation}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        
        <Route path="/dash" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
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

