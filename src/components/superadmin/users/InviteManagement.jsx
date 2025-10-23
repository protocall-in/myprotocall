
import React, { useState, useCallback } from 'react';
import { UserInvite, Role } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, RefreshCw, X, Clock, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function InviteManagement({ invites, isLoading, roles, onRefresh }) {

  const statusConfig = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    accepted: { label: 'Accepted', color: 'bg-green-100 text-green-800', icon: Check },
    expired: { label: 'Expired', color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
    revoked: { label: 'Revoked', color: 'bg-red-100 text-red-800', icon: X },
  };

  const copyInviteLink = (token) => {
    // FIX: Point to the built-in /signup page with the 'token' parameter
    const inviteLink = `${window.location.origin}/signup?token=${token}`;
    navigator.clipboard.writeText(inviteLink).then(() => {
      toast.success('Invite link copied!');
    });
  };

  const resendInvite = useCallback(async (inviteId) => {
    try {
      const expires_at = new Date();
      expires_at.setDate(expires_at.getDate() + 7);
      const token = 'invite_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      
      await UserInvite.update(inviteId, { 
        token, 
        expires_at: expires_at.toISOString(),
        status: 'pending',
        consumed_at: null, // Reset consumption status
        consumed_by_user_id: null,
      });
      toast.success('Invite has been refreshed and a new link generated.');
      onRefresh();
    } catch (error) {
      toast.error('Failed to resend invite.');
      console.error(error);
    }
  }, [onRefresh]);

  const revokeInvite = useCallback(async (inviteId) => {
    if (!confirm('Are you sure you want to revoke this invitation? This action cannot be undone.')) return;
    try {
      await UserInvite.update(inviteId, { status: 'revoked' });
      toast.success('Invitation has been revoked.');
      onRefresh();
    } catch (error) {
      toast.error('Failed to revoke invite.');
      console.error(error);
    }
  }, [onRefresh]);

  if (isLoading) return <div>Loading invites...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage User Invites</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Expires</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => {
                const config = statusConfig[invite.status] || statusConfig.pending;
                const Icon = config.icon;
                return (
                  <tr key={invite.id} className="border-t">
                    <td className="p-3 font-medium">{invite.email}</td>
                    <td className="p-3"><Badge variant="outline">{invite.role_to_assign}</Badge></td>
                    <td className="p-3">
                      <Badge className={config.color}><Icon className="w-3 h-3 mr-1"/>{config.label}</Badge>
                    </td>
                    <td className="p-3 text-slate-600">
                      {invite.status === 'pending' ? new Date(invite.expires_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {invite.status === 'pending' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => copyInviteLink(invite.token)}><Copy className="w-3 h-3 mr-2"/>Copy Link</Button>
                            <Button size="sm" variant="outline" onClick={() => resendInvite(invite.id)}><RefreshCw className="w-3 h-3 mr-2"/>Resend</Button>
                            <Button size="sm" variant="destructive" onClick={() => revokeInvite(invite.id)}><X className="w-3 h-3 mr-2"/>Revoke</Button>
                          </>
                        )}
                        {invite.status === 'accepted' && <span className="text-sm text-green-600">User registered</span>}
                        {invite.status === 'expired' && <Button size="sm" variant="outline" onClick={() => resendInvite(invite.id)}><RefreshCw className="w-3 h-3 mr-2"/>Resend</Button>}
                        {invite.status === 'revoked' && <span className="text-sm text-red-600">Invite revoked</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {invites.length === 0 && <p className="text-center text-slate-500 py-8">No invitations have been sent yet.</p>}
      </CardContent>
    </Card>
  );
}
