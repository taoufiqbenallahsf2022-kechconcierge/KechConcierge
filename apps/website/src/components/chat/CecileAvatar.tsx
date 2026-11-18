import Image from "next/image";

export function CecileAvatar({ size = 48 }: { size?: number }) {
  return <Image src="https://imagedelivery.net/qcrNy2QA3vt3EbTLsOQBpA/5b445fa7-6859-4ac0-6585-84cd621b6400/public" alt="Cécile" width={size} height={size} sizes={`${size}px`} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
}
