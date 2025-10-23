import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const socialFields = [
  { key: 'social_link_twitter', label: 'Twitter URL' },
  { key: 'social_link_youtube', label: 'YouTube URL' },
  { key: 'social_link_linkedin', label: 'LinkedIn URL' },
  { key: 'social_link_instagram', label: 'Instagram URL' },
  { key: 'social_link_telegram', label: 'Telegram URL' },
];

export default function ManageJoinLinks({ settings, onChange }) {
  const handleInputChange = (key, value) => {
    onChange({ [key]: value });
  };

  return (
    <div className="space-y-6">
      {socialFields.map(field => (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={field.key} className="font-semibold">{field.label}</Label>
          <Input
            id={field.key}
            value={settings[field.key] || ''}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            placeholder={`Enter full URL for ${field.label}`}
          />
        </div>
      ))}
    </div>
  );
}