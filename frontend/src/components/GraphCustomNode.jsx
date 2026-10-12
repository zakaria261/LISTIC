import { Handle, Position } from "@xyflow/react";
export default function GraphCustomNode({ data, selected }) {
  const { color = "#43694f", label = "Élément", type = "default" } = data;
  return (
    <div
      className={`atlas-node ${type === "root" ? "is-root" : ""} ${selected ? "is-selected" : ""}`}
    >
      {type !== "root" && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: "var(--accent)", borderColor: "var(--surface)" }}
        />
      )}
      <span className="atlas-node-marker" style={{ background: color }} />
      <span className="atlas-node-label">{label}</span>
      {data.subLabel && (
        <span className="atlas-node-caption">{data.subLabel}</span>
      )}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "var(--accent)", borderColor: "var(--surface)" }}
      />
    </div>
  );
}
