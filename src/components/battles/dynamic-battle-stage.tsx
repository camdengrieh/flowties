'use client';

import React, { useEffect, useState } from 'react';
import { Sword, Shield, Sparkles } from 'lucide-react';

interface Card {
  id: string;
  name: string;
  image: string;
  attack: number;
  defense: number;
}

interface Props {
  initialData: {
    playerCard: Card;
    opponentCard: Card;
  };
  onReset: () => void;
}

const getRarityColor = () => 'border-orange-400 bg-gradient-to-br from-orange-900/50 to-red-900/50 backdrop-blur-sm';

const DynamicBattleStage: React.FC<Props> = ({ initialData, onReset }) => {
  const [gameState, setGameState] = useState<'opening' | 'revealing' | 'battle' | 'result'>('opening');
  const [showCardContent, setShowCardContent] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [battleResult, setBattleResult] = useState<'win' | 'lose' | 'draw' | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const { playerCard, opponentCard } = initialData;

  useEffect(() => {
    // mimic old timing sequence
    setTimeout(() => {
      setGameState('revealing');
      setIsFlipping(true);
      setTimeout(() => {
        setIsFlipping(false);
        setShowCardContent(true);
        setTimeout(() => {
          setShowMetadata(true);
          setGameState('battle');
          // compute result
          const playerPower = playerCard.attack + playerCard.defense;
          const opponentPower = opponentCard.attack + opponentCard.defense;
          setTimeout(() => {
            if (playerPower > opponentPower) setBattleResult('win');
            else if (playerPower < opponentPower) setBattleResult('lose');
            else setBattleResult('draw');
            setGameState('result');
            // Show result with delay for smooth animation
            setTimeout(() => setShowResult(true), 100);
          }, 1500);
        }, 400);
      }, 1000);
    }, 800);
  }, [playerCard, opponentCard]);

  return (
    <div className="flex w-full flex-col items-center gap-12 min-h-screen py-8 bg-gradient-to-br from-black via-red-950/30 to-blue-950/30 overflow-hidden">
      <div className={`flex items-center w-full relative px-8 transition-all duration-1000 ${
        gameState === 'result' && showResult 
          ? 'md:justify-between justify-center flex-col md:flex-row gap-8 md:gap-0' 
          : 'justify-center gap-12 flex-col md:flex-row'
      }`} style={{ minWidth: '320px' }}>
        {/* Opponent card - shows first on mobile (top), second on desktop (right) */}
        <div className="order-1 md:order-2">
          <CardDisplay 
            card={opponentCard} 
            role="OPPONENT" 
            isFlipping={isFlipping} 
            gameState={gameState} 
            showContent={showCardContent} 
            showMeta={showMetadata} 
            opponent
            showResult={showResult}
          />
        </div>
        
        {/* Battle Result */}
        {battleResult && (
          <div className={`absolute z-20 transition-all duration-800 ease-out ${
            showResult 
              ? 'opacity-100 scale-100 translate-y-0' 
              : 'opacity-0 scale-50 translate-y-4'
          } left-1/2 transform -translate-x-1/2 md:top-auto top-1/2 md:-translate-y-0 -translate-y-1/2`}>
            <div className={`px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold text-xl md:text-2xl shadow-2xl border-2 transform ${
              battleResult === 'win' 
                ? 'bg-gradient-to-r from-green-600 via-green-500 to-green-600 text-white border-green-400 animate-pulse-glow-green' 
                : battleResult === 'lose' 
                ? 'bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white border-red-400 animate-pulse-glow-red' 
                : 'bg-gradient-to-r from-yellow-600 via-orange-500 to-yellow-600 text-black border-orange-400 animate-pulse-glow-orange'
            }`}>
              <div className="flex items-center gap-2 md:gap-3">
                {battleResult === 'win' && <Sparkles className="h-5 w-5 md:h-6 md:w-6" />}
                {battleResult === 'win' ? 'YOU WIN!' : battleResult === 'lose' ? 'YOU LOSE!' : 'DRAW!'}
                {battleResult === 'win' && <Sparkles className="h-5 w-5 md:h-6 md:w-6" />}
              </div>
            </div>
          </div>
        )}
        
        {/* Player card - shows second on mobile (bottom), first on desktop (left) */}
        <div className="order-2 md:order-1">
          <CardDisplay 
            card={playerCard} 
            role="YOU" 
            isFlipping={isFlipping} 
            gameState={gameState} 
            showContent={showCardContent} 
            showMeta={showMetadata}
            showResult={showResult}
          />
        </div>
      </div>

      {gameState === 'result' && (
        <button 
          onClick={onReset} 
          className={`bg-gradient-to-r from-red-600 via-orange-600 to-red-600 hover:from-red-700 hover:via-orange-700 hover:to-red-700 text-white font-bold py-3 px-8 rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300 text-xl flex items-center gap-2 z-10 ${
            showResult ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: showResult ? '0.8s' : '0s' }}
        >
          <Sparkles size={20} /> Open Another Pack <Sparkles size={20} />
        </button>
      )}

      <style jsx global>{`
        .card-flip-animation {
          perspective: 1000px !important;
          width: 320px !important;
          height: 384px !important;
        }
        
        @media (max-width: 768px) {
          .card-flip-animation {
            width: 280px !important;
            height: 336px !important;
          }
        }
        
        .card-flip-inner {
          position: relative !important;
          width: 100% !important;
          height: 100% !important;
          text-align: center !important;
          transition: transform 1s !important;
          transform-style: preserve-3d !important;
        }
        
        .card-flip-animation.flipping .card-flip-inner {
          transform: rotateY(180deg) !important;
        }
        
        .card-flip-front, .card-flip-back {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          backface-visibility: hidden !important;
          -webkit-backface-visibility: hidden !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
        }
        
        .card-flip-back {
          transform: rotateY(180deg) !important;
        }
        
        .card-flip-front {
          transform: rotateY(0deg) !important;
        }
        
        @keyframes fade-in-custom {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-custom {
          animation: fade-in-custom 0.6s ease-out !important;
        }

        @keyframes pulse-glow-green {
          0%, 100% {
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.5), 0 0 40px rgba(34, 197, 94, 0.3), 0 0 60px rgba(34, 197, 94, 0.1);
          }
          50% {
            box-shadow: 0 0 30px rgba(34, 197, 94, 0.8), 0 0 50px rgba(34, 197, 94, 0.5), 0 0 70px rgba(34, 197, 94, 0.2);
          }
        }

        @keyframes pulse-glow-red {
          0%, 100% {
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.3), 0 0 60px rgba(239, 68, 68, 0.1);
          }
          50% {
            box-shadow: 0 0 30px rgba(239, 68, 68, 0.8), 0 0 50px rgba(239, 68, 68, 0.5), 0 0 70px rgba(239, 68, 68, 0.2);
          }
        }

        @keyframes pulse-glow-orange {
          0%, 100% {
            box-shadow: 0 0 20px rgba(251, 146, 60, 0.5), 0 0 40px rgba(251, 146, 60, 0.3), 0 0 60px rgba(251, 146, 60, 0.1);
          }
          50% {
            box-shadow: 0 0 30px rgba(251, 146, 60, 0.8), 0 0 50px rgba(251, 146, 60, 0.5), 0 0 70px rgba(251, 146, 60, 0.2);
          }
        }

        .animate-pulse-glow-green {
          animation: pulse-glow-green 2s ease-in-out infinite !important;
        }

        .animate-pulse-glow-red {
          animation: pulse-glow-red 2s ease-in-out infinite !important;
        }

        .animate-pulse-glow-orange {
          animation: pulse-glow-orange 2s ease-in-out infinite !important;
        }
      `}</style>
    </div>
  );
};

interface CardDisplayProps {
  card: Card;
  role: string;
  opponent?: boolean;
  isFlipping: boolean;
  gameState: string;
  showContent: boolean;
  showMeta: boolean;
  showResult: boolean;
}

const CardDisplay: React.FC<CardDisplayProps> = ({ 
  card, 
  role, 
  opponent, 
  isFlipping, 
  gameState, 
  showContent, 
  showMeta, 
  showResult
}) => {
  // Calculate transform for card movement when result is shown
  const getCardTransform = () => {
    if (gameState === 'opening') {
      // Mobile: slide from top/bottom, Desktop: slide from left/right
      return opponent 
        ? 'opacity-0 translate-y-96 md:translate-y-0 md:translate-x-96' 
        : 'opacity-0 translate-y-96 md:translate-y-0 md:-translate-x-96';
    }
    
    if (gameState === 'result' && showResult) {
      // Subtle scaling when result is shown, main positioning handled by parent container
      return 'opacity-100 translate-x-0 translate-y-0 scale-95';
    }
    
    return 'opacity-100 translate-x-0 translate-y-0';
  };

  return (
    <div className="text-center">
      <h2 className={`text-xl font-bold ${opponent ? 'text-red-400' : 'text-orange-400'} mb-4 transition-all duration-800 ${
        gameState === 'result' && showResult ? 'scale-110' : ''
      }`}>
        {role}
      </h2>
      <div className={`relative transition-all duration-1000 ease-out ${getCardTransform()}`}>
        <div className={`card-flip-animation ${isFlipping ? 'flipping' : ''} ${
          gameState === 'result' && showResult ? 'animate-subtle-float' : ''
        }`}>
          <div className="card-flip-inner">
            {/* Card Back */}
            <div className="card-flip-back">
              <div className={`w-80 h-96 rounded-xl shadow-2xl flex items-center justify-center border-4 border-orange-400 ${
                opponent ? 'bg-gradient-to-br from-red-800 to-orange-900' : 'bg-gradient-to-br from-blue-800 to-red-900'
              }`}>
                <div className="text-6xl">🎴</div>
              </div>
            </div>
            
            {/* Card Front */}
            <div className="card-flip-front">
              {showContent && (
                <div className={`w-80 h-96 rounded-xl shadow-2xl border-4 ${getRarityColor()} p-4 flex flex-col transition-all duration-500 ${
                  gameState === 'result' && showResult ? 'shadow-orange-500/20' : ''
                }`}>
                  <div className="text-center mb-3">
                    <h3 className="font-bold text-base text-white">{card.name}</h3>
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center">
                    <img src={card.image} alt={card.name} className="object-contain max-h-64 max-w-full rounded" />
                  </div>
                  
                  {showMeta && (
                    <div className="animate-fade-in-custom space-y-2 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1 text-red-400 text-sm">
                          <Sword size={14} />
                          {card.attack}
                        </span>
                        <span className="flex items-center gap-1 text-blue-400 text-sm">
                          <Shield size={14} />
                          {card.defense}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes subtle-float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-subtle-float {
          animation: subtle-float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default DynamicBattleStage; 