import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Auth
import InscriptionForm from './pages/InscriptionForm';
import Login           from './pages/Login';
import ChooseOTP       from './pages/ChooseOTP';
import OTPVerify       from './pages/OTPVerify';
import ForgotPassword  from './pages/ForgotPassword';
import ChangePassword  from './pages/ChangePassword';

// User pages
import Dashboard from './pages/Dashboard';
import Players   from './pages/Players';
import Leagues   from './pages/Leagues';
import Roster    from './pages/Roster';
import Matches   from './pages/Matches';
import Scores    from './pages/Scores';
import Market    from './pages/Market';
import Social    from './pages/Social';
import Chatbot      from './pages/Chatbot';
import Tournaments  from './pages/Tournaments';
import LiveWatch    from './pages/LiveWatch';
import Overview     from './pages/Overview';


// Admin pages
import AdminLogin        from './pages/admin/AdminLogin';
import AdminVerify       from './pages/admin/AdminVerify';
import AdminDashboard    from './pages/admin/AdminDashboard';
import AdminDemandes     from './pages/admin/AdminDemandes';
import AdminUtilisateurs from './pages/admin/AdminUtilisateurs';
import AdminJoueurs      from './pages/admin/AdminJoueurs';
import AdminLigues       from './pages/admin/AdminLigues';

// Manager pages (hérite de Joueur + fonctions de gestion)
import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManagerLeagues   from './pages/manager/ManagerLeagues';
import ManagerMembers   from './pages/manager/ManagerMembers';
import ManagerRosters   from './pages/manager/ManagerRosters';
import ManagerRanking   from './pages/manager/ManagerRanking';
import ManagerInvite    from './pages/manager/ManagerInvite';
import ManagerAllRosters from './pages/manager/ManagerAllRosters';

import './App.css';

function PrivateRoute({ children }) {
  return localStorage.getItem('access_token') ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  return localStorage.getItem('admin_access_token') ? children : <Navigate to="/admin/login" />;
}

// ManagerRoute : Manager uniquement (Admin a son propre panel séparé)
function ManagerRoute({ children }) {
  const token = localStorage.getItem('access_token');
  if (!token) return <Navigate to="/login" />;
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.role !== 'manager') return <Navigate to="/dashboard" />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"                   element={<Navigate to="/login" />} />
        <Route path="/inscription"        element={<InscriptionForm />} />
        <Route path="/login"              element={<Login />} />
        <Route path="/choose-otp/:userId" element={<ChooseOTP />} />
        <Route path="/verify/:userId"     element={<OTPVerify />} />
        <Route path="/forgot-password"    element={<ForgotPassword />} />

        {/* Protected user */}
        <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />
        <Route path="/dashboard"       element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/players"         element={<PrivateRoute><Players /></PrivateRoute>} />
        <Route path="/leagues"         element={<PrivateRoute><Leagues /></PrivateRoute>} />
        <Route path="/roster"          element={<PrivateRoute><Roster /></PrivateRoute>} />
        <Route path="/matches"         element={<PrivateRoute><Matches /></PrivateRoute>} />
        <Route path="/scores"          element={<PrivateRoute><Scores /></PrivateRoute>} />
        <Route path="/market"          element={<PrivateRoute><Market /></PrivateRoute>} />
        <Route path="/social"          element={<PrivateRoute><Social /></PrivateRoute>} />
        <Route path="/chatbot"         element={<PrivateRoute><Chatbot /></PrivateRoute>} />
        <Route path="/tournaments"    element={<PrivateRoute><Tournaments /></PrivateRoute>} />
        <Route path="/live"           element={<PrivateRoute><LiveWatch /></PrivateRoute>} />
        <Route path="/overview"      element={<PrivateRoute><Overview /></PrivateRoute>} />

        {/* ── MANAGER (hérite de Joueur + gestion) ── */}
        <Route path="/manager/dashboard"              element={<ManagerRoute><ManagerDashboard /></ManagerRoute>} />
        <Route path="/manager/leagues"                element={<ManagerRoute><ManagerLeagues   /></ManagerRoute>} />
        <Route path="/manager/invite"                 element={<ManagerRoute><ManagerInvite      /></ManagerRoute>} />
        <Route path="/manager/rosters"                element={<ManagerRoute><ManagerAllRosters  /></ManagerRoute>} />
        <Route path="/manager/leagues/:id/members"    element={<ManagerRoute><ManagerMembers   /></ManagerRoute>} />
        <Route path="/manager/leagues/:id/rosters"    element={<ManagerRoute><ManagerRosters   /></ManagerRoute>} />
        <Route path="/manager/leagues/:id/ranking"    element={<ManagerRoute><ManagerRanking   /></ManagerRoute>} />
        <Route path="/manager/rankings"               element={<ManagerRoute><ManagerRanking   /></ManagerRoute>} />

        {/* Admin — périmètre : joueurs + ligues publiques + gestion comptes */}
        <Route path="/admin/login"        element={<AdminLogin />} />
        <Route path="/admin/verify"       element={<AdminVerify />} />
        <Route path="/admin/dashboard"    element={<AdminRoute><AdminDashboard    /></AdminRoute>} />
        <Route path="/admin/demandes"     element={<AdminRoute><AdminDemandes     /></AdminRoute>} />
        <Route path="/admin/utilisateurs" element={<AdminRoute><AdminUtilisateurs /></AdminRoute>} />
        <Route path="/admin/joueurs"      element={<AdminRoute><AdminJoueurs      /></AdminRoute>} />
        <Route path="/admin/ligues"       element={<AdminRoute><AdminLigues       /></AdminRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
