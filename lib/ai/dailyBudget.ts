import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

/**
 * Daily AI request budget tracker.
 * Uses a JSON file for persistence across serverless cold starts.
 * Not suitable for multi-instance deployments — documented limitation.
 */

const BUDGET_DIR = join(process.cwd(), ".ai-budget");
const BUDGET_FILE = join(BUDGET_DIR, "daily.json");

interface DailyBudgetState {
  date: string; // YYYY-MM-DD
  count: number;
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function readBudgetState(): DailyBudgetState {
  try {
    if (existsSync(BUDGET_FILE)) {
      const raw = readFileSync(BUDGET_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.date === getToday() && typeof parsed.count === "number") {
        return parsed;
      }
    }
  } catch {
    // corrupted file, reset
  }
  return { date: getToday(), count: 0 };
}

function writeBudgetState(state: DailyBudgetState): void {
  try {
    if (!existsSync(BUDGET_DIR)) {
      mkdirSync(BUDGET_DIR, { recursive: true });
    }
    writeFileSync(BUDGET_FILE, JSON.stringify(state), "utf-8");
  } catch (err) {
    console.warn("Failed to write daily budget state:", err);
  }
}

export function getDailyBudgetLimit(): number {
  const envLimit = process.env.AI_DAILY_BUDGET
    ? parseInt(process.env.AI_DAILY_BUDGET, 10)
    : NaN;
  return !isNaN(envLimit) && envLimit > 0 ? envLimit : 35;
}

export function getDailyUsage(): { used: number; limit: number; remaining: number } {
  const state = readBudgetState();
  const limit = getDailyBudgetLimit();
  return {
    used: state.count,
    limit,
    remaining: Math.max(0, limit - state.count),
  };
}

export function consumeDailyBudget(): {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
} {
  const state = readBudgetState();
  const limit = getDailyBudgetLimit();

  if (state.count >= limit) {
    return {
      allowed: false,
      used: state.count,
      limit,
      remaining: 0,
    };
  }

  state.count += 1;
  writeBudgetState(state);

  return {
    allowed: true,
    used: state.count,
    limit,
    remaining: Math.max(0, limit - state.count),
  };
}

export function resetDailyBudgetForTesting(count: number = 0): void {
  writeBudgetState({ date: getToday(), count });
}

