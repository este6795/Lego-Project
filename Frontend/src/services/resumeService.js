import { apiRequest, BASE_URL } from "./api";

export function uploadResume(file, jobPosting = "") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("job_posting", jobPosting); // will handle empty job posting backend side. (yes, an extra field all the time)
  return apiRequest("/api/resumes/", { method: "POST", body: formData });
}

export function getResume(id) {
  return apiRequest(`/api/resumes/${id}/`);
}

export function getResumeFileUrl(id) {
  return `${BASE_URL}/api/resumes/${id}/file/`;
}

export function getAnalysis(id) {
  return apiRequest(`/api/analyses/${id}/`);
}

export function listAnalyses() {
  return apiRequest("/api/analyses/");
}
