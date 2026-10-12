import { createContext, useContext } from "react";
export const LaboratoryContext = createContext(null);
export function useLaboratory() {
  const value = useContext(LaboratoryContext);
  if (!value) throw new Error("LaboratoryProvider requis");
  return value;
}
export const categoryLabel = (value) =>
  ({
    enseignants_chercheurs: "Enseignants-chercheurs",
    émérite: "Émérites",
    "administratif et technique": "Équipe technique",
    administratif_et_technique: "Équipe technique",
    doctorants: "Doctorants",
    administratifs_techniques: "Équipe technique",
    chercheurs_associes: "Chercheurs associés",
    emerites: "Émérites",
    collaborateurs_benevoles: "Collaborateurs bénévoles",
  })[value] ||
  value?.replaceAll("_", " ") ||
  "Membre du laboratoire";
export const number = (value) =>
  typeof value === "number"
    ? new Intl.NumberFormat("fr-FR").format(value)
    : "—";
export const initials = (name) =>
  (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("");
export function openOracle(question = "") {
  window.dispatchEvent(
    new CustomEvent("listic:oracle", { detail: { question } }),
  );
}

export function emailAddress(value) {
  if (typeof value !== "string") return null;
  const address = value.replace(/\s*-@-\s*|\s*@\s*/g, "@").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) ? address : null;
}
