import { Users, FolderKanban } from "lucide-react";
import { useLaboratory } from "../context/laboratory";
export default function NetworkSubNav({ onSelectElement }) {
  const { researchers, projects, loading } = useLaboratory();
  const select = (event, kind, items, identity) => {
    const item = items.find(
      (row) => String(row[identity]) === event.target.value,
    );
    if (item) onSelectElement(kind, item);
    event.target.value = "";
  };
  return (
    <div className="atlas-navigation">
      <span>Aller directement à</span>
      <label>
        <Users size={15} />
        <select
          aria-label="Explorer un chercheur dans le réseau"
          defaultValue=""
          disabled={loading && !researchers.length}
          onChange={(e) => select(e, "researcher", researchers, "_unique_id")}
        >
          <option value="" disabled>
            Un chercheur
          </option>
          {[...researchers]
            .sort((a, b) => a.name.localeCompare(b.name, "fr"))
            .map((r) => (
              <option key={r._unique_id} value={r._unique_id}>
                {r.name}
              </option>
            ))}
        </select>
      </label>
      <label>
        <FolderKanban size={15} />
        <select
          aria-label="Explorer un projet dans le réseau"
          defaultValue=""
          disabled={loading && !projects.length}
          onChange={(e) => select(e, "project", projects, "_unique_id")}
        >
          <option value="" disabled>
            Un projet
          </option>
          {[...projects]
            .sort((a, b) => a.NOM.localeCompare(b.NOM, "fr"))
            .map((p) => (
              <option key={p._unique_id || p.NOM} value={p._unique_id || p.NOM}>
                {p.NOM}
              </option>
            ))}
        </select>
      </label>
    </div>
  );
}
