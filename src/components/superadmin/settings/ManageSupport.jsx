import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function ManageSupport({ settings, onChange }) {
  const handleInputChange = (key, value) => {
    onChange({ [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="support_email" className="font-semibold">Support Email Address</Label>
        <Input
          id="support_email"
          type="email"
          value={settings['support_email'] || ''}
          onChange={(e) => handleInputChange('support_email', e.target.value)}
          placeholder="e.g., support@protocol.app"
        />
        <p className="text-xs text-slate-500">This email will be displayed on the contact and support pages.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="support_phone" className="font-semibold">Support Phone Number (Optional)</Label>
        <Input
          id="support_phone"
          value={settings['support_phone'] || ''}
          onChange={(e) => handleInputChange('support_phone', e.target.value)}
          placeholder="e.g., +91 12345 67890"
        />
      </div>
    </div>
  );
}