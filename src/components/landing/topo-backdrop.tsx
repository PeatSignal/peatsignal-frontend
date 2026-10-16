import type { ReactNode } from "react";

// Kontur kubah gambut: lingkar konsentris yang sedikit bergelombang (dihitung sekali, statis).
// Dipakai hero landing dan panel login agar keduanya berbahasa visual sama.
const CONTOURS = Array.from({ length: 8 }, (_, k) => {
  const rx = 38 + k * 30;
  const points = Array.from({ length: 60 }, (_, i) => {
    const a = (i / 60) * Math.PI * 2;
    const r = 1 + 0.07 * Math.sin(3 * a + k * 0.9) + 0.04 * Math.cos(5 * a - k * 0.6);
    return `${(330 + Math.cos(a) * rx * r).toFixed(1)} ${(170 + Math.sin(a) * rx * 0.72 * r).toFixed(1)}`;
  });
  return `M${points.join(" L")} Z`;
});

/** Latar peta topografi gelap (500×400), statis. `children` digambar di atas kontur. */
export function TopoBackdrop({ id, className, river = true, children }: { id: string; className?: string; river?: boolean; children?: ReactNode }) {
  return (
    <svg viewBox="0 0 500 400" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-glow`} cx="66%" cy="42%" r="65%">
          <stop offset="0" stopColor="#15803D" stopOpacity="0.55" />
          <stop offset="1" stopColor="#0B2E1E" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="500" height="400" fill="#0B2E1E" />
      <rect width="500" height="400" fill={`url(#${id}-glow)`} />
      <g stroke="#FFFFFF" strokeOpacity="0.05">
        {[50, 100, 150, 200, 250, 300, 350, 400, 450].map((x) => <line key={`x${x}`} x1={x} y1="0" x2={x} y2="400" />)}
        {[50, 100, 150, 200, 250, 300, 350].map((y) => <line key={`y${y}`} x1="0" y1={y} x2="500" y2={y} />)}
      </g>
      <g fill="none" strokeLinejoin="round">
        {CONTOURS.map((d, k) => <path key={d} d={d} stroke="#86EFAC" strokeOpacity={0.42 - k * 0.04} strokeWidth={k === 0 ? 1.5 : 1} />)}
      </g>
      {river && <path d="M-10 318 C70 300 110 250 170 258 C240 268 250 330 330 322 C400 314 430 360 510 352" fill="none" stroke="#1D90FF" strokeOpacity="0.6" strokeWidth="2.5" strokeLinecap="round" />}
      {children}
    </svg>
  );
}
