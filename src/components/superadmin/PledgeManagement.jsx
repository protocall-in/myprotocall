
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Shield, Activity, BarChart, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PledgeSession, Pledge, PledgeExecutionRecord, User, PledgeAccessRequest } from '@/api/entities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import PledgeSessionManager from './pledge/PledgeSessionManager';
import PledgeAccessRequests from './pledge/PledgeAccessRequests';
import PledgeExecutions from './pledge/PledgeExecutions';
import PledgeAnalytics from './pledge/PledgeAnalytics';
import AutomatedExecutionEngine from '../pledges/AutomatedExecutionEngine';
import AutomationSettings from './pledge/AutomationSettings';
import { useConfirm } from '../hooks/useConfirm';

const navItems = [
  { value: 'sessions', label: 'Sessions', icon: Target, description: 'Manage pledge rounds', restricted: false },
  { value: 'requests', label: 'Access Requests', icon: Shield, description: 'Approve user access', restricted: false },
  { value: 'executions', label: 'Executions', icon: Activity, description: 'Monitor pledge executions', restricted: false },
  { value: 'analytics', label: 'Analytics', icon: BarChart, description: 'View performance data', restricted: false },
];

export default function PledgeManagement({ user }) {
  const [activeTab, setActiveTab] = useState('sessions');
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState({
    sessions: [],
    pledges: [],
    executions: [],
    users: [],
    accessRequests: [],
  });

  const [autoExecutionEnabled, setAutoExecutionEnabled] = useState(false);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);

  const hasLoadedRef = useRef(false);
  const { ConfirmDialog, confirm } = useConfirm();

  // ✅ Load data ONLY ONCE on mount
  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      if (hasLoadedRef.current) return;

      console.log('🔄 Loading pledge data (ONCE)...');
      setIsLoading(true);

      try {
        const [sessions, pledges, executions, users, accessRequests] = await Promise.all([
          PledgeSession.list('-created_date').catch(() => []),
          Pledge.list('-created_date', 100).catch(() => []),
          PledgeExecutionRecord.list('-executed_at', 100).catch(() => []),
          User.list('-created_date', 50).catch(() => []),
          PledgeAccessRequest.list('-created_date', 100).catch(() => []),
        ]);

        if (isCancelled) return;

        setData({ sessions, pledges, executions, users, accessRequests });
        setPendingRequestCount(accessRequests.filter(req => req.status === 'pending').length);
        hasLoadedRef.current = true;
        console.log('✅ Pledge data loaded successfully');
      } catch (error) {
        console.error('❌ Error loading pledge data:', error);
        toast.error('Failed to load pledge data');
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, []); // ✅ EMPTY DEPS - Runs ONLY on mount

  // ✅ Manual refresh handler
  const handleRefresh = useCallback(async () => {
    console.log('🔄 Manual refresh triggered...');
    setIsLoading(true);

    try {
      const [sessions, pledges, executions, users, accessRequests] = await Promise.all([
        PledgeSession.list('-created_date').catch(() => []),
        Pledge.list('-created_date', 100).catch(() => []),
        PledgeExecutionRecord.list('-executed_at', 100).catch(() => []),
        User.list('-created_date', 50).catch(() => []),
        PledgeAccessRequest.list('-created_date', 100).catch(() => []),
      ]);

      setData({ sessions, pledges, executions, users, accessRequests });
      setPendingRequestCount(accessRequests.filter(req => req.status === 'pending').length);
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ Local update functions - NO RELOAD
  const updateSessionLocally = useCallback((sessionId, updates) => {
    console.log('📝 Updating session locally:', sessionId);
    setData(prev => ({
      ...prev,
      sessions: prev.sessions.map(s => s.id === sessionId ? { ...s, ...updates } : s)
    }));
  }, []);

  const updateAccessRequestLocally = useCallback((requestId, updates) => {
    console.log('📝 Updating access request locally:', requestId);
    setData(prev => {
      const newRequests = prev.accessRequests.map(r => r.id === requestId ? { ...r, ...updates } : r);
      setPendingRequestCount(newRequests.filter(r => r.status === 'pending').length);
      return { ...prev, accessRequests: newRequests };
    });
  }, []);

  const addExecutionLocally = useCallback((execution) => {
    console.log('📝 Adding execution locally:', execution.id);
    setData(prev => ({
      ...prev,
      executions: [execution, ...prev.executions]
    }));
  }, []);

  const stats = {
    totalSessions: data.sessions.length,
    activeSessions: data.sessions.filter(s => s.status === 'active').length,
    totalPledges: data.pledges.length,
    executedPledges: data.pledges.filter(p => p.status === 'executed').length,
    totalExecutions: data.executions.length,
    completedExecutions: data.executions.filter(e => e.status === 'completed').length,
  };

  if (isLoading && !hasLoadedRef.current) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Loading Pledge Data...</h3>
            <p className="text-sm text-gray-500 mt-1">Please wait while we fetch the latest information</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog />

      {autoExecutionEnabled && (
        <AutomatedExecutionEngine 
          enabled={autoExecutionEnabled}
          user={user}
          onExecutionComplete={(sessionId, status) => {
            if (status === 'success') {
              updateSessionLocally(sessionId, { status: 'completed', last_executed_at: new Date().toISOString() });
              toast.success('Execution completed successfully');
            }
          }}
        />
      )}

      <Card className="border-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-2xl">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <Target className="w-7 h-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Pledge Management Suite</CardTitle>
                <p className="text-blue-100 text-sm mt-1">
                  Oversee pledge sessions, user access, and execution monitoring.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
              className="bg-white/20 text-white border-white/50 hover:bg-white/30 px-4 py-2 text-sm rounded-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Data
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <AutomationSettings 
        enabled={autoExecutionEnabled}
        onToggle={setAutoExecutionEnabled}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Sessions</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Sessions</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalSessions}</p>
              <p className="text-xs text-gray-500 mt-2">{stats.activeSessions} Active</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Requests</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Requests</p>
              <p className="text-3xl font-bold text-gray-900">{pendingRequestCount}</p>
              <p className="text-xs text-gray-500 mt-2">{data.accessRequests.length} total</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Pledges</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Pledges</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalPledges}</p>
              <p className="text-xs text-gray-500 mt-2">{stats.executedPledges} Executed</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <BarChart className="w-6 h-6 text-orange-600" />
              </div>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Executions</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Executions</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalExecutions}</p>
              <p className="text-xs text-gray-500 mt-2">{stats.completedExecutions} Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 h-auto bg-transparent p-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.value;
            
            return (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className="w-full h-auto p-0 transition-all duration-300 data-[state=active]:scale-105"
              >
                <Card className={`w-full border-0 transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                    : 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700'
                }`}>
                  <CardContent className="p-4 relative">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${isActive ? 'bg-white/20' : 'bg-blue-100'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-base font-semibold">{item.label}</p>
                        <p className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-600'}`}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                    {item.value === 'requests' && pendingRequestCount > 0 && (
                      <div className="absolute top-2 right-2 h-6 w-6 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center animate-pulse">
                        {pendingRequestCount}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <Card className="p-4 sm:p-6 bg-white rounded-2xl shadow-xl">
          <TabsContent value="sessions" className="mt-0">
            <PledgeSessionManager 
              sessions={data.sessions}
              pledges={data.pledges}
              onSessionUpdate={updateSessionLocally}
              onRefresh={handleRefresh}
            />
          </TabsContent>
          <TabsContent value="requests" className="mt-0">
            <PledgeAccessRequests 
              requests={data.accessRequests}
              onRequestUpdate={updateAccessRequestLocally}
              onRefresh={handleRefresh}
            />
          </TabsContent>
          <TabsContent value="executions" className="mt-0">
            <PledgeExecutions 
              executions={data.executions}
              sessions={data.sessions}
              pledges={data.pledges}
              users={data.users}
              onExecutionAdd={addExecutionLocally}
              onRefresh={handleRefresh}
            />
          </TabsContent>
          <TabsContent value="analytics" className="mt-0">
            <PledgeAnalytics 
              sessions={data.sessions}
              pledges={data.pledges}
              executions={data.executions}
            />
          </TabsContent>
        </Card>
      </Tabs>
    </div>
  );
}
