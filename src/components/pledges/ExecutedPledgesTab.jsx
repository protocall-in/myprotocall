
import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle, TrendingUp, TrendingDown, FileText,
  Target, Calendar, Clock, Receipt, Download, Loader2
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import PledgeTradeDocumentModal from './PledgeTradeDocumentModal';
import { toast } from 'sonner';

const ExecutionCard = ({ execution, sellExecution, session, livePrice, pledge }) => {
  const isCycle = session?.session_mode === 'buy_sell_cycle';
  const isCompletedCycle = isCycle && sellExecution;
  const isAwaitingSell = isCycle && !sellExecution;

  const unrealizedPl = isAwaitingSell && livePrice ? (livePrice - execution.executed_price) * execution.executed_qty : 0;
  const realizedPl = isCompletedCycle ? (sellExecution.executed_price - execution.executed_price) * execution.executed_qty : 0;
  const realizedPlPercent = isCompletedCycle ? ((sellExecution.executed_price - execution.executed_price) / execution.executed_price) * 100 : 0;

  const executedOnDate = new Date(execution.executed_at);
  const settlementDate = new Date(executedOnDate);
  settlementDate.setDate(settlementDate.getDate() + 1);

  // Removed showDocModal and docType state, and handleShowDoc function
  // as document generation is being centralized elsewhere.
  
  const getStatusBadge = () => {
    if (isCompletedCycle) return <Badge className="bg-purple-100 text-purple-800"><CheckCircle className="w-3 h-3 mr-1" />Cycle Complete</Badge>;
    if (isAwaitingSell) return <Badge className="bg-blue-100 text-blue-800 animate-pulse">Awaiting Sell</Badge>;
    if (execution.side === 'buy') return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Buy Executed</Badge>;
    return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Sell Executed</Badge>;
  };

  return (
    <>
      <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden relative">
        {isCycle && (
          <div className="absolute top-4 right-4 text-xs font-bold bg-gray-100 text-gray-700 rounded-full px-3 py-1.5 transform rotate-[15deg] z-10">
            Buy-Sell Cycle
          </div>
        )}
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{execution.stock_symbol}</h2>
              <p className="text-sm font-semibold text-gray-500 mt-1">{execution.side.toUpperCase()} • {execution.executed_qty} shares</p>
            </div>
            {getStatusBadge()}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Buy Box */}
            <div className="p-4 border-2 border-green-200 bg-green-50 rounded-xl space-y-1">
              <h4 className="font-semibold text-sm text-green-800">Buy Executed Price</h4>
              <p className="text-2xl font-bold text-green-900">₹{execution.executed_price.toFixed(2)}</p>
              <p className="text-xs text-green-700">on {new Date(execution.executed_at).toLocaleDateString()}</p>
            </div>

            {/* Sell Box */}
            {isCycle && (
              isCompletedCycle ? (
                <div className="p-4 border-2 border-red-200 bg-red-50 rounded-xl space-y-1">
                  <h4 className="font-semibold text-sm text-red-800">Sell Executed Price</h4>
                  <p className="text-2xl font-bold text-red-900">₹{sellExecution.executed_price.toFixed(2)}</p>
                  <p className="text-xs text-red-700">on {new Date(sellExecution.executed_at).toLocaleDateString()}</p>
                </div>
              ) : (
                <div className="p-4 border-2 border-red-200 bg-red-50 rounded-xl flex flex-col items-center justify-center text-center">
                  <Clock className="w-6 h-6 text-red-600 mb-2" />
                  <h4 className="font-semibold text-sm text-red-800">Pending Sell Execution</h4>
                  <p className="text-xs text-gray-500 mt-2 italic">
                    The corresponding sell order for this cycle will be executed automatically by the system.
                  </p>
                </div>
              )
            )}
          </div>

          {/* Profit/Loss Box */}
          {isCycle && (
            <div className={`p-4 rounded-xl ${isCompletedCycle ? (realizedPl >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200') : 'bg-gray-50 border-gray-200'}`}>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">{isCompletedCycle ? "Realized Profit" : "Live P&L"}</h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <p className={`text-2xl font-bold ${isCompletedCycle ? (realizedPl >= 0 ? 'text-green-700' : 'text-red-700') : (unrealizedPl >= 0 ? 'text-green-700' : 'text-red-700')}`}>
                    {unrealizedPl >= 0 || realizedPl >= 0 ? '+' : ''}₹{Math.abs(isCompletedCycle ? realizedPl : unrealizedPl).toFixed(2)}
                  </p>
                  {isCompletedCycle && (
                    <Badge className={`${realizedPl >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {realizedPl >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {realizedPl >= 0 ? '+' : ''}{realizedPlPercent.toFixed(2)}%
                    </Badge>
                  )}
                </div>
                <TrendingUp className={`w-8 h-8 ${isCompletedCycle ? 'text-gray-300' : (unrealizedPl >= 0 ? 'text-green-400' : 'text-red-400')}`} />
              </div>
              <p className="text-xs text-gray-500 mt-1">{isCompletedCycle ? `Realized from cycle` : "Based on live market price"}</p>
            </div>
          )}

          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              Transaction Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" />Executed On</p>
                <p className="font-bold text-gray-800">{executedOnDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                <p className="text-xs text-gray-600">{executedOnDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />Settlement</p>
                <p className="font-bold text-gray-800">{settlementDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                <p className="text-xs text-gray-600">T+1</p>
              </div>
            </div>
          </div>

          {/* Buttons for Receipt and Invoice removed as per change request */}
        </CardContent>
      </Card>
      {/* PledgeTradeDocumentModal removed as its triggers were removed from this component */}
    </>
  );
};

const ExecutedPledgesTab = ({ executions, sessions, stockPrices, pledges }) => {
  const processedExecutions = useMemo(() => {
    // Check for null/undefined inputs early
    if (!executions || !sessions || !pledges) return [];

    const executionsByPledgeId = new Map();
    for (const exec of executions) {
        if (!executionsByPledgeId.has(exec.pledge_id)) {
            executionsByPledgeId.set(exec.pledge_id, { buyExecution: null, sellExecution: null });
        }
        const group = executionsByPledgeId.get(exec.pledge_id);
        if (exec.side === 'buy') {
            group.buyExecution = exec;
        } else if (exec.side === 'sell') {
            group.sellExecution = exec;
        }
    }

    const result = pledges
      .map(pledge => {
        const execs = executionsByPledgeId.get(pledge.id);
        const session = sessions.find(s => s.id === pledge.session_id);
        
        if (!execs || !session) {
          return null; // This pledge has no executions or session info, so we skip it.
        }

        const primaryExec = execs.buyExecution || execs.sellExecution;
        if (!primaryExec) {
          return null; // Skip if no primary execution is found.
        }

        return {
          id: pledge.id,
          execution: execs.buyExecution || primaryExec, // Prioritize buy execution for cycles
          sellExecution: execs.sellExecution,
          session,
          pledge,
        };
      })
      .filter(Boolean); // Remove any null entries

    // Sort by most recent execution time
    result.sort((a, b) => {
        const timeA = new Date(a.sellExecution?.executed_at || a.execution.executed_at).getTime();
        const timeB = new Date(b.sellExecution?.executed_at || b.execution.executed_at).getTime();
        return timeB - timeA;
    });

    return result;
  }, [executions, sessions, pledges]);

  if (processedExecutions.length === 0) {
    return (
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>No Executed Pledges Yet!</AlertTitle>
        <AlertDescription>
          Once your pledges are executed, they will appear here. For "Buy & Sell" cycles, the final Profit/Loss will be displayed after the sell order is complete.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {processedExecutions.map(item => {
        const livePrice = (stockPrices && stockPrices[item.execution.stock_symbol]) 
          ? stockPrices[item.execution.stock_symbol].price 
          : null;
        
        return (
          <ExecutionCard
            key={item.id}
            execution={item.execution}
            sellExecution={item.sellExecution}
            session={item.session}
            livePrice={livePrice}
            pledge={item.pledge}
          />
        );
      })}
    </div>
  );
};

export default ExecutedPledgesTab;
