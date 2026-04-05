import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "server",
          environment: "node",
          include: ["server/tests/**/*.test.js"],
        },
      },
      {
        test: {
          name: "frontend",
          environment: "jsdom",
          include: ["client/tests/**/*.test.js"],
        },
      },
    ],
  },
});
