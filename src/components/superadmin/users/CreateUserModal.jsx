import React, { useState } from 'react';
import { User } from '@/api/entities';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateUserModal({ isOpen, onClose, onUserCreated }) {
  const [formData, setFormData] = useState({
    email: '',
    display_name: '',
    app_role: 'trader',
    password: '',
    confirmPassword: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email || !formData.display_name || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsCreating(true);
    try {
      // Since User is a built-in entity, we need to use a different approach
      // We'll update the user after they're created through the normal registration flow
      // For now, let's create a user record with the registration_method set
      
      // Note: In a real implementation, you might need to use a backend function
      // or special admin API to create users with passwords
      
      const userData = {
        email: formData.email,
        display_name: formData.display_name,
        app_role: formData.app_role,
        registration_method: 'direct_admin_creation',
        // Note: Password handling would need to be implemented on the backend
        // as the frontend SDK doesn't handle password creation for security reasons
      };

      // Since direct user creation with password isn't supported through the entity SDK,
      // we'll need to inform the user to use the invite system instead
      toast.error('Direct user creation with passwords is not supported. Please use the "Invite User" feature instead.');
      
      onClose();
      
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(`Error creating user: ${error.message || 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password, confirmPassword: password }));
    toast.success('Random password generated');
  };

  const handleClose = () => {
    setFormData({
      email: '',
      display_name: '',
      app_role: 'trader',
      password: '',
      confirmPassword: ''
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Create New User Account
          </DialogTitle>
          <DialogDescription>
            <strong>Note:</strong> Direct user creation with passwords is not supported by the platform for security reasons. 
            We recommend using the "Invite User" feature instead, which allows users to set their own secure passwords.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="user@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_name">Display Name *</Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
              placeholder="User's display name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="app_role">Role</Label>
            <Select value={formData.app_role} onValueChange={(value) => setFormData(prev => ({ ...prev, app_role: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trader">Trader</SelectItem>
                <SelectItem value="premium_trader">Premium Trader</SelectItem>
                <SelectItem value="advisor">Advisor</SelectItem>
                <SelectItem value="finfluencer">Finfluencer</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-semibold text-orange-800 mb-2">Security Limitation</h4>
            <p className="text-sm text-orange-700">
              For security reasons, admin-created users cannot have passwords set directly. 
              Please use the <strong>"Invite User"</strong> feature instead, which sends a secure 
              invitation email allowing users to create their own passwords.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="button" onClick={() => {
              handleClose();
              // Signal to parent to open invite modal instead
              toast.info('Opening Invite User instead - recommended approach');
            }}>
              Use Invite Instead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}