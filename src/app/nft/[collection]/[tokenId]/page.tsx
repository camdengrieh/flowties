"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface NFTMeta {
  name?: string;
  description?: string;
  image_url?: string;
  display_image_url?: string;
  display_animation_url?: string;
  traits?: {trait_type:string;value:string}[];
}

export default function NFTDetailPage({ params }: { params: Promise<{ collection: string; tokenId: string }> }) {
  const [collection, setCollection] = useState<string>('');
  const [tokenId, setTokenId] = useState<string>('');
  const [meta, setMeta] = useState<NFTMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Handle async params
  useEffect(() => {
    async function handleParams() {
      const resolvedParams = await params;
      setCollection(resolvedParams.collection);
      setTokenId(resolvedParams.tokenId);
    }
    handleParams();
  }, [params]);

  useEffect(() => {
    if (!collection || !tokenId) return;
    
    async function fetchMeta() {
      try {
        const apiKey = process.env.NEXT_PUBLIC_OPENSEA_API_KEY;
        const url = `https://api.opensea.io/api/v2/nfts?collection_slug=${collection}&identifier=${tokenId}&chain_identifier=FLOW`;
        const res = await fetch(url, { headers: { "X-API-KEY": apiKey || "" } });
        const data = await res.json();
        const nft = data?.nfts?.[0];
        setMeta({
          name: nft?.name,
          description: nft?.description,
          image_url: nft?.image_url,
          display_image_url: nft?.display_image_url,
          display_animation_url: nft?.display_animation_url,
          traits: nft?.traits
        });
      } catch (err) {
        console.error(err);
      } finally { setLoading(false); }
    }
    fetchMeta();
  }, [collection, tokenId]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!meta) return <div className="p-8">No data found.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <button onClick={() => router.back()} className="text-blue-600 hover:underline">← Back</button>
      <h1 className="text-2xl font-bold">{meta.name || `#${tokenId}`}</h1>
      {meta.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={meta.image_url} alt={meta.name} className="w-full max-w-md rounded" />
      )}
      {meta.description && <p className="text-gray-700 whitespace-pre-wrap">{meta.description}</p>}

      {meta.traits?.length ? (
        <div>
          <h2 className="text-xl font-semibold mt-4 mb-2">Traits</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {meta.traits.map((t,i)=> (
              <div key={i} className="border rounded p-2 text-sm bg-gray-50">
                <div className="font-medium text-gray-600">{t.trait_type}</div>
                <div className="text-gray-900">{t.value}</div>
              </div>
            ))}
          </div>
        </div>
      ): null}
    </div>
  );
} 