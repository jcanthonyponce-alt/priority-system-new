import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { getToken } from "./api";
import "./themes-extra.css";

const ThemeContext = createContext(null);

export const THEMES = ["light", "dark", "colorful", "ocean", "neon", "metal"];

function deviceDefault() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readTheme(key) {
  const saved = localStorage.getItem(key);
  return THEMES.includes(saved) ? saved : null;
}

// on a page refresh, start with the last theme used so there is no flash of another one
function startTheme() {
  const last = getToken() ? readTheme("theme:last") : null;
  return last || deviceDefault();
}

export function ThemeProvider({ children }) {
  const { user, loading } = useAuth();
  const uid = user ? user.id : null;
  const [theme, setTheme] = useState(startTheme);

  // when someone logs in or out, load THEIR saved theme
  useEffect(() => {
    if (loading) return;
    const t = (uid && readTheme(`theme:${uid}`)) || deviceDefault();
    setTheme(t);
    if (uid) localStorage.setItem("theme:last", t);
  }, [uid, loading]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // save the choice under the logged-in account only
  function changeTheme(t) {
    setTheme(t);
    if (uid) {
      localStorage.setItem(`theme:${uid}`, t);
      localStorage.setItem("theme:last", t);
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);