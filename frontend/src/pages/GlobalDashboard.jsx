import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CalendarDays, BookOpen, Globe, Layers, Users } from "lucide-react";
import {
  PageHeader,
  StatCard,
  SectionHeading,
  EmptyState,
  LoadingState,
} from "../components/WorkspaceUI";
import { number } from "../context/laboratory";
import ExportWidget from "../components/ExportWidget";
import api from "../lib/api";
const COLORS = [
  "#43694f",
  "#a7bd78",
  "#c0a17e",
  "#829f9c",
  "#998896",
  "#d8ca92",
];
const TYPE_LABELS = {
  ART: "Articles",
  COMM: "Conférences",
  OUV: "Ouvrages",
  COUV: "Chapitres",
  DOUV: "Direction d’ouvrages",
  THESE: "Thèses",
  HDR: "Habilitations",
  REPORT: "Rapports",
  POSTER: "Posters",
  OTHER: "Autres",
  UNDEFINED: "Non défini",
  SOFTWARE: "Logiciels",
};
const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: 8,
  color: "var(--ink)",
  fontSize: 11,
};
export default function GlobalDashboard() {
  const currentYear = new Date().getFullYear();
  const [start, setStart] = useState(currentYear - 9);
  const [end, setEnd] = useState(currentYear);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const valid =
    Number.isInteger(Number(start)) &&
    Number.isInteger(Number(end)) &&
    start !== "" &&
    end !== "" &&
    Number(start) >= 1900 &&
    Number(end) <= 2100 &&
    Number(start) <= Number(end);
  useEffect(() => {
    if (!valid) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const r = await api.get("/global-stats", {
          params: { start_year: Number(start), end_year: Number(end) },
          signal: controller.signal,
          timeout: 20000,
        });
        if (r.data.hal?.error || !Array.isArray(r.data.hal?.years))
          throw new Error("HAL indisponible");
        if (!controller.signal.aborted)
          setResult({ data: r.data.hal, start, end });
      } catch {
        if (!controller.signal.aborted)
          setError(
            "La source HAL ne répond pas. Vous pouvez réessayer ou consulter les comptages locaux sur la vue d’ensemble.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [start, end, retry, valid]);
  const data = result?.data;
  const isUpdating = loading && valid;
  const types = (data?.types || []).map((t) => ({
    ...t,
    name: TYPE_LABELS[t.name] || t.name,
  }));
  const peak = [...(data?.years || [])].sort((a, b) => b.value - a.value)[0];
  const keywords = (data?.keywords || []).slice(0, 12);
  return (
    <div className="science-page page-enter">
      <PageHeader
        eyebrow="05 / PRODUCTION SCIENTIFIQUE"
        title={
          <>
            La science laisse
            <br />
            <em>une empreinte.</em>
          </>
        }
        description="Suivez l’évolution des publications, les sujets explorés et les collaborations institutionnelles du laboratoire."
        actions={
          data && (
            <ExportWidget
              data={data}
              jsonFilename="listic_production_scientifique"
              csvOptions={[
                {
                  label: "Publications par année",
                  data: data.years,
                  filename: "listic_evolution",
                  description: "Comptages annuels HAL",
                },
                {
                  label: "Mots-clés",
                  data: data.keywords,
                  filename: "listic_mots_cles",
                  description: "Thématiques présentes dans les publications",
                },
              ]}
            />
          )
        }
      />
      <div className="science-filters">
        <span>
          <CalendarDays size={16} />
          Période d’observation
        </span>
        <div className="year-inputs">
          <label>
            De
            <input
              aria-label="Année de début"
              type="number"
              min="1900"
              max="2100"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <span>—</span>
          <label>
            À
            <input
              aria-label="Année de fin"
              type="number"
              min="1900"
              max="2100"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
        </div>
        <div className="period-shortcuts">
          {[5, 10].map((years) => (
            <button
              key={years}
              onClick={() => {
                setStart(currentYear - years + 1);
                setEnd(currentYear);
              }}
            >
              {years} ans
            </button>
          ))}
          <button
            onClick={() => {
              setStart(2010);
              setEnd(currentYear);
            }}
          >
            Depuis 2010
          </button>
        </div>
        <span className="source-tag">
          <i />
          HAL · données en direct
        </span>
      </div>
      {!valid && (
        <p className="inline-notice" role="alert">
          Choisissez deux années entre 1900 et 2100, avec une année de début
          inférieure ou égale à l’année de fin.
        </p>
      )}
      {error && (
        <div className="inline-notice" role="alert">
          {error}
          <button className="text-link" onClick={() => setRetry((r) => r + 1)}>
            Réessayer
          </button>
        </div>
      )}
      {isUpdating && !data ? (
        <LoadingState label="Lecture des indicateurs scientifiques sur HAL…" />
      ) : !data ? (
        <EmptyState
          title="Les indicateurs ne sont pas disponibles"
          description="La vue d’ensemble reste accessible avec les publications déjà synchronisées."
          onRetry={() => setRetry((r) => r + 1)}
        />
      ) : (
        <div
          className={
            isUpdating ? "science-results is-updating" : "science-results"
          }
          aria-busy={isUpdating}
        >
          <p className="science-scope">
            {isUpdating
              ? "Actualisation en cours…"
              : `Période affichée : ${result.start}–${result.end}. Publications référencées avec la structure LISTIC sur HAL.`}
          </p>
          <div className="stats-grid">
            <StatCard
              icon={BookOpen}
              value={number(data.total_docs)}
              label="Publications HAL"
              detail={`Sur la période ${result.start}–${result.end}`}
            />
            <StatCard
              icon={Layers}
              value={number(types.length)}
              label="Types de documents"
              detail="La recherche sous toutes ses formes"
            />
            <StatCard
              icon={Users}
              value={number((data.authors || []).length)}
              label="Auteurs dans les facettes"
              detail="Jusqu’aux 50 noms renvoyés par HAL"
            />
            <StatCard
              icon={Globe}
              value={number((data.languages || []).length)}
              label="Langues de publication"
              detail="Langues représentées dans les résultats"
            />
          </div>
          <div className="science-chart-grid">
            <section className="panel">
              <SectionHeading
                eyebrow="DYNAMIQUE DE PUBLICATION"
                title="Les idées prennent forme."
              />
              <div className="science-chart">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <AreaChart
                    data={data.years}
                    margin={{ left: -20, right: 10, top: 15, bottom: 10 }}
                  >
                    <defs>
                      <linearGradient
                        id="science-fill"
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                      >
                        <stop
                          offset="0"
                          stopColor="#43694f"
                          stopOpacity={0.2}
                        />
                        <stop offset="1" stopColor="#43694f" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="var(--line)"
                      vertical={false}
                      strokeDasharray="3 5"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "var(--muted)" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "var(--muted)" }}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value) => [number(value), "Publications"]}
                    />
                    <Area
                      isAnimationActive={false}
                      dataKey="value"
                      type="monotone"
                      stroke="var(--accent)"
                      strokeWidth={2.5}
                      fill="url(#science-fill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {peak && (
                <div className="chart-footnote">
                  Année la plus représentée : <strong>{peak.name}</strong>
                  <span className="chart-peak">
                    {number(peak.value)} publications
                  </span>
                </div>
              )}
            </section>
            <section className="panel">
              <SectionHeading
                eyebrow="FORMES DE LA RECHERCHE"
                title="Une diversité de travaux."
              />
              {types.length ? (
                <>
                  <div className="science-donut">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      minWidth={0}
                    >
                      <PieChart>
                        <Pie
                          isAnimationActive={false}
                          data={types}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={57}
                          outerRadius={84}
                          paddingAngle={3}
                          stroke="var(--surface)"
                        >
                          {types.map((t, i) => (
                            <Cell
                              key={t.name}
                              fill={COLORS[i % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(value) => [number(value), "Documents"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="chart-legend">
                    {types.map((t, i) => (
                      <div key={t.name}>
                        <i style={{ background: COLORS[i % COLORS.length] }} />
                        <span>{t.name}</span>
                        <strong>{number(t.value)}</strong>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState title="Aucun type de document" />
              )}
            </section>
          </div>
          <div className="science-bottom-grid">
            <section className="panel">
              <SectionHeading
                eyebrow="LES SUJETS EXPLORÉS"
                title="Le vocabulaire de la recherche."
              />
              <div className="keyword-cloud">
                {keywords.map((keyword, i) => (
                  <span
                    key={keyword.name}
                    className={i < 3 ? "is-featured" : ""}
                  >
                    {keyword.name}
                    <small>{number(keyword.value)}</small>
                  </span>
                ))}
              </div>
              {!keywords.length && (
                <EmptyState title="Aucun mot-clé disponible" />
              )}
            </section>
            <section className="panel">
              <SectionHeading
                eyebrow="COLLABORATIONS INSTITUTIONNELLES"
                title="Au-delà du laboratoire."
              />
              {data.structures?.length ? (
                <div className="institution-bars">
                  {data.structures.slice(0, 5).map((s) => (
                    <div key={s.name}>
                      <div>
                        <span>{s.name}</span>
                        <strong>{number(s.value)}</strong>
                      </div>
                      <div className="institution-bar">
                        <span
                          style={{
                            width: `${(s.value / Math.max(...data.structures.map((item) => item.value), 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="Aucune structure associée disponible" />
              )}
            </section>
          </div>
          <div className="science-bottom-grid">
            <section className="panel">
              <SectionHeading
                eyebrow="AUTEURS / FACETTES HAL"
                title="Des contributions partagées."
              />
              <div className="science-chart">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart
                    data={(data.authors || []).slice(0, 8)}
                    layout="vertical"
                    margin={{ left: 0, right: 10 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={125}
                      tick={{ fontSize: 9, fill: "var(--muted)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value) => [number(value), "Publications"]}
                    />
                    <Bar
                      isAnimationActive={false}
                      dataKey="value"
                      fill="#8d9e6e"
                      radius={[0, 3, 3, 0]}
                      barSize={13}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
            <section className="panel">
              <SectionHeading
                eyebrow="SUPPORTS & LANGUES"
                title="Partager la connaissance."
              />
              <div className="journal-list">
                {(data.journals || []).slice(0, 5).map((j) => (
                  <div key={j.name}>
                    <span>{j.name}</span>
                    <strong>{number(j.value)}</strong>
                  </div>
                ))}
              </div>
              <div className="language-tags">
                {(data.languages || []).map((l) => (
                  <span key={l.name}>
                    {{
                      en: "Anglais",
                      fr: "Français",
                      de: "Allemand",
                      es: "Espagnol",
                      it: "Italien",
                    }[l.name] || l.name.toUpperCase()}
                    <strong>{number(l.value)}</strong>
                  </span>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
