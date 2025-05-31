/* components/dashboard/sales-marquee.tsx */
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface SaleEvent {
  id: string;
  name: string;
  price?: string;
  currency?: string;
  isNew?: boolean;
  collection?: {
    name: string;
    address: string;
  };
  tokenId?: string;
}

export default function SalesMarquee() {
  const [sales, setSales] = useState<SaleEvent[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/events?eventType=sale&limit=5");
      const { events } = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: SaleEvent[] = events.map((e: any) => ({
        id: e.id,
        name: e.name || `NFT #${e.tokenId}`,
        price: e.price ? (Number(e.price) / 1e18).toFixed(2) : undefined,
        currency: e.currency,
        isNew: false,
        collection: e.collection,
        tokenId: e.tokenId
      }));
      setSales((prevSales) => {
        const newSales = mapped.filter(sale => !prevSales.some(ps => ps.id === sale.id));
        const existingSales = mapped.filter(sale => prevSales.some(ps => ps.id === sale.id));
        return [...newSales.map(s => ({ ...s, isNew: true })), ...existingSales].slice(0, 5);
      });
      
      // Reset isNew flag after animation
      setTimeout(() => {
        setSales(s => s.map(sale => ({ ...sale, isNew: false })));
      }, 2000);
    }
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, []);

  if (!sales.length) return null;

  return (
    <div className="bg-gradient-to-r from-black via-red-950/50 to-blue-950/50 border-b border-red-900/30 py-1 w-full">
      <div className="w-full mx-auto items-center px-2 sm:px-3 lg:px-5">
        <div className="flex justify-center items-stretch gap-4 overflow-x-auto pb-2">
          {sales.map((sale) => (
            <Link
              key={sale.id}
              href={sale.collection && sale.tokenId 
                ? `/nft/${encodeURIComponent(sale.collection.name || sale.collection.address)}/${encodeURIComponent(sale.tokenId)}`
                : "#"
              }
              className={`flex-none w-64 rounded-lg border p-4 transition-all duration-500 hover:shadow-lg ${
                sale.isNew 
                  ? 'bg-gradient-to-br from-green-900/80 to-green-800/80 border-green-500/50 scale-105 shadow-green-500/25' 
                  : 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-gray-700/50 hover:border-orange-500/50'
              }`}
            >
              <div className="flex flex-col gap-1">
                <div className="text-base font-medium text-white truncate">
                  {sale.name}
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500"></div>
                  <span className="text-sm text-gray-300">Sold for</span>
                  <span className="text-sm font-medium text-orange-300">
                    {sale.price} {sale.currency}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}