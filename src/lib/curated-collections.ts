export interface CuratedCollection {
  name: string;
  description: string;
  contractAddress: string;
  slug: string;
  category: 'sports' | 'gaming' | 'art' | 'utility' | 'music';
  featured: boolean;
  logoUrl?: string;
  bannerUrl?: string;
  website?: string;
  twitter?: string;
  discord?: string;
}

export const CURATED_COLLECTIONS: CuratedCollection[] = [
  {
    name: 'NBA TopShot',
    description: 'Officially licensed NBA collectible highlights - the most popular NFT collection on Flow',
    contractAddress: '0x84c6a2e6765e88427c41bb38c82a78b570e24709',
    slug: 'nba-topshot',
    category: 'sports',
    featured: true,
    logoUrl: '/images/collections/nba-topshot-logo.png',
    bannerUrl: '/images/collections/nba-topshot-banner.jpg',
    website: 'https://nbatopshot.com',
    twitter: 'https://twitter.com/nbatopshot',
    discord: 'https://discord.gg/nbatopshot'
  },
  {
    name: 'BeezieCollectibles',
    description: 'Exclusive digital collectibles featuring unique characters and art',
    contractAddress: '0xD112634f06902a977db1D596c77715D72f8DA8a9',
    slug: 'beezie-collectibles',
    category: 'art',
    featured: true,
    website: 'https://beezie.io',
    twitter: 'https://twitter.com/beeziecollect'
  }
];

export const COLLECTION_CATEGORIES = {
  sports: { label: 'Sports', color: 'bg-blue-500' },
  gaming: { label: 'Gaming', color: 'bg-purple-500' },
  art: { label: 'Art', color: 'bg-pink-500' },
  utility: { label: 'Utility', color: 'bg-green-500' },
  music: { label: 'Music', color: 'bg-yellow-500' }
};

export function getFeaturedCollections(): CuratedCollection[] {
  return CURATED_COLLECTIONS.filter(collection => collection.featured);
}

export function getCollectionsByCategory(category: string): CuratedCollection[] {
  return CURATED_COLLECTIONS.filter(collection => collection.category === category);
}

export function getCollectionBySlug(slug: string): CuratedCollection | undefined {
  return CURATED_COLLECTIONS.find(collection => collection.slug === slug);
}

export function getCollectionByAddress(address: string): CuratedCollection | undefined {
  return CURATED_COLLECTIONS.find(collection => 
    collection.contractAddress.toLowerCase() === address.toLowerCase()
  );
} 