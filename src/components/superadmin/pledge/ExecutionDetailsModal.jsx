import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  User,
  Building2,
  Calendar,
  DollarSign,
  Package,
  Activity,
  FileText,
  AlertCircle,
  Copy,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ExecutionDetailsModal({ execution, session, user, open, onClose }) {
  if (!execution) return null;

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'Pending' };
      case 'partial':
        return { icon: Activity, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Partial' };
      case 'completed':
        return { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Completed' };
      case 'failed':
        return { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100', label: 'Failed' };
      case 'cancelled':
        return { icon: XCircle, color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Cancelled' };
      default:
        return { icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Unknown' };
    }
  };

  const statusConfig = getStatusConfig(execution.status);
  const StatusIcon = statusConfig.icon;

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleDownloadReceipt = () => {
    // Generate receipt data
    const receiptData = {
      execution_id: execution.id,
      stock_symbol: execution.stock_symbol,
      side: execution.side,
      executed_qty: execution.executed_qty,
      executed_price: execution.executed_price,
      total_value: execution.total_execution_value,
      executed_at: execution.executed_at,
      broker_order_id: execution.broker_order_id,
      status: execution.status
    };

    const dataStr = JSON.stringify(receiptData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `execution-receipt-${execution.id}.json`;
    link.click();
    toast.success('Receipt downloaded!');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
                <StatusIcon className={`w-6 h-6 ${statusConfig.color}`} />
              </div>
              Execution Details
            </DialogTitle>
            <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0 text-sm px-3 py-1`}>
              {statusConfig.label}
            </Badge>
          </div>
          <DialogDescription>
            Complete details for execution record #{execution.id?.slice(-8)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stock & Session Information */}
          <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Stock & Session Info
                </h3>
                {execution.side && (
                  <Badge className={execution.side === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {execution.side === 'buy' ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {execution.side?.toUpperCase()}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Stock Symbol</p>
                  <p className="text-lg font-bold text-gray-900">{execution.stock_symbol || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Session ID</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono text-gray-900">{execution.session_id?.slice(-12) || 'N/A'}</p>
                    {execution.session_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(execution.session_id, 'Session ID')}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Batch ID</p>
                  <p className="text-sm font-mono text-gray-700">{execution.execution_batch_id?.slice(-12) || 'N/A'}</p>
                </div>
                {session && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Session Name</p>
                    <p className="text-sm font-medium text-gray-900">{session.stock_name || 'N/A'}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Execution Metrics */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                Execution Metrics
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-xs text-blue-600 font-medium mb-1">Pledged Qty</p>
                  <p className="text-2xl font-bold text-blue-900">{execution.pledged_qty || 0}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-xs text-green-600 font-medium mb-1">Executed Qty</p>
                  <p className="text-2xl font-bold text-green-900">{execution.executed_qty || 0}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-xs text-purple-600 font-medium mb-1">Executed Price</p>
                  <p className="text-2xl font-bold text-purple-900">₹{execution.executed_price?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg">
                  <p className="text-xs text-amber-600 font-medium mb-1">Total Value</p>
                  <p className="text-2xl font-bold text-amber-900">₹{(execution.total_execution_value || 0).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Breakdown */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Financial Breakdown
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Gross Amount</span>
                  <span className="font-semibold text-gray-900">₹{(execution.total_execution_value || 0).toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Platform Commission ({execution.commission_rate}%)</span>
                  <span className="font-semibold text-blue-600">₹{(execution.platform_commission || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Broker Commission</span>
                  <span className="font-semibold text-purple-600">₹{(execution.broker_commission || 0).toLocaleString()}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg">
                  <span className="font-semibold text-gray-900">Net Amount</span>
                  <span className="font-bold text-green-700 text-lg">₹{(execution.net_amount || 0).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User & Account Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                User & Account Info
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">User ID</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono text-gray-900">{execution.user_id?.slice(-12) || 'N/A'}</p>
                    {execution.user_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(execution.user_id, 'User ID')}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
                {user && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">User Name</p>
                    <p className="text-sm font-medium text-gray-900">{user.display_name || 'N/A'}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Demat Account</p>
                  <p className="text-sm font-mono text-gray-900">{execution.demat_account_id?.slice(-12) || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Broker Order ID</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono text-gray-900">{execution.broker_order_id || 'N/A'}</p>
                    {execution.broker_order_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(execution.broker_order_id, 'Broker Order ID')}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Execution Timeline */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Execution Timeline
              </h3>

              <div className="space-y-3">
                {execution.executed_at && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Executed At</p>
                      <p className="text-xs text-gray-600">
                        {format(new Date(execution.executed_at), 'PPP p')}
                      </p>
                    </div>
                  </div>
                )}
                {execution.settlement_date && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Settlement Date</p>
                      <p className="text-xs text-gray-600">
                        {format(new Date(execution.settlement_date), 'PPP')}
                      </p>
                    </div>
                  </div>
                )}
                {execution.created_date && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Record Created</p>
                      <p className="text-xs text-gray-600">
                        {format(new Date(execution.created_date), 'PPP p')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Error Details (if failed) */}
          {execution.status === 'failed' && execution.error_message && (
            <Card className="border-2 border-red-200 bg-red-50">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  Error Details
                </h3>
                <div className="bg-white p-4 rounded-lg border border-red-200">
                  <p className="text-sm text-red-800 font-mono whitespace-pre-wrap">{execution.error_message}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Broker Response (if available) */}
          {execution.raw_broker_response && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  Raw Broker Response
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-60 overflow-y-auto">
                  <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap">
                    {typeof execution.raw_broker_response === 'string' 
                      ? execution.raw_broker_response 
                      : JSON.stringify(execution.raw_broker_response, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleDownloadReceipt}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Receipt
            </Button>
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}