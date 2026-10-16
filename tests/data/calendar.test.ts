import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("calendar: tanggal tetap sama pada WIB, UTC negatif dan pergantian DST", () => {
  for (const zone of ["Asia/Jakarta", "America/Los_Angeles", "Pacific/Auckland"]) {
    const result = spawnSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", `
      import assert from 'node:assert/strict';
      import { calendarDate, calendarValue } from './src/lib/calendar-date.ts';
      for (const value of ['2018-04-08', '2019-12-31', '2024-02-29', '2026-03-08', '2026-11-01']) {
        assert.equal(calendarValue(calendarDate(value)), value);
      }
    `], { env: { ...process.env, TZ: zone }, encoding: "utf8" });
    assert.equal(result.status, 0, `${zone}: ${result.stderr}`);
  }
});
