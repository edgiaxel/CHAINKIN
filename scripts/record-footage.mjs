import { chromium } from "playwright";
import { mkdirSync, existsSync } from "fs";
import { join } from "path";

async function recordJourney() {
  const outputDir = join(process.cwd(), "video", "public", "recordings");
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: outputDir,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // 1. Home
  console.log("1. Navigating to Home...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await wait(1800);
  await page.screenshot({ path: join(outputDir, "scene1-hero.png") });

  console.log("Switching archetypes...");
  const tabs = ["Wisp", "Bytebeast", "Mossling", "Bytebeast"];
  for (const tab of tabs) {
    const btn = page.locator("button", { hasText: new RegExp(tab, "i") }).first();
    if (await btn.isVisible()) {
      await btn.click();
      await wait(1400);
    }
  }

  await page.evaluate(() => window.scrollBy({ top: 550, behavior: "smooth" }));
  await wait(2000);
  await page.screenshot({ path: join(outputDir, "scene2-features.png") });

  // 2. Collection
  console.log("2. Navigating to Collection...");
  await page.click('a[href="/collection"]');
  await page.waitForURL("**/collection");
  await wait(1800);
  await page.screenshot({ path: join(outputDir, "scene3-collection.png") });

  console.log("Adding watch-only wallet...");
  const addressInput = page.locator('input[placeholder*="Base58"]').first();
  if (await addressInput.isVisible()) {
    await addressInput.fill("9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM");
    await wait(800);
    const labelInput = page.locator('input[placeholder*="Label"]').first();
    if (await labelInput.isVisible()) {
      await labelInput.fill("Main Devnet Validator");
      await wait(800);
    }
    const addBtn = page.locator('button', { hasText: /watch/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await wait(1800);
    }
  }
  await page.screenshot({ path: join(outputDir, "scene3-collection-added.png") });

  // 3. Settings
  console.log("3. Navigating to Settings...");
  await page.click('a[href="/settings"]');
  await page.waitForURL("**/settings");
  await wait(2000);
  await page.screenshot({ path: join(outputDir, "scene4-settings.png") });

  const motionBtn = page.locator('button', { hasText: /reduced motion/i }).first();
  if (await motionBtn.isVisible()) {
    await motionBtn.click();
    await wait(1200);
  }
  await page.screenshot({ path: join(outputDir, "scene4-settings-motion.png") });

  // 4. Card
  console.log("4. Navigating to Card...");
  await page.click('a[href="/card"]');
  await page.waitForURL("**/card");
  await wait(2000);
  await page.screenshot({ path: join(outputDir, "scene5-card.png") });

  // 5. Companion Space
  console.log("5. Navigating to Companion space...");
  await page.click('a[href="/creature"]');
  await page.waitForURL("**/creature");
  await wait(2500);
  await page.screenshot({ path: join(outputDir, "scene6-companion.png") });

  console.log("Finishing recording...");
  await wait(1500);

  await context.close();
  await browser.close();

  console.log("Recording complete! Video saved in video/public/recordings/");
}

recordJourney().catch((err) => {
  console.error("Recording error:", err);
  process.exit(1);
});
