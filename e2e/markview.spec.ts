import { test, expect, type Page } from "@playwright/test";

const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = "testpassword123";

async function setupFirstUser(page: Page, email: string, password: string) {
  await page.goto("/setup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/login");
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("/");
}

async function logout(page: Page) {
  const logoutBtn = page.getByRole("button", { name: /log\s*out/i });
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
    await page.waitForURL("**/login");
  } else {
    await page.request.post("/api/auth/logout");
    await page.goto("/login");
  }
}

// ── 1. Setup flow ──────────────────────────────────────────────

test.describe("Setup flow (V1, V4)", () => {
  test("first user can be created via setup page", async ({ page }) => {
    await setupFirstUser(page, TEST_EMAIL, TEST_PASSWORD);
    await expect(page).toHaveURL(/\/login/);
  });

  test("setup page returns error after first user exists", async ({ page }) => {
    const res = await page.request.post("/api/auth/setup", {
      data: {
        email: "second@example.com",
        password: "password123",
        confirmPassword: "password123",
      },
    });
    expect(res.status()).toBe(403);
  });
});

// ── 2. Login / Logout flow ─────────────────────────────────────

test.describe("Login / Logout flow", () => {
  test("user can log in with valid credentials", async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD);
    await expect(page).toHaveURL("/");
    await expect(page.locator("body")).toBeVisible();
  });

  test("login fails with wrong password", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(TEST_EMAIL);
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText(/invalid/i)).toBeVisible();
  });

  test("user can log out", async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD);
    await logout(page);
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });
});

// ── 3. Register when enabled / disabled (V3) ──────────────────

test.describe("Registration gating (V3)", () => {
  test("register API returns 403 when ENABLE_REGISTER is not true", async ({
    page,
  }) => {
    const res = await page.request.post("/api/auth/register", {
      data: {
        email: "newuser@example.com",
        password: "password123",
        confirmPassword: "password123",
      },
    });
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/disabled/i);
  });
});

// ── 4. Create markdown via paste + view shared link (V2, V5) ──

test.describe("Markdown paste + share flow", () => {
  let shareToken: string;

  test("authenticated user can create markdown via paste", async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD);

    await page.getByLabel("Title (optional)").fill("Test Document");
    await page.getByLabel("Markdown content").fill("# Hello\n\nThis is a test.");
    await page.getByRole("button", { name: "Create document" }).click();

    await page.waitForURL(/\/editor\//);
    await expect(page.locator("body")).toBeVisible();

    const shareLink = page.locator("code").first();
    const shareUrl = await shareLink.textContent();
    expect(shareUrl).toBeTruthy();
    const match = shareUrl!.match(/\/view\/(.+)$/);
    expect(match).toBeTruthy();
    shareToken = match![1];
  });

  test("shared link is publicly viewable", async ({ page }) => {
    await page.goto(`/view/${shareToken}`);
    await expect(page.getByText("Hello")).toBeVisible();
    await expect(page.getByText("This is a test.")).toBeVisible();
  });
});

// ── 5. Editor page — edit and save ─────────────────────────────

test.describe("Editor page (V13)", () => {
  test("can edit and save a document", async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD);

    await page.getByLabel("Markdown content").fill("# Draft\n\nInitial content.");
    await page.getByRole("button", { name: "Create document" }).click();
    await page.waitForURL(/\/editor\//);

    const editor = page.locator("textarea").first();
    await editor.fill("# Updated\n\nEdited content.");

    await page.getByRole("button", { name: "Save" }).click();

    await page.waitForTimeout(2000);

    const shareLink = page.locator("code").first();
    await expect(shareLink).toBeVisible({ timeout: 5000 });
    const shareUrl = await shareLink.textContent();
    const match = shareUrl!.match(/\/view\/(.+)$/);
    expect(match).toBeTruthy();

    const viewPage = await page.context().newPage();
    await viewPage.goto(`/view/${match![1]}`);
    await expect(viewPage.getByText("Edited content.")).toBeVisible({ timeout: 10000 });
    await viewPage.close();
  });
});

// ── 6. Expired doc shows not-found (V5) ───────────────────────

test.describe("Expired document (V5)", () => {
  test("expired doc returns not-found page", async ({ page }) => {
    await page.goto("/view/nonexistent-token-12345");
    await expect(
      page.getByText(/not found|expired|doesn't exist/i)
    ).toBeVisible();
  });
});

// ── 7. Unauthenticated user cannot create/edit (V2) ───────────

test.describe("Auth protection (V2)", () => {
  test("unauthenticated POST to /api/markdown returns 401", async ({
    page,
  }) => {
    const res = await page.request.post("/api/markdown", {
      data: {
        sourceType: "PASTE",
        content: "# Unauthorized",
      },
    });
    expect(res.status()).toBe(401);
  });

  test("unauthenticated user is redirected from home to login", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated user is redirected from editor to login", async ({
    page,
  }) => {
    await page.goto("/editor");
    await expect(page).toHaveURL(/\/login/);
  });
});
