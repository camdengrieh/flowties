import { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";

export function useTopOfferNotifications() {
  const bestMap = useRef<Record<string, number>>({}); // key = collection+id

  useEffect(() => {
    async function poll() {
      const r = await fetch("/api/events?eventType=offer&limit=20");
      const { events } = await r.json();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      events.forEach((e: any) => {
        const key = `${e.collection?.address}-${e.tokenId}`;
        const v = Number(e.price || 0);
        if (!bestMap.current[key] || v > bestMap.current[key]) {
          bestMap.current[key] = v;
          toast.success(
            `New top offer • ${e.name || `NFT #${e.tokenId}`} • ${(v/1e18).toFixed(2)} ${e.currency}`,
            { duration: 8000 }
          );
        }
      });
    }
    poll();
    const t = setInterval(poll, 45_000);
    return () => clearInterval(t);
  }, []);
}
