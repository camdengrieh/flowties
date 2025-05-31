'use client';

import { useState } from 'react';
import { CollectionStatsCard } from '@/components/opensea/CollectionStatsCard';
import { 
  CURATED_COLLECTIONS, 
  COLLECTION_CATEGORIES, 
  getFeaturedCollections,
  getCollectionsByCategory 
} from '@/lib/curated-collections';
import { ExternalLink, Globe, MessageCircle } from 'lucide-react';

export default function CollectionsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const featuredCollections = getFeaturedCollections();
  
  const filteredCollections = selectedCategory === 'all' 
    ? CURATED_COLLECTIONS 
    : getCollectionsByCategory(selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Curated Collections
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover the most popular NFT collections on Flow blockchain
          </p>
        </div>

        {/* Featured Collections */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Featured Collections
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {featuredCollections.map((collection) => (
              <div key={collection.slug} className="relative">
                <CollectionStatsCard 
                  slug={collection.slug}
                  collectionName={collection.name}
                  className="h-full"
                />
                {/* Collection Info Overlay */}
                <div className="absolute top-4 right-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full text-white ${
                      COLLECTION_CATEGORIES[collection.category]?.color || 'bg-gray-500'
                    }`}>
                      {COLLECTION_CATEGORIES[collection.category]?.label || collection.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              All Collections
            </button>
            {Object.entries(COLLECTION_CATEGORIES).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === key
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* All Collections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCollections.map((collection) => (
            <div key={collection.slug} className="group">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                {/* Collection Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {collection.name}
                      </h3>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full text-white mt-1 ${
                        COLLECTION_CATEGORIES[collection.category]?.color || 'bg-gray-500'
                      }`}>
                        {COLLECTION_CATEGORIES[collection.category]?.label || collection.category}
                      </span>
                    </div>
                    {collection.featured && (
                      <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs rounded-full">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {collection.description}
                  </p>
                  
                  {/* Social Links */}
                  <div className="flex items-center gap-3">
                    {collection.website && (
                      <a
                        href={collection.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <Globe className="h-4 w-4" />
                        Website
                      </a>
                    )}
                    {collection.twitter && (
                      <a
                        href={collection.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Twitter
                      </a>
                    )}
                    {collection.discord && (
                      <a
                        href={collection.discord}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Discord
                      </a>
                    )}
                  </div>
                </div>

                {/* Quick Stats Preview */}
                <div className="p-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Contract: {collection.contractAddress.slice(0, 8)}...
                    </p>
                    <a
                      href={`/collections/${collection.slug}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                    >
                      View Full Stats
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* NBA TopShot Spotlight */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
          <div className="max-w-4xl">
            <h2 className="text-3xl font-bold mb-4">NBA TopShot - The Premier Sports NFT</h2>
            <p className="text-lg mb-6 opacity-90">
              NBA TopShot is the most successful NFT collection on Flow, featuring officially licensed 
              NBA highlights and moments. With over $1 billion in total sales, it has redefined digital 
              sports collectibles.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold">$1B+</div>
                <div className="text-sm opacity-80">Total Sales Volume</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">1M+</div>
                <div className="text-sm opacity-80">Registered Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">19M+</div>
                <div className="text-sm opacity-80">Moments Owned</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <a
                href="https://nbatopshot.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Visit NBA TopShot
                <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href="/collections/nba-topshot"
                className="inline-flex items-center gap-2 px-6 py-3 border border-white text-white rounded-lg font-medium hover:bg-white hover:text-blue-600 transition-colors"
              >
                View Detailed Analytics
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 