import { useEffect, useState } from "react";
import { Play, Pause, RotateCcw, CalendarDays } from "lucide-react";
import { useLaboratory, number } from "../context/laboratory";
export default function TimeMachineSlider({ activeYear, onYearChange }) {
  const { yearly, loading } = useLaboratory();
  const [playing, setPlaying] = useState(false);
  const min = 2010;
  const max = new Date().getFullYear();
  const byYear = yearly?.global_by_year || {};
  const maxCount = Math.max(...Object.values(byYear), 1);
  const total = Object.entries(byYear)
    .filter(([year]) => Number(year) <= activeYear)
    .reduce((sum, [, count]) => sum + count, 0);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      if (activeYear >= max) setPlaying(false);
      else onYearChange(activeYear + 1);
    }, 900);
    return () => clearInterval(timer);
  }, [playing, activeYear, max, onYearChange]);
  return (
    <section
      className="research-timeline"
      aria-label="Évolution du corpus par année"
    >
      <div className="timeline-label">
        <CalendarDays size={20} strokeWidth={1.3} />
        <div>
          <span className="eyebrow">PRENDRE DU RECUL</span>
          <h3>La recherche au fil du temps.</h3>
        </div>
      </div>
      <div className="timeline-year">
        {activeYear}
        <span>ANNÉE OBSERVÉE</span>
      </div>
      <div className="timeline-counts">
        <span>
          <strong>{yearly ? number(byYear[activeYear] || 0) : "—"}</strong>
          publications cette année
        </span>
        <span>
          <strong>{yearly ? number(total) : "—"}</strong>cumulées depuis {min}
        </span>
      </div>
      <div className="timeline-control">
        <div className="timeline-bars">
          {Array.from({ length: max - min + 1 }, (_, i) => min + i).map(
            (year) => (
              <button
                key={year}
                onClick={() => {
                  setPlaying(false);
                  onYearChange(year);
                }}
                aria-label={`Année ${year}, ${byYear[year] || 0} publications`}
                title={`${year} · ${byYear[year] || 0} publications`}
                className={year === activeYear ? "is-active" : ""}
              >
                <span
                  style={{
                    height: `${((byYear[year] || 0) / maxCount) * 100}%`,
                  }}
                />
              </button>
            ),
          )}
        </div>
        <input
          aria-label="Année observée"
          type="range"
          min={min}
          max={max}
          step="1"
          value={activeYear}
          disabled={!yearly && loading}
          onChange={(e) => {
            setPlaying(false);
            onYearChange(Number(e.target.value));
          }}
        />
        <div className="timeline-axis">
          <span>{min}</span>
          <span>{Math.round((min + max) / 2)}</span>
          <span>{max}</span>
        </div>
      </div>
      <div className="timeline-buttons">
        <button
          className="icon-button"
          aria-label="Revenir à l’année actuelle"
          onClick={() => {
            setPlaying(false);
            onYearChange(max);
          }}
        >
          <RotateCcw size={15} />
        </button>
        <button
          className="button button-secondary"
          onClick={() => {
            if (!playing && activeYear >= max) onYearChange(min);
            setPlaying(!playing);
          }}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
          {playing ? "Pause" : "Parcourir"}
        </button>
      </div>
    </section>
  );
}
