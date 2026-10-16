// Helper tes browser: masuk/keluar lewat halaman login seperti pengguna sungguhan.

const ROLE_LABEL = { coordinator: /Koordinator ·/, field_officer: /Petugas lapangan ·/ };

/** Masuk sebagai akun demo pertama dengan peran `role`, lalu tunggu kembali ke `next`. */
export async function signIn(page, baseURL, role = "coordinator", next = "/dashboard") {
  if (!new URL(page.url() === "about:blank" ? baseURL : page.url()).pathname.startsWith("/login")) {
    await page.goto(`${baseURL}/login?next=${encodeURIComponent(next)}`);
  }
  await chooseAccount(page, role);
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

/** Di halaman login: pilih akun sesuai peran dan kirim form. */
export async function chooseAccount(page, role) {
  const accounts = page.locator("label").filter({ has: page.locator('input[type="radio"]') });
  await accounts.first().waitFor();
  const labels = await accounts.allInnerTexts();
  const index = labels.findIndex((text) => ROLE_LABEL[role].test(text));
  if (index < 0) throw new Error(`Tidak ada akun demo dengan peran ${role}`);
  await accounts.nth(index).locator('input[type="radio"]').check();
  await page.getByRole("button", { name: /^Masuk sebagai / }).click();
}

/** Keluar dari header aplikasi; kembali ke login dengan tujuan halaman saat ini. */
export async function signOut(page) {
  await page.getByRole("button", { name: /^Keluar/ }).click();
  await page.waitForURL((url) => url.pathname.startsWith("/login"));
}

/** Ganti akun tanpa meninggalkan halaman yang sedang dibuka. */
export async function switchRole(page, role) {
  await signOut(page);
  await chooseAccount(page, role);
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}
