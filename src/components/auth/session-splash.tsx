import { BrandMark } from "@/components/layout/brand-mark";
import styles from "./session-splash.module.css";

export function SessionSplash({ redirecting = false }: { redirecting?: boolean }) {
  return (
    <div className={styles.screen} role="status" aria-live="polite" aria-label={redirecting ? "Mengalihkan ke halaman masuk" : "Memuat PeatSignal"}>
      <div className={styles.ambient} aria-hidden="true" />
      <div className={styles.content}>
        <div className={styles.emblem} aria-hidden="true">
          <span className={styles.ripple} />
          <span className={styles.orbit} />
          <span className={styles.logo}>
            <BrandMark />
          </span>
        </div>
        <p className={styles.brand}>Peat<span>Signal</span></p>
        <p className={styles.tagline}>PREVENT · DETECTION · ACTION</p>
        <div className={styles.track} aria-hidden="true"><span /></div>
        <p className={styles.message}>{redirecting ? "Menuju halaman masuk…" : "Menyiapkan ruang pantau…"}</p>
      </div>
      <p className={styles.footer}>Pemantauan gambut, langkah lebih awal.</p>
    </div>
  );
}
