import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function ManageMetas({ settings, onChange }) {
  const handleInputChange = (key, value) => {
    onChange({ [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="seo_meta_title" className="font-semibold">Default Meta Title</Label>
        <Input
          id="seo_meta_title"
          value={settings['seo_meta_title'] || 'Protocol - The Ultimate Social Trading Platform'}
          onChange={(e) => handleInputChange('seo_meta_title', e.target.value)}
          placeholder="Enter the default meta title for your site"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="seo_meta_description" className="font-semibold">Default Meta Description</Label>
        <Textarea
          id="seo_meta_description"
          value={settings['seo_meta_description'] || ''}
          onChange={(e) => handleInputChange('seo_meta_description', e.target.value)}
          placeholder="Enter a concise default description for search engines."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="seo_meta_keywords" className="font-semibold">Default Meta Keywords</Label>
        <Input
          id="seo_meta_keywords"
          value={settings['seo_meta_keywords'] || 'social trading, stocks, finance, community, investing'}
          onChange={(e) => handleInputChange('seo_meta_keywords', e.target.value)}
          placeholder="Enter comma-separated keywords"
        />
      </div>
    </div>
  );
}