
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Target, Activity, CheckCircle, Clock, CreditCard, Plus,
  RefreshCw, TrendingUp, IndianRupee, Calendar, AlertCircle,
  Users, Download, Bell, BellOff, ExternalLink, Lock, FileText, Search, Receipt
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

import { base44 } from '@/api/base44Client';
import { PledgeSession, Pledge, PledgePayment, PledgeExecutionRecord, PledgeAuditLog, PledgeAccessRequest, Stock, User } from '@/api/entities'; // Added Stock, User

import { useRealTimePledgeUpdates, requestNotificationPermission } from '../hooks/useRealTimePledgeUpdates';

import PledgeModal from './PledgeModal';
import ActivePledgesTab from './ActivePledgesTab';
import MyPledgesTab from './MyPledgesTab';
import LiveSessionStats from './LiveSessionStats';
import LiveExecutionStatus from './LiveExecutionStatus';
import LockedPledgeTab from './LockedPledgeTab';
import PaymentSuccessModal from './PaymentSuccessModal';
import ExecutedPledgesTab from './ExecutedPledgesTab';
import PledgeTradeDocumentModal from './PledgeTradeDocumentModal';

// Delay helper function to space out API calls
const delay = ms => new Promise(res => setTimeout(res, ms));

export default function MyPledgePortfolio({ user }) {
  const [activeTab, setActiveTab] = useState('active');
  const [isLoading, setIsLoading] = useState(true);
  const [showPledgeModal, setShowPledgeModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [payingPledgeId, setPayingPledgeId] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successPledgeDetails, setSuccessPledgeDetails] = useState(null);
  const [successPaymentDetails, setSuccessPaymentDetails] = useState(null);

  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedDocData, setSelectedDocData] = useState(null);

  const [data, setData] = useState({
    sessions: [],
    pledges: [],
    executions: [],
    stockPrices: {}
  });

  const [paymentHistory, setPaymentHistory] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [auditFilters, setAuditFilters] = useState({
    stockSymbol: '',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });

  const [accessStatus, setAccessStatus] = useState(null);
  const [accessRequestId, setAccessRequestId] = useState(null);
  const [userDematAccountId, setUserDematAccountId] = useState(null);

  const isMountedRef = useRef(true);
  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false); // NEW: Prevent concurrent loads

  const {
    pledgeStats,
    executionUpdates,
    lastUpdate,
    isPolling,
    error: pollingError,
    refresh,
    pausePolling,
    resumePolling,
    enablePolling
  } = useRealTimePledgeUpdates(user?.id, [], 30000);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationsEnabled(window.Notification.permission === 'granted');
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // FIXED: Load data ONLY ONCE on mount - NO AbortController
  const loadData = useCallback(async () => {
    // Prevent multiple concurrent loads
    if (!user?.id || !isMountedRef.current || hasLoadedRef.current || isLoadingRef.current) {
      if (hasLoadedRef.current) {
        console.log('⏸️ Skipping loadData - already loaded.');
      } else if (!user?.id) {
        console.log('⏸️ Skipping loadData - user ID is missing.');
      } else if (isLoadingRef.current) {
        console.log('⏸️ Skipping loadData - load is already in progress.');
      } else {
        console.log('⏸️ Skipping loadData - component unmounted.');
      }
      return;
    }

    isLoadingRef.current = true;
    setIsLoading(true);
    console.log('🔄 Loading pledge portfolio data (ONCE)...');

    try {
      // Simple error wrapper - NO abort signal
      const loadSafely = async (loadFn, entityName) => {
        try {
          return await loadFn();
        } catch (error) {
          console.error(`Failed to load ${entityName}:`, error);
          return []; // Return empty array or appropriate default for failed requests
        }
      };

      // 1. Fetch sessions, user's pledges, and user's executions in parallel
      const [
        sessionData,
        pledgeData,
        executionData,
        paymentData,
        auditLogData,
        accessRequestData
      ] = await Promise.all([
        // Fetch sessions (active, closed, executing, awaiting_sell_execution)
        loadSafely(() => PledgeSession.filter({ status: { '$in': ['active', 'closed', 'executing', 'awaiting_sell_execution'] } }, '-session_start'), 'sessions'),
        // Fetch user's pledges
        loadSafely(() => Pledge.filter({ user_id: user.id }, '-created_date'), 'pledges'),
        // Fetch user's execution records
        loadSafely(() => PledgeExecutionRecord.filter({ user_id: user.id }, '-executed_at'), 'execution records'),
        // Fetch user's payment history
        loadSafely(() => PledgePayment.filter({ user_id: user.id }, '-created_date'), 'payment history'),
        // Fetch user's audit logs (limit to 50 for performance)
        loadSafely(() => PledgeAuditLog.filter({ actor_id: user.id }, '-created_date', 50), 'audit logs'),
        // Fetch user's pledge access requests
        loadSafely(() => PledgeAccessRequest.filter({ user_id: user.id }, '-created_date'), 'access requests')
      ]);

      if (!isMountedRef.current) return;

      // 2. Process stock prices (simplified - no live API for now to reduce load)
      const executionSymbols = executionData
        .filter(e => e.side === 'buy' && sessionData.find(s => s.id === e.session_id)?.session_mode === 'buy_sell_cycle')
        .map(e => e.stock_symbol);
      const stockSymbols = [...new Set([...sessionData.map(s => s.stock_symbol), ...executionSymbols])];
      
      const fetchedStockPrices = {};
      stockSymbols.forEach(symbol => {
        // Generate dummy data
        const dummyChange = (Math.random() - 0.5) * 5; // -2.5% to +2.5%
        fetchedStockPrices[symbol] = {
          price: Math.random() * 1000 + 500,
          change: dummyChange
        };
      });

      if (isMountedRef.current) {
        setData({
          sessions: sessionData,
          pledges: pledgeData,
          executions: executionData,
          stockPrices: fetchedStockPrices
        });
        setPaymentHistory(paymentData);
        setAuditLogs(auditLogData);

        // Update access status
        if (accessRequestData && accessRequestData.length > 0) {
          const latestRequest = accessRequestData[0];
          setAccessStatus(latestRequest.status);
          setAccessRequestId(latestRequest.id);
          if (latestRequest.status === 'approved') {
            setUserDematAccountId(latestRequest.demat_account_id);
          } else {
            setUserDematAccountId(null);
          }
        } else {
          setAccessStatus('none');
          setAccessRequestId(null);
          setUserDematAccountId(null);
        }

        hasLoadedRef.current = true; // Mark as loaded
        console.log('✅ Pledge portfolio data loaded successfully.');
      }
    } catch (error) {
      console.error("Error loading pledge portfolio data:", error);
      if (isMountedRef.current) {
        toast.error("Failed to load your pledge data. Please try again later.");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    }
  }, [user?.id]); // Only depends on user.id

  const handleEnableNotifications = async () => {
    const permission = await requestNotificationPermission();
    setNotificationsEnabled(permission === 'granted');
    if (permission === 'granted') {
      toast.success('Notifications enabled! You\'ll receive updates about your pledges.');
    } else {
      toast.error('Notifications blocked. Please enable them in your browser settings.');
    }
  };

  // FIXED: Load data ONLY on mount or when user changes, and only once if successful
  useEffect(() => {
    if (user?.id && !hasLoadedRef.current) {
      loadData();
    }
  }, [user?.id, loadData]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pausePolling();
      } else if (isPolling) { // Only resume if polling was active before hiding
        resumePolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pausePolling, resumePolling, isPolling]);

  // FIXED: Manual refresh only
  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    hasLoadedRef.current = false; // Allow reload by resetting this flag
    isLoadingRef.current = false; // Allow reload by resetting this flag
    setIsLoading(true);
    try {
      await loadData();
      // Also refresh real-time updates as they may not be automatically polling
      await refresh(); 
      toast.success('Data refreshed successfully!');
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('Failed to refresh data');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleToggleLiveUpdates = () => {
    if (isPolling) {
      pausePolling();
      toast.info('Live updates paused. Click to resume or refresh manually.');
    } else {
      enablePolling();
      toast.success('Live updates enabled! Data will refresh every 30 seconds.');
    }
  };

  const processRazorpayPayment = async (amount, userData, sessionData) => {
    console.log('💳 Starting payment for ₹' + amount);

    // FIX: Add null check for sessionData
    if (!sessionData) {
      console.error('❌ Session data is missing');
      toast.error('Session information is missing. Please try again.');
      return { success: false, error: 'Session data is missing' };
    }

    return new Promise((resolve) => {
      if (amount === 0) {
        resolve({
          success: true,
          payment_id: 'FREE_' + Date.now(),
          method: 'free'
        });
        return;
      }

      console.log('🧪 TEST MODE: Simulating payment...');
      toast.loading('Processing payment...', { id: 'payment-toast', duration: 2000 });

      setTimeout(() => {
        const paymentId = 'TEST_PAY_' + Date.now();
        console.log('✅ Payment successful:', paymentId);
        toast.success('Payment completed!', { id: 'payment-toast' });

        resolve({
          success: true,
          payment_id: paymentId,
          method: 'test_razorpay',
          raw_response: {
            test_mode: true,
            amount: amount,
            currency: 'INR',
            timestamp: new Date().toISOString()
          }
        });
      }, 2000);
    });
  };

  const handlePaymentAndSubmit = async (pledgeData) => {
    console.log('🎬 ===== PLEDGE SUBMISSION START =====');
    console.log('📦 Received pledge data:', pledgeData);

    // FIX: Validate selectedSession before processing
    if (!selectedSession) {
      console.error('❌ No session selected');
      toast.error('Session information is missing. Please try again.');
      return;
    }

    // VALIDATE: Ensure all required fields are present
    if (!pledgeData.qty || pledgeData.qty <= 0) {
      toast.error('Invalid quantity');
      console.error('❌ Missing or invalid qty:', pledgeData.qty);
      return;
    }

    if (!pledgeData.price_target || pledgeData.price_target <= 0) {
      toast.error('Invalid target price');
      console.error('❌ Missing or invalid price_target:', pledgeData.price_target);
      return;
    }

    if (!pledgeData.side) {
      toast.error('Invalid pledge side');
      console.error('❌ Missing side:', pledgeData.side);
      return;
    }

    setIsProcessing(true);

    try {
      // Use existing userDematAccountId from state
      if (!userDematAccountId) {
        throw new Error("No approved Demat account found. Please ensure your pledge access is approved.");
      }
      const dematId = userDematAccountId;

      let fee = 0;
      if (selectedSession.convenience_fee_type === 'flat') {
        fee = selectedSession.convenience_fee_amount || 0;
      } else if (selectedSession.convenience_fee_type === 'percentage' || selectedSession.convenience_fee_type === 'percent') {
        const value = pledgeData.qty * pledgeData.price_target;
        fee = (value * (selectedSession.convenience_fee_amount || 0)) / 100;
      }
      fee = Math.max(0, fee);

      // FIX: Pass selectedSession (not sessionData) to payment function
      const paymentResult = await processRazorpayPayment(fee, user, selectedSession);

      // FIX: Check payment result properly
      if (!paymentResult || !paymentResult.success) {
        toast.error(paymentResult?.error || 'Payment failed');
        return;
      }

      // FIXED: Create pledge with ALL required fields
      const completePledgeData = {
        session_id: selectedSession.id,
        user_id: user.id,
        demat_account_id: dematId,
        stock_symbol: selectedSession.stock_symbol,
        qty: pledgeData.qty, // CRITICAL
        price_target: pledgeData.price_target, // CRITICAL
        side: pledgeData.side, // CRITICAL
        consent_hash: pledgeData.consent_hash || `consent_${user.id}_${Date.now()}`, // Use provided hash or fallback
        convenience_fee_paid: true,
        convenience_fee_amount: fee,
        convenience_fee_payment_id: paymentResult.payment_id,
        status: 'ready_for_execution',
        // FIX: Only include auto_sell_config if it exists
        ...(pledgeData.auto_sell_config && { auto_sell_config: pledgeData.auto_sell_config })
      };

      console.log('💾 Creating pledge with complete data:', completePledgeData);

      const newPledge = await Pledge.create(completePledgeData);

      console.log('✅ Pledge created successfully:', newPledge);

      await PledgePayment.create({
        pledge_id: newPledge.id,
        user_id: user.id,
        amount: fee,
        status: 'completed',
        payment_ref: paymentResult.payment_id,
        payment_provider: paymentResult.method || 'razorpay',
        payment_method: 'test_mode',
        currency: 'INR',
        gateway_response: JSON.stringify(paymentResult.raw_response || {})
      });

      await PledgeAuditLog.create({
        actor_id: user.id,
        actor_role: 'user',
        action: 'pledge_created',
        target_type: 'pledge',
        target_pledge_id: newPledge.id,
        target_session_id: selectedSession.id,
        payload_json: JSON.stringify({
          stock_symbol: newPledge.stock_symbol,
          qty: newPledge.qty,
          side: newPledge.side,
          fee: fee,
          payment_id: paymentResult.payment_id
        }),
        success: true
      });

      setSuccessPledgeDetails(newPledge);
      setSuccessPaymentDetails({
        payment_id: paymentResult.payment_id,
        amount: fee,
        method: paymentResult.method || 'test',
        timestamp: new Date().toISOString()
      });

      setShowPledgeModal(false);
      setSelectedSession(null);

      toast.success(`Pledge created for ${newPledge.stock_symbol}!`);

      console.log('🔄 Refreshing data after pledge creation...');

      await new Promise(resolve => setTimeout(resolve, 1500));
      // Force reload all data after a successful pledge
      hasLoadedRef.current = false;
      isLoadingRef.current = false; // Reset to allow reload
      await loadData();

      setShowSuccessModal(true);

    } catch (error) {
      console.error('❌ Error:', error);
      toast.error(error.message || 'Failed to create pledge');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayConvenienceFee = async (pledgeId) => {
    setPayingPledgeId(pledgeId);
    try {
      const pledge = data.pledges.find(p => p.id === pledgeId); // Use data.pledges
      if (!pledge) {
        throw new Error('Pledge not found.');
      }

      const session = data.sessions.find(s => s.id === pledge.session_id); // Use data.sessions
      if (!session) {
        throw new Error('Associated session not found.');
      }

      const paymentResult = await processRazorpayPayment(pledge.convenience_fee_amount, user, session);

      if (!paymentResult || !paymentResult.success) { // Also checking for paymentResult null/undefined
        throw new Error(paymentResult?.error || "Payment failed");
      }

      await Pledge.update(pledgeId, {
        convenience_fee_paid: true,
        convenience_fee_payment_id: paymentResult.payment_id,
        status: 'ready_for_execution'
      });

      await PledgePayment.create({
        pledge_id: pledgeId,
        user_id: user.id,
        amount: pledge.convenience_fee_amount,
        status: 'completed',
        payment_ref: paymentResult.payment_id,
        payment_provider: paymentResult.method || 'razorpay',
        payment_method: paymentResult.method || 'test',
        currency: 'INR',
        gateway_response: JSON.stringify(paymentResult.raw_response)
      });

      toast.success('Convenience fee paid successfully!');
      // Force reload all data
      hasLoadedRef.current = false;
      isLoadingRef.current = false; // Reset to allow reload
      await loadData();

    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
    } finally {
      setPayingPledgeId(null);
    }
  };

  const handleShowDocument = (payment, type) => {
    const pledge = data.pledges.find(p => p.id === payment.pledge_id);
    if (!pledge) {
      toast.error("Associated pledge not found for this payment.");
      return;
    }

    const session = data.sessions.find(s => s.id === pledge.session_id);
    if (!session) {
      toast.error("Associated session not found.");
      return;
    }
    
    const buyExecution = data.executions.find(e => e.pledge_id === pledge.id && e.side === 'buy');
    const sellExecution = data.executions.find(e => e.pledge_id === pledge.id && e.side === 'sell');

    if (type === 'invoice' && !buyExecution) {
        toast.error("Invoice can only be generated after the trade has been executed.");
        return;
    }

    setSelectedDocData({
      type,
      pledge,
      session,
      execution: buyExecution, // The first execution is always the 'buy' or single 'sell'
      sellExecution,
    });
    setShowDocModal(true);
  };

  // Memoized data for tabs
  const activeSessions = useMemo(() => data.sessions.filter(s => ['active', 'closed', 'executing', 'awaiting_sell_execution'].includes(s.status)), [data.sessions]);

  // userPledges now directly from data state
  const userPledges = data.pledges;

  const executedPledges = useMemo(() => {
    // Return only pledges that have a corresponding execution record for the user
    const userExecutionPledgeIds = new Set(data.executions.map(e => e.pledge_id));
    return data.pledges.filter(p => userExecutionPledgeIds.has(p.id));
  }, [data.pledges, data.executions]);

  const hasUserPledgedForSession = useCallback((sessionId) => {
    const hasPledge = data.pledges.some(pledge => // Use data.pledges
      pledge.session_id === sessionId &&
      ['pending_payment', 'paid', 'ready_for_execution', 'executing', 'executed'].includes(pledge.status)
    );
    // console.log('Check pledge for session', sessionId, ':', hasPledge);
    return hasPledge;
  }, [data.pledges]); // Dependency changed

  const getUserPledgeForSession = useCallback((sessionId) => {
    return data.pledges.find(pledge => // Use data.pledges
      pledge.session_id === sessionId &&
      ['pending_payment', 'paid', 'ready_for_execution', 'executing', 'executed'].includes(pledge.status)
    );
  }, [data.pledges]); // Dependency changed

  const getAuditStatusBadge = (log) => {
    if (log.success) {
      return 'bg-green-100 text-green-800';
    } else if (log.action.includes('Failed') || log.action.includes('Error')) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const handleExportAuditLogs = () => {
    const csvContent = [
      ['Timestamp', 'Action', 'Target Type', 'Actor ID', 'Payload (JSON)', 'Success'],
      ...auditLogs.map(log => [
        new Date(log.created_date).toLocaleString(),
        log.action,
        log.target_type,
        log.actor_id,
        JSON.stringify(log.payload_json),
        log.success ? 'True' : 'False'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pledge_audit_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Audit log exported successfully!');
  };

  const filteredAuditLogs = auditLogs.filter(log => {
    const logPayload = typeof log.payload_json === 'string' ? JSON.parse(log.payload_json) : log.payload_json;

    if (auditFilters.stockSymbol && !(logPayload?.stock_symbol || '').toLowerCase().includes(auditFilters.stockSymbol.toLowerCase())) {
      return false;
    }
    if (auditFilters.status !== 'all') {
      if (auditFilters.status === 'success' && !log.success) return false;
      if (auditFilters.status === 'failure' && log.success) return false;
    }
    return true;
  });

  if (!user?.has_pledge_access) {
    return <LockedPledgeTab user={user} />;
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">My Pledge Portfolio</h2>
              <p className="text-blue-100">Track and manage your collective investment pledges</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleLiveUpdates}
                className={`${
                  isPolling
                    ? 'bg-green-500/20 hover:bg-green-500/30 border border-green-300'
                    : 'bg-white/20 hover:bg-white/30'
                } text-white`}
              >
                <Activity className={`w-4 h-4 mr-2 ${isPolling ? 'animate-pulse' : ''}`} />
                {isPolling ? 'Live (30s)' : 'Enable Live Updates'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={notificationsEnabled ? () => {} : handleEnableNotifications}
                className="bg-white/20 hover:bg-white/30 text-white"
                disabled={notificationsEnabled}
              >
                {notificationsEnabled ? (
                  <>
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications On
                  </>
                ) : (
                  <>
                    <BellOff className="w-4 h-4 mr-2" />
                    Enable Notifications
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="bg-white/20 hover:bg-white/30 text-white"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
            <div className="text-xs text-blue-100">
              Last updated: {new Date(lastUpdate).toLocaleTimeString()}
            </div>
            {pollingError && (
              <div className="flex items-center gap-2 text-xs bg-red-500/20 text-white px-3 py-1 rounded-lg">
                <AlertCircle className="w-3 h-3" />
                {pollingError}
              </div>
            )}
            {isPolling && (
              <div className="text-xs text-green-300">
                ⚡ Auto-refreshing every 30 seconds
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 bg-transparent border-0 rounded-xl shadow-sm gap-2 p-1">
          <TabsTrigger
            value="active"
            className="bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:from-blue-100 hover:to-purple-100 data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300 rounded-lg font-semibold shadow-sm"
          >
            <Target className="w-4 h-4 mr-2" />
            Active Sessions
          </TabsTrigger>
          <TabsTrigger
            value="my-pledges"
            className="bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:from-blue-100 hover:to-purple-100 data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300 rounded-lg font-semibold shadow-sm"
          >
            <Users className="w-4 h-4 mr-2" />
            My Pledges
          </TabsTrigger>
          <TabsTrigger
            value="executed"
            className="bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:from-blue-100 hover:to-purple-100 data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300 rounded-lg font-semibold shadow-sm"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Executed
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:from-blue-100 hover:to-purple-100 data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300 rounded-lg font-semibold shadow-sm"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Payments
          </TabsTrigger>
          <TabsTrigger
            value="audit"
            className="bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:from-blue-100 hover:to-purple-100 data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300 rounded-lg font-semibold shadow-sm"
          >
            <Activity className="w-4 h-4 mr-2" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeSessions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Sessions</h3>
                <p className="text-gray-600">There are no pledge sessions available right now. Check back soon!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeSessions.map(session => {
                const userPledge = getUserPledgeForSession(session.id);
                const hasPledged = hasUserPledgedForSession(session.id);
                const isExpired = new Date(session.session_end) < new Date();
                const priceData = data.stockPrices[session.stock_symbol]; // Use data.stockPrices
                const currentPrice = priceData?.price;
                const priceChange = priceData?.change || 0;
                const isPricePositive = priceChange >= 0;

                // Determine badge color based on session mode
                let sessionModeBadgeClass = 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'; // Default for 'buy_only' or unknown
                if (session.session_mode === 'sell_only') {
                  sessionModeBadgeClass = 'bg-gradient-to-r from-red-500 to-rose-600 text-white';
                } else if (session.session_mode === 'buy_sell_cycle') {
                  sessionModeBadgeClass = 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white';
                }

                return (
                  <Card key={session.id} className="relative rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-white to-slate-50 flex flex-col">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 opacity-10 rounded-full transform translate-x-10 -translate-y-10 z-0"></div>
                    <CardHeader className="pb-3 relative z-10">
                      {/* Stock Name & Price Section */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <CardTitle className="text-2xl font-bold">{session.stock_symbol}</CardTitle>
                            {currentPrice && (
                              <div className="flex items-center gap-1">
                                <IndianRupee className={`w-4 h-4 ${isPricePositive ? 'text-green-600' : 'text-red-600'}`} />
                                <span className={`text-lg font-bold ${isPricePositive ? 'text-green-600' : 'text-red-600'}`}>
                                  {currentPrice.toFixed(2)}
                                </span>
                                <span className={`text-sm font-semibold ${isPricePositive ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                                  {isPricePositive ? '▲' : '▼'} {Math.abs(priceChange).toFixed(2)}%
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{session.stock_name}</p>
                        </div>
                        <Badge className={`${sessionModeBadgeClass} text-[10px] font-semibold border-0 px-3 py-1`}>
                          {session.session_mode?.replace(/_/g, ' ').toUpperCase()}
                        </Badge>
                      </div>

                      {/* Recommendation Badges */}
                      {(session.is_advisor_recommended || session.is_analyst_certified) && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {session.is_advisor_recommended && (
                            <Badge className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 text-xs font-semibold border-0 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Advisor Recommended
                            </Badge>
                          )}
                          {session.is_analyst_certified && (
                            <Badge className="bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 text-xs font-semibold border-0 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Analyst Certified
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Session Description */}
                      {session.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {session.description}
                        </p>
                      )}

                      {/* Execution Reason - Prominent Display */}
                      {session.execution_reason && (
                        <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                          <div className="flex items-start gap-2">
                            <TrendingUp className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs font-bold text-amber-900 mb-1">Why This Stock?</p>
                              <p className="text-xs text-amber-800 leading-relaxed">
                                {session.execution_reason}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardHeader>

                    <CardContent className="pt-0 relative z-10 flex-1 flex flex-col justify-between">
                      <div>
                        <LiveSessionStats
                          session={session}
                          stats={pledgeStats[session.id]}
                          userPledges={data.pledges.filter(p => p.session_id === session.id)} // Use data.pledges
                        />
                      </div>

                      {hasPledged && userPledge ? (
                        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-0 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="font-bold text-green-800">You've Pledged!</span>
                          </div>
                          <div className="text-sm text-green-700 space-y-1">
                            <p><strong>Qty:</strong> {userPledge.qty} shares</p>
                            <p><strong>Price:</strong> ₹{userPledge.price_target}</p>
                            <p><strong>Status:</strong> {userPledge.status.replace(/_/g, ' ').toUpperCase()}</p>
                          </div>
                        </div>
                      ) : (
                        <Button
                          onClick={() => {
                            if (isExpired) {
                              toast.error('This session has ended');
                              return;
                            }
                            setSelectedSession(session);
                            setShowPledgeModal(true);
                          }}
                          className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
                          disabled={isExpired}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {isExpired ? 'Session Ended' : 'Create Pledge'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-pledges" className="space-y-6">
          <MyPledgesTab
            pledges={userPledges} // Use memoized userPledges
            sessions={data.sessions} // Pass all sessions for context
            isProcessing={isProcessing}
            payingPledgeId={payingPledgeId}
            onPayFee={handlePayConvenienceFee}
            // onPledgeSuccess={handlePledgeSuccess} // This isn't used by MyPledgesTab directly based on common patterns, remove if not implemented
          />
        </TabsContent>

        <TabsContent value="executed" className="space-y-4">
          <ExecutedPledgesTab
            executions={data.executions}
            sessions={data.sessions}
            stockPrices={data.stockPrices}
            pledges={data.pledges}
          />
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          {paymentHistory.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CreditCard className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Payments Yet</h3>
                <p className="text-gray-600">Your payment history will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentHistory.map(payment => {
                    const pledge = data.pledges.find(p => p.id === payment.pledge_id);
                    // Check if there's any execution record for this pledge
                    const hasExecution = data.executions.some(e => e.pledge_id === payment.pledge_id);

                    if (!pledge) return null; // Skip if pledge not found

                    return (
                      <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg transition-colors hover:bg-gray-100">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                             <p className="font-bold text-lg text-gray-800">₹{payment.amount}</p>
                            <Badge className={
                              payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                              payment.status === 'failed' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }>
                              {payment.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {payment.payment_method === 'test_mode' ? 'Convenience Fee' : payment.payment_method} for <span className="font-semibold">{pledge.stock_symbol}</span> Pledge
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(payment.created_date).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                           <Button variant="outline" size="sm" onClick={() => handleShowDocument(payment, 'receipt')}>
                              <Receipt className="w-4 h-4 mr-2" />
                              Receipt
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleShowDocument(payment, 'invoice')} disabled={!hasExecution}>
                              <Download className="w-4 h-4 mr-2" />
                              Invoice
                            </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card className="rounded-2xl">
            <CardHeader>
              <div className="flex justify-between items-center flex-wrap gap-2">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Pledge Audit Log
                </CardTitle>
                <Button onClick={handleExportAuditLogs} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Input
                    placeholder="Search by stock symbol..."
                    value={auditFilters.stockSymbol}
                    onChange={(e) => setAuditFilters({...auditFilters, stockSymbol: e.target.value})}
                    className="h-9"
                  />
                </div>
                <div>
                  <Select
                    value={auditFilters.status}
                    onValueChange={(value) => setAuditFilters({...auditFilters, status: value})}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="failure">Failure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredAuditLogs.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Audit Records</h3>
                  <p className="text-gray-600">Pledge activities will appear here as they happen.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredAuditLogs.map((log) => {
                    const logPayload = typeof log.payload_json === 'string' ? JSON.parse(log.payload_json) : log.payload_json;
                    return (
                    <Card key={log.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {log.target_type?.replace(/_/g, ' ').toUpperCase()}
                            </Badge>
                            <span className="text-sm font-medium">{log.action}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1 break-all">
                            {logPayload && logPayload.stock_symbol && `Stock: ${logPayload.stock_symbol}`}
                            {logPayload && logPayload.qty && ` Qty: ${logPayload.qty}`}
                            {logPayload && logPayload.amount && ` Amount: ₹${logPayload.amount}`}
                            {logPayload && logPayload.error_message && ` Error: ${logPayload.error_message}`}
                            {!logPayload && log.action}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{new Date(log.created_date).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={`text-xs ${getAuditStatusBadge(log)}`}>
                            {log.success ? 'SUCCESS' : 'FAILURE'}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  )})}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showPledgeModal && selectedSession && (
        <PledgeModal
          isOpen={showPledgeModal}
          onClose={() => {
            setShowPledgeModal(false);
            setSelectedSession(null);
          }}
          stock_symbol={selectedSession.stock_symbol}
          session={selectedSession}
          user={user}
          onSubmit={handlePaymentAndSubmit}
          isProcessing={isProcessing}
          convenienceFee={selectedSession.convenience_fee_amount}
          sessionLimits={{
            min_qty: selectedSession.min_qty,
            max_qty: selectedSession.max_qty
          }}
        />
      )}

      {showDocModal && selectedDocData && (
        <PledgeTradeDocumentModal
          isOpen={showDocModal}
          onClose={() => setShowDocModal(false)}
          type={selectedDocData.type}
          pledge={selectedDocData.pledge}
          execution={selectedDocData.execution}
          sellExecution={selectedDocData.sellExecution}
          session={selectedDocData.session}
        />
      )}

      {showSuccessModal && successPledgeDetails && successPaymentDetails && (
        <PaymentSuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            setSuccessPledgeDetails(null);
            setSuccessPaymentDetails(null);
          }}
          pledgeDetails={successPledgeDetails}
          paymentDetails={successPaymentDetails}
        />
      )}
    </div>
  );
}
