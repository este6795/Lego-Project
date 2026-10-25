import useAnalysisHistory from "../../hooks/useAnalysisHistory";
import AnalysisHistory from "./AnalysisHistory";

function AnalysisHistoryPage() {
  const { analyses, loading, error, removeAnalysis } = useAnalysisHistory();

  if (loading) return <p>Loading your analysis history…</p>;
  if (error)
    return (
      <p className="error">
        Could not load analysis history: {error.message}
      </p>
    );

  return <AnalysisHistory analyses={analyses} onDelete={removeAnalysis} />;
}

export default AnalysisHistoryPage;
