import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ManageLocalization({ settings, onChange }) {
  const handleSelectChange = (key, value) => {
    onChange({ [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="default_country" className="font-semibold">Default Country</Label>
        <Select
          value={settings['default_country'] || 'IN'}
          onValueChange={(value) => handleSelectChange('default_country', value)}
        >
          <SelectTrigger id="default_country">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="IN">India</SelectItem>
            <SelectItem value="US">United States</SelectItem>
            <SelectItem value="GB">United Kingdom</SelectItem>
            <SelectItem value="SG">Singapore</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="default_currency" className="font-semibold">Default Currency</Label>
        <Select
          value={settings['default_currency'] || 'INR'}
          onValueChange={(value) => handleSelectChange('default_currency', value)}
        >
          <SelectTrigger id="default_currency">
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
            <SelectItem value="USD">US Dollar ($)</SelectItem>
            <SelectItem value="GBP">British Pound (£)</SelectItem>
            <SelectItem value="SGD">Singapore Dollar (S$)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="default_language" className="font-semibold">Default Language</Label>
        <Select
          value={settings['default_language'] || 'en'}
          onValueChange={(value) => handleSelectChange('default_language', value)}
        >
          <SelectTrigger id="default_language">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="hi">Hindi</SelectItem>
            <SelectItem value="es">Spanish</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}