import Image from "next/image";

/** Logo PeatSignal 3D dengan latar transparan. */
export function BrandMark({ className }: { className?: string }) {
  return <Image src="/brand/peatsignal-mark-3d.png" width={128} height={128} sizes="128px" alt="" aria-hidden="true" className={className} preload />;
}
