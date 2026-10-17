import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import MyTasks from "./pages/MyTasks";
import AddTask from "./pages/AddTask";
import CalendarPage from "./pages/Calendar";
import History from "./pages/History";
import Users from "./pages/Users";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="loading">Loading...</p>;
  return user ? children : <Navigate to="/login" replace />;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="loading">Loading...</p>;
  return user ? <Navigate to="/" replace /> : children;
}

// only admins can open these pages
function AdminOnly({ children }) {
  const { user } = useAuth();
  return user.role === "admin" ? children : <Navigate to="/" replace />;
}

// admins and regular users get different dashboards
function Home() {
  const { user } = useAuth();
  return user.role === "admin" ? <AdminDashboard /> : <Dashboard />;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Home />} />
        <Route path="tasks" element={<MyTasks />} />
        <Route path="add" element={<AddTask />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="history" element={<History />} />
        <Route path="users" element={<AdminOnly><Users /></AdminOnly>} />
        <Route path="reports" element={<AdminOnly><Reports /></AdminOnly>} />
        <Route path="settings" element={<Settings />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}