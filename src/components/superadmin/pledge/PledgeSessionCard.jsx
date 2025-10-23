
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Edit,
  Copy,
  Trash2,
  Play,
  StopCircle,
  Eye,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Calendar,
  Moon,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  ShoppingCart,
  ShoppingBag,
  Repeat,
  AlertTriangle,
  RefreshCw,
  FileText,
  Loader2,
  PlayCircle,
  BarChart,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function PledgeSessionCard({
  session,
  pledges = [],
  onEdit,
  onClone,
  onDelete,
  onActivate,
  onClose,
  onExecute,
  onRecalculateStats,
  isExecuting, // Prop preserved as per existing code
}) {
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const statusConfig = {
    draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: <FileText className="w-3 h-3 mr-1" /> },
    active: { label: 'Active', color: 'bg-green-100 text-green-800', icon: <Activity className="w-3 h-3 mr-1" /> },
    closed: { label: 'Closed', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-3 h-3 mr-1" /> },
    executing: { label: 'Executing', color: 'bg-blue-100 text-blue-800', icon: <Loader2 className="w-3 h-3 mr-1 animate-spin" /> },
    // CHANGED: icon for awaiting_sell_execution from TrendingUp to Clock as per outline
    awaiting_sell_execution: { label: 'Awaiting Sell', color: 'bg-indigo-100 text-indigo-800', icon: <Clock className="w-3 h-3 mr-1" /> },
    completed: { label: 'Completed', color: 'bg-purple-100 text-purple-800', icon: <CheckCircle className="w-3 h-3 mr-1" /> },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3 mr-1" /> },
  };

  // Session Mode Configuration
  const sessionModeConfig = {
    buy_only: {
      color: 'bg-green-100 text-green-700 border-green-200',
      icon: ShoppingCart,
      label: 'BUY ONLY'
    },
    sell_only: {
      color: 'bg-red-100 text-red-700 border-red-200',
      icon: ShoppingBag,
      label: 'SELL ONLY'
    },
    buy_sell_cycle: {
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: Repeat,
      label: 'BUY & SELL'
    },
  };

  const sessionStatus = statusConfig[session.status] || statusConfig.draft;

  const modeConfig = sessionModeConfig[session.session_mode] || sessionModeConfig.buy_only;
  const ModeIcon = modeConfig.icon;

  // Mock stock price change (in production, fetch from real API)
  const mockPriceChange = Math.random() > 0.5 ? 1 : -1;
  const mockPricePercent = (Math.random() * 5).toFixed(2);

  const readyPledges = pledges.filter(p => p.status === 'ready_for_execution');
  const executedPledges = pledges.filter(p => p.status === 'executed');

  // Check if execution rule is session_end to highlight it
  const isSessionEndRule = session.execution_rule === 'session_end';

  return (
    <>
      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
        {/* Card Header with Gradient */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white">{session.stock_symbol}</h3>
                  {/* Stock Price Indicator */}
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded ${mockPriceChange > 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    {mockPriceChange > 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-300" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-300" />
                    )}
                    <span className={`text-xs font-semibold ${mockPriceChange > 0 ? 'text-green-300' : 'text-red-300'}`}>
                      {mockPriceChange > 0 ? '+' : '-'}{mockPricePercent}%
                    </span>
                  </div>
                </div>

                {/* Session Mode Badge */}
                <Badge className={`${modeConfig.color} border`}>
                  <ModeIcon className="w-3 h-3 mr-1" />
                  {modeConfig.label}
                </Badge>

                <Badge className={`${sessionStatus.color} border-0`}>
                  {sessionStatus.icon}
                  {sessionStatus.label}
                </Badge>

                {session.allow_amo && (
                  <Badge className="bg-indigo-100 text-indigo-700 border-0">
                    <Moon className="w-3 h-3 mr-1" />
                    AMO
                  </Badge>
                )}
              </div>
              <p className="text-sm text-white/90">{session.stock_name}</p>
            </div>

            {/* Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowDetailsModal(true)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Session
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onClone}>
                  <Copy className="w-4 h-4 mr-2" />
                  Clone Session
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                {session.status === 'draft' && (
                  <DropdownMenuItem onClick={onActivate}>
                    <Play className="w-4 h-4 mr-2 text-green-600" />
                    <span className="text-green-600">Activate Session</span>
                  </DropdownMenuItem>
                )}

                {session.status === 'active' && (
                  <>
                    <DropdownMenuItem onClick={() => onExecute(session)}>
                      <Play className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="text-blue-600">Execute Now</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onClose}>
                      <StopCircle className="w-4 h-4 mr-2 text-yellow-600" />
                      <span className="text-yellow-600">Close Session</span>
                    </DropdownMenuItem>
                  </>
                )}

                {/* NEW: Dropdown menu item for 'Execute Sell Orders' */}
                {session.status === 'awaiting_sell_execution' && (
                  <DropdownMenuItem onClick={() => onExecute(session)}>
                    <TrendingDown className="w-4 h-4 mr-2 text-red-600" />
                    <span className="text-red-600">Execute Sell Orders</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Session
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <CardContent className="p-6 space-y-4">
          {/* Display stock symbol and status badge pair in CardContent */}
          <div className="flex justify-between items-center text-sm">
            <Badge variant="outline" className="font-mono text-blue-700 bg-blue-50 border-blue-200">
              {session.stock_symbol}
            </Badge>
            <Badge variant="outline" className={cn("font-semibold text-xs", sessionStatus.color)}>
              {sessionStatus.icon}
              <span className="ml-1">{sessionStatus.label}</span>
            </Badge>
          </div>

          {/* Special highlighted panel for 'awaiting_sell_execution' status */}
          {session.status === 'awaiting_sell_execution' && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
              <h4 className="font-semibold text-sm text-indigo-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Sell Phase Active
              </h4>
              <p className="text-xs text-indigo-700 mt-1">
                Buy orders are complete and positions are now live. You can monitor and manage sell executions from the <b className="font-bold">"Executions"</b> tab.
              </p>
            </div>
          )}

          {/* Session Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-xs text-blue-600 font-semibold">TOTAL</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{session.total_pledges || 0}</p>
              <p className="text-xs text-blue-600">Total Pledges</p>
              <div className="mt-2 flex gap-2 text-xs">
                <span className="text-green-600">Buy: {session.buy_pledges_count || 0}</span>
                <span className="text-red-600">Sell: {session.sell_pledges_count || 0}</span>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-xs text-green-600 font-semibold">VALUE</span>
              </div>
              <p className="text-2xl font-bold text-green-900">
                ₹{((session.total_pledge_value || 0) / 1000).toFixed(1)}k
              </p>
              <p className="text-xs text-green-600">Total Value</p>
              <div className="mt-2 flex gap-2 text-xs">
                <span className="text-green-600">Buy: ₹{((session.buy_pledges_value || 0) / 1000).toFixed(1)}k</span>
                <span className="text-red-600">Sell: ₹{((session.sell_pledges_value || 0) / 1000).toFixed(1)}k</span>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-5 h-5 text-purple-600" />
                <span className="text-xs text-purple-600 font-semibold">READY</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">{readyPledges.length}</p>
              <p className="text-xs text-purple-600">Ready to Execute</p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-orange-600" />
                <span className="text-xs text-orange-600 font-semibold">EXECUTED</span>
              </div>
              <p className="text-2xl font-bold text-orange-900">{executedPledges.length}</p>
              <p className="text-xs text-orange-600">Completed</p>
            </div>
          </div>

          {/* Recalculate Stats Button */}
          {(session.total_pledges === 0 && pledges.length > 0) && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">Stats may be out of sync</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRecalculateStats}
                  className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Recalculate
                </Button>
              </div>
            </div>
          )}

          {/* Session Timeline */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Start: {format(new Date(session.session_start), 'PPp')}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span>End: {format(new Date(session.session_end), 'PPp')}</span>
            </div>
          </div>

          {/* Session Info Tags */}
          <div className="flex flex-wrap gap-2">
            {/* Highlight session_end execution rule */}
            <Badge
              variant="outline"
              className={`text-xs ${isSessionEndRule ? 'bg-orange-100 text-orange-700 border-orange-300 font-semibold' : ''}`}
            >
              {isSessionEndRule && <Clock className="w-3 h-3 mr-1" />}
              {session.execution_rule}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Fee: ₹{session.convenience_fee_amount}
            </Badge>
          </div>

          {/* Action Buttons */}
          {/* Consolidated existing and new buttons here */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowDetailsModal(true)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Details
            </Button>

            {/* Changed icon to PlayCircle for active session execution as per outline */}
            {session.status === 'active' && (
              <Button
                size="sm"
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={() => onExecute(session)}
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                Execute
              </Button>
            )}

            {/* NEW: Button for awaiting_sell_execution status */}
            {session.status === 'awaiting_sell_execution' && (
              <Button
                size="sm"
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={() => onExecute(session)}
              >
                <TrendingDown className="w-4 h-4 mr-2" />
                Execute Sell Orders
              </Button>
            )}

            {session.status === 'draft' && (
              <Button
                size="sm"
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                onClick={onActivate}
              >
                <Play className="w-4 h-4 mr-2" />
                Activate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              {session.stock_symbol}
              <Badge className={`${sessionStatus.color} border-0`}>
                {sessionStatus.label}
              </Badge>
            </DialogTitle>
            <DialogDescription>{session.stock_name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Description */}
            {session.description && (
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-gray-600">{session.description}</p>
              </div>
            )}

            {/* Execution Reason */}
            {session.execution_reason && (
              <div>
                <h4 className="font-semibold mb-2">Execution Rationale</h4>
                <p className="text-sm text-gray-600">{session.execution_reason}</p>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-xs text-blue-600 mb-1">Total Pledges</p>
                <p className="text-2xl font-bold text-blue-900">{session.total_pledges || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-xs text-green-600 mb-1">Total Value</p>
                <p className="text-2xl font-bold text-green-900">₹{((session.total_pledge_value || 0) / 1000).toFixed(1)}k</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-xs text-purple-600 mb-1">Buy Pledges</p>
                <p className="text-2xl font-bold text-purple-900">{session.buy_pledges_count || 0}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-xs text-orange-600 mb-1">Sell Pledges</p>
                <p className="text-2xl font-bold text-orange-900">{session.sell_pledges_count || 0}</p>
              </div>
            </div>

            {/* Configuration Details */}
            <div className="space-y-3">
              <h4 className="font-semibold">Configuration</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Session Mode</p>
                  <p className="font-medium">{session.session_mode?.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-gray-500">Execution Rule</p>
                  {/* Highlight session_end in modal too */}
                  <p className={`font-medium ${isSessionEndRule ? 'text-orange-600 font-semibold' : ''}`}>
                    {session.execution_rule}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">AMO Enabled</p>
                  <p className="font-medium">{session.allow_amo ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Convenience Fee</p>
                  <p className="font-medium">
                    {session.convenience_fee_type === 'flat' ? '₹' : ''}{session.convenience_fee_amount}{session.convenience_fee_type === 'percent' ? '%' : ''}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Min Quantity</p>
                  <p className="font-medium">{session.min_qty || 1}</p>
                </div>
                <div>
                  <p className="text-gray-500">Max Quantity</p>
                  <p className="font-medium">{session.max_qty || 'Unlimited'}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              <h4 className="font-semibold">Timeline</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Session Start</span>
                  <span className="font-medium">{format(new Date(session.session_start), 'PPp')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Session End</span>
                  <span className="font-medium">{format(new Date(session.session_end), 'PPp')}</span>
                </div>
                {session.last_executed_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Executed</span>
                    <span className="font-medium">{format(new Date(session.last_executed_at), 'PPp')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {session.is_advisor_recommended && (
                <Badge className="bg-blue-100 text-blue-700">SEBI Advisor Recommended</Badge>
              )}
              {session.is_analyst_certified && (
                <Badge className="bg-green-100 text-green-700">Analyst Certified</Badge>
              )}
              {session.allow_amo && (
                <Badge className="bg-indigo-100 text-indigo-700">
                  <Moon className="w-3 h-3 mr-1" />
                  AMO Enabled
                </Badge>
              )}
            </div>

            {/* Action Buttons for Modal */}
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onEdit} className="flex-1">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" onClick={onClone} className="flex-1">
                <Copy className="w-4 h-4 mr-2" />
                Clone
              </Button>
              {session.status === 'active' && (
                <Button
                  onClick={() => {
                    setShowDetailsModal(false);
                    onExecute(session);
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Execute
                </Button>
              )}
              {/* NEW: Button for awaiting_sell_execution status in modal */}
              {session.status === 'awaiting_sell_execution' && (
                <Button
                  onClick={() => {
                    setShowDetailsModal(false);
                    onExecute(session);
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Execute Sell Orders
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
