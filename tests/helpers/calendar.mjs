import { selectOption } from "./select.mjs";
import assert from "node:assert/strict";

/** Exercise the calendar UI rather than changing hidden values or React state. */
export async function selectCalendarDay(dialog, date) {
  const [year, month] = date.split("-").map(Number);
  await selectOption(dialog.getByRole("combobox", { name: "Tahun", exact: true }), String(year));
  await selectOption(dialog.getByRole("combobox", { name: "Bulan", exact: true }), String(month - 1));
  await dialog.locator(`[data-day="${date}"]:not([data-outside]) button`).click();
}

export async function pickDate(page, label, date) {
  await page.getByRole("button", { name: label, exact: true }).click();
  await selectCalendarDay(page.getByRole("dialog", { name: label, exact: true }), date);
}

export async function pickRange(page, from, to) {
  await page.getByRole("button", { name: "Periode", exact: true }).click();
  const calendar = page.getByRole("dialog", { name: "Pilih periode" });
  await selectCalendarDay(calendar, from);
  await selectCalendarDay(calendar, to);
  assert.equal(await calendar.locator(`[data-day="${from}"]:not([data-outside])`).getAttribute("data-selected"), "true");
  assert.equal(await calendar.locator(`[data-day="${to}"]:not([data-outside])`).getAttribute("data-selected"), "true");
  await calendar.getByRole("button", { name: "Terapkan" }).click();
}
