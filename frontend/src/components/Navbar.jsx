import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Network,
  ChartNoAxesCombined,
  ScanLine,
  ArrowUpRight,
  Menu,
  X,
  Sun,
  Moon,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import OracleOmnibar from "./OracleOmnibar";
import { useLaboratory } from "../context/laboratory";

const navigation = [
  { to: "/", label: "Vue d’ensemble", icon: LayoutDashboard, index: "01" },
  { to: "/researchers", label: "Les chercheurs", icon: Users, index: "02" },
  { to: "/projects", label: "Les projets", icon: FolderKanban, index: "03" },
  { to: "/network", label: "Atlas des relations", icon: Network, index: "04" },
  {
    to: "/global-stats",
    label: "Production scientifique",
    icon: ChartNoAxesCombined,
    index: "05",
  },
  {
    to: "/advanced",
    label: "Intelligence & analyses",
    icon: ScanLine,
    index: "06",
  },
];
export default function Navbar({ theme, toggleTheme }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarRef = useRef(null);
  const menuRef = useRef(null);
  const location = useLocation();
  const { loading, errors, refresh } = useLaboratory();
  const active = navigation.find((item) => item.to === location.pathname);
  useEffect(() => {
    if (!mobileOpen) return;
    const sidebar = sidebarRef.current;
    const menuTrigger = menuRef.current;
    sidebar?.querySelector("a")?.focus();
    const close = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")
        setMobileOpen(false);
      if (e.key !== "Tab") return;
      const elements = [...sidebar.querySelectorAll("a, button")];
      const first = elements[0];
      const last = elements.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    const desktop = window.matchMedia("(min-width: 1001px)");
    const onResize = () => {
      if (desktop.matches) setMobileOpen(false);
    };
    window.addEventListener("keydown", close);
    desktop.addEventListener("change", onResize);
    return () => {
      window.removeEventListener("keydown", close);
      desktop.removeEventListener("change", onResize);
      menuTrigger?.focus();
    };
  }, [mobileOpen]);
  return (
    <>
      {mobileOpen && (
        <button
          className="sidebar-scrim"
          onClick={() => setMobileOpen(false)}
          aria-label="Fermer la navigation"
        />
      )}
      <aside
        ref={sidebarRef}
        role={mobileOpen ? "dialog" : undefined}
        aria-modal={mobileOpen || undefined}
        className={`workspace-sidebar ${mobileOpen ? "is-open" : ""}`}
        aria-label="Navigation principale"
      >
        <Link
          to="/"
          className="workspace-brand"
          onClick={() => setMobileOpen(false)}
        >
          <span className="brand-symbol">
            <span />
            <span />
            <span />
            <span />
          </span>
          <div>
            <strong>
              LISTIC<span>.</span>
            </strong>
            <small>RESEARCH OBSERVATORY</small>
          </div>
        </Link>
        <button
          className="mobile-close"
          onClick={() => setMobileOpen(false)}
          aria-label="Fermer le menu"
        >
          <X size={20} />
        </button>
        <div className="sidebar-section-label">Votre espace de recherche</div>
        <nav className="workspace-navigation">
          {navigation.map(({ to, label, icon, index }) => {
            const Icon = icon;
            return (
              <NavLink
                key={to}
                end={to === "/"}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `workspace-nav-link ${isActive || (to === "/researchers" && location.pathname.startsWith("/researcher/")) ? "is-active" : ""}`
                }
              >
                <Icon size={18} strokeWidth={1.5} />
                <span>{label}</span>
                <small>{index}</small>
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-note">
          <span className="sidebar-orbit">
            <Network size={26} strokeWidth={1} />
          </span>
          <p>
            Les idées se rencontrent.
            <br />
            <strong>La recherche avance.</strong>
          </p>
          <Link to="/network" onClick={() => setMobileOpen(false)}>
            Explorer les connexions
            <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="sidebar-bottom">
          <p>Université Savoie Mont Blanc</p>
          <span>Laboratoire LISTIC · Annecy</span>
          <div className="sidebar-bottom-rule" />
          <span>Informatique. Systèmes. Connaissance.</span>
        </div>
      </aside>
      <header className="workspace-topbar">
        <div className="topbar-breadcrumb">
          <button
            ref={menuRef}
            className="mobile-menu"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={mobileOpen}
          >
            <Menu size={20} />
          </button>
          <span className="topbar-lab">Observatoire</span>
          <ChevronRight size={13} />
          <strong>{active?.label || "Profil chercheur"}</strong>
        </div>
        <div className="topbar-actions">
          <span
            className={`connection-status ${errors.length ? "has-error" : ""}`}
          >
            <i />
            {loading
              ? "Actualisation…"
              : errors.length
                ? "Données partielles"
                : "Données du laboratoire"}
          </span>
          <button
            className="icon-button refresh-button"
            onClick={refresh}
            disabled={loading}
            aria-label="Actualiser les données"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <OracleOmnibar />
          <button
            className="icon-button theme-button"
            onClick={toggleTheme}
            aria-label={
              theme === "dark"
                ? "Activer le thème clair"
                : "Activer le thème sombre"
            }
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>
    </>
  );
}
