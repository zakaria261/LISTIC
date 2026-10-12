import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  Users,
  BookOpen,
  FolderKanban,
  GraduationCap,
  Sparkles,
  Network,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  useLaboratory,
  number,
  initials,
  categoryLabel,
  openOracle,
} from "../context/laboratory";
import {
  SectionHeading,
  StatCard,
  EmptyState,
} from "../components/WorkspaceUI";

function Collective({ researchers, loading }) {
  const groups = Object.entries(
    researchers.reduce(
      (all, r) => ({
        ...all,
        [r.category || "membres"]: (all[r.category || "membres"] || 0) + 1,
      }),
      {},
    ),
  );
  return (
    <div className="collective-visual">
      <div className="visual-label">
        <span className="eyebrow">LE COLLECTIF SCIENTIFIQUE</span>
        <span className="visual-label-number">01 / LISTIC</span>
      </div>
      <svg
        viewBox="0 0 440 320"
        role="img"
        aria-label={`Répartition de ${researchers.length} membres en ${groups.length} catégories`}
      >
        <defs>
          <pattern
            id="atlas-grid"
            width="18"
            height="18"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="0.7" fill="currentColor" opacity=".14" />
          </pattern>
        </defs>
        <rect width="440" height="320" fill="url(#atlas-grid)" />
        <ellipse cx="220" cy="160" rx="158" ry="115" className="orbit-ring" />
        <ellipse
          cx="220"
          cy="160"
          rx="114"
          ry="82"
          className="orbit-ring inner"
        />
        <path d="M220 20V300M35 160H405" className="orbit-cross" />
        {researchers.slice(0, 90).map((r, i) => {
          const angle = (i / Math.max(researchers.length, 1)) * Math.PI * 2;
          return (
            <circle
              key={r._unique_id || i}
              cx={220 + Math.cos(angle) * 158}
              cy={160 + Math.sin(angle) * 115}
              r={i % 7 === 0 ? 4.5 : 2.8}
              className={`orbit-member tone-${groups.findIndex(([key]) => key === (r.category || "membres"))}`}
            />
          );
        })}
        <circle cx="220" cy="160" r="52" className="orbit-center" />
        <text x="220" y="153" textAnchor="middle" className="orbit-value">
          {loading ? "—" : researchers.length}
        </text>
        <text x="220" y="178" textAnchor="middle" className="orbit-caption">
          MEMBRES
        </text>
        {groups.slice(0, 4).map(([category, count], i) => {
          const coords = [
            [292, 43],
            [300, 250],
            [42, 235],
            [28, 55],
          ][i];
          return (
            <g
              key={category}
              transform={`translate(${coords[0]},${coords[1]})`}
            >
              <rect width="130" height="43" rx="7" className="orbit-label-bg" />
              <text x="10" y="17" className="orbit-label-name">
                {categoryLabel(category)}
              </text>
              <text x="10" y="33" className="orbit-label-count">
                {count} membres
              </text>
            </g>
          );
        })}
      </svg>
      <div className="visual-footer">
        <span>
          <i />
          Une communauté, plusieurs perspectives
        </span>
        <Network size={16} />
      </div>
    </div>
  );
}
export default function Overview() {
  const { researchers, projects, sync, yearly, loading, errors } =
    useLaboratory();
  const yearData = Object.entries(yearly?.global_by_year || {})
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([year, count]) => ({ year, count }));
  const recentYears = yearData.slice(-10);
  const peak = [...yearData].sort((a, b) => b.count - a.count)[0];
  const featured = [...researchers]
    .filter((r) => r.category === "enseignants_chercheurs")
    .sort((a, b) => (b.pub_count || 0) - (a.pub_count || 0))
    .slice(0, 4);
  return (
    <div className="overview-page page-enter">
      <section className="overview-hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span />
            L’OBSERVATOIRE DU LISTIC
          </p>
          <h1>
            La recherche,
            <br />
            <em>au-delà des chiffres.</em>
          </h1>
          <p>
            Un nouveau regard sur celles et ceux qui font avancer la science.
            Explorez les travaux, les projets et les connexions de notre
            laboratoire.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/researchers">
              Explorer les chercheurs
              <ArrowUpRight size={17} />
            </Link>
            <button className="hero-oracle-link" onClick={() => openOracle()}>
              <Sparkles size={16} />
              Demander à Oracle
            </button>
          </div>
          <div className="hero-footnote">
            <span className="stacked-initials">
              {featured.slice(0, 3).map((r) => (
                <span key={r._unique_id}>{initials(r.name)}</span>
              ))}
            </span>
            <span>
              Informatique, systèmes & connaissance
              <br />
              <strong>Université Savoie Mont Blanc</strong>
            </span>
          </div>
        </div>
        <Collective researchers={researchers} loading={loading} />
      </section>
      {errors.length > 0 && (
        <div className="inline-notice" role="status">
          Certaines sources sont indisponibles. Les valeurs affichées
          proviennent des données actuellement accessibles.
        </div>
      )}
      <section className="stats-grid" aria-label="Le laboratoire en chiffres">
        <StatCard
          icon={Users}
          value={
            loading && !researchers.length
              ? "—"
              : errors.includes("researchers") && !researchers.length
                ? "—"
                : number(researchers.length)
          }
          label="Membres du laboratoire"
          detail="Profils de la base LISTIC"
        />
        <StatCard
          icon={BookOpen}
          value={number(sync?.database?.publications)}
          label="Publications indexées"
          detail="Entrepôt scientifique HAL local"
        />
        <StatCard
          icon={FolderKanban}
          value={
            (errors.includes("projects") && !projects.length) ||
            (loading && !projects.length)
              ? "—"
              : number(projects.length)
          }
          label="Projets de recherche"
          detail="Toutes catégories de financement"
        />
        <StatCard
          icon={GraduationCap}
          value={number(sync?.database?.doctorants)}
          label="Doctorants"
          detail="La prochaine génération scientifique"
        />
      </section>
      <div className="overview-analysis-grid">
        <section className="panel publication-panel">
          <SectionHeading
            eyebrow="LES TRAVAUX DU LABORATOIRE"
            title="Une recherche en mouvement."
            to="/global-stats"
            label="Voir l’analyse"
          />
          <div className="chart-caption">
            <span>Publications par année · entrepôt local</span>
            <span>
              {recentYears[0]?.year || "—"} — {recentYears.at(-1)?.year || "—"}
            </span>
          </div>
          {recentYears.length ? (
            <div className="overview-chart">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart
                  data={recentYears}
                  margin={{ top: 20, right: 8, bottom: 0, left: -25 }}
                >
                  <defs>
                    <linearGradient
                      id="overview-fill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#416953"
                        stopOpacity={0.18}
                      />
                      <stop offset="95%" stopColor="#416953" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="var(--line)"
                    vertical={false}
                    strokeDasharray="3 5"
                  />
                  <XAxis
                    dataKey="year"
                    tick={{ fill: "var(--muted)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    tick={{ fill: "var(--muted)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--surface)",
                      border: "1px solid var(--line)",
                      borderRadius: 10,
                      color: "var(--ink)",
                      fontSize: 12,
                    }}
                    formatter={(value) => [number(value), "Publications"]}
                  />
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="count"
                    stroke="var(--accent)"
                    strokeWidth={2.5}
                    fill="url(#overview-fill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title={
                loading ? "Les données arrivent…" : "Aucune publication indexée"
              }
              description="La courbe sera disponible après la synchronisation des publications."
            />
          )}
          {peak && (
            <div className="chart-footnote">
              <span className="tiny-square" />
              Année la plus représentée dans le corpus :{" "}
              <strong>{peak.year}</strong>
              <span className="chart-peak">
                {number(peak.count)} publications
              </span>
            </div>
          )}
        </section>
        <section className="oracle-feature">
          <div className="oracle-feature-top">
            <span className="pill">VOTRE ASSISTANT DE RECHERCHE</span>
            <Sparkles size={24} strokeWidth={1.2} />
          </div>
          <h2>
            Une question.
            <br />
            <em>De nouvelles pistes.</em>
          </h2>
          <p>
            Retrouvez un chercheur, explorez un sujet ou consultez les travaux
            du laboratoire. Avec des sources, toujours.
          </p>
          <button
            className="oracle-question"
            onClick={() =>
              openOracle("Quels chercheurs sont associés à l’IA explicable ?")
            }
          >
            <span>Qui travaille sur l’IA explicable ?</span>
            <ArrowUpRight size={18} />
          </button>
          <button className="oracle-feature-link" onClick={() => openOracle()}>
            Ouvrir Oracle
            <ArrowRight size={16} />
          </button>
          <div className="oracle-feature-bottom">
            <span className="orbit-mini" />
            <span>
              La connaissance commence
              <br />
              par une bonne question.
            </span>
          </div>
        </section>
      </div>
      <section className="overview-people">
        <SectionHeading
          eyebrow="LES VISAGES DE LA RECHERCHE"
          title="Un collectif, mille idées."
          to="/researchers"
          label="Tous les profils"
        />
        <div className="featured-people">
          {featured.map((r, i) => (
            <Link
              key={r._unique_id}
              to={`/researcher/${encodeURIComponent(r._unique_id)}`}
              className="featured-person"
            >
              <span className={`person-avatar avatar-${i % 4}`}>
                {initials(r.name)}
              </span>
              <div>
                <h3>{r.name}</h3>
                <p>Enseignant-chercheur</p>
                <span>{number(r.pub_count)} publications indexées</span>
              </div>
              <ArrowUpRight size={17} />
            </Link>
          ))}
        </div>
        {!loading && !featured.length && (
          <EmptyState
            title="Les profils ne sont pas disponibles"
            description="Actualisez les données pour retrouver le collectif du laboratoire."
          />
        )}
      </section>
      <div className="exploration-banner">
        <span className="banner-index">04</span>
        <div>
          <p className="eyebrow">L’ATLAS DES RELATIONS</p>
          <h2>Chaque connexion ouvre une possibilité.</h2>
        </div>
        <Link to="/network" className="button button-secondary">
          Explorer le réseau
          <ArrowUpRight size={17} />
        </Link>
      </div>
    </div>
  );
}
