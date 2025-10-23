import React, { useState, useEffect } from 'react';
import { Subscription, User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Users as UsersIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SubscriptionUserManagement({ permissions }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [subsData, usersData] = await Promise.all([
        Subscription.list('-created_date'),
        User.list()
      ]);
      setSubscriptions(subsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReinstate = async (subscription) => {
    if (!permissions.canEdit) {
      toast.error('You do not have permission to modify subscriptions');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to reinstate this subscription for the user?\n\nThis will re-enable auto-renewal.`
    );

    if (!confirmed) return;

    try {
      await Subscription.update(subscription.id, {
        cancelAtPeriodEnd: false,
        auto_renew: true
      });
      toast.success('Subscription reinstated successfully');
      loadData();
    } catch (error) {
      console.error('Error reinstating subscription:', error);
      toast.error('Failed to reinstate subscription');
    }
  };

  const getUserForSubscription = (subscription) => {
    return users.find(u => u.id === subscription.user_id);
  };

  const getStatusBadge = (subscription) => {
    if (subscription.cancelAtPeriodEnd && subscription.status === 'active') {
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-300">
          <Clock className="w-3 h-3 mr-1" />
          CANCELLING
        </Badge>
      );
    }

    switch(subscription.status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            ACTIVE
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            CANCELLED
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-300">
            <XCircle className="w-3 h-3 mr-1" />
            EXPIRED
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {subscription.status.toUpperCase()}
          </Badge>
        );
    }
  };

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter(sub => {
    const user = getUserForSubscription(sub);
    const matchesSearch = !searchTerm || 
      (user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       user?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       sub.plan_type?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && sub.status === 'active' && !sub.cancelAtPeriodEnd) ||
      (statusFilter === 'cancelling' && sub.cancelAtPeriodEnd && sub.status === 'active') ||
      (statusFilter === 'cancelled' && sub.status === 'cancelled') ||
      (statusFilter === 'expired' && sub.status === 'expired');

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return <div className="p-6">Loading subscriptions...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-purple-600" />
            User Subscriptions ({filteredSubscriptions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by email, name, or plan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subscriptions</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="cancelling">Cancelling</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            {/* Refresh Button */}
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-green-700 mb-1">Active</p>
              <p className="text-xl font-bold text-green-900">
                {subscriptions.filter(s => s.status === 'active' && !s.cancelAtPeriodEnd).length}
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <p className="text-xs text-orange-700 mb-1">Cancelling</p>
              <p className="text-xl font-bold text-orange-900">
                {subscriptions.filter(s => s.cancelAtPeriodEnd && s.status === 'active').length}
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-xs text-red-700 mb-1">Cancelled</p>
              <p className="text-xl font-bold text-red-900">
                {subscriptions.filter(s => s.status === 'cancelled').length}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-700 mb-1">Expired</p>
              <p className="text-xl font-bold text-gray-900">
                {subscriptions.filter(s => s.status === 'expired').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions List */}
      {filteredSubscriptions.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="p-12 text-center">
            <UsersIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Subscriptions Found</h3>
            <p className="text-slate-600">Try adjusting your search or filter criteria</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSubscriptions.map((subscription) => {
            const user = getUserForSubscription(subscription);
            return (
              <Card key={subscription.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                          {user?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{user?.display_name || 'Unknown User'}</p>
                          <p className="text-sm text-slate-500">{user?.email || 'No email'}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-slate-500">Plan</p>
                          <p className="font-semibold capitalize">{subscription.plan_type}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Price</p>
                          <p className="font-semibold">₹{subscription.price}/mo</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Start Date</p>
                          <p className="font-semibold">{format(new Date(subscription.start_date), 'MMM d, yyyy')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">End Date</p>
                          <p className="font-semibold">{format(new Date(subscription.end_date), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex flex-col items-end gap-3">
                      {getStatusBadge(subscription)}
                      
                      {/* Reinstate Button - Only show for subscriptions marked for cancellation */}
                      {subscription.cancelAtPeriodEnd && subscription.status === 'active' && permissions.canEdit && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-300 text-green-700 hover:bg-green-50"
                          onClick={() => handleReinstate(subscription)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Reinstate Subscription
                        </Button>
                      )}

                      {subscription.cancelAtPeriodEnd && (
                        <p className="text-xs text-orange-600 text-right">
                          Cancels on: {format(new Date(subscription.end_date), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}