import { describe, expect, it } from "vitest";
import { getEmptyExpensesMockData, getExpensesMockData } from "./mock-expenses-data";

const VALID_CATEGORIES = ["supplies", "utilities", "services", "other"];
const VALID_STATUSES = ["posted", "cancelled"];

describe("getExpensesMockData", () => {
  it("has unique ids", () => {
    const expenses = getExpensesMockData();
    const ids = expenses.map((expense) => expense.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only uses valid categories and statuses", () => {
    for (const expense of getExpensesMockData()) {
      expect(VALID_CATEGORIES).toContain(expense.category);
      expect(VALID_STATUSES).toContain(expense.status);
    }
  });

  it("every amount is a positive whole number (CLAUDE.md §20 money discipline)", () => {
    for (const expense of getExpensesMockData()) {
      expect(expense.amount).toBeGreaterThan(0);
      expect(Number.isInteger(expense.amount)).toBe(true);
    }
  });

  it("includes at least one deliberately cancelled entry to prove exclusion from aggregates", () => {
    expect(getExpensesMockData().some((expense) => expense.status === "cancelled")).toBe(true);
  });

  it("dates are valid ISO YYYY-MM-DD strings", () => {
    for (const expense of getExpensesMockData()) {
      expect(expense.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe("getEmptyExpensesMockData", () => {
  it("returns an empty array", () => {
    expect(getEmptyExpensesMockData()).toEqual([]);
  });
});
