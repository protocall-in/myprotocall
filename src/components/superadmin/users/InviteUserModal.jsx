import React, { useState } from 'react';
import { UserInvite, Role } from '@/api/entities';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, CheckCircle, Copy, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { User } from '@/api/entities';

export default function InviteUserModal({ isOpen, onClose, onInviteSent, roles }) {
  const [formData, setFormData] = useState({
    email: '',
    role_to_assign: 'trader',
    subscription_plan: 'basic'
  });
  const [isSending, setIsSending] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  React.useEffect(() => {
    if (isOpen) {
      User.me().then(setCurrentUser);
    }
  }, [isOpen]);

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!formData.email) return toast.error('Please enter an email address');
    if (!currentUser) return toast.error('Could not identify admin. Please refresh.');
    setIsSending(true);

    try {
      const expires_at = new Date();
      expires_at.setDate(expires_at.getDate() + 7);
      const token = 'invite_' + Math.random().toString(36).substring(2) + Date.now().toString(36);

      const inviteData = {
        ...formData,
        token,
        expires_at: expires_at.toISOString(),
        status: 'pending',
        invited_by_admin_id: currentUser.id,
        invited_by_admin_name: currentUser.display_name,
      };

      const newInvite = await UserInvite.create(inviteData);
      
      // FIX: Point to the built-in /signup page with the 'token' parameter
      const link = `${window.location.origin}/signup?token=${newInvite.token}`;
      setInviteLink(link);
      setInviteSent(true);
      
      // Store metadata for post-registration update
      const postRegData = {
          app_role: formData.role_to_assign,
          role_template_name: formData.role_to_assign,
          registration_method: 'invite',
          trust_score: 50,
      };
      localStorage.setItem(`post_registration_data_${formData.email}`, JSON.stringify(postRegData));

      toast.success('Invitation created successfully!');
      if (onInviteSent) onInviteSent();
    } catch (error) {
      console.error("Error creating invitation:", error);
      toast.error('Failed to create invitation.');
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      toast.success('Invite link copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  const handleClose = () => {
    setFormData({ email: '', role_to_assign: 'trader', subscription_plan: 'basic' });
    setInviteSent(false);
    setInviteLink('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Mail className="w-5 h-5"/>Invite New User</DialogTitle>
          <DialogDescription>Send an invitation link to a new user. The link will expire in 7 days.</DialogDescription>
        </DialogHeader>
        {!inviteSent ? (
          <form onSubmit={handleSendInvite} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role_to_assign">Role</Label>
              <Select value={formData.role_to_assign} onValueChange={(value) => setFormData({ ...formData, role_to_assign: value })}>
                <SelectTrigger id="role_to_assign"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(roles || []).map((role) => <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={isSending}>
              {isSending ? <><Loader2 className="w-4 h-4 animate-spin mr-2"/>Sending...</> : <><Send className="w-4 h-4 mr-2"/>Send Invite</>}
            </Button>
          </form>
        ) : (
          <div className="pt-4 space-y-4">
            <div className="flex flex-col items-center text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold">Invite Link Generated!</h3>
              <p className="text-sm text-slate-500">Copy the link below and send it to the user.</p>
            </div>
            <div className="flex items-center space-x-2">
              <Input value={inviteLink} readOnly className="bg-slate-100" />
              <Button size="icon" onClick={copyToClipboard}><Copy className="h-4 w-4" /></Button>
            </div>
            <Button onClick={handleClose} variant="outline" className="w-full">Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}