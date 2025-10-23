import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Subscription, AdvisorSubscription, AuditLog } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, ShieldOff, ShieldCheck, UserCheck, Search, Download } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SubscriptionAudit = ({ currentAdmin, permissions }) => {
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [advisorSubscriptions, setAdvisorSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allUsers, allSubs, allAdvisorSubs] = await Promise.all([
        User.list('-created_date'),
        Subscription.list(),
        AdvisorSubscription.list()
      ]);
      setUsers(allUsers);
      setSubscriptions(allSubs);
      setAdvisorSubscriptions(allAdvisorSubs);
    } catch (error) {
      console.error("Error loading subscription audit data:", error);
      toast.error("Failed to load data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const combinedUserData = useMemo(() => {
    const subsByUserId = subscriptions.reduce((acc, sub) => {
      if (!acc[sub.user_id]) acc[sub.user_id] = [];
      if (sub.status === 'active') acc[sub.user_id].push(sub);
      return acc;
    }, {});
    const advisorSubsByUserId = advisorSubscriptions.reduce((acc, sub) => {
      if (!acc[sub.user_id]) acc[sub.user_id] = [];
      if (sub.status === 'active') acc[sub.user_id].push(sub);
      return acc;
    }, {});

    return users.map(user => ({
      ...user,
      platformSubscriptions: subsByUserId[user.id] || [],
      advisorSubscriptions: advisorSubsByUserId[user.id] || []
    }));
  }, [users, subscriptions, advisorSubscriptions]);

  const filteredUsers = useMemo(() =>
    combinedUserData.filter(user =>
      user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [combinedUserData, searchTerm]
  );

  const handleImpersonate = async (user) => {
    if (!permissions.isSuperAdmin) {
      toast.error("You don't have permission to impersonate users.");
      return;
    }
    await AuditLog.create({
      admin_id: currentAdmin.id,
      admin_name: currentAdmin.display_name,
      action: 'IMPERSONATE_USER_START',
      entity_type: 'User',
      entity_id: user.id,
      details: `Started impersonating user ${user.display_name} (${user.email}).`
    });
    localStorage.setItem('impersonated_user_id', user.id);
    window.location.href = '/';
  };

  const handleTogglePremium = async (user, currentSubs) => {
    if (!permissions.isSuperAdmin) return toast.error("Permission denied.");
    
    const activePremiumSub = currentSubs.find(s => s.plan_type === 'premium');
    
    try {
      if (activePremiumSub) {
        await Subscription.update(activePremiumSub.id, { status: 'cancelled' });
        toast.success(`Revoked Premium subscription for ${user.display_name}.`);
        await AuditLog.create({ admin_id: currentAdmin.id, admin_name: currentAdmin.display_name, action: 'SUBSCRIPTION_REVOKED', entity_type: 'User', entity_id: user.id, details: `Revoked Premium subscription for ${user.display_name}.`});
      } else {
        const newSub = {
            user_id: user.id,
            plan_type: 'premium',
            status: 'active',
            price: 0,
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            payment_id: `admin_grant_${currentAdmin.id}`
        };
        await Subscription.create(newSub);
        toast.success(`Granted Premium subscription to ${user.display_name}.`);
        await AuditLog.create({ admin_id: currentAdmin.id, admin_name: currentAdmin.display_name, action: 'SUBSCRIPTION_GRANTED', entity_type: 'User', entity_id: user.id, details: `Granted Premium subscription to ${user.display_name}.`});
      }
      loadData();
    } catch (error) {
      toast.error("Failed to update subscription.");
      console.error(error);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Subscription Audit</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Platform Subscription</TableHead>
                <TableHead>Advisor Subscriptions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan="5" className="text-center">Loading...</TableCell></TableRow>
              ) : (
                filteredUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.display_name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell>{user.app_role}</TableCell>
                    <TableCell>
                      {user.platformSubscriptions.length > 0 ? 
                        user.platformSubscriptions.map(s => s.plan_type).join(', ') : 'None'}
                    </TableCell>
                    <TableCell>{user.advisorSubscriptions.length}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">Actions</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuLabel>Manage User</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {permissions.isSuperAdmin && (
                            <>
                              <DropdownMenuItem onClick={() => handleImpersonate(user)}>
                                <UserCheck className="mr-2 h-4 w-4" /> Impersonate User
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleTogglePremium(user, user.platformSubscriptions)}>
                                {user.platformSubscriptions.some(s => s.plan_type === 'premium') ? 
                                  <><ShieldOff className="mr-2 h-4 w-4" /> Revoke Premium</> : 
                                  <><ShieldCheck className="mr-2 h-4 w-4" /> Grant Premium</>}
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem disabled={!permissions.isAdmin}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionAudit;