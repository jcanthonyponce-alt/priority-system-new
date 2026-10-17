import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Crown,
  History as HistoryIcon,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Moon,
  Palette,
  Plus,
  Settings as SettingsIcon,
  Sun,
  Users,
} from "lucide-react";
import { useAuth } from "../AuthContext";
import { useTheme } from "../ThemeContext";
import { api } from "../api";
import TopSearch from "./TopSearch";
import "./app.css";
import "./layout-extra.css";

const BASIC_THEMES = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
];

const PALETTES = [
  { id: "ocean", label: "Ocean glass", swatch: "linear-gradient(135deg, #0a3fd8, #4ea1ff)" },
  { id: "neon", label: "Neon night", swatch: "linear-gradient(135deg, #7c3aed, #ec4899)" },
  { id: "colorful", label: "Violet", swatch: "linear-gradient(135deg, #6d3df2, #a78bfa)" },
  { id: "metal", label: "Metallic", swatch: "linear-gradient(135deg, #7d8a9c, #1a2230)" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const menuRef = useRef(null);
  const paletteRef = useRef(null);
  const isAdmin = user.role === "admin";
  const inPalette = PALETTES.some((p) => p.id === theme);

  const sections = [
    {
      title: "Menu",
      links: [
        { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
        { to: "/tasks", label: "My Tasks", icon: ListChecks },
        { to: "/add", label: "Add Task", icon: Plus },
        { to: "/calendar", label: "Calendar", icon: CalendarDays },
        { to: "/history", label: "History", icon: HistoryIcon },
      ],
    },
    ...(isAdmin
      ? [
          {
            title: "Admin",
            links: [
              { to: "/users", label: "Users", icon: Users },
              { to: "/reports", label: "Reports", icon: BarChart3 },
            ],
          },
        ]
      : []),
    {
      title: "Preferences",
      links: [{ to: "/settings", label: "Settings", icon: SettingsIcon }],
    },
  ];

  // refresh the notification dot whenever the page changes
  useEffect(() => {
    api("/notifications")
      .then((d) => setUnread(d.unread))
      .catch(() => {});
    setMenuOpen(false);
    setPaletteOpen(false);
  }, [location.pathname]);

  // close the menus when clicking anywhere else
  useEffect(() => {
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (paletteRef.current && !paletteRef.current.contains(e.target)) setPaletteOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // pressing Esc closes the logout box
  useEffect(() => {
    if (!confirmOpen) return;
    function onKey(e) {
      if (e.key === "Escape") setConfirmOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [confirmOpen]);

  function askLogout() {
    setMenuOpen(false);
    setConfirmOpen(true);
  }

  function handleLogout() {
    setConfirmOpen(false);
    logout();
    navigate("/login");
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="side-logo">
          <div className="logo-box">
            <Check size={22} strokeWidth={3} />
          </div>
          <div>
            <div className="logo-name">TaskPriority</div>
            <div className="logo-tag">Plan · Focus · Get It Done</div>
          </div>
        </div>

        <nav className="side-nav">
          {sections.map((section) => (
            <div key={section.title} className="side-section">
              <div className="side-title">{section.title}</div>
              {section.links.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) => "side-link" + (isActive ? " active" : "")}
                  >
                    <Icon size={19} />
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {isAdmin && (
          <div className="admin-box">
            <Crown size={22} />
            <div>
              <strong>Admin Panel</strong>
              <span>Manage users, tasks and system</span>
            </div>
          </div>
        )}

        <button className="side-logout" onClick={askLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </aside>

      <main className="main">
        <div className="topbar">
                    <TopSearch />
          <div className="theme-pill" role="group" aria-label="Choose a theme">
            {BASIC_THEMES.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  className={"tp-btn" + (theme === t.id ? " active" : "")}
                  onClick={() => {
                    setTheme(t.id);
                    setPaletteOpen(false);
                  }}
                  title={t.label + " theme"}
                  aria-label={t.label + " theme"}
                >
                  <Icon size={17} />
                </button>
              );
            })}

            <div className="palette-wrap" ref={paletteRef}>
              <button
                className={"tp-btn" + (inPalette ? " active" : "")}
                onClick={() => setPaletteOpen((o) => !o)}
                title="Color palettes"
                aria-label="Color palettes"
                aria-expanded={paletteOpen}
              >
                <Palette size={17} />
              </button>

              {paletteOpen && (
                <div className="palette-menu">
                  <div className="palette-title">Color palettes</div>
                  {PALETTES.map((p) => (
                    <button
                      key={p.id}
                      className={"palette-opt" + (theme === p.id ? " active" : "")}
                      onClick={() => {
                        setTheme(p.id);
                        setPaletteOpen(false);
                      }}
                    >
                      <span className="palette-swatch" style={{ background: p.swatch }} />
                      <span>{p.label}</span>
                      {theme === p.id && <Check size={16} className="palette-check" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Link to="/notifications" className="icon-btn" title="Notifications">
            <Bell size={20} />
            {unread > 0 && <span className="dot" />}
          </Link>

          <div className="user-menu" ref={menuRef}>
            <button className="user-chip" onClick={() => setMenuOpen((o) => !o)}>
              <span className="avatar">{user.username[0].toUpperCase()}</span>
              <span>{user.username}</span>
              <ChevronDown size={16} />
            </button>
            {menuOpen && (
              <div className="menu">
                <Link to="/profile">My profile</Link>
                <button onClick={askLogout}>Log out</button>
              </div>
            )}
          </div>
        </div>

        <Outlet />
      </main>

      {confirmOpen && (
        <div className="modal-backdrop" onClick={() => setConfirmOpen(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-icon">
              <LogOut size={26} />
            </div>
            <h3 id="logout-title">Log out?</h3>
            <p>Are you sure you want to log out of your account?</p>
            <div className="modal-actions">
              <button className="m-cancel" onClick={() => setConfirmOpen(false)}>
                Cancel
              </button>
              <button className="m-confirm" onClick={handleLogout}>
                Yes, log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}