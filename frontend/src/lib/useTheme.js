import { useState, useEffect } from "react";
export default function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("listic-theme-v2") === "dark"
        ? "dark"
        : "light";
    } catch {
      return "light";
    }
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    try {
      localStorage.setItem("listic-theme-v2", theme);
    } catch {
      /* Storage can be disabled. */
    }
  }, [theme]);
  return {
    theme,
    toggleTheme: () =>
      setTheme((previous) => (previous === "dark" ? "light" : "dark")),
  };
}
