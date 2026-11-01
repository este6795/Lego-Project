import { apiRequest } from "./api";

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toHistoryEntry(item) {
  return {
    id: item.id,
    status: item.status,
    matchScore: item.match_score,
    skillsMatched: item.matched_count,
    skillsTotal: item.matched_count + item.missing_count,
    hasJobPosting: item.has_job_posting,
    resumeFileName: item.filename,
    analyzedDate: formatDate(item.created_at),
  };
}

export function deleteAnalysis(id) {
  return apiRequest(`/api/analyses/${id}/`, { method: "DELETE" });
}

export async function getAnalysisHistory() {
  const items = await apiRequest("/api/analyses/");
  return items.map(toHistoryEntry);
}
