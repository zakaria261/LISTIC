import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  ArrowUpRight,
  ArrowLeft,
  CalendarDays,
  Users,
  Landmark,
  BookOpen,
  FolderKanban,
  X,
} from "lucide-react";
import { useLaboratory, number } from "../context/laboratory";
import {
  PageHeader,
  EmptyState,
  LoadingState,
  SectionHeading,
} from "../components/WorkspaceUI";
import ExportWidget from "../components/ExportWidget";
import api from "../lib/api";
function text(value) {
  return Array.isArray(value) ? value.join(", ") : String(value || "");
}
export default function ProjectDashboard() {
  const { projects, loading: listLoading, errors, refresh } = useLaboratory();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [analysis, setAnalysis] = useState({
    key: null,
    stats: null,
    loading: false,
    error: false,
  });
  const selected = projects.find(
    (p) => String(p._unique_id || p.NOM) === params.get("project"),
  );
  const uid = selected ? String(selected._unique_id || selected.NOM) : null;
  useEffect(() => {
    if (!uid) return;
    const controller = new AbortController();
    api
      .get(`/project/${encodeURIComponent(uid)}`, {
        signal: controller.signal,
        timeout: 25000,
      })
      .then((r) => {
        if (!controller.signal.aborted)
          setAnalysis({
            key: uid,
            stats: r.data.stats,
            loading: false,
            error: Boolean(r.data.stats?.hal?.error),
          });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setAnalysis({ key: uid, stats: null, loading: false, error: true });
      });
    return () => controller.abort();
  }, [uid]);
  const stats = analysis.key === uid ? analysis.stats : null;
  const isLoading = uid && analysis.key !== uid;
  const types = [...new Set(projects.map((p) => p.type || "Autres"))];
  const filtered = projects.filter(
    (p) =>
      (category === "all" || (p.type || "Autres") === category) &&
      `${text(p.NOM)} ${text(p["MOTS CLÉS"])} ${text(p.PARTENAIRES)}`
        .toLocaleLowerCase("fr")
        .includes(query.toLocaleLowerCase("fr")),
  );
  if (selected)
    return (
      <div className="project-detail page-enter">
        <button
          className="text-link project-back"
          onClick={() => setParams({})}
        >
          <ArrowLeft size={14} />
          Tous les projets
        </button>
        <PageHeader
          eyebrow={`03 / ${selected.type || "PROJET DE RECHERCHE"}`}
          title={selected.NOM}
          description={
            text(selected["MOTS CLÉS"]) ||
            "Projet de recherche du laboratoire LISTIC."
          }
          actions={
            <ExportWidget
              data={{ project: selected, stats }}
              jsonFilename={`${selected.NOM}_rapport`}
              csvOptions={[
                {
                  label: "Publications (CSV)",
                  data: stats?.hal?.recent_publications || [],
                  filename: `${selected.NOM}_publications`,
                  description: "Résultats de la recherche HAL",
                },
              ]}
            />
          }
        />
        <div className="project-detail-grid">
          <section className="panel project-information">
            <p className="eyebrow">FICHE DU PROJET</p>
            <dl>
              <div>
                <dt>
                  <CalendarDays size={15} />
                  Période
                </dt>
                <dd>{text(selected["PÉRIODE"]) || "Non renseignée"}</dd>
              </div>
              <div>
                <dt>
                  <Users size={15} />
                  Partenaires
                </dt>
                <dd>{text(selected.PARTENAIRES) || "Non renseignés"}</dd>
              </div>
              <div>
                <dt>
                  <Landmark size={15} />
                  Financeurs
                </dt>
                <dd>{text(selected.FINANCEURS) || "Non renseignés"}</dd>
              </div>
              <div>
                <dt>
                  <FolderKanban size={15} />
                  Catégorie
                </dt>
                <dd>{selected.type || "Non renseignée"}</dd>
              </div>
            </dl>
            <div className="source-note">
              <span className="tiny-square" />
              Informations issues de la base locale LISTIC.
            </div>
          </section>
          <section className="panel project-publications">
            <SectionHeading
              eyebrow="PRODUCTION SCIENTIFIQUE"
              title="Les travaux associés."
            />
            {isLoading ? (
              <LoadingState label="Recherche des publications sur HAL…" />
            ) : analysis.error ? (
              <EmptyState
                title="HAL est momentanément indisponible"
                description="Les informations locales du projet restent accessibles. Réessayez ultérieurement pour les publications."
              />
            ) : stats?.hal?.recent_publications?.length ? (
              <>
                <div className="project-publication-count">
                  <BookOpen size={18} />
                  <strong>{number(stats.hal.total_publications)}</strong>
                  <span>publications trouvées par acronyme sur HAL</span>
                </div>
                <div className="publication-list">
                  {stats.hal.recent_publications.map((p, i) => (
                    <article key={p.halId_s || i}>
                      <span className="publication-number">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <span className="publication-meta">
                          HAL / {p.producedDateY_i || "ANNÉE NON RENSEIGNÉE"}
                        </span>
                        <h3>{text(p.title_s)}</h3>
                        <p>{text(p.authFullName_s)}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                title="Aucune publication associée trouvée"
                description="La recherche HAL utilise l’acronyme du projet. Ce résultat ne couvre pas nécessairement tous ses travaux."
              />
            )}
            {Object.keys(stats?.hal?.top_authors || {}).length > 0 && (
              <div className="project-contributors">
                <p className="eyebrow">AUTEURS IDENTIFIÉS DANS LES RÉSULTATS</p>
                {Object.entries(stats.hal.top_authors).map(([name, count]) => (
                  <div key={name}>
                    <span>{name}</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    );
  return (
    <div className="projects-page page-enter">
      <PageHeader
        eyebrow="03 / LES PROJETS"
        title={
          <>
            L’ambition devient
            <br />
            <em>recherche.</em>
          </>
        }
        description="Des collaborations, des moyens et des idées. Explorez les projets qui donnent corps à la recherche du laboratoire."
        actions={
          <ExportWidget
            data={filtered}
            jsonFilename="listic_projets"
            csvOptions={[
              {
                label: "Projets (CSV)",
                data: filtered,
                filename: "listic_projets",
                description: "Le portefeuille de projets sélectionné",
              },
            ]}
          />
        }
      />
      <div className="directory-toolbar">
        <label className="search-field">
          <Search size={18} />
          <input
            aria-label="Rechercher un projet"
            placeholder="Un projet, un mot-clé, un partenaire…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              aria-label="Effacer la recherche"
              onClick={() => setQuery("")}
            >
              <X size={16} />
            </button>
          )}
        </label>
        <span className="project-total">
          {number(projects.length)} projets au total
        </span>
      </div>
      <div className="category-filters">
        <button
          className={category === "all" ? "is-active" : ""}
          aria-pressed={category === "all"}
          onClick={() => setCategory("all")}
        >
          Tous les projets<span>{projects.length}</span>
        </button>
        {types.map((type) => (
          <button
            key={type}
            className={category === type ? "is-active" : ""}
            aria-pressed={category === type}
            onClick={() => setCategory(type)}
          >
            {type}
            <span>
              {projects.filter((p) => (p.type || "Autres") === type).length}
            </span>
          </button>
        ))}
      </div>
      <div className="results-heading">
        <p>
          <strong>{filtered.length}</strong> projet
          {filtered.length > 1 ? "s" : ""} à explorer
        </p>
        <span>DE L’IDÉE À L’IMPACT</span>
      </div>
      {listLoading && !projects.length ? (
        <LoadingState />
      ) : errors.includes("projects") && !projects.length ? (
        <EmptyState title="Les projets sont indisponibles" onRetry={refresh} />
      ) : !filtered.length ? (
        <EmptyState
          title="Aucun projet ne correspond"
          onRetry={() => {
            setQuery("");
            setCategory("all");
          }}
        />
      ) : (
        <div className="project-grid">
          {filtered.map((p, i) => (
            <button
              key={p._unique_id || p.NOM}
              className="project-card"
              onClick={() => {
                setParams({ project: String(p._unique_id || p.NOM) });
                window.scrollTo({ top: 0 });
              }}
            >
              <div className="project-card-top">
                <span>{p.type || "Projet de recherche"}</span>
                <ArrowUpRight size={19} />
              </div>
              <span className="project-card-index">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2>{p.NOM}</h2>
              <p>
                {text(p["MOTS CLÉS"]) ||
                  "Découvrir le projet et ses partenaires."}
              </p>
              <div className="project-card-bottom">
                <CalendarDays size={13} />
                <span>{text(p["PÉRIODE"]) || "Période non renseignée"}</span>
                <span>
                  Voir le projet
                  <ArrowUpRight size={12} />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
