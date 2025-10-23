
import React, { useState, useEffect, useCallback, useRef } from 'react'; // Added useRef
import { Poll, User, PollVote, ChatRoom } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Vote,
  Plus,
  Search,
  Filter,
  Download,
  BarChart3,
  TrendingUp,
  Shield,
  Crown,
  PieChart, // Added for Analytics tab icon
  Target // Added for Tomorrow's Pick tab icon
} from
'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from

'@/components/ui/select';
import { toast } from 'sonner';

import PollOverview from './poll/PollOverview';
import PollTable from './poll/PollTable';
import PollAnalytics from './poll/PollAnalytics';
import CreatePollModal from './poll/CreatePollModal';
import PollDetailsModal from './poll/PollDetailsModal';
import TopPollsWidget from './poll/TopPollsWidget';
import TomorrowsPickOverride from './poll/TomorrowsPickOverride'; // New import

export default function PollManagement({ user }) {
  const [polls, setPolls] = useState([]);
  const [enrichedPolls, setEnrichedPolls] = useState([]);
  const [users, setUsers] = useState([]);
  const [votes, setVotes] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [overviewStats, setOverviewStats] = useState({
    total: 0,
    active: 0,
    premium: 0,
    admin: 0,
    totalVotes: 0,
    avgVotes: 0
  });
  const [activeTab, setActiveTab] = useState('overview'); // New state for active tab
  const pollSubscriptionRef = useRef(null); // Added for real-time subscriptions

  // Permission checks
  const canCreatePolls = user?.app_role === 'super_admin' || user?.app_role === 'admin';
  const canDeletePolls = user?.app_role === 'super_admin';
  const canModeratePolls = user?.app_role === 'super_admin' || user?.app_role === 'admin';

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Load all data without restrictive filters
      const [allPolls, allUsers, allVotes, allChatRooms] = await Promise.all([
        Poll.list('-created_date').catch(() => []), // Use created_date instead of created_at
        User.list().catch(() => []),
        PollVote.list().catch(() => []),
        ChatRoom.list().catch(() => [])
      ]);

      console.log(`Polls loaded: ${allPolls.length}`);
      if (allPolls.length > 0) {
        console.log('Sample poll structure:', allPolls[0]);
      }

      // Create lookup maps for efficient joining
      const chatRoomMap = new Map(allChatRooms.map((room) => [room.id, room]));
      const voteCountMap = new Map();

      // Count votes per poll
      allVotes.forEach((vote) => {
        const pollId = vote.poll_id;
        voteCountMap.set(pollId, (voteCountMap.get(pollId) || 0) + 1);
      });

      // Enrich polls with related data
      const enrichedPollsData = allPolls.map((poll) => ({
        ...poll,
        chatroom: poll.chatroom_id ? chatRoomMap.get(poll.chatroom_id) : null,
        vote_count: voteCountMap.get(poll.id) || 0,
        // Calculate percentages
        buy_percentage: poll.total_votes > 0 ? ((poll.buy_votes || 0) / poll.total_votes * 100).toFixed(1) : 0,
        sell_percentage: poll.total_votes > 0 ? ((poll.sell_votes || 0) / poll.total_votes * 100).toFixed(1) : 0,
        hold_percentage: poll.total_votes > 0 ? ((poll.hold_votes || 0) / poll.total_votes * 100).toFixed(1) : 0,
        // Determine if active based on expiry date
        is_currently_active: poll.expires_at ? new Date(poll.expires_at) > new Date() : true
      }));

      // Calculate overview stats
      const total = allPolls.length;
      const active = enrichedPollsData.filter((p) => p.is_currently_active).length;
      const premium = allPolls.filter((p) => p.is_premium).length;
      const admin = allPolls.filter((p) => p.created_by_admin).length;
      const totalVotes = allPolls.reduce((sum, p) => sum + (p.total_votes || 0), 0);
      const avgVotes = total > 0 ? Math.round(totalVotes / total) : 0;

      const newStats = { total, active, premium, admin, totalVotes, avgVotes };
      console.log("Overview Stats", newStats);
      setOverviewStats(newStats);

      setPolls(allPolls);
      setEnrichedPolls(enrichedPollsData);
      setUsers(allUsers);
      setVotes(allVotes);
      setChatRooms(allChatRooms);

    } catch (error) {
      console.error('Error loading poll management data:', error);
      toast.error('Failed to load poll data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set up real-time subscription for poll updates
  useEffect(() => {
    loadData(); // Initial data load

    let pollInterval = null; // Declare a variable for the interval ID for fallback

    const setupSubscription = async () => {
      try {
        // Check if Poll.subscribe exists and is a function
        if (typeof Poll.subscribe === 'function') {
          // Subscribe to Poll entity changes
          // Whenever a poll is created, updated, or deleted, this callback fires
          pollSubscriptionRef.current = await Poll.subscribe((event) => {
            console.log('Real-time poll update received:', event);

            // Reload data when polls change to ensure consistency
            // This ensures admin panel always shows up-to-date vote counts
            loadData();
          });
          // If subscription is successful, clear any potential fallback interval
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
        } else {
          console.warn('Poll.subscribe is not available, using polling fallback');
          throw new Error('Subscribe not available'); // Trigger fallback
        }
      } catch (error) {
        console.log('Poll subscription not available, using polling fallback:', error);
        // Fallback: poll for updates every 10 seconds if subscription fails
        if (!pollInterval) { // Only set if not already set to avoid multiple intervals
            pollInterval = setInterval(() => {
                loadData();
            }, 10000);
        }
      }
    };

    setupSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (pollSubscriptionRef.current) {
        // Check if unsubscribe method exists before calling
        if (typeof pollSubscriptionRef.current.unsubscribe === 'function') {
          pollSubscriptionRef.current.unsubscribe();
        } else if (typeof pollSubscriptionRef.current === 'function') {
          // Some implementations might return the unsubscribe function directly
          pollSubscriptionRef.current();
        }
      }
      if (pollInterval) { // Clear the fallback interval if it was set
          clearInterval(pollInterval);
      }
    };
  }, [loadData]);

  const handleTogglePremium = async (pollId, isPremium) => {
    try {
      await Poll.update(pollId, { is_premium: isPremium });
      toast.success(`Poll ${isPremium ? 'upgraded to premium' : 'downgraded to general'} successfully`);
      // loadData(); // Reload data - subscription will handle this
    } catch (error) {
      console.error('Error toggling premium status:', error);
      toast.error('Failed to update premium status');
    }
  };

  const handleSuspendPoll = async (pollId, isActive) => {
    try {
      await Poll.update(pollId, { is_active: !isActive });
      toast.success(`Poll ${isActive ? 'suspended' : 'reactivated'} successfully`);
      // loadData(); // Reload data - subscription will handle this
    } catch (error) {
      console.error('Error updating poll status:', error);
      toast.error('Failed to update poll status');
    }
  };

  const handleDeletePoll = async (pollId) => {
    if (window.confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      try {
        await Poll.delete(pollId);
        toast.success('Poll deleted successfully');
        // loadData(); // Reload data - subscription will handle this
      } catch (error) {
        console.error('Error deleting poll:', error);
        toast.error('Failed to delete poll');
      }
    }
  };

  const handleCreatePoll = async (pollData) => {
    try {
      await Poll.create({
        ...pollData,
        created_by_admin: true,
        buy_votes: 0,
        sell_votes: 0,
        hold_votes: 0,
        total_votes: 0
      });
      toast.success('Poll created successfully');
      setShowCreateModal(false);
      // loadData(); // Reload data - subscription will handle this
    } catch (error) {
      console.error('Error creating poll:', error);
      toast.error('Failed to create poll');
    }
  };

  const handleViewDetails = (poll) => {
    setSelectedPoll(poll);
  };

  const exportPolls = () => {
    // Create CSV data
    const csvData = enrichedPolls.map((poll) => ({
      'Poll Title': poll.title,
      'Stock Symbol': poll.stock_symbol,
      'Chat Room': poll.chatroom?.name || 'None',
      'Type': poll.poll_type,
      'Is Premium': poll.is_premium ? 'Yes' : 'No',
      'Is Admin': poll.created_by_admin ? 'Yes' : 'No',
      'Status': poll.is_currently_active ? 'Active' : 'Expired',
      'Total Votes': poll.total_votes || 0,
      'Buy Votes': poll.buy_votes || 0,
      'Sell Votes': poll.sell_votes || 0,
      'Hold Votes': poll.hold_votes || 0,
      'Buy %': poll.buy_percentage,
      'Sell %': poll.sell_percentage,
      'Hold %': poll.hold_percentage,
      'Created Date': new Date(poll.created_date).toLocaleDateString(),
      'Expires At': poll.expires_at ? new Date(poll.expires_at).toLocaleDateString() : 'No expiry'
    }));

    // Convert to CSV string
    const headers = Object.keys(csvData[0] || {});
    const csvString = [
    headers.join(','),
    ...csvData.map((row) => headers.map((header) => `"${row[header]}"`).join(','))].

    join('\n');

    // Download CSV
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `polls-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredPolls = enrichedPolls.filter((poll) => {
    // Search term filter - searches across poll title, stock symbol, and chat room name
    // Affects "Poll Details" and "Stock & Room" columns
    const matchesSearchTerm = searchTerm === '' ||
    poll.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    poll.stock_symbol && poll.stock_symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    poll.chatroom?.name && poll.chatroom.name.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter - filters based on poll active/expired status
    // Affects the "Status" column
    const matchesStatus = statusFilter === 'all' ||
    statusFilter === 'active' && poll.is_currently_active ||
    statusFilter === 'expired' && !poll.is_currently_active;

    // Type filter - filters based on poll type (general, premium, admin)
    // Affects the "Type" column
    const matchesType = typeFilter === 'all' ||
    typeFilter === 'premium' && poll.is_premium ||
    typeFilter === 'admin' && poll.created_by_admin ||
    typeFilter === 'general' && !poll.is_premium && !poll.created_by_admin;

    // Date filter - filters based on poll creation date
    // Affects the "Created" column
    const pollDate = new Date(poll.created_date);
    const now = new Date();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    const monthAgo = new Date(now);
    monthAgo.setMonth(now.getMonth() - 1);
    monthAgo.setHours(0, 0, 0, 0);

    const matchesDate = dateFilter === 'all' ||
    dateFilter === 'today' && pollDate >= today ||
    dateFilter === 'week' && pollDate >= weekAgo ||
    dateFilter === 'month' && pollDate >= monthAgo;

    // The "Votes & Results" columns are displayed for the filtered polls but are not filter criteria themselves.
    return matchesSearchTerm && matchesStatus && matchesType && matchesDate;
  });

  if (isLoading) {
    return (
      <div className="text-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
        <p className="text-lg text-slate-600">Loading Poll Management Dashboard...</p>
      </div>);

  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <PollOverview polls={filteredPolls} stats={overviewStats} user={user} />;
      case 'polls':
        return (
          <>
            {/* Top Polls Widget - only show if there are polls */}
            {enrichedPolls.length > 0 &&
            <TopPollsWidget polls={enrichedPolls} onViewDetails={handleViewDetails} />
            }

            {/* Main Poll Details Table */}
            <Card className="shadow-lg border-0 bg-white">
              <CardContent className="p-0">
                {/* The 'filteredPolls' constant is passed here, ensuring the table only receives filtered data */}
                <PollTable
                  polls={filteredPolls}
                  onViewDetails={handleViewDetails} // Corresponds to onPollSelect
                  onDeletePoll={handleDeletePoll}
                  onSuspendPoll={handleSuspendPoll}
                  onTogglePremium={handleTogglePremium}
                  canModerate={canModeratePolls}
                  canDelete={canDeletePolls}
                  onRefresh={loadData} // Added from outline, though subscription handles auto-refresh now
                  user={user} // Added from outline
                />
              </CardContent>
            </Card>

            {/* Show message when no polls match filters */}
            {filteredPolls.length === 0 && enrichedPolls.length > 0 &&
            <Card className="shadow-lg border-0 bg-white">
                <CardContent className="p-8 text-center">
                  <Vote className="mx-auto h-12 w-12 text-slate-400" />
                  <h3 className="mt-2 text-sm font-medium text-slate-900">No polls match your filters</h3>
                  <p className="mt-1 text-sm text-slate-500">Try adjusting your search term or filter criteria to see more results.</p>
                  <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setDateFilter('all');
                  }}
                  className="mt-4">

                    Clear All Filters
                  </Button>
                </CardContent>
              </Card>
            }
          </>);

      case 'analytics':
        return <PollAnalytics polls={polls} votes={votes} />;
      case 'tomorrows-pick':
        return <TomorrowsPickOverride user={user} />;
      default:
        return <PollOverview polls={filteredPolls} stats={overviewStats} user={user} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Polls & Pledges Management</h2>
          <p className="text-slate-600">Monitor and manage community polls and premium content</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={exportPolls} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          {canCreatePolls &&
          <Button onClick={() => setShowCreateModal(true)} className="bg-cyan-600 hover:bg-cyan-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Poll
            </Button>
          }
        </div>
      </div>

      {/* Quick Stats - Colorful Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl p-4 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-full">
            <Vote className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold">{overviewStats.total}</p>
            <p className="text-sm opacity-90">Total Polls</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl p-4 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-full">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold">{overviewStats.active}</p>
            <p className="text-sm opacity-90">Active</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-xl p-4 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-full">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold">{overviewStats.premium}</p>
            <p className="text-sm opacity-90">Premium</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-4 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-full">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold">{overviewStats.admin}</p>
            <p className="text-sm opacity-90">Admin Created</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl p-4 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-full">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold">{overviewStats.totalVotes}</p>
            <p className="text-sm opacity-90">Total Votes</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search polls by title, stock symbol, chat room..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10" />

            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 bg-transparent rounded-lg p-1 gap-2">
          <TabsTrigger value="overview" className="whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="polls" className="whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md">
            <Vote className="w-4 h-4" />
            Manage Polls
          </TabsTrigger>
          <TabsTrigger value="analytics" className="whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md">
            <PieChart className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="tomorrows-pick" className="whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md">
            <Target className="w-4 h-4" />
            Tomorrow's Pick
          </TabsTrigger>
        </TabsList>

        {renderTabContent()}
      </Tabs>

      {/* Modals */}
      {canCreatePolls &&
      <CreatePollModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreatePoll={handleCreatePoll} />


      }

      <PollDetailsModal
        open={!!selectedPoll}
        onClose={() => setSelectedPoll(null)}
        poll={selectedPoll}
        votes={votes.filter((v) => v.poll_id === selectedPoll?.id)}
        users={users} />

    </div>);

}
