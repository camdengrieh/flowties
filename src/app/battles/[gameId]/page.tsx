'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import GameDetail from '@/components/battles/game-detail';

export default function GameDetailPage() {
  const params = useParams();
  const gameId = params.gameId as string;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950/30 to-blue-950/30">
      <GameDetail gameId={gameId} />
    </div>
  );
} 