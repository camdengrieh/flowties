/* components/dashboard/sales-marquee.tsx */
"use client";
import { useEffect, useState } from "react";

interface SaleEvent {
  id: string;
  name: string;
  price?: string;
  currency?: string;
}

export default function SalesMarquee() {
  const [sales, setSales] = useState<SaleEvent[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/events?eventType=sale&limit=30");
      const { events } = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: SaleEvent[] = events.map((e: any) => ({
        id: e.id,
        name: e.name || `NFT #${e.tokenId}`,
        price: e.price ? (Number(e.price) / 1e18).toFixed(2) : undefined,
        currency: e.currency,
      }));
      setSales(mapped);
    }
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);

  if (!sales.length) return null;

  return (
    <div className="fixed top-0 left-0 w-full overflow-hidden bg-gray-900 text-white z-50">
      <div className="marquee-content whitespace-nowrap py-1">
        {sales.map((s) => (
          <span key={s.id} className="mx-6">
            {s.name} sold
            {s.price && ` for ${s.price} ${s.currency}`} •
          </span>
        ))}
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .marquee-content {
          display: inline-block;
          padding-left: 100%;
          animation: marquee 80s linear infinite;
          will-change: transform;
        }
      `}</style>
    </div>
  );
}