import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";
import { chooseAccount, signOut } from "./helpers.mjs";

const baseURL = process.env.SHELL_BASE_URL ?? "http://127.0.0.1:3000";
const rest = process.env.COMMUNITY_E2E_REST === "1";

test("REST + masyarakat: portal tetap lokal dan role operasional tetap menggunakan API", { skip: !rest, timeout: 120_000 }, async (t) => {
  const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}) });
  t.after(() => browser.close());
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  t.after(() => context.close());
  const users = [
    { id: "coordinator-rest", role: "coordinator", display_name: "Koordinator Backend" },
    { id: "officer-rest", role: "field_officer", display_name: "Petugas Backend" },
  ];
  const requests = [];
  let currentRole = "coordinator";
  let backendAvailable = true;
  await context.route("**/api/v1/**", (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    requests.push({ path, method: request.method(), authorization: request.headers().authorization });
    if (!backendAvailable) return route.fulfill({ status: 503, json: { detail: "Backend sementara tidak tersedia" } });
    if (path.endsWith("/users")) return route.fulfill({ json: users });
    if (path.endsWith("/auth/me")) return route.fulfill({ json: users.find((user) => user.role === currentRole) });
    if (path.endsWith("/tasks")) return route.fulfill({ json: [] });
    return route.fulfill({ status: 500, json: { detail: "Permintaan API tidak diharapkan dalam pengujian" } });
  });
  await context.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) { return String(type).startsWith("webgl") ? null : original.call(this, type, ...args); };
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${baseURL}/login?next=/tasks`);
  await page.getByText("Server", { exact: true }).waitFor();
  await page.getByText("Koordinator Backend", { exact: true }).waitFor();
  await chooseAccount(page, "community");
  await page.waitForURL("**/masyarakat");
  await page.getByRole("heading", { name: "Pantau hutan, jaga kehidupan" }).waitFor();
  assert.doesNotMatch(await page.locator("body").innerText(), /\b(mock|demo|simulasi|sintetis)\b/i);
  assert.equal(requests.filter((request) => request.path.endsWith("/auth/me")).length, 0, "masyarakat tidak login ke backend");
  const afterLogin = requests.length;
  await page.getByRole("button", { name: "Gunakan pusat wilayah" }).click();
  await page.getByLabel("Deskripsi kejadian").fill("Laporan masyarakat lokal ketika aplikasi memakai REST.");
  await page.getByRole("button", { name: "Simpan laporan" }).click();
  const history = page.getByRole("region", { name: "Laporan saya", exact: true });
  await history.getByText("Laporan masyarakat lokal ketika aplikasi memakai REST.", { exact: true }).waitFor();
  await page.evaluate(() => {
    const key = "gambutops:session:v1";
    const session = JSON.parse(localStorage.getItem(key));
    session.user.display_name = "Masyarakat Demo";
    localStorage.setItem(key, JSON.stringify(session));
  });
  await page.reload();
  await history.getByText("Laporan masyarakat lokal ketika aplikasi memakai REST.", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Buka profil (Masyarakat)", exact: true }).waitFor();
  assert.doesNotMatch(await page.locator("body").innerText(), /\b(mock|demo|simulasi|sintetis)\b/i);
  await page.getByRole("status").filter({ hasText: "Laporan tersimpan" }).waitFor({ state: "hidden" });
  assert.equal(requests.length, afterLogin, "portal dan reload tidak meminta data backend");

  for (const role of ["coordinator", "field_officer"]) {
    await signOut(page);
    currentRole = role;
    await page.goto(`${baseURL}/login?next=/tasks`);
    const before = requests.length;
    await chooseAccount(page, role);
    await page.waitForURL("**/tasks");
    await page.getByRole("heading", { name: "Tidak ada yang perlu Anda kerjakan", exact: true }).waitFor();
    const operational = requests.slice(before);
    const auth = operational.find((request) => request.path.endsWith("/auth/me"));
    assert.ok(auth, `${role} diverifikasi oleh backend`);
    assert.match(auth.authorization ?? "", /^Bearer .+/);
    assert.ok(operational.some((request) => request.path.endsWith("/tasks")), `${role} membaca tugas melalui REST`);
  }

  await signOut(page);
  backendAvailable = false;
  await page.goto(`${baseURL}/login`);
  await page.getByText(/Daftar akun belum dapat dimuat:/).waitFor();
  await chooseAccount(page, "community");
  await page.waitForURL("**/masyarakat");
  await history.getByText("Laporan masyarakat lokal ketika aplikasi memakai REST.", { exact: true }).waitFor();
  assert.equal(requests.filter((request) => request.method !== "GET").length, 0, "laporan masyarakat tidak dikirim ke backend");
  assert.deepEqual(errors, []);
});
