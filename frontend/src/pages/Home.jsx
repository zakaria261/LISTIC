import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  FolderKanban,
  GraduationCap,
  Mail,
  X,
} from "lucide-react";
import {
  useLaboratory,
  categoryLabel,
  number,
  initials,
  emailAddress,
} from "../context/laboratory";
import {
  PageHeader,
  EmptyState,
  LoadingState,
} from "../components/WorkspaceUI";
import ExportWidget from "../components/ExportWidget";
const PAGE_SIZE = 12;
export default function Home() {
  const { researchers, loading, errors, refresh } = useLaboratory();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("name");
  const [view, setView] = useState("grid");
  const [page, setPage] = useState(0);
  const categories = useMemo(
    () =>
      Object.entries(
        researchers.reduce(
          (all, r) => ({
            ...all,
            [r.category || "membres"]: (all[r.category || "membres"] || 0) + 1,
          }),
          {},
        ),
      ),
    [researchers],
  );
  const filtered = useMemo(
    () =>
      researchers
        .filter(
          (r) =>
            (category === "all" || (r.category || "membres") === category) &&
            `${r.name} ${r.email || ""}`
              .toLocaleLowerCase("fr")
              .includes(query.toLocaleLowerCase("fr")),
        )
        .sort((a, b) =>
          sort === "publications"
            ? (b.pub_count || 0) - (a.pub_count || 0) ||
              a.name.localeCompare(b.name, "fr")
            : a.name.localeCompare(b.name, "fr"),
        ),
    [researchers, category, query, sort],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );
  const reset = () => {
    setQuery("");
    setCategory("all");
    setPage(0);
  };
  return (
    <div className="researchers-page page-enter">
      <PageHeader
        eyebrow="02 / LE COLLECTIF"
        title={
          <>
            Des personnes.
            <br />
            <em>Des perspectives.</em>
          </>
        }
        description="Découvrez les expertises, les parcours et les travaux des membres du laboratoire."
        actions={
          <ExportWidget
            data={filtered}
            jsonFilename="listic_chercheurs"
            csvOptions={[
              {
                label: "Les chercheurs (CSV)",
                data: filtered,
                filename: "listic_chercheurs",
                description: "Les profils correspondant aux filtres",
              },
            ]}
          />
        }
      />
      <div className="directory-toolbar">
        <label className="search-field">
          <Search size={18} />
          <input
            aria-label="Rechercher un chercheur"
            placeholder="Un nom, une adresse e-mail…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setPage(0);
              }}
              aria-label="Effacer la recherche"
            >
              <X size={15} />
            </button>
          )}
          <kbd>Recherche</kbd>
        </label>
        <div className="directory-controls">
          <SlidersHorizontal size={16} />
          <select
            aria-label="Trier les chercheurs"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(0);
            }}
          >
            <option value="name">Ordre alphabétique</option>
            <option value="publications">Publications indexées</option>
          </select>
          <div className="view-toggle">
            <button
              aria-label="Affichage en grille"
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              aria-label="Affichage en liste"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
            >
              <List size={17} />
            </button>
          </div>
        </div>
      </div>
      <div className="category-filters" aria-label="Catégories de membres">
        <button
          className={category === "all" ? "is-active" : ""}
          aria-pressed={category === "all"}
          onClick={() => {
            setCategory("all");
            setPage(0);
          }}
        >
          Tous les membres<span>{number(researchers.length)}</span>
        </button>
        {categories.map(([key, count]) => (
          <button
            key={key}
            className={category === key ? "is-active" : ""}
            aria-pressed={category === key}
            onClick={() => {
              setCategory(key);
              setPage(0);
            }}
          >
            {categoryLabel(key)}
            <span>{count}</span>
          </button>
        ))}
      </div>
      <div className="results-heading">
        <p>
          <strong>{filtered.length}</strong> profil
          {filtered.length > 1 ? "s" : ""}
          {query ? ` pour « ${query} »` : " à explorer"}
        </p>
        <span>BASE DU LABORATOIRE / LISTIC</span>
      </div>
      {loading && !researchers.length ? (
        <LoadingState />
      ) : errors.includes("researchers") && !researchers.length ? (
        <EmptyState
          title="Les profils sont indisponibles"
          description="Vérifiez la connexion au laboratoire puis réessayez."
          onRetry={refresh}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Aucun profil ne correspond"
          description="Essayez un autre nom ou retirez les filtres de catégorie."
          onRetry={reset}
        />
      ) : (
        <div
          className={`researcher-directory ${view === "list" ? "is-list" : ""}`}
        >
          {visible.map((r) => {
            const email = emailAddress(r.email);
            const tone =
              [...r.name].reduce((sum, char) => sum + char.charCodeAt(0), 0) %
              4;
            return (
              <article key={r._unique_id} className="researcher-card">
                <Link
                  className="researcher-card-main"
                  to={`/researcher/${encodeURIComponent(r._unique_id)}`}
                >
                  <div className="researcher-card-top">
                    <span className={`person-avatar avatar-${tone}`}>
                      {initials(r.name)}
                    </span>
                    <span className="card-open-icon">
                      <ArrowUpRight size={18} />
                    </span>
                  </div>
                  <span className="researcher-category">
                    {categoryLabel(r.category)}
                  </span>
                  <h2>{r.name}</h2>
                  <div className="researcher-card-stats">
                    <span>
                      <BookOpen size={14} />
                      <strong>{number(r.pub_count)}</strong> publications
                    </span>
                    <span>
                      <FolderKanban size={14} />
                      <strong>{number(r.project_count)}</strong> projets
                    </span>
                    <span>
                      <GraduationCap size={15} />
                      <strong>{number(r.phd_count)}</strong> doctorants
                    </span>
                  </div>
                </Link>
                <div className="researcher-card-footer">
                  {email ? (
                    <a href={`mailto:${email}`}>
                      <Mail size={13} />
                      <span>{email}</span>
                    </a>
                  ) : (
                    <span>Profil du laboratoire</span>
                  )}
                  <span className="member-marker" />
                </div>
              </article>
            );
          })}
        </div>
      )}
      {filtered.length > PAGE_SIZE && (
        <div className="pagination">
          <span>
            Profils {currentPage * PAGE_SIZE + 1}–
            {Math.min((currentPage + 1) * PAGE_SIZE, filtered.length)} sur{" "}
            {filtered.length}
          </span>
          <div>
            <button
              className="icon-button"
              aria-label="Page précédente"
              disabled={!currentPage}
              onClick={() => {
                setPage(currentPage - 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <ArrowLeft size={16} />
            </button>
            <span>
              {currentPage + 1} / {pageCount}
            </span>
            <button
              className="icon-button"
              aria-label="Page suivante"
              disabled={currentPage >= pageCount - 1}
              onClick={() => {
                setPage(currentPage + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
