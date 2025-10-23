import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const apiFields = [
  { key: 'stock_data_api_key', label: 'Stock Data API Key', placeholder: 'Enter your stock data API key (e.g., Alpha Vantage, Finnhub)' },
  { key: 'news_api_key', label: 'News API Key', placeholder: 'Enter your NewsAPI.org or other news provider key' },
  { key: 'google_maps_api_key', label: 'Google Maps API Key', placeholder: 'Enter your Google Maps platform key for location features' },
];

export default function ManageApiCredentials({ settings, onChange }) {
  const handleInputChange = (key, value) => {
    onChange({ [key]: value });
  };

  return (
    <div className="space-y-6">
      {apiFields.map(field => (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={field.key} className="font-semibold">{field.label}</Label>
          <Input
            id={field.key}
            type="password"
            value={settings[field.key] || ''}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            placeholder={field.placeholder}
          />
          <p className="text-xs text-slate-500">This key is sensitive and will not be shown again once saved.</p>
        </div>
      ))}
    </div>
  );
}