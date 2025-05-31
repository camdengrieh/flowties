import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: LucideIcon;
}

export default function StatsCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon: Icon 
}: StatsCardProps) {
  const changeColorMap = {
    increase: 'text-green-400',
    decrease: 'text-red-400',
    neutral: 'text-gray-400'
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-red-950/30 to-gray-900 rounded-lg shadow-2xl border border-red-900/30 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-400 truncate">
            {title}
          </p>
          <p className="text-2xl font-semibold text-white mt-1">
            {value}
          </p>
          {change && (
            <p className={`text-sm mt-1 ${changeColorMap[changeType]}`}>
              {change}
            </p>
          )}
        </div>
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
} 