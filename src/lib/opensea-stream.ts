'use client';

import { OpenSeaStreamClient, Network } from '@opensea/stream-js';

interface StreamEvent {
  id: string;
  type: 'sale' | 'listing' | 'offer';
  collection?: {
    address: string;
    name: string;
    image: string;
    slug: string;
  };
  tokenId?: string;
  seller?: string;
  buyer?: string;
  price?: string;
  currency?: string;
  platform?: string;
  timestamp: number;
  txHash: string;
  blockNumber: string | number;
  event_timestamp: string;
  raw_payload?: unknown;
}

type EventCallback = (event: StreamEvent) => void;

// Target collections to monitor
const TARGET_COLLECTIONS = [
  {
    slug: 'nba-top-shot',          // NBA TopShot
    name: 'NBA TopShot',
    address: '0x84c6a2e6765e88427c41bb38c82a78b570e24709'
  },
];

export class OpenSeaStreamService {
  private client: OpenSeaStreamClient | null = null;
  private subscribers: Map<string, EventCallback[]> = new Map();
  private isConnected = false;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    const apiKey = process.env.NEXT_PUBLIC_OPENSEA_API_KEY;
    
    if (!apiKey) {
      console.warn('OpenSea API key not found. Stream functionality will be limited.');
      return;
    }

    // Build client options; using `any` until SDK typings include Flow chain
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientOptions: any = {
      token: apiKey,
      network: Network.MAINNET,
      //chain: 'FLOW',
      onError: (error: unknown) => {
        console.error('OpenSea Stream error:', error);
        this.handleConnectionError();
      }
    };

    this.client = new OpenSeaStreamClient(clientOptions);

