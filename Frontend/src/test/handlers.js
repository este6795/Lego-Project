import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/users", () => {
    return HttpResponse.json([
      { id: 1, name: "Ada" }, // for testing in the future
      { id: 2, name: "Linus" },
    ]);
  }),
];
