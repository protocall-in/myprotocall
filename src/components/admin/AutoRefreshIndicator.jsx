import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Pause, Play, Clock, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/**
 * Auto-refresh indicator and controls for admin panels
 */
export default function AutoRefreshIndicator({
  isEnabled,
  isLoading,
  lastRefreshTime,
  onToggle,
  onManualRefresh,
  intervalSeconds = 30,
  hasNewData = false,
  onClearNewData
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
      {/* Auto-refresh toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="flex items-center gap-2"
      >
        {isEnabled ? (
          <>
            <Pause className="w-4 h-4" />
            Pause Auto-Refresh
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Enable Auto-Refresh
          </>
        )}
      </Button>

      {/* Manual refresh button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onManualRefresh}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? 'Refreshing...' : 'Refresh Now'}
      </Button>

      {/* Status indicator */}
      <div className="flex items-center gap-2 text-sm">
        {isEnabled && (
          <Badge className="bg-green-100 text-green-800 border-green-200 animate-pulse">
            <Activity className="w-3 h-3 mr-1" />
            Auto-refresh ON ({intervalSeconds}s)
          </Badge>
        )}

        {lastRefreshTime && (
          <Badge variant="outline" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Updated {formatDistanceToNow(lastRefreshTime, { addSuffix: true })}
          </Badge>
        )}

        {hasNewData && (
          <Badge 
            className="bg-blue-500 text-white cursor-pointer hover:bg-blue-600"
            onClick={onClearNewData}
          >
            New Data Available - Click to Dismiss
          </Badge>
        )}
      </div>
    </div>
  );
}