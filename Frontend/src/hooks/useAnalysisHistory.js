import { useCallback, useEffect, useState } from "react";
import {
  deleteAnalysis,
  getAnalysisHistory,
} from "../services/analysisHistoryService";

function useAnalysisHistory() {
  const [analyses, setAnalyses] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getAnalysisHistory()
      .then((items) => {
        if (!cancelled) setAnalyses(items);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const removeAnalysis = useCallback(async (id) => {
    await deleteAnalysis(id);
    setAnalyses((previous) => previous.filter((entry) => entry.id !== id));
  }, []);

  return { analyses, error, loading, removeAnalysis };
}

export default useAnalysisHistory;
