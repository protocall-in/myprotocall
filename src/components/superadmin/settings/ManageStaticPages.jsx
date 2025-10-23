import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ManageStaticPages({ settings, onChange }) {
  const handleInputChange = (key, value) => {
    onChange({ [key]: value });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="static_page_privacy_policy" className="font-semibold text-lg">Privacy Policy</Label>
        <Textarea
          id="static_page_privacy_policy"
          value={settings['static_page_privacy_policy'] || ''}
          onChange={(e) => handleInputChange('static_page_privacy_policy', e.targe.value)}
          placeholder="Enter the full content for your Privacy Policy page. Supports Markdown."
          rows={15}
          className="font-mono text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="static_page_terms_of_service" className="font-semibold text-lg">Terms of Service</Label>
        <Textarea
          id="static_page_terms_of_service"
          value={settings['static_page_terms_of_service'] || ''}
          onChange={(e) => handleInputChange('static_page_terms_of_service', e.target.value)}
          placeholder="Enter the full content for your Terms of Service page. Supports Markdown."
          rows={15}
          className="font-mono text-sm"
        />
      </div>
    </div>
  );
}