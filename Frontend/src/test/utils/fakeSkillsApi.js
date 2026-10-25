import { http, HttpResponse } from "msw";

// A tiny in-memory copy of the backend's /api/profile/skills/ endpoints, with the same
// rules: names sorted ignoring case, duplicates rejected with a 400 and the same message.
// Usage in a test:  const api = fakeSkillsApi([{ id: 1, name: "Python" }]);
//                   server.use(...api.handlers);
// The "*/" prefix matches whether VITE_API_URL is empty or a full http://host:port URL.
export function fakeSkillsApi(initial = []) {
  let skills = initial.map((skill) => ({ ...skill }));
  let nextId = Math.max(0, ...skills.map((skill) => skill.id)) + 1;

  const sorted = () =>
    [...skills].sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
    );

  const handlers = [
    http.get("*/api/profile/skills/", () => HttpResponse.json(sorted())),

    http.post("*/api/profile/skills/", async ({ request }) => {
      const { name } = await request.json();
      if (skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
        return HttpResponse.json(
          { error: `${name} is already in your skills.` },
          { status: 400 },
        );
      }
      const created = { id: nextId++, name };
      skills.push(created);
      return HttpResponse.json(created, { status: 201 });
    }),

     http.post("*/api/profile/skills/import/", async ({ request }) => {
      const { names } = await request.json();
      const added = [];
      const skipped = [];
      for (const raw of names) {
        const name = typeof raw === "string" ? raw.trim().replace(/\s+/g, " ") : "";
        if (!name) {
          skipped.push({ name: "", reason: "invalid" });
        } else if (skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
          skipped.push({ name, reason: "duplicate" });
        } else {
          const created = { id: nextId++, name };
          skills.push(created);
          added.push(created);
        }
      }
      return HttpResponse.json({ added, skipped });
    }),

    http.delete("*/api/profile/skills/:id/", ({ params }) => {
      const id = Number(params.id);
      if (!skills.some((skill) => skill.id === id)) {
        return HttpResponse.json({ error: "Skill not found" }, { status: 404 });
      }
      skills = skills.filter((skill) => skill.id !== id);
      return new HttpResponse(null, { status: 204 });
    }),
  ];

  return { handlers, all: sorted };
}