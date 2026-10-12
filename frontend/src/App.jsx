import { Suspense, lazy, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Link,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Overview from "./pages/Overview";
import LaboratoryProvider from "./context/LaboratoryProvider";
import { LoadingState } from "./components/WorkspaceUI";
import useTheme from "./lib/useTheme";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NetworkGraph = lazy(() => import("./pages/NetworkGraph"));
const ProjectDashboard = lazy(() => import("./pages/ProjectDashboard"));
const GlobalDashboard = lazy(() => import("./pages/GlobalDashboard"));
const AdvancedDashboard = lazy(() => import("./pages/AdvancedDashboard"));
function Workspace() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.pathname]);
  return (
    <div className="workspace">
      <a className="skip-link" href="#main-content">
        Aller au contenu
      </a>
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <main
        id="main-content"
        className="workspace-content"
        key={location.pathname}
      >
        <Suspense
          fallback={<LoadingState label="Ouverture de votre espace…" />}
        >
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/researchers" element={<Home />} />
            <Route path="/network" element={<NetworkGraph />} />
            <Route path="/projects" element={<ProjectDashboard />} />
            <Route path="/global-stats" element={<GlobalDashboard />} />
            <Route path="/advanced" element={<AdvancedDashboard />} />
            <Route path="/researcher/:id" element={<Dashboard />} />
            <Route
              path="*"
              element={
                <div className="empty-state">
                  <h1>Cette page n’existe pas.</h1>
                  <Link className="button button-primary" to="/">
                    Revenir à l’observatoire
                  </Link>
                </div>
              }
            />
          </Routes>
        </Suspense>
        <footer className="workspace-footer">
          <span>LISTIC — Observatoire de la recherche</span>
          <span>Des données pour comprendre. Des liens pour avancer.</span>
        </footer>
      </main>
    </div>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <LaboratoryProvider>
        <Workspace />
      </LaboratoryProvider>
    </BrowserRouter>
  );
}
