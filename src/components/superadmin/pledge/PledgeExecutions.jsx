
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, TrendingUp, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { PledgeExecutionRecord, PledgeSession } from '@/api/entities';
import AwaitingSellExecutionCard from './AwaitingSellExecutionCard';
import { Button } from '@/components/ui/button';

// PAGE_SIZE is removed as pagination is now managed externally by the parent component
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default function PledgeExecutions({ executions, sessions, pledges, users, onExecutionAdd, onRefresh }) {
  // Removed internal state for executions, awaitingSellSessions, page, hasMore
  // isLoading is now local for the refresh button, not for overall data loading
  const [isLoading, setIsLoading] = useState(false);
  const [isExecutingSell, setIsExecutingSell] = useState(null);

  // New state variables from the outline for filtering/searching and modal
  const [statusFilter, setStatusFilter] = useState('all'); // This would be hooked to a UI element for filtering
  const [searchTerm, setSearchTerm] = useState('');       // This would be hooked to a UI element for searching
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Derive awaitingSellSessions from the `sessions` prop
  const awaitingSellSessions = useMemo(() => {
    return sessions.filter(session => session.status === 'awaiting_sell_execution');
  }, [sessions]);

  // Filter executions based on new state variables
  const filteredExecutions = useMemo(() => {
    return executions.filter(execution => {
      const matchesStatus = statusFilter === 'all' || execution.status === statusFilter;
      const matchesSearch = searchTerm === '' ||
        execution.stock_symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        execution.side?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        execution.status?.toLowerCase().includes(searchTerm.toLowerCase()); // Added more fields for search
      return matchesStatus && matchesSearch;
    });
  }, [executions, statusFilter, searchTerm]);

  // New function from outline for viewing details (requires a modal component)
  const handleViewDetails = (execution) => {
    setSelectedExecution(execution);
    setShowDetailsModal(true);
  };

  // Removed loadData and its useEffect, as data is now passed via props

  const handleExecuteSell = async (sessionId) => {
    setIsExecutingSell(sessionId);
    toast.info(`Executing sell orders for session ${sessionId}...`);

    try {
      // 1. Find all original 'buy' execution records for this session
      const buyExecutions = await PledgeExecutionRecord.filter({
        session_id: sessionId,
        side: 'buy',
        status: 'completed'
      });

      if (buyExecutions.length === 0) {
        toast.warning('No buy positions found to sell for this session.');
        await PledgeSession.update(sessionId, { status: 'completed', execution_notes: 'Closed: No buy positions to sell.' });
        onRefresh && onRefresh(); // Notify parent to refresh all data
        return;
      }

      // 2. Create a new 'sell' execution record for each 'buy' record
      const sellPromises = buyExecutions.map(async (buyExec) => {
        await delay(100); // Stagger API calls
        const sellPrice = buyExec.executed_price * (1 + (Math.random() - 0.4) * 0.10); // Simulate price change
        
        const newRecordData = {
          pledge_id: buyExec.pledge_id,
          session_id: sessionId,
          user_id: buyExec.user_id,
          demat_account_id: buyExec.demat_account_id,
          stock_symbol: buyExec.stock_symbol,
          side: 'sell',
          pledged_qty: buyExec.executed_qty,
          executed_qty: buyExec.executed_qty,
          executed_price: parseFloat(sellPrice.toFixed(2)), // Ensure price is a number
          total_execution_value: parseFloat((buyExec.executed_qty * sellPrice).toFixed(2)), // Ensure value is a number
          status: 'completed',
          executed_at: new Date().toISOString(),
          error_message: 'Sell-side of buy-sell cycle.'
        };
        const createdRecord = await PledgeExecutionRecord.create(newRecordData);
        onExecutionAdd && onExecutionAdd(createdRecord); // Notify parent about the new individual execution
        return createdRecord;
      });
      
      await Promise.all(sellPromises);

      // 3. Update the session to 'completed'
      await PledgeSession.update(sessionId, {
        status: 'completed',
        last_executed_at: new Date().toISOString(),
        execution_notes: 'Buy-Sell cycle completed successfully.'
      });

      toast.success(`Sell orders executed for session ${sessionId}. The cycle is now complete.`);

      // 4. Refresh data - Now triggered via prop callback
      onRefresh && onRefresh();

    } catch (error) {
      console.error(`Failed to execute sell orders for session ${sessionId}:`, error);
      toast.error(`Failed to execute sell orders: ${error.message}`);
    } finally {
      setIsExecutingSell(null);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true); // Set local loading state for the button
    try {
      if (onRefresh) {
        await onRefresh(); // Call parent refresh function
        toast.success("Execution data refreshed.");
      } else {
        toast.info("Refresh function not provided by parent.");
      }
    } catch (error) {
      console.error("Failed to refresh execution data:", error);
      toast.error("Failed to refresh execution data.");
    } finally {
      setIsLoading(false); // Reset local loading state
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            Sessions Awaiting Sell-Side Execution
          </CardTitle>
          <p className="text-sm text-gray-500">
            These are "Buy-Sell Cycle" sessions where the initial buy orders have been executed. Click to trigger the sell orders and complete the cycle.
          </p>
        </CardHeader>
        <CardContent>
          {/* The initial loading state for this section is implicitly handled by the parent passing `sessions`. */}
          {/* If sessions is an empty array initially, it will show the 'No sessions...' message. */}
          {awaitingSellSessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {awaitingSellSessions.map(session => (
                <AwaitingSellExecutionCard
                  key={session.id}
                  session={session}
                  onExecuteSell={handleExecuteSell}
                  isExecuting={isExecutingSell === session.id}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No sessions are currently awaiting sell execution.</p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Execution History</CardTitle>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          {/* Placeholder for future filter and search UI */}
          {/*
          <div className="flex gap-4 mt-4">
            <select
              className="px-3 py-2 border rounded-md text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
            <input
              type="text"
              placeholder="Search stock symbol..."
              className="px-3 py-2 border rounded-md text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          */}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stock</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                {/* <TableHead>Details</TableHead> Uncomment if handleViewDetails is used */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExecutions.length === 0 ? (
                 <TableRow>
                     <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                         No execution records found matching your criteria.
                     </TableCell>
                 </TableRow>
              ) : (
                filteredExecutions.map(exec => (
                  <TableRow key={exec.id}>
                    <TableCell className="font-medium">{exec.stock_symbol}</TableCell>
                    <TableCell>
                      <Badge className={exec.side === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {exec.side.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{exec.executed_qty}</TableCell>
                    <TableCell>₹{exec.executed_price?.toFixed(2)}</TableCell>
                    <TableCell>
                       <Badge variant="outline" className={
                          exec.status === 'completed' ? 'text-green-700 border-green-200' :
                          exec.status === 'failed' ? 'text-red-700 border-red-200' :
                          'text-yellow-700 border-yellow-200'
                       }>
                          {exec.status}
                       </Badge>
                    </TableCell>
                    <TableCell>{new Date(exec.executed_at).toLocaleString()}</TableCell>
                    {/* <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleViewDetails(exec)}>View</Button>
                    </TableCell> */}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {/* Removed internal isLoading spinner for data fetching, as parent manages overall loading */}
          {/* Removed "Load More" button as internal pagination is no longer managed here */}
          
          {/* Display alert if filteredExecutions is empty AFTER filtering. The initial alert if no executions were found at all. */}
          {filteredExecutions.length === 0 && (
            <Alert className="mt-4">
              <TrendingUp className="h-4 w-4" />
              <AlertTitle>No Executions Found</AlertTitle>
              <AlertDescription>
                Pledge execution records will appear here as they happen, or check your filter/search criteria.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Conditional rendering for the details modal (placeholder) */}
      {/*
      {showDetailsModal && selectedExecution && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
                <h2 className="text-xl font-bold mb-4">Execution Details: {selectedExecution.stock_symbol}</h2>
                <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto max-h-96">
                    {JSON.stringify(selectedExecution, null, 2)}
                </pre>
                <div className="flex justify-end mt-4">
                    <Button onClick={() => setShowDetailsModal(false)}>Close</Button>
                </div>
            </div>
        </div>
      )}
      */}
    </div>
  );
}
