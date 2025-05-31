'use client';

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import DynamicBattleStage from './dynamic-battle-stage';

interface Card {
  id: string;
  name: string;
  image: string;
  attack: number;
  defense: number;
}

interface BattlePayload {
  playerCard: Card;
  opponentCard: Card;
}

export default function TradingCardBattle() {
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<BattlePayload | null>(null);

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/entropy/battle', { method: 'POST' });
      const data = await res.json();
      setPayload(data);
    } catch (error) {
      console.error('Failed to start battle', error);
      alert('Failed to start battle.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950/30 to-blue-950/30 p-8 flex flex-col items-center justify-start">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-orange-400 bg-clip-text text-transparent mb-8 flex items-center gap-2">
        <Sparkles className="text-orange-400" />
        Trading Card Battle Arena
        <Sparkles className="text-orange-400" />
      </h1>

      {!payload && (
        <button
          onClick={handleStart}
          disabled={loading}
          className="bg-gradient-to-r from-red-600 via-orange-600 to-red-600 hover:from-red-700 hover:via-orange-700 hover:to-red-700 disabled:opacity-50 text-white font-bold py-4 px-8 rounded-xl text-xl shadow-2xl transform hover:scale-105 transition-all duration-300"
        >
          {loading ? 'Requesting Pyth Entropy…' : 'Open Card Pack!'}
        </button>
      )}

      {payload && <DynamicBattleStage initialData={payload} onReset={() => setPayload(null)} />}
    </div>
  );
} 