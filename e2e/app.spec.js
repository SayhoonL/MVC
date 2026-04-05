// @ts-check
import { test, expect } from "@playwright/test";

// Unique username per test run to avoid collisions in the in-memory store
function uid() {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

test.describe("TaskFlow E2E", () => {
  let username;
  const password = "pass123!";

  test.beforeEach(async ({ page }) => {
    username = uid();
    await page.goto("/");
  });

  // ─── Auth ────────────────────────────────────────────────────────────────────

  test.describe("Authentication", () => {
    test("shows auth overlay on first load", async ({ page }) => {
      await expect(page.locator(".auth-overlay")).toBeVisible();
      await expect(page.locator("#app")).toBeHidden();
    });

    test("can sign up and log in", async ({ page }) => {
      // Switch to sign-up tab
      await page.getByRole("button", { name: "Sign Up" }).click();
      await expect(page.locator("#auth-submit")).toHaveText("Create Account");

      await page.fill("#auth-username", username);
      await page.fill("#auth-password", password);
      await page.click("#auth-submit");

      // App should appear
      await expect(page.locator("#app")).toBeVisible();
      await expect(page.locator(".auth-overlay")).toBeHidden();
      await expect(page.locator("#username-display")).toContainText(username);
    });

    test("shows error for wrong password", async ({ page }) => {
      // First sign up and log in
      await page.getByRole("button", { name: "Sign Up" }).click();
      await page.fill("#auth-username", username);
      await page.fill("#auth-password", password);
      await page.click("#auth-submit");
      await expect(page.locator("#app")).toBeVisible();

      // Log out — auth overlay re-appears
      await page.click("#logout-btn");
      await expect(page.locator(".auth-overlay")).toBeVisible();
      await expect(page.locator("#auth-submit")).toBeEnabled();

      // Try wrong password
      await page.fill("#auth-username", username);
      await page.fill("#auth-password", "wrongpassword");
      await page.click("#auth-submit");

      await expect(page.locator("#auth-error")).toBeVisible();
      await expect(page.locator(".auth-overlay")).toBeVisible();
    });

    test("can log out", async ({ page }) => {
      await page.getByRole("button", { name: "Sign Up" }).click();
      await page.fill("#auth-username", username);
      await page.fill("#auth-password", password);
      await page.click("#auth-submit");
      await expect(page.locator("#app")).toBeVisible();

      await page.click("#logout-btn");
      await expect(page.locator(".auth-overlay")).toBeVisible();
    });
  });

  // ─── List management ─────────────────────────────────────────────────────────

  test.describe("List management", () => {
    test.beforeEach(async ({ page }) => {
      // Sign up and log in
      await page.getByRole("button", { name: "Sign Up" }).click();
      await page.fill("#auth-username", username);
      await page.fill("#auth-password", password);
      await page.click("#auth-submit");
      await expect(page.locator("#app")).toBeVisible();
    });

    test("can create a new list", async ({ page }) => {
      await page.click("#new-list-btn");
      await expect(page.locator("#new-list-modal")).toBeVisible();

      await page.fill("#new-list-name", "Shopping");
      await page.click('[id="new-list-form"] button[type="submit"]');

      await expect(page.locator(".list-item")).toHaveCount(1);
      await expect(page.locator(".list-name").first()).toHaveText("Shopping");
      await expect(page.locator("#todo-panel")).toBeVisible();
    });

    test("can delete a list", async ({ page }) => {
      await page.click("#new-list-btn");
      await page.fill("#new-list-name", "Temp");
      await page.click('[id="new-list-form"] button[type="submit"]');
      await expect(page.locator(".list-item")).toHaveCount(1);

      page.once("dialog", (dialog) => dialog.accept());
      await page.click("#delete-list-btn");

      await expect(page.locator(".list-item")).toHaveCount(0);
      await expect(page.locator("#empty-state")).toBeVisible();
    });

    test("shows success toast on list creation", async ({ page }) => {
      await page.click("#new-list-btn");
      await page.fill("#new-list-name", "My New List");
      await page.click('[id="new-list-form"] button[type="submit"]');

      await expect(page.locator(".toast.success")).toBeVisible();
    });
  });

  // ─── Todo management ─────────────────────────────────────────────────────────

  test.describe("Todo management", () => {
    test.beforeEach(async ({ page }) => {
      // Sign up, log in, and create a list
      await page.getByRole("button", { name: "Sign Up" }).click();
      await page.fill("#auth-username", username);
      await page.fill("#auth-password", password);
      await page.click("#auth-submit");
      await expect(page.locator("#app")).toBeVisible();

      await page.click("#new-list-btn");
      await page.fill("#new-list-name", "Tasks");
      await page.click('[id="new-list-form"] button[type="submit"]');
      await expect(page.locator("#todo-panel")).toBeVisible();
    });

    test("can add a todo", async ({ page }) => {
      await page.fill("#todo-input", "Buy groceries");
      await page.click('[id="todo-form"] button[type="submit"]');

      await expect(page.locator(".todo-item")).toHaveCount(1);
      await expect(page.locator(".todo-text").first()).toHaveText("Buy groceries");
    });

    test("can complete a todo via checkbox", async ({ page }) => {
      await page.fill("#todo-input", "Write tests");
      await page.click('[id="todo-form"] button[type="submit"]');

      await page.click(".todo-check");
      await expect(page.locator(".todo-item.completed")).toHaveCount(1);
    });

    test("can edit a todo", async ({ page }) => {
      await page.fill("#todo-input", "Old text");
      await page.click('[id="todo-form"] button[type="submit"]');

      // Hover to reveal action buttons, then click edit
      await page.hover(".todo-item");
      await page.click(".edit-btn");

      const editInput = page.locator(".todo-edit-input");
      await expect(editInput).toBeVisible();
      await editInput.fill("New text");
      await page.click(".save-btn");

      await expect(page.locator(".todo-text").first()).toHaveText("New text");
    });

    test("can delete a todo", async ({ page }) => {
      await page.fill("#todo-input", "To delete");
      await page.click('[id="todo-form"] button[type="submit"]');
      await expect(page.locator(".todo-item")).toHaveCount(1);

      await page.hover(".todo-item");
      await page.click(".delete-btn");

      await expect(page.locator(".todo-item")).toHaveCount(0);
    });

    test("can sort todos alphabetically", async ({ page }) => {
      const tasks = ["Zebra", "Apple", "Mango"];
      for (let i = 0; i < tasks.length; i++) {
        await page.fill("#todo-input", tasks[i]);
        await page.click('[id="todo-form"] button[type="submit"]');
        await expect(page.locator(".todo-item")).toHaveCount(i + 1);
      }

      await page.click("#sort-btn");

      const texts = await page.locator(".todo-text").allTextContents();
      expect(texts).toEqual(["Apple", "Mango", "Zebra"]);
    });

    test("filter tabs show correct subsets", async ({ page }) => {
      // Add two todos, wait for each to render
      await page.fill("#todo-input", "Pending task");
      await page.click('[id="todo-form"] button[type="submit"]');
      await expect(page.locator(".todo-item")).toHaveCount(1);

      await page.fill("#todo-input", "Done task");
      await page.click('[id="todo-form"] button[type="submit"]');
      await expect(page.locator(".todo-item")).toHaveCount(2);

      // Complete the first visible todo (most recently added)
      const checks = page.locator(".todo-check");
      await checks.nth(0).click();
      await expect(page.locator(".todo-item.completed")).toHaveCount(1);

      // Filter: Active — should show 1
      await page.click('[data-filter="active"]');
      await expect(page.locator(".todo-item")).toHaveCount(1);

      // Filter: Done — should show 1
      await page.click('[data-filter="done"]');
      await expect(page.locator(".todo-item")).toHaveCount(1);

      // Filter: All — should show 2
      await page.click('[data-filter="all"]');
      await expect(page.locator(".todo-item")).toHaveCount(2);
    });

    test("stats update as todos are added and completed", async ({ page }) => {
      await expect(page.locator("#todo-stats-text")).toHaveText("No tasks yet");

      await page.fill("#todo-input", "Task 1");
      await page.click('[id="todo-form"] button[type="submit"]');
      await expect(page.locator("#todo-stats-text")).toContainText("1 task");

      await page.click(".todo-check");
      await expect(page.locator("#todo-stats-text")).toContainText("done");
    });
  });
});
