import { useState, useEffect, useRef, useCallback } from "react";
import api from "../lib/api";
import { LaboratoryContext } from "./laboratory";

const endpoints = {
  researchers: "/api/researchers/cards",
  projects: "/projects",
  sync: "/api/sync/status",
  yearly: "/api/analytics/yearly-stats",
  insights: "/api/analytics/insights",
};
export default function LaboratoryProvider({ children }) {
  const [data, setData] = useState({
    researchers: [],
    projects: [],
    sync: null,
    yearly: null,
    insights: null,
  });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const request = useRef(null);
  const refresh = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    const entries = Object.entries(endpoints);
    const results = await Promise.allSettled(
      entries.map(([, path]) =>
        api.get(path, { signal: controller.signal, timeout: 20000 }),
      ),
    );
    if (controller.signal.aborted) return;
    const next = {};
    const failed = [];
    results.forEach((result, index) => {
      const key = entries[index][0];
      if (result.status === "fulfilled") next[key] = result.value.data;
      else failed.push(key);
    });
    setData((previous) => ({ ...previous, ...next }));
    setErrors(failed);
    setLoading(false);
    if (Object.keys(next).length) setUpdatedAt(new Date());
  }, []);
  useEffect(() => {
    const timer = setTimeout(refresh, 0);
    return () => {
      clearTimeout(timer);
      request.current?.abort();
    };
  }, [refresh]);
  return (
    <LaboratoryContext.Provider
      value={{ ...data, loading, errors, updatedAt, refresh }}
    >
      {children}
    </LaboratoryContext.Provider>
  );
}
