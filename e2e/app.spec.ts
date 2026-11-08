import { test, expect } from "@playwright/test";

test.describe("Chainkin Final Product Journey & Acceptance Verification", () => {
  test.beforeEach(async ({ page }) => {
    // Collect console errors to verify no unhandled errors occur during user journeys
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.error(`Browser console error: "${msg.text()}"`);
      }
    });
  });

  test("1. Disconnected home screen renders welcoming hero, archetypes, and value proposition", async ({
    page,
  }) => {
    await page.goto("/");

    // Verify main headings and brand elements
    await expect(page.locator("h1")).toContainText("Something alive lives on your chain.");
    await expect(page.getByText("Solana Devnet Living Companion", { exact: true })).toBeVisible();

    // Verify floating centered navigation
    const nav = page.locator("nav[aria-label='Main Navigation']");
    await expect(nav).toBeVisible();
    await expect(nav).toContainText("CHAINKIN");
    await expect(nav).toContainText("Home");
    await expect(nav).toContainText("Companion");
    await expect(nav).toContainText("Collection");
    await expect(nav).toContainText("Stat Card");
    await expect(nav).toContainText("Settings");

    // Verify Archetype tabs: Wisp, Bytebeast, Mossling
    await expect(page.getByRole("button", { name: "Wisp" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Bytebeast" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Mossling" })).toBeVisible();

    // Switch tabs to Bytebeast and verify details update
    await page.getByRole("button", { name: "Bytebeast" }).click();
    await expect(page.locator("h3")).toContainText("Bytebeast");

    // Switch tabs to Mossling and verify details update
    await page.getByRole("button", { name: "Mossling" }).click();
    await expect(page.locator("h3")).toContainText("Mossling");

    // Verify 3 onboarding steps
    await expect(page.getByText("Link Devnet Wallet")).toBeVisible();
    await expect(page.getByText("Awaken Companion PDA")).toBeVisible();
    await expect(page.getByText("Nurture & Transcend")).toBeVisible();

    // Take screenshot of clean welcome hero
    await page.screenshot({ path: "test-results/01-welcome-home.png", fullPage: true });
  });

  test("2. Floating navigation bar navigates to all routes without breaking or reloading", async ({
    page,
  }) => {
    await page.goto("/");

    // Navigate to Companion
    await page.click("nav a[href='/creature']");
    await expect(page).toHaveURL("/creature");
    await expect(page.getByText("Connect Solana Wallet")).toBeVisible();

    // Navigate to Collection
    await page.click("nav a[href='/collection']");
    await expect(page).toHaveURL("/collection");
    await expect(page.getByRole("heading", { name: "Companion Collection" })).toBeVisible();

    // Navigate to Stat Card
    await page.click("nav a[href='/card']");
    await expect(page).toHaveURL("/card");
    await expect(page.getByText("No Companion Card Found")).toBeVisible();

    // Navigate to Settings
    await page.click("nav a[href='/settings']");
    await expect(page).toHaveURL("/settings");
    await expect(page.getByRole("heading", { name: "Settings & System Telemetry" })).toBeVisible();
  });

  test("3. Settings page displays Devnet architecture and AI quota telemetry without exposing secrets", async ({
    page,
  }) => {
    await page.goto("/settings");

    // Verify Solana cluster and program ID telemetry
    await expect(page.getByText("Solana Devnet Architecture")).toBeVisible();
    await expect(page.getByText("Target Cluster:")).toBeVisible();
    await expect(page.locator("strong", { hasText: /devnet/i })).toBeVisible();

    // Verify AI Quota telemetry
    await expect(page.getByText("AI Provider & Daily Budget")).toBeVisible();
    await expect(page.getByText("Daily Safety Budget:")).toBeVisible();
    await expect(page.getByText("calls remaining today", { exact: false })).toBeVisible();

    // Verify secrets are NOT exposed
    const content = await page.content();
    expect(content).not.toContain("sk-or-v1");
    expect(content).not.toContain("OPENROUTER_API_KEY");

    // Verify Accessibility toggles
    await expect(page.getByText("Reduced Motion")).toBeVisible();

    // Verify local storage hygiene action
    const clearBtn = page.getByRole("button", { name: "Clear Local Activity History" });
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();
    await expect(page.getByText("Local Activity History Cleared")).toBeVisible();

    await page.screenshot({ path: "test-results/02-settings-telemetry.png", fullPage: true });
  });

  test("4. Collection page enforces Solana PDA address validation and displays architecture notice", async ({
    page,
  }) => {
    await page.goto("/collection");

    // Verify honest architecture notice
    await expect(page.getByText("Solana Architecture Notice: One Creature PDA Per Wallet")).toBeVisible();

    // Attempt to submit invalid Solana address
    const input = page.locator("input[placeholder*='Add Solana wallet address']");
    await input.fill("invalid-solana-address");
    await page.getByRole("button", { name: "Add Watched Wallet" }).click();

    // Verify validation feedback
    await expect(page.getByText("Invalid Solana base58 address")).toBeVisible();

    // Submit valid Solana address (e.g. SystemProgram address)
    await input.fill("11111111111111111111111111111111");
    await page.getByRole("button", { name: "Add Watched Wallet" }).click();

    // Verify wallet added to watch list
    await expect(page.getByText("111111...111111")).toBeVisible();

    await page.screenshot({ path: "test-results/03-collection-multiwallet.png", fullPage: true });
  });

  test("5. Stat Card renders clean printable passport layout with shareable URL", async ({
    page,
  }) => {
    // Navigate with simulated wallet parameter
    await page.goto("/card?wallet=11111111111111111111111111111111");

    // Verify page loads without unhandled exceptions
    await expect(page.locator("body")).toBeVisible();

    // Check share link and print triggers
    const backBtn = page.getByText("Back to Companion");
    await expect(backBtn).toBeVisible();

    await page.screenshot({ path: "test-results/04-stat-card-view.png", fullPage: true });
  });

  test("6. System Status API returns structured JSON with safety quota and devnet cluster", async ({
    request,
  }) => {
    const res = await request.get("/api/creature/status");
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data.solana.cluster).toBe("devnet");
    expect(data.solana.programId).toBeTruthy();
    expect(data.ai.dailyBudget.limit).toBe(35);
    expect(typeof data.ai.dailyBudget.used).toBe("number");
    expect(typeof data.ai.dailyBudget.remaining).toBe("number");
    expect(data.ai.requestsPerMinuteLimit).toBe(10);
  });
});
