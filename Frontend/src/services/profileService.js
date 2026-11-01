import { apiRequest } from "./api";

export function getSkills() {
  return apiRequest("/api/profile/skills/");
}

export function addSkill(name) {
  return apiRequest("/api/profile/skills/", {
    method: "POST",
    body: { name },
  });
}

export function deleteSkill(id) {
  return apiRequest(`/api/profile/skills/${id}/`, { method: "DELETE" });
}

export function importSkills(names) {
  return apiRequest("/api/profile/skills/import/", {
    method: "POST",
    body: { names },
  });
}