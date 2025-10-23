
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter, Target, CheckCircle, FileText, Activity, XCircle, Zap, Repeat, Ban, HelpCircle } from 'lucide-react';
import { PledgeSession, Pledge, PledgeExecutionRecord, PledgeAuditLog } from '@/api/entities';
import { toast } from 'sonner';
import PledgeSessionCard from './PledgeSessionCard';
import PledgeSessionFormModal from './PledgeSessionFormModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOptimisticPledgeUpdates } from '../../hooks/useOptimisticPledgeUpdates'; // New import
import { useConfirm } from '../../hooks/useConfirm'; // Assuming this hook exists and provides ConfirmDialog and confirm

export default function PledgeSessionManager({ user, sessions: initialSessions, pledges, onRefresh }) { // Changed sessions prop to initialSessions, removed onSessionUpdate as its handled by optimistic
  // ✅ Use optimistic updates
  const {
    data: sessions, // 'sessions' now comes from the hook
    setData: setSessions,
    optimisticUpdate,
    optimisticAdd,
    rollback,
    confirmUpdate
  } = useOptimisticPledgeUpdates(initialSessions, 'id'); // Use 'id' as the unique identifier field name

  // ✅ Sync with parent data
  useEffect(() => {
    setSessions(initialSessions);
  }, [initialSessions, setSessions]);

  const [isProcessing, setIsProcessing] = useState(false); // New state for overall processing (replaces isLoading, isCreating)
  const [showForm, setShowForm] = useState(false); // Replaced showCreateModal
  const [selectedSession, setSelectedSession] = useState(null); // Replaced editingSession

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // State for tracking session execution
  const [isExecuting, setIsExecuting] = useState(null); // Will hold the ID of the session being executed

  const { ConfirmDialog, confirm } = useConfirm(); // New hook for confirmation

  // Function to get status info (text, icon, color)
  const getStatusInfo = (status) => {
    switch (status) {
      case 'draft':
        return { text: 'Draft', icon: FileText, color: 'text-gray-500' };
      case 'active':
        return { text: 'Active', icon: Activity, color: 'text-green-600' };
      case 'closed':
        return { text: 'Closed', icon: XCircle, color: 'text-orange-600' };
      case 'executing':
        return { text: 'Executing', icon: Zap, color: 'text-indigo-600' };
      case 'awaiting_sell_execution':
        return { text: 'Awaiting Sell', icon: Repeat, color: 'text-blue-600' };
      case 'completed':
        return { text: 'Completed', icon: CheckCircle, color: 'text-green-700' };
      case 'cancelled':
        return { text: 'Cancelled', icon: Ban, color: 'text-red-600' };
      default:
        return { text: 'Unknown', icon: HelpCircle, color: 'text-gray-500' };
    }
  };

  // Function to get status badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'closed':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'executing':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'awaiting_sell_execution':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // New handleUpdateSession function with optimistic updates
  const handleUpdateSession = async (sessionId, updates, successMessage = 'Session updated successfully', errorMessage = 'Failed to update session') => {
    optimisticUpdate(sessionId, updates, `Updating session ${sessionId}...`); // Optimistically update

    try {
      await PledgeSession.update(sessionId, updates);
      toast.success(successMessage);
      confirmUpdate(sessionId); // Confirm the optimistic update
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error(errorMessage);
      rollback(sessionId, errorMessage); // Rollback on error
      throw error; // Re-throw to allow calling functions to handle further
    }
  };

  // Recalculate session stats from pledges
  const recalculateSessionStats = async (sessionId) => {
    setIsProcessing(true);
    try {
      const sessionPledges = (pledges || []).filter(p =>
        p.session_id === sessionId &&
        (p.status === 'ready_for_execution' || p.status === 'executed')
      );

      let updates = {};

      if (sessionPledges.length === 0) {
        // Reset stats to zero if no valid pledges
        updates = {
          total_pledges: 0,
          total_pledge_value: 0,
          buy_pledges_count: 0,
          sell_pledges_count: 0,
          buy_pledges_value: 0,
          sell_pledges_value: 0,
        };
        toast.info('No relevant pledges found for session. Stats reset.');
      } else {
        // Calculate totals
        let totalPledges = sessionPledges.length;
        let totalValue = 0;
        let buyCount = 0;
        let sellCount = 0;
        let buyValue = 0;
        let sellValue = 0;

        sessionPledges.forEach(pledge => {
          const pledgeValue = pledge.qty * (pledge.price_target || 0);
          totalValue += pledgeValue;

          if (pledge.side === 'buy') {
            buyCount++;
            buyValue += pledgeValue;
          } else if (pledge.side === 'sell') {
            sellCount++;
            sellValue += pledgeValue;
          }
        });

        // Update session with calculated stats
        updates = {
          total_pledges: totalPledges,
          total_pledge_value: totalValue,
          buy_pledges_count: buyCount,
          sell_pledges_count: sellCount,
          buy_pledges_value: buyValue,
          sell_pledges_value: sellValue,
        };
      }

      await handleUpdateSession(sessionId, updates, 'Session statistics updated successfully', 'Failed to update session statistics'); // Use the new update handler
      console.log(`✅ Recalculated stats for session ${sessionId}:`, updates);

    } catch (error) {
      console.error('Error recalculating session stats:', error);
      toast.error('Failed to update session statistics');
      rollback(sessionId, 'Failed to update session statistics'); // Rollback on error
    } finally {
      setIsProcessing(false);
    }
  };

  // Memoized filtering and sorting logic
  const filteredSessions = useMemo(() => {
    let filtered = sessions || []; // Use `sessions` directly from the hook

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.stock_symbol?.toLowerCase().includes(term) ||
        s.stock_name?.toLowerCase().includes(term) ||
        s.description?.toLowerCase().includes(term)
      );
    }

    // Sort: executing first, then active, then by created date
    filtered.sort((a, b) => {
      // Priority order: executing > active > closed > completed > awaiting_sell_execution > draft > cancelled
      const statusOrder = {
        'executing': 0,
        'active': 1,
        'closed': 2,
        'awaiting_sell_execution': 3,
        'completed': 4,
        'draft': 5,
        'cancelled': 6
      };

      const orderA = statusOrder[a.status] ?? 99;
      const orderB = statusOrder[b.status] ?? 99;

      // Handle optimistic items for sorting, keep them at the top or in their "intended" place
      if (a.isOptimistic && !b.isOptimistic) return -1;
      if (!a.isOptimistic && b.isOptimistic) return 1;

      if (orderA !== orderB) return orderA - orderB;

      // If same status, sort by creation date (newest first)
      return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
    });

    return filtered;
  }, [sessions, statusFilter, searchTerm]); // 'sessions' is a dependency

  // Create Session Handler (adapted for optimistic updates)
  const handleCreateSession = async (sessionData) => {
    setIsProcessing(true);
    try {
      const tempId = `temp_${Date.now()}`;
      const optimisticSession = {
        ...sessionData,
        id: tempId,
        status: 'draft', // Default initial status
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        total_pledges: 0,
        total_pledge_value: 0,
        buy_pledges_count: 0,
        sell_pledges_count: 0,
        buy_pledges_value: 0,
        sell_pledges_value: 0,
        isOptimistic: true // Mark as optimistic
      };

      optimisticAdd(optimisticSession, 'Creating session...');

      const newSession = await PledgeSession.create(sessionData);

      // Replace the temporary optimistic entry with the real one and confirm
      setSessions(prev => prev.map(s => s.id === tempId ? { ...newSession, isOptimistic: false } : s));

      toast.success('Session created successfully!');
      setShowForm(false); // Close modal using new state name

      if (onRefresh) { // Use onRefresh from props
        await onRefresh();
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session. Please try again.');
      rollback(undefined, 'Failed to create session. Please try again.'); // Rollback for all pending changes, or specific if an ID was tracked
    } finally {
      setIsProcessing(false);
    }
  };

  // Edit Session Handler (adapted to new state names)
  const handleEditSession = (session) => {
    setSelectedSession(session);
    setShowForm(true);
  };

  // Clone Session Handler (adapted for optimistic updates)
  const handleCloneSession = async (session) => {
    setIsProcessing(true);
    try {
      const tempId = `temp_clone_${Date.now()}`;
      const clonedData = {
        ...session,
        id: tempId, // Temporary ID
        stock_symbol: `${session.stock_symbol} (Copy)`, // Changed from _COPY to (Copy)
        stock_name: `${session.stock_name} (Copy)`,
        status: 'draft',
        total_pledges: 0,
        total_pledge_value: 0,
        buy_pledges_count: 0,
        sell_pledges_count: 0,
        buy_pledges_value: 0,
        sell_pledges_value: 0,
        created_by: user.id,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        isOptimistic: true // Mark as optimistic
      };

      // Create a copy for the API call, removing fields not set by client
      const apiClonedData = { ...clonedData };
      delete apiClonedData.id; // Backend will generate a new ID
      delete apiClonedData.created_date;
      delete apiClonedData.updated_date;
      delete apiClonedData.last_executed_at;
      delete apiClonedData.isOptimistic; // Not for backend

      optimisticAdd(clonedData, 'Cloning session...');

      const newSession = await PledgeSession.create(apiClonedData);

      // Replace temp with real session
      setSessions(prev => prev.map(s => s.id === tempId ? { ...newSession, isOptimistic: false } : s));

      toast.success('Session cloned successfully');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error cloning session:', error);
      toast.error('Failed to clone session');
      rollback(undefined, 'Failed to clone session'); // Rollback for all, or track tempId
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete Session Handler (adapted for optimistic updates)
  const handleDeleteSession = async (sessionId) => {
    const confirmed = await confirm({ // Use new confirm hook
      title: 'Delete Session?',
      message: 'Are you sure you want to delete this session? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;
    setIsProcessing(true);

    // Optimistically remove the session
    optimisticUpdate(sessionId, null, 'Deleting session...'); // Passing null typically means deletion

    try {
      await PledgeSession.delete(sessionId);
      toast.success('Session deleted successfully');
      confirmUpdate(sessionId); // Confirm the deletion
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
      rollback(sessionId, 'Failed to delete session'); // Rollback on error
    } finally {
      setIsProcessing(false);
    }
  };

  // Activate Session Handler (uses new handleUpdateSession with optimistic logic)
  const handleActivateSession = async (sessionId) => {
    const confirmed = await confirm({
      title: 'Activate Session?',
      message: 'Are you sure you want to activate this session?',
      confirmText: 'Yes, Activate'
    });
    if (!confirmed) return;

    setIsProcessing(true);
    try {
      await handleUpdateSession(sessionId, { status: 'active' }, 'Session activated successfully', 'Failed to activate session');
    } catch (error) {
      // Error handled by handleUpdateSession, just re-throw to finally block
    } finally {
      setIsProcessing(false);
    }
  };

  // Close Session Handler (uses new handleUpdateSession with optimistic logic)
  const handleCloseSession = async (sessionId) => {
    const confirmed = await confirm({
      title: 'Close Session?',
      message: 'Are you sure you want to close this session? No new pledges will be accepted.',
      confirmText: 'Yes, Close Session'
    });

    if (!confirmed) return;

    setIsProcessing(true);
    try {
      await handleUpdateSession(sessionId, { status: 'closed' }, 'Session closed successfully', 'Failed to close session');
    } catch (error) {
      // Error handled by handleUpdateSession
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute Session Handler - Implemented manual execution logic
  const handleExecuteSession = async (session) => {
    if (!session) return;

    const confirmation = await confirm({
      title: `Execute ${session.status === 'awaiting_sell_execution' ? 'SELL' : 'BUY'} Orders?`,
      message: `This will trigger the ${session.status === 'awaiting_sell_execution' ? 'sell' : 'buy'} execution for the session "${session.stock_symbol}". This action cannot be undone.`,
      confirmText: `Yes, Execute ${session.status === 'awaiting_sell_execution' ? 'Sell' : 'Buy'}`,
    });

    if (!confirmation) return;

    setIsExecuting(session.id); // Specific state for execution UI
    setIsProcessing(true); // General processing state
    const toastId = toast.loading(`Executing ${session.status === 'awaiting_sell_execution' ? 'sell' : 'buy'} orders for ${session.stock_symbol}...`);

    let initialStatusUpdatePerformed = false;
    try {
      // Optimistically update session status to 'executing' right away
      if (session.status !== 'executing' && session.status !== 'awaiting_sell_execution') {
        optimisticUpdate(session.id, { status: 'executing', last_executed_at: new Date().toISOString() }, `Session ${session.stock_symbol} is now executing...`);
        initialStatusUpdatePerformed = true;
      }

      if (session.session_mode === 'buy_sell_cycle' && session.status === 'awaiting_sell_execution') {
        // ---- SELL EXECUTION LOGIC ----
        console.log(`🚀 Starting SELL execution for session: ${session.id}`);

        const pledgesToSell = await Pledge.filter({
          session_id: session.id,
          status: 'executed', // Pledges that have been bought
        });

        if (pledgesToSell.length === 0) {
          toast.warning('No pledges found that are ready to be sold in this session.', { id: toastId });
          // If no pledges, it means the cycle is done or there were no buys, so mark as completed
          const finalUpdates = { status: 'completed', last_executed_at: new Date().toISOString() };
          optimisticUpdate(session.id, finalUpdates, 'Session completed (no pledges to sell)');
          await PledgeSession.update(session.id, finalUpdates); // Actual API call for final status
          confirmUpdate(session.id); // Confirm the final update
          if (onRefresh) onRefresh();
          return;
        }

        const buyExecutions = await PledgeExecutionRecord.filter({
          session_id: session.id,
          side: 'buy',
          status: 'completed'
        });
        const buyExecutionsMap = new Map(buyExecutions.map(e => [e.pledge_id, e]));

        let sellSuccessCount = 0;
        let sellFailCount = 0;

        for (const pledge of pledgesToSell) {
          try {
            const buyExec = buyExecutionsMap.get(pledge.id);
            if (!buyExec) {
              console.warn(`No corresponding BUY execution record found for pledge ${pledge.id}. Skipping SELL.`);
              sellFailCount++;
              await PledgeAuditLog.create({
                actor_id: user.id,
                actor_role: 'system',
                action: 'sell_execution_skipped',
                target_type: 'pledge',
                target_pledge_id: pledge.id,
                target_session_id: session.id,
                payload_json: JSON.stringify({ reason: 'No corresponding BUY execution record found' }),
                success: false
              });
              continue;
            }

            console.log(`⚡ Executing SELL for pledge ${pledge.id}...`);
            const executedPrice = session.stock_price || pledge.price_target || 0;
            const totalExecutionValue = pledge.qty * executedPrice;

            await PledgeExecutionRecord.create({
              pledge_id: pledge.id,
              session_id: session.id,
              user_id: pledge.user_id,
              demat_account_id: pledge.demat_account_id,
              stock_symbol: session.stock_symbol,
              side: 'sell',
              pledged_qty: pledge.qty,
              executed_qty: pledge.qty,
              executed_price: executedPrice,
              total_execution_value: totalExecutionValue,
              platform_commission: 0,
              commission_rate: 0,
              broker_commission: 0,
              net_amount: totalExecutionValue,
              status: 'completed',
              executed_at: new Date().toISOString(),
              settlement_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });

            await PledgeAuditLog.create({
              actor_id: user.id,
              actor_role: 'admin',
              action: 'sell_execution_completed',
              target_type: 'pledge',
              target_pledge_id: pledge.id,
              target_session_id: session.id,
              payload_json: JSON.stringify({
                execution_record_id: 'newly_created_id', // In a real system, this ID would be returned by `create`
                executed_qty: pledge.qty,
                executed_price: executedPrice
              }),
              success: true
            });
            sellSuccessCount++;
            await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
          } catch (error) {
            console.error(`❌ Failed to execute SELL for pledge ${pledge.id}:`, error);
            sellFailCount++;
            await PledgeExecutionRecord.create({
              pledge_id: pledge.id,
              session_id: session.id,
              user_id: pledge.user_id,
              demat_account_id: pledge.demat_account_id,
              stock_symbol: session.stock_symbol,
              side: 'sell',
              pledged_qty: pledge.qty,
              executed_qty: 0,
              status: 'failed',
              error_message: error.message || 'Sell execution failed',
              executed_at: new Date().toISOString(),
            });
            await PledgeAuditLog.create({
              actor_id: user.id,
              actor_role: 'admin',
              action: 'sell_execution_failed',
              target_type: 'pledge',
              target_pledge_id: pledge.id,
              target_session_id: session.id,
              payload_json: JSON.stringify({ error: error.message }),
              success: false
            });
          }
        }

        const finalUpdates = { // Define final status updates
          status: 'completed',
          last_executed_at: new Date().toISOString()
        };
        optimisticUpdate(session.id, finalUpdates, 'Sell execution completed'); // Optimistically update final status
        await PledgeSession.update(session.id, finalUpdates); // Actual API call
        confirmUpdate(session.id); // Confirm the final status update

        toast.success(
          `Executed ${sellSuccessCount} sell orders for ${session.stock_symbol}.` +
          (sellFailCount > 0 ? ` ${sellFailCount} failed.` : ''),
          { id: toastId, duration: 5000 }
        );

      } else {
        // ---- BUY EXECUTION LOGIC ----
        console.log('🚀 Starting BUY execution for session:', session.id);

        // Session status was optimistically updated to 'executing' at the start of the try block.
        // We now proceed with the actual pledge execution.

        const pledgesToExecute = await Pledge.filter({
          session_id: session.id,
          status: 'ready_for_execution',
        });

        console.log(`📊 Found ${pledgesToExecute.length} pledges ready for BUY execution`);

        if (pledgesToExecute.length === 0) {
          toast.warning('No pledges ready for BUY execution in this session.', { id: toastId });
          const nextStatusIfNoPledges = session.session_mode === 'buy_sell_cycle' ? 'awaiting_sell_execution' : 'completed';
          const finalUpdates = { status: nextStatusIfNoPledges, last_executed_at: new Date().toISOString() };
          optimisticUpdate(session.id, finalUpdates, 'No pledges to buy, updating session status');
          await PledgeSession.update(session.id, finalUpdates);
          confirmUpdate(session.id);
          if (onRefresh) onRefresh();
          return;
        }

        let successCount = 0;
        let failCount = 0;

        // Execute each pledge
        for (const pledge of pledgesToExecute) {
          try {
            console.log(`⚡ Executing BUY for pledge ${pledge.id}...`);

            const executedPrice = pledge.price_target || session.stock_price || 0;
            const totalExecutionValue = pledge.qty * executedPrice;

            const executionRecord = await PledgeExecutionRecord.create({
              pledge_id: pledge.id,
              session_id: session.id,
              user_id: pledge.user_id,
              demat_account_id: pledge.demat_account_id,
              stock_symbol: pledge.stock_symbol,
              side: 'buy',
              pledged_qty: pledge.qty,
              executed_qty: pledge.qty,
              executed_price: executedPrice,
              total_execution_value: totalExecutionValue,
              platform_commission: 0,
              commission_rate: 0,
              broker_commission: 0,
              net_amount: totalExecutionValue,
              status: 'completed',
              executed_at: new Date().toISOString(),
              settlement_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });

            console.log(`✅ Created BUY execution record: ${executionRecord.id}`);

            await Pledge.update(pledge.id, {
              status: 'executed'
            });

            await PledgeAuditLog.create({
              actor_id: user.id,
              actor_role: 'admin',
              action: 'buy_execution_completed',
              target_type: 'pledge',
              target_pledge_id: pledge.id,
              target_session_id: session.id,
              payload_json: JSON.stringify({
                execution_record_id: executionRecord.id,
                executed_qty: pledge.qty,
                executed_price: executedPrice
              }),
              success: true
            });

            successCount++;
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.error(`❌ Failed to execute BUY for pledge ${pledge.id}:`, error);
            failCount++;

            await PledgeExecutionRecord.create({
              pledge_id: pledge.id,
              session_id: session.id,
              user_id: pledge.user_id,
              demat_account_id: pledge.demat_account_id,
              stock_symbol: pledge.stock_symbol,
              side: 'buy',
              pledged_qty: pledge.qty,
              executed_qty: 0,
              status: 'failed',
              error_message: error.message || 'Execution failed',
              executed_at: new Date().toISOString(),
            });

            await PledgeAuditLog.create({
              actor_id: user.id,
              actor_role: 'admin',
              action: 'buy_execution_failed',
              target_type: 'pledge',
              target_pledge_id: pledge.id,
              target_session_id: session.id,
              payload_json: JSON.stringify({ error: error.message }),
              success: false
            });
          }
        }

        const nextStatus = session.session_mode === 'buy_sell_cycle' ? 'awaiting_sell_execution' : 'completed';
        console.log(`✅ Updating session ${session.id} to status: ${nextStatus}`);
        const finalUpdates = { // Define final status updates
          status: nextStatus,
          last_executed_at: new Date().toISOString(),
          notification_sent: true,
        };
        optimisticUpdate(session.id, finalUpdates, 'Buy execution completed'); // Optimistically update final status
        await PledgeSession.update(session.id, finalUpdates); // Actual API call
        confirmUpdate(session.id); // Confirm the final status update

        toast.success(
          `Executed ${successCount} buy orders for ${session.stock_symbol}.` +
          (failCount > 0 ? ` ${failCount} failed.` : ''),
          { id: toastId, duration: 5000 }
        );
      }

      console.log('🔄 Triggering data refresh after execution...');
      if (onRefresh) onRefresh(); // Full refresh after complex execution logic

    } catch (error) {
      console.error('❌ Error during session execution:', error);
      toast.error(`Failed to execute session: ${error.message}`, { id: toastId });

      // Attempt to revert session status if overall execution failed
      if (initialStatusUpdatePerformed) { // Only rollback if we optimistically updated
        rollback(session.id, `Failed to execute session: ${error.message}`);
      }

      // If initial status was `executing` or `awaiting_sell_execution` and overall process failed, revert to 'active' or previous status
      if (session.status === 'executing' || session.status === 'awaiting_sell_execution') {
        try {
          const originalStatus = initialSessions.find(s => s.id === session.id)?.status || 'active'; // Get original status from initialSessions
          optimisticUpdate(session.id, { status: originalStatus }, 'Reverting session status due to error');
          await PledgeSession.update(session.id, { status: originalStatus }); // Revert on backend
          confirmUpdate(session.id); // Confirm revert
          if (onRefresh) onRefresh();
        } catch (revertError) {
          console.error('Failed to revert session status after execution error:', revertError);
        }
      }
    } finally {
      setIsExecuting(null);
      setIsProcessing(false);
    }
  };

  // Add recalculate button to actions
  const handleRecalculateStats = async (sessionId) => {
    setIsProcessing(true); // Set general processing state
    try {
      await recalculateSessionStats(sessionId);
    } catch (error) {
      // Error handled by recalculateSessionStats
    } finally {
      setIsProcessing(false);
    }
  };

  // Form Success Handler (Simplified as per new data flow: Modal's onCreate/onUpdate now handle data updates)
  const handleFormSuccess = () => {
    setShowForm(false); // Use new state name
    setSelectedSession(null); // Use new state name
  };

  // Determine if user can create sessions (e.g., based on authentication or role)
  const canCreateSessions = !!user;

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Pledge Sessions ({filteredSessions.length})
            </CardTitle>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search stock symbol, name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="executing">Executing</SelectItem>
                  <SelectItem value="awaiting_sell_execution">Awaiting Sell</SelectItem>
                  <SelectItem value="completed">✅ Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {statusFilter !== 'completed' && (
                <Button
                  variant="outline"
                  onClick={() => setStatusFilter('completed')}
                  className="whitespace-nowrap"
                >
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  View Completed
                </Button>
              )}

              {canCreateSessions && (
                <Button
                  onClick={() => {
                    setSelectedSession(null); // Clear any previous edit data
                    setShowForm(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isProcessing} // Disable button when any processing is in progress
                >
                  {isProcessing ? 'Processing...' : <> <Plus className="w-4 h-4 mr-2" /> New Session </>}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No pledge sessions found</p>
              {canCreateSessions && (
                <Button
                  onClick={() => {
                    setSelectedSession(null);
                    setShowForm(true);
                  }}
                  className="mt-4"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Create Your First Session'}
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredSessions.map((session) => (
                <PledgeSessionCard
                  key={session.id}
                  session={session}
                  pledges={pledges?.filter(p => p.session_id === session.id) || []}
                  onEdit={() => handleEditSession(session)}
                  onClone={() => handleCloneSession(session)}
                  onDelete={() => handleDeleteSession(session.id)}
                  onActivate={() => handleActivateSession(session.id)}
                  onClose={() => handleCloseSession(session.id)}
                  onExecute={() => handleExecuteSession(session)}
                  onRecalculateStats={() => handleRecalculateStats(session.id)}
                  isExecuting={isExecuting === session.id}
                  getStatusInfo={getStatusInfo}
                  getStatusBadge={getStatusBadge}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <PledgeSessionFormModal
        open={showForm} // Use new state name
        onClose={() => {
          setShowForm(false); // Use new state name
          setSelectedSession(null); // Use new state name
        }}
        onSuccess={handleFormSuccess} // This is the modal's internal success handler, now simplified
        sessionToEdit={selectedSession} // Use new state name
        onCreate={handleCreateSession} // Pass the new handleCreateSession for creation
        onUpdate={(sessionId, updates) => handleUpdateSession(sessionId, updates)} // Pass the new handleUpdateSession for updates
        isSaving={isProcessing} // Pass isProcessing for form state management in the modal
      />
      {/* Confirmation Dialog component from useConfirm hook */}
      <ConfirmDialog />
    </div>
  );
}
