import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, Loader2, TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Real-time execution status display
 * Shows live updates for pledge execution without changing UI
 */
export default function LiveExecutionStatus({ execution }) {
  if (!execution) return null;

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          label: 'Pending Execution',
          animate: false
        };
      case 'partial':
        return {
          icon: Loader2,
          color: 'bg-blue-100 text-blue-700 border-blue-200',
          label: 'Partially Executed',
          animate: true
        };
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'bg-green-100 text-green-700 border-green-200',
          label: 'Executed Successfully',
          animate: false
        };
      case 'failed':
        return {
          icon: AlertCircle,
          color: 'bg-red-100 text-red-700 border-red-200',
          label: 'Execution Failed',
          animate: false
        };
      case 'cancelled':
        return {
          icon: AlertCircle,
          color: 'bg-orange-100 text-orange-700 border-orange-200',
          label: 'Cancelled',
          animate: false
        };
      default:
        return {
          icon: Clock,
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          label: status,
          animate: false
        };
    }
  };

  const statusConfig = getStatusConfig(execution.status);
  const StatusIcon = statusConfig.icon;

  const hasProfitLoss = execution.executed_qty && execution.executed_price;
  const profitLoss = hasProfitLoss 
    ? (execution.executed_price - (execution.pledged_price || 0)) * execution.executed_qty
    : 0;
  const isProfitable = profitLoss > 0;

  return (
    <div className="space-y-2">
      {/* Status Badge */}
      <Badge className={`${statusConfig.color} flex items-center gap-1`}>
        <StatusIcon className={`w-3 h-3 ${statusConfig.animate ? 'animate-spin' : ''}`} />
        {statusConfig.label}
      </Badge>

      {/* Execution Details */}
      {execution.status === 'completed' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Executed Qty:</span>
            <span className="font-semibold text-gray-900">{execution.executed_qty}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Execution Price:</span>
            <span className="font-semibold text-gray-900">₹{execution.executed_price?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Total Value:</span>
            <span className="font-semibold text-gray-900">
              ₹{(execution.total_execution_value || 0).toFixed(2)}
            </span>
          </div>
          
          {hasProfitLoss && profitLoss !== 0 && (
            <div className={`flex justify-between items-center text-sm pt-2 border-t ${
              isProfitable ? 'border-green-300' : 'border-red-300'
            }`}>
              <span className="text-gray-600">P&L:</span>
              <span className={`font-bold flex items-center gap-1 ${
                isProfitable ? 'text-green-600' : 'text-red-600'
              }`}>
                {isProfitable ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {isProfitable ? '+' : ''}₹{profitLoss.toFixed(2)}
              </span>
            </div>
          )}

          {execution.executed_at && (
            <div className="text-xs text-gray-500 pt-1">
              Executed: {new Date(execution.executed_at).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Partial Execution */}
      {execution.status === 'partial' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-blue-700 mb-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="font-medium">Execution in progress...</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Executed:</span>
            <span className="font-semibold text-gray-900">
              {execution.executed_qty} / {execution.pledged_qty}
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ 
                width: `${((execution.executed_qty / execution.pledged_qty) * 100)}%` 
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Failed Execution */}
      {execution.status === 'failed' && execution.error_message && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700 font-medium mb-1">Execution Failed</p>
          <p className="text-xs text-red-600">{execution.error_message}</p>
        </div>
      )}

      {/* Broker Order ID */}
      {execution.broker_order_id && (
        <div className="text-xs text-gray-500">
          Order ID: <span className="font-mono">{execution.broker_order_id}</span>
        </div>
      )}
    </div>
  );
}