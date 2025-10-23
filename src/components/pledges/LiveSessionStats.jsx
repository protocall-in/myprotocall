import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, DollarSign, Clock, Activity } from 'lucide-react';
import { useCountdown } from '../hooks/useCountdown';

/**
 * Real-time session statistics display
 * Shows live updates without changing UI structure
 */
export default function LiveSessionStats({ session, stats }) {
  const countdown = useCountdown(session?.session_end);

  if (!session) return null;

  const displayStats = stats || {
    unique_pledgers_count: session.unique_pledgers_count || 0,
    total_pledges: session.total_pledges || 0,
    total_pledge_value: session.total_pledge_value || 0
  };

  return (
    <>
      {/* Live Countdown Timer */}
      {countdown && !countdown.expired && (
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-orange-500 animate-pulse" />
          <span className="font-medium text-gray-700">
            Ends in: <span className="text-orange-600 font-semibold">{countdown.display}</span>
          </span>
          {countdown.totalSeconds < 3600 && (
            <Badge className="bg-orange-100 text-orange-700 border-orange-200 animate-pulse">
              Ending Soon!
            </Badge>
          )}
        </div>
      )}

      {countdown?.expired && (
        <Badge className="bg-red-100 text-red-700 border-red-200">
          <Clock className="w-3 h-3 mr-1" />
          Expired
        </Badge>
      )}

      {/* Live Stats */}
      <div className="grid grid-cols-3 gap-4 mt-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" />
          <div>
            <p className="text-xs text-gray-500">Pledgers</p>
            <p className="text-sm font-semibold text-gray-900">
              {displayStats.unique_pledgers_count}
              {stats && <Activity className="w-3 h-3 inline ml-1 text-green-500 animate-pulse" />}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-600" />
          <div>
            <p className="text-xs text-gray-500">Total Pledges</p>
            <p className="text-sm font-semibold text-gray-900">
              {displayStats.total_pledges}
              {stats && <Activity className="w-3 h-3 inline ml-1 text-green-500 animate-pulse" />}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-600" />
          <div>
            <p className="text-xs text-gray-500">Total Value</p>
            <p className="text-sm font-semibold text-gray-900">
              ₹{(displayStats.total_pledge_value / 1000).toFixed(1)}K
              {stats && <Activity className="w-3 h-3 inline ml-1 text-green-500 animate-pulse" />}
            </p>
          </div>
        </div>
      </div>

      {/* Capacity Warning */}
      {session.capacity && displayStats.total_pledges > 0 && (
        <div className="mt-3">
          {(() => {
            const fillPercentage = (displayStats.total_pledges / session.capacity) * 100;
            return (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Capacity</span>
                  <span className={fillPercentage >= 90 ? 'text-red-600 font-semibold' : ''}>
                    {displayStats.total_pledges} / {session.capacity}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      fillPercentage >= 100 ? 'bg-red-500' :
                      fillPercentage >= 80 ? 'bg-orange-500 animate-pulse' :
                      fillPercentage >= 50 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                  ></div>
                </div>
                {fillPercentage >= 80 && fillPercentage < 100 && (
                  <p className="text-xs text-orange-600 font-medium animate-pulse">
                    ⚠️ Filling up fast! Only {session.capacity - displayStats.total_pledges} spots left
                  </p>
                )}
                {fillPercentage >= 100 && (
                  <p className="text-xs text-red-600 font-semibold">
                    🔴 Session Full - No more pledges accepted
                  </p>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </>
  );
}