import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../lib/api";
import {
  ArrowLeft,
  BookOpen,
  Layers,
  Award,
  ExternalLink,
  Calendar,
  FolderOpen,
  Database,
  GraduationCap,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { motion as Motion } from "framer-motion";
import ExportWidget from "../components/ExportWidget";
import { PageHeader } from "../components/WorkspaceUI";
import { categoryLabel, initials } from "../context/laboratory";

const COLORS = [
  "#43694f",
  "#a7bd78",
  "#c0a17e",
  "#829f9c",
  "#998896",
  "#d8ca92",
];

export default function Dashboard() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dbStats, setDbStats] = useState(null);
  const [phdStudents, setPhdStudents] = useState([]);

  // Filters State
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [selectedKeyword, setSelectedKeyword] = useState("");
  const [allKeywords, setAllKeywords] = useState([]);

  const fetchData = () => {
    setError(null);
    setLoading(true);
    api
      .get(`/researcher/${id}`, {
        params: {
          start_year: startYear || undefined,
          end_year: endYear || undefined,
          keyword: selectedKeyword || undefined,
        },
      })
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(
          "Impossible de charger ce profil. Réessayez depuis l’annuaire.",
        );
        setLoading(false);
      });
  };

  // Initial Load & ID Change
  useEffect(() => {
    setStartYear("");
    setEndYear("");
    setSelectedKeyword("");
    setAllKeywords([]);
    setDbStats(null);

    setLoading(true);
    api
      .get(`/researcher/${id}`)
      .then((res) => {
        setData(res.data);
        setPhdStudents(res.data.phd_students || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(
          "Impossible de charger ce profil. Réessayez depuis l’annuaire.",
        );
        setLoading(false);
      });

    api
      .get(`/api/researchers/${id}/publications`)
      .then((res) => setDbStats({ pub_count: res.data.total }))
      .catch(() => {});
  }, [id]);

  // Keep track of initial keywords for the dropdown so it doesn't disappear on filter

  useEffect(() => {
    if (data && data.stats && data.stats.hal && allKeywords.length === 0) {
      const keys = Object.keys(data.stats.hal.top_keywords || {});
      if (keys.length > 0) setAllKeywords(keys);
    }
  }, [data, allKeywords.length]);

  const handleKeywordChange = (e) => {
    setSelectedKeyword(e.target.value);
  };

  const handleYearStartChange = (e) => {
    const val = e.target.value;
    setStartYear(val ? parseInt(val) : "");
  };

  const handleYearEndChange = (e) => {
    const val = e.target.value;
    setEndYear(val ? parseInt(val) : "");
  };

  const handleApplyFilters = () => {
    fetchData();
  };

  const handleClearFilters = () => {
    setStartYear("");
    setEndYear("");
    setSelectedKeyword("");
    // Trigger fetch with empty params immediately
    setLoading(true);
    api
      .get(`/researcher/${id}`)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  if (loading && !data)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );

  if (error)
    return <div className="p-10 text-center text-red-500">{error}</div>;

  const { profile, stats } = data;
  const hal = stats.hal;
  const dblp = stats.dblp;

  // --- Data Processing Restore ---
  const sourceStats = hal.found ? hal : dblp;

  const yearData = Object.entries(sourceStats.years_distribution || {})
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year);

  const DOC_TYPE_MAPPING = {
    ART: "Articles de revue",
    COMM: "Communications",
    OUV: "Book",
    COUV: "Chapitres d’ouvrages",
    DOUV: "Direction d’ouvrages",
    PATENT: "Patent",
    OTHER: "Autres publications",
    UNDEFINED: "Undefined",
    THESE: "Thesis",
    HDR: "Habilitation (HDR)",
    REPORT: "Report",
    POSTER: "Poster",
    VIDEO: "Video",
    SOFTWARE: "Software",
    LECTURE: "Lecture",
    MAP: "Map",
    IMG: "Image",
    SON: "Sound",
    PRESCONF: "Keynote / Invited Talk",
    CREPORT: "Research Report",
    ETHESE: "Thesis (Electronic)",
    MEM: "Student Memoir",
    PROCEEDINGS: "Proceedings",
    ISSUE: "Special Issue",
    BLOG: "Blog Post",
    NOTICE: "Encyclopedia Entry",
    TRAD: "Translation",
  };

  const allTypeData = Object.entries(sourceStats.types_distribution || {})
    .map(([name, value]) => ({
      name: DOC_TYPE_MAPPING[name] || name,
      value,
    }))
    .sort((a, b) => b.value - a.value);

  // Filter to Top 4 + Autres
  const top4 = allTypeData.slice(0, 4);
  const rest = allTypeData.slice(4);
  const othersCount = rest.reduce((acc, curr) => acc + curr.value, 0);

  const typeData =
    othersCount > 0 ? [...top4, { name: "Autres", value: othersCount }] : top4;

  // -------------------------------
  // -------------------------------

  return (
    <div className="profile-page analysis-view page-enter">
      <Link
        to="/researchers"
        className="profile-back inline-flex items-center space-x-2 text-slate-500 hover:text-blue-600 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" /> <span>Tous les chercheurs</span>
      </Link>

      <section className="profile-hero panel">
        <div className="profile-avatar">{initials(profile.name)}</div>
        <div className="profile-hero-content">
          <PageHeader
            eyebrow={`PROFIL / ${categoryLabel(profile.category)}`}
            title={profile.name}
            description="Parcours scientifique, publications et collaborations."
          />
          <div className="profile-meta">
            <span>
              <Database size={14} />
              {dbStats
                ? dbStats.pub_count
                : (hal.total_publications ?? "—")}{" "}
              publications dans l’entrepôt HAL
            </span>
            {profile.office && (
              <span>
                <Layers size={14} />
                Bureau {profile.office}
              </span>
            )}
            {phdStudents.length > 0 && (
              <span>
                <GraduationCap size={15} />
                {phdStudents.length} doctorants associés
              </span>
            )}
            {profile.url_listic && (
              <a href={profile.url_listic} target="_blank" rel="noreferrer">
                <ExternalLink size={14} />
                Profil institutionnel
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-gray-100 flex flex-wrap gap-6 items-end justify-between">
        <div className="flex flex-wrap gap-6 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Année de début
            </label>
            <input
              type="number"
              aria-label="Année de début du profil"
              placeholder="Ex. 2015"
              value={startYear}
              onChange={handleYearStartChange}
              className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Année de fin
            </label>
            <input
              type="number"
              aria-label="Année de fin du profil"
              placeholder="Ex. 2025"
              value={endYear}
              onChange={handleYearEndChange}
              className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
            />
          </div>
          <div className="flex flex-col gap-1 min-w-[200px]">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Sujet de recherche
            </label>
            <select
              aria-label="Sujet de recherche du profil"
              value={selectedKeyword}
              onChange={handleKeywordChange}
              className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Tous les sujets</option>
              {allKeywords.map((kw, i) => (
                <option key={i} value={kw}>
                  {kw}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleApplyFilters}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition"
            >
              Appliquer les filtres
            </button>

            {(startYear || endYear || selectedKeyword) && (
              <button
                onClick={handleClearFilters}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-2 px-4 rounded-md transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <ExportWidget
          data={data}
          jsonFilename={`${profile.name.replace(/\s+/g, "_")}_stats`}
          csvOptions={[
            {
              label: "Évolution des publications",
              data: yearData,
              filename: `${profile.name}_timeline`,
              description: "Publications per year",
            },
            {
              label: "Publications récentes",
              data: sourceStats.recent_publications,
              filename: `${profile.name}_recent_pubs`,
              description: "List of papers",
            },
            {
              label: "Thématiques de recherche",
              data: sourceStats.top_keywords
                ? Object.entries(sourceStats.top_keywords).map(([k, v]) => ({
                    keyword: k,
                    count: v,
                  }))
                : [],
              filename: `${profile.name}_keywords`,
              description: "Topic frequency",
            },
            {
              label: "Collaborateurs",
              data: sourceStats.top_collaborators
                ? Object.entries(sourceStats.top_collaborators).map(
                    ([k, v]) => ({ name: k, count: v }),
                  )
                : [],
              filename: `${profile.name}_collaborators`,
              description: "Top co-authors",
            },
          ]}
        />
      </div>

      {/* Visualizations - Wait I need to keep the code flow correct */}

      {/* Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Timeline */}
        <Motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 bg-white"
        >
          <h3 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" /> Évolution des
            publications
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={yearData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#43694f" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#43694f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--line)"
                />
                <XAxis
                  dataKey="year"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted)", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted)", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Area
                  isAnimationActive={false}
                  type="monotone"
                  dataKey="count"
                  stroke="#43694f"
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Motion.div>

        {/* Types de documents */}
        <Motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 bg-white"
        >
          <h3 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-500" /> Types de documents
          </h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  isAnimationActive={false}
                  data={typeData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Motion.div>
      </div>

      {/* Keywords Cloud & Recent Pubs & Collaborateurs & Venues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Keywords Bar Chart */}
        {sourceStats.top_keywords &&
          Object.keys(sourceStats.top_keywords).length > 0 && (
            <div className="lg:col-span-1 glass-card p-6 bg-white">
              <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" /> Thématiques de
                recherche
              </h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(sourceStats.top_keywords)
                      .map(([name, value]) => ({ name, value }))
                      .sort((a, b) => b.value - a.value)
                      .slice(0, 10)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="var(--line)"
                    />
                    <XAxis
                      type="number"
                      stroke="#9ca3af"
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={140}
                      tick={{ fontSize: 11 }}
                      stroke="var(--muted)"
                      tickFormatter={(value) =>
                        value.length > 20
                          ? `${value.substring(0, 20)}...`
                          : value
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar
                      isAnimationActive={false}
                      dataKey="value"
                      name="Occurrences"
                      fill="#9eaf76"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        {/* Collaborateurs */}
        <div className="lg:col-span-2 glass-card p-6 bg-white">
          <h3 className="text-lg font-bold text-slate-700 mb-4">
            Collaborations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sourceStats.top_collaborators &&
              Object.entries(sourceStats.top_collaborators)
                .slice(0, 10)
                .map(([name, count], i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-2 rounded hover:bg-slate-50 border-b border-slate-50 last:border-0"
                  >
                    <span
                      className="font-medium text-slate-700 truncate"
                      title={name}
                    >
                      {name}
                    </span>
                    <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-full">
                      {count} Papiers
                    </span>
                  </div>
                ))}
            {(!sourceStats.top_collaborators ||
              Object.keys(sourceStats.top_collaborators).length === 0) && (
              <div className="text-slate-400 italic">
                No collaborator info available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Venues & Recent Pubs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Venues Bar Chart */}
        <div className="glass-card p-6 bg-white">
          <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-500" /> Revues et conférences
          </h3>
          <div className="h-[400px]">
            {sourceStats.top_venues || sourceStats.top_journals ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(
                    sourceStats.top_venues || sourceStats.top_journals || {},
                  )
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 10)}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="var(--line)"
                  />
                  <XAxis
                    type="number"
                    stroke="#9ca3af"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={140}
                    tick={{ fontSize: 11 }}
                    stroke="var(--muted)"
                    tickFormatter={(value) =>
                      value.length > 20 ? `${value.substring(0, 20)}...` : value
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar
                    isAnimationActive={false}
                    dataKey="value"
                    name="Publications"
                    fill="#ac9278"
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 italic h-full flex items-center justify-center">
                No venue info available.
              </div>
            )}
          </div>
        </div>

        {/* Recent Pubs */}
        <div className="glass-card p-6 bg-white">
          <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" /> Publications récentes
          </h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {sourceStats.recent_publications?.map((pub, i) => (
              <div
                key={i}
                className="flex gap-4 items-start p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-blue-200 transition"
              >
                <div className="mt-1 min-w-[40px] text-center">
                  <span className="block text-sm font-bold text-slate-700">
                    {pub.year || pub.producedDateY_i}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <a
                    href={
                      pub.url ||
                      `https://scholar.google.com/scholar?q=${encodeURIComponent(pub.title || pub.title_s?.[0])}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="block font-medium text-slate-800 hover:text-blue-600 truncate transition mb-1"
                    title={pub.title || pub.title_s?.[0]}
                  >
                    {pub.title || pub.title_s?.[0]}
                  </a>
                  <div className="text-xs text-slate-500 truncate">
                    {pub.venue || pub.journalTitle_s}
                  </div>
                </div>
              </div>
            ))}
            {(!sourceStats.recent_publications ||
              sourceStats.recent_publications.length === 0) && (
              <div className="text-slate-400 italic">
                No recent publications found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Doctorants Panel */}
      {phdStudents.length > 0 && (
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 bg-white mb-8"
        >
          <h3 className="text-lg font-bold text-slate-700 mb-5 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-500" />
            Doctorants Supervised
            <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
              {phdStudents.length}
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {phdStudents.map((doc, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border ${
                  doc.status === "defended"
                    ? "border-slate-200 bg-slate-50 dark:bg-slate-800/30"
                    : "border-emerald-100 bg-emerald-50 dark:bg-emerald-900/10"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold text-slate-800 dark:text-white text-sm leading-tight">
                    {doc.name}
                  </p>
                  <span
                    className={`flex-shrink-0 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                      doc.status === "defended"
                        ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                        : "bg-emerald-200 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                    }`}
                  >
                    {doc.status === "defended" ? (
                      <>
                        <CheckCircle className="w-3 h-3" /> Soutenues
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" /> En cours
                      </>
                    )}
                  </span>
                </div>
                {doc.sujet && doc.sujet !== "Non trouve" && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                    {doc.sujet}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  {doc.start_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Since {doc.start_date.substring(0, 7)}
                    </span>
                  )}
                  {doc.theme && doc.theme !== "Non trouve" && (
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded font-medium">
                      {doc.theme}
                    </span>
                  )}
                  {doc.defense_date && (
                    <span className="text-slate-400">
                      Soutenues {doc.defense_date}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Motion.div>
      )}

      {!hal.found && !dblp.found && (
        <div className="mt-8 p-4 bg-yellow-50 text-yellow-700 rounded-lg text-center">
          We couldn't find detailed statistics for this researcher in public
          databases (HAL/DBLP).
        </div>
      )}
    </div>
  );
}
