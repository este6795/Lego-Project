// @vitest-environment jsdom
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "../test/setup";
import { fakeSkillsApi } from "../test/utils/fakeSkillsApi";
import { addSkill, deleteSkill, getSkills, importSkills } from "./profileService";
import { removeToken } from "./tokenStorage";

// api.js reads the login token from tokenStorage, so fake that instead of relying on a storage key.
vi.mock("./tokenStorage", () => ({
  getToken: () => "abc123",
  removeToken: vi.fn(),
}));

describe("profileService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getSkills returns the user's saved skills", async () => {
    const api = fakeSkillsApi([
      { id: 2, name: "SQL" },
      { id: 1, name: "Python" },
    ]);
    server.use(...api.handlers);

    await expect(getSkills()).resolves.toEqual([
      { id: 1, name: "Python" },
      { id: 2, name: "SQL" },
    ]);
  });

  it("sends the login token with every request", async () => {
    let authHeader;
    server.use(
      http.get("*/api/profile/skills/", ({ request }) => {
        authHeader = request.headers.get("Authorization");
        return HttpResponse.json([]);
      }),
    );

    await getSkills();

    expect(authHeader).toBe("Token abc123");
  });

  it("addSkill posts the name as JSON and returns the created skill", async () => {
    let body;
    server.use(
      http.post("*/api/profile/skills/", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ id: 5, name: "SQL" }, { status: 201 });
      }),
    );

    await expect(addSkill("SQL")).resolves.toEqual({ id: 5, name: "SQL" });
    expect(body).toEqual({ name: "SQL" });
  });

  it("addSkill throws the backend's message for a duplicate", async () => {
    const api = fakeSkillsApi([{ id: 1, name: "Python" }]);
    server.use(...api.handlers);

    await expect(addSkill("python")).rejects.toMatchObject({
      message: "python is already in your skills.",
      status: 400,
    });
    expect(api.all()).toHaveLength(1);
  });

  it("deleteSkill removes the skill and handles the empty 204 response", async () => {
    const api = fakeSkillsApi([
      { id: 1, name: "Python" },
      { id: 2, name: "SQL" },
    ]);
    server.use(...api.handlers);

    await expect(deleteSkill(1)).resolves.toBe("");
    expect(api.all()).toEqual([{ id: 2, name: "SQL" }]);
  });

  it("deleteSkill throws the backend's message when it isn't allowed", async () => {
    server.use(
      http.delete("*/api/profile/skills/:id/", () =>
        HttpResponse.json(
          { error: "You do not have permission to delete this skill" },
          { status: 403 },
        ),
      ),
    );

    await expect(deleteSkill(9)).rejects.toMatchObject({
      message: "You do not have permission to delete this skill",
      status: 403,
    });
  });

  it("an unauthorized response throws and clears the stored token", async () => {
    server.use(
      http.get("*/api/profile/skills/", () =>
        HttpResponse.json({ detail: "Invalid token." }, { status: 401 }),
      ),
    );
    vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(getSkills()).rejects.toMatchObject({ status: 401 });
    expect(removeToken).toHaveBeenCalled();
  });
});
it("importSkills posts the list of names and returns what was added and skipped", async () => {
    const api = fakeSkillsApi([{ id: 1, name: "Python" }]);
    server.use(...api.handlers);
 
    await expect(importSkills(["python", "SQL"])).resolves.toEqual({
      added: [{ id: 2, name: "SQL" }],
      skipped: [{ name: "python", reason: "duplicate" }],
    });
    expect(api.all().map((skill) => skill.name)).toEqual(["Python", "SQL"]);
  });
 
  it("importSkills sends the names as JSON", async () => {
    let body;
    server.use(
      http.post("*/api/profile/skills/import/", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ added: [], skipped: [] });
      }),
    );
 
    await importSkills(["SQL", "Docker"]);
 
    expect(body).toEqual({ names: ["SQL", "Docker"] });
  });
 
  it("importSkills throws the backend's message when the request is rejected", async () => {
    server.use(
      http.post("*/api/profile/skills/import/", () =>
        HttpResponse.json(
          { error: "You can add up to 100 skills at a time." },
          { status: 400 },
        ),
      ),
    );
 
    await expect(importSkills(["SQL"])).rejects.toMatchObject({
      message: "You can add up to 100 skills at a time.",
      status: 400,
    });
  });