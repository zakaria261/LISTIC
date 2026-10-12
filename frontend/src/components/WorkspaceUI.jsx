import { ArrowUpRight, RotateCcw, SearchX } from "lucide-react";
import { Link } from "react-router-dom";
export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">
          <span />
          {eyebrow}
        </p>
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  to,
  label = "Tout explorer",
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {to && (
        <Link className="text-link" to={to}>
          {label}
          <ArrowUpRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function EmptyState({
  title = "Aucun résultat",
  description = "Essayez une autre recherche ou ajustez les filtres.",
  onRetry,
}) {
  return (
    <div className="empty-state">
      <SearchX size={30} strokeWidth={1.3} />
      <h3>{title}</h3>
      <p>{description}</p>
      {onRetry && (
        <button className="button button-secondary" onClick={onRetry}>
          <RotateCcw size={15} />
          Réessayer
        </button>
      )}
    </div>
  );
}
export function LoadingState({ label = "Chargement des données…" }) {
  return (
    <div className="loading-state" role="status">
      <span className="loader" />
      {label}
    </div>
  );
}
export function StatCard({ icon, value, label, detail }) {
  const Icon = icon;
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <Icon size={18} strokeWidth={1.5} />
      </div>
      <strong>{value}</strong>
      <p>{detail}</p>
    </div>
  );
}
