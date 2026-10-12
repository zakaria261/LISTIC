import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BookOpen,
  Users,
  ScanLine,
  CalendarDays,
} from "lucide-react";
import {
  useLaboratory,
  number,
  initials,
  categoryLabel,
} from "../context/laboratory";
import {
  SectionHeading,
  StatCard,
  LoadingState,
  EmptyState,
} from "./WorkspaceUI";
export default function IntelligenceSummary() {
  const { insights, researchers, loading, refresh } = useLaboratory();
  if (!insights && loading)
    return <LoadingState label="Lecture du corpus scientifique…" />;
  if (!insights)
    return (
      <EmptyState title="La synthèse est indisponible" onRetry={refresh} />
    );
  const coverage = insights.total_researchers
    ? Math.round(
        (insights.active_researchers / insights.total_researchers) * 100,
      )
    : 0;
  const indexed = [...researchers]
    .filter((r) => r.category === "enseignants_chercheurs")
    .sort((a, b) => (b.pub_count || 0) - (a.pub_count || 0))
    .slice(0, 5);
  const groups = Object.entries(
    researchers.reduce(
      (all, r) => ({ ...all, [r.category]: (all[r.category] || 0) + 1 }),
      {},
    ),
  );
  return (
    <div className="intelligence-summary">
      <div className="stats-grid">
        <StatCard
          icon={BookOpen}
          value={number(insights.total_publications)}
          label="Publications locales"
          detail="Documents présents dans l’entrepôt HAL"
        />
        <StatCard
          icon={Users}
          value={number(insights.total_researchers)}
          label="Enseignants-chercheurs"
          detail="Catégorie renseignée dans la base LISTIC"
        />
        <StatCard
          icon={ScanLine}
          value={`${coverage}%`}
          label="Profils avec publications"
          detail="Parmi les enseignants-chercheurs locaux"
        />
        <StatCard
          icon={CalendarDays}
          value={insights.peak_year || "—"}
          label="Année la plus représentée"
          detail={`${number(insights.peak_count)} publications dans le corpus`}
        />
      </div>
      <div className="intelligence-summary-grid">
        <section className="panel">
          <SectionHeading
            eyebrow="LES PROFILS DOCUMENTÉS"
            title="Les travaux, derrière les noms."
            to="/researchers"
            label="Explorer les profils"
          />
          <div className="indexed-researchers">
            {indexed.map((r, i) => (
              <Link
                key={r._unique_id}
                to={`/researcher/${encodeURIComponent(r._unique_id)}`}
              >
                <span className="indexed-position">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={`person-avatar avatar-${i % 4}`}>
                  {initials(r.name)}
                </span>
                <div>
                  <strong>{r.name}</strong>
                  <span>Enseignant-chercheur</span>
                </div>
                <span className="indexed-count">
                  {number(r.pub_count)}
                  <small>publications</small>
                </span>
                <ArrowUpRight size={15} />
              </Link>
            ))}
          </div>
          <p className="source-note">
            Comptages de l’entrepôt local. Ils décrivent le corpus disponible,
            pas la qualité ni l’ensemble de l’activité scientifique.
          </p>
        </section>
        <section className="panel">
          <SectionHeading
            eyebrow="LES COMPOSANTES DU COLLECTIF"
            title="Des parcours complémentaires."
          />
          <div className="category-distribution">
            {groups.map(([category, count]) => (
              <div key={category}>
                <div>
                  <span>{categoryLabel(category)}</span>
                  <strong>{count}</strong>
                </div>
                <div className="institution-bar">
                  <span
                    style={{
                      width: `${(count / Math.max(researchers.length, 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="source-note">
            Répartition des {researchers.length} profils présents dans
            l’annuaire local.
          </p>
        </section>
      </div>
      <div className="analysis-reading-note">
        <ScanLine size={20} />
        <div>
          <h3>Des indicateurs pour ouvrir la discussion.</h3>
          <p>
            Explorez les collaborations, les thématiques et la couverture des
            sources dans les onglets ci-dessus. Une donnée absente n’est pas une
            activité absente.
          </p>
        </div>
      </div>
    </div>
  );
}