    this.setupEventSubscriptions();
  }

  private setupEventSubscriptions() {
    if (!this.client) return;

    // Subscribe only to key events for home page: listings, sales, and offers
    TARGET_COLLECTIONS.forEach(collection => {
      console.log(`Setting up OpenSea stream subscriptions for ${collection.name} (${collection.slug})`);
      console.log('- Subscribing to: Item Listed, Item Sold, Item Received Offer');
      
      // Subscribe to item listed events (onItemListed)
      this.client?.onItemListed(collection.slug, (event) => {
        this.handleStreamEvent('listing', event, collection.slug);
      });

      // Subscribe to item sold events (onItemSold)
      this.client?.onItemSold(collection.slug, (event) => {
        this.handleStreamEvent('sale', event, collection.slug);
      });

      // Subscribe to item received offer events (onItemReceivedOffer)
      this.client?.onItemReceivedOffer(collection.slug, (event) => {
        this.handleStreamEvent('offer', event, collection.slug);
      });
    });
  }

  private handleStreamEvent(eventType: StreamEvent['type'], payload: unknown, collectionSlug?: string) {
    try {
      const streamEvent = this.transformPayload(eventType, payload, collectionSlug);
      
      // Only process events from our target collections
      if (streamEvent.collection && !TARGET_COLLECTIONS.some(tc => tc.slug === streamEvent.collection?.slug)) {
        return; // Skip events from collections we're not monitoring
      }
      
      // Notify all subscribers
      const globalSubscribers = this.subscribers.get('*') || [];
      const typeSubscribers = this.subscribers.get(eventType) || [];
      const collectionSubscribers = collectionSlug ? this.subscribers.get(`collection:${collectionSlug}`) || [] : [];

      [...globalSubscribers, ...typeSubscribers, ...collectionSubscribers].forEach(callback => {
        try {
          callback(streamEvent);
        } catch (error) {
          console.error('Error in event callback:', error);
        }
      });
    } catch (error) {
      console.error('Error handling stream event:', error);
    }
  }

  private transformPayload(eventType: StreamEvent['type'], payload: unknown, collectionSlug?: string): StreamEvent {
    // Safely extract data from the payload
    const eventPayload = this.extractEventPayload(payload);
    
    // Extract common fields with type safety
    const eventTimestamp = this.getStringValue(eventPayload, 'event_timestamp');
    const timestamp = eventTimestamp ? 
      new Date(eventTimestamp).getTime() / 1000 : 
      Date.now() / 1000;
    
    const collectionSlugFromPayload = this.getNestedStringValue(eventPayload, 'collection', 'slug');
    const collection = this.getCollectionInfo(collectionSlugFromPayload || collectionSlug);
    
    const blockNumberValue = this.getNestedValue(eventPayload, 'transaction', 'block_number');
    const blockNumber = typeof blockNumberValue === 'string' || typeof blockNumberValue === 'number' ? 
      blockNumberValue : '';
    
    const baseEvent: StreamEvent = {
      id: `${eventType}_${timestamp}_${Math.random().toString(36).substring(7)}`,
      type: eventType,
      collection,
      timestamp,
      event_timestamp: eventTimestamp || new Date().toISOString(),
      txHash: this.getNestedStringValue(eventPayload, 'transaction', 'hash') || '',
      blockNumber,
      raw_payload: payload
    };

    // Event-specific transformations based on OpenSea Stream API schemas
    switch (eventType) {
      case 'sale':
        return {
          ...baseEvent,
          tokenId: this.getNestedStringValue(eventPayload, 'item', 'nft_id'),
          seller: this.getNestedStringValue(eventPayload, 'seller', 'address'),
          buyer: this.getNestedStringValue(eventPayload, 'buyer', 'address'),
          price: this.getStringValue(eventPayload, 'sale_price'),
          currency: this.getNestedStringValue(eventPayload, 'payment_token', 'symbol') || 'ETH',
          platform: 'OpenSea'
        };

      case 'listing':
        return {
          ...baseEvent,
          tokenId: this.getNestedStringValue(eventPayload, 'item', 'nft_id'),
          seller: this.getNestedStringValue(eventPayload, 'maker', 'address'),
          price: this.getStringValue(eventPayload, 'base_price'),
          currency: this.getNestedStringValue(eventPayload, 'payment_token', 'symbol') || 'ETH',
          platform: 'OpenSea'
        };

      case 'offer':
        return {
          ...baseEvent,
          tokenId: this.getNestedStringValue(eventPayload, 'item', 'nft_id'),
          buyer: this.getNestedStringValue(eventPayload, 'maker', 'address'),
          price: this.getStringValue(eventPayload, 'base_price'),
          currency: this.getNestedStringValue(eventPayload, 'payment_token', 'symbol') || 'ETH',
          platform: 'OpenSea'
        };

      default:
        return baseEvent;
    }
  }

  private extractEventPayload(payload: unknown): Record<string, unknown> {
    if (typeof payload === 'object' && payload !== null && 'payload' in payload) {
      const innerPayload = (payload as { payload: unknown }).payload;
      if (typeof innerPayload === 'object' && innerPayload !== null) {
        return innerPayload as Record<string, unknown>;
      }
    }
    return {};
  }

  private getStringValue(obj: Record<string, unknown>, key: string): string | undefined {
    const value = obj[key];
    return typeof value === 'string' ? value : undefined;
  }

  private getNestedStringValue(obj: Record<string, unknown>, key1: string, key2: string): string | undefined {
    const nested = obj[key1];
    if (typeof nested === 'object' && nested !== null) {
      const value = (nested as Record<string, unknown>)[key2];
      return typeof value === 'string' ? value : undefined;
    }
    return undefined;
  }

  private getNestedValue(obj: Record<string, unknown>, key1: string, key2: string): unknown {
    const nested = obj[key1];
    if (typeof nested === 'object' && nested !== null) {
      return (nested as Record<string, unknown>)[key2];
    }
    return undefined;
  }

  private getCollectionInfo(slug?: string) {
    if (!slug) return undefined;
    
    const collection = TARGET_COLLECTIONS.find(c => c.slug === slug);
    return collection ? {
      address: collection.address,
      name: collection.name,
      image: '/images/collections/default-collection.png',
      slug: collection.slug
    } : undefined;
  }

  private handleConnectionError() {
    this.isConnected = false;
    // Implement reconnection logic
    setTimeout(() => {
      this.connect();
    }, 5000);
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        reject(new Error('OpenSea Stream client not initialized'));
        return;
      }

      try {
        this.client.connect();
        this.isConnected = true;
        resolve();
      } catch (error) {
        console.error('Failed to connect to OpenSea Stream:', error);
        reject(error);
      }
    });
  }

  public disconnect() {
    if (this.client && this.isConnected) {
      this.client.disconnect();
      this.isConnected = false;
      console.log('OpenSea Stream disconnected');
    }
  }

  public subscribe(eventType: string, callback: EventCallback): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    
    this.subscribers.get(eventType)!.push(callback);

    // Auto-connect if not already connected
    if (!this.isConnected && this.client) {
      this.connect();
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Create singleton instance
export const openSeaStreamService = new OpenSeaStreamService();

// Export types for use in components
export type { StreamEvent, EventCallback }; 