import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

export default function ManageReferrals({ settings, onChange }) {
  const handleInputChange = (key, value) => {
    onChange({ [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Switch
          id="referral_system_enabled"
          checked={settings['referral_system_enabled'] === 'true'}
          onCheckedChange={(checked) => handleInputChange('referral_system_enabled', String(checked))}
        />
        <Label htmlFor="referral_system_enabled" className="font-semibold">
          Enable Referral System
        </Label>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="referral_inviter_bonus" className="font-semibold">Inviter Bonus Amount (₹)</Label>
        <Input
          id="referral_inviter_bonus"
          type="number"
          value={settings['referral_inviter_bonus'] || '100'}
          onChange={(e) => handleInputChange('referral_inviter_bonus', e.target.value)}
          placeholder="e.g., 100"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="referral_invitee_bonus" className="font-semibold">Invitee Bonus Amount (₹)</Label>
        <Input
          id="referral_invitee_bonus"
          type="number"
          value={settings['referral_invitee_bonus'] || '50'}
          onChange={(e) => handleInputChange('referral_invitee_bonus', e.target.value)}
          placeholder="e.g., 50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="referral_conditions" className="font-semibold">Referral Conditions</Label>
        <Textarea
          id="referral_conditions"
          value={settings['referral_conditions'] || 'Bonus is awarded after the new user completes KYC verification and joins a premium chat room.'}
          onChange={(e) => handleInputChange('referral_conditions', e.target.value)}
          placeholder="Describe when the referral bonus is awarded..."
          rows={4}
        />
      </div>
    </div>
  );
}