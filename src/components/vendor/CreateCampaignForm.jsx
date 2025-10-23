
import React, { useState } from 'react';
import { AdCampaign } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { UploadFile } from '@/api/integrations';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Upload, DollarSign, Target, MapPin, Calendar } from 'lucide-react';

const SECTOR_OPTIONS = [
  'Banking', 'IT Services', 'Pharmaceuticals', 'Automobiles', 'Textiles',
  'Steel', 'Oil & Gas', 'Power', 'Telecom', 'FMCG', 'Real Estate', 'Infrastructure'
];

const STOCK_OPTIONS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR', 'ICICIBANK', 'ITC',
  'KOTAKBANK', 'LT', 'ASIANPAINT', 'AXISBANK', 'MARUTI', 'BAJFINANCE', 'WIPRO'
];

const PLACEMENT_SURCHARGE_RATE = 0.05; // 5%

export default function CreateCampaignForm({ vendor, onSuccess, onCancel, isAdmin = false }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    creative_url: '',
    cta_link: '',
    billing_model: 'weekly',
    cpc_rate: '',
    weekly_fee: 1999,
    monthly_fee: 6999,
    total_budget: '',
    daily_budget: '',
    target_sectors: [],
    target_stocks: [],
    placement_locations: ['dashboard'], // Default placement
    start_date: '',
    end_date: '',
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate pricing with surcharge
  const calculatePricing = () => {
    const { billing_model, weekly_fee, monthly_fee, placement_locations } = formData;
    let baseFee = 0;
    
    if (billing_model === 'weekly') baseFee = parseFloat(weekly_fee) || 0;
    if (billing_model === 'monthly') baseFee = parseFloat(monthly_fee) || 0;
    
    const hasPremiumPlacements = placement_locations.some(p => p !== 'dashboard');
    const surcharge = hasPremiumPlacements && baseFee > 0 ? baseFee * PLACEMENT_SURCHARGE_RATE : 0;
    const totalFee = baseFee + surcharge;
    
    return { baseFee, surcharge, totalFee, hasPremiumPlacements };
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      handleInputChange('creative_url', file_url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSectorChange = (sector, checked) => {
    const updatedSectors = checked 
      ? [...formData.target_sectors, sector]
      : formData.target_sectors.filter(s => s !== sector);
    handleInputChange('target_sectors', updatedSectors);
  };

  const handleStockChange = (stock, checked) => {
    const updatedStocks = checked 
      ? [...formData.target_stocks, stock]
      : formData.target_stocks.filter(s => s !== stock);
    handleInputChange('target_stocks', updatedStocks);
  };

  const handlePlacementChange = (placement, checked) => {
    let updatedPlacements;
    if (checked) {
      updatedPlacements = [...formData.placement_locations, placement];
    } else {
      updatedPlacements = formData.placement_locations.filter(p => p !== placement);
      // Ensure at least 'dashboard' remains selected
      if (updatedPlacements.length === 0) {
        updatedPlacements = ['dashboard'];
        toast.info('Dashboard placement is required as minimum');
      }
    }
    handleInputChange('placement_locations', updatedPlacements);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.title.trim() || !formData.creative_url || !formData.cta_link) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.billing_model === 'cpc' && !formData.cpc_rate) {
      toast.error('Please set CPC rate for CPC campaigns');
      return;
    }

    // New validation for dates
    if (['weekly', 'monthly'].includes(formData.billing_model) && (!formData.start_date || !formData.end_date)) {
        toast.error('Please select a start and end date for the campaign period.');
        return;
    }
    if (formData.start_date && formData.end_date && new Date(formData.end_date) <= new Date(formData.start_date)) {
        toast.error('End date must be after the start date.');
        return;
    }


    try {
      setIsSubmitting(true);
      
      const campaignData = {
        ...formData,
        vendor_id: vendor.id,
        cpc_rate: formData.billing_model === 'cpc' ? parseFloat(formData.cpc_rate) : null,
        weekly_fee: formData.billing_model === 'weekly' ? parseFloat(formData.weekly_fee) : null,
        monthly_fee: formData.billing_model === 'monthly' ? parseFloat(formData.monthly_fee) : null,
        total_budget: formData.total_budget ? parseFloat(formData.total_budget) : null,
        daily_budget: formData.daily_budget ? parseFloat(formData.daily_budget) : null,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        status: isAdmin ? 'active' : 'pending' // Admin campaigns auto-approved
      };

      await AdCampaign.create(campaignData);
      
      toast.success(isAdmin ? 'Admin campaign created and activated!' : 'Campaign created successfully! Awaiting approval.');
      onSuccess?.();
      
    } catch (error) {
      console.error('Campaign creation error:', error);
      toast.error('Failed to create campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pricing = calculatePricing();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          {isAdmin ? 'Create Admin Campaign' : 'Create New Ad Campaign'}
        </h1>
        <p className="text-blue-100">
          {isAdmin ? 'Create promotional campaigns for the platform' : 'Reach thousands of active traders and investors'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Campaign Details */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Campaign Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="title">Campaign Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter compelling ad title"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="cta_link">Call-to-Action Link *</Label>
                <Input
                  id="cta_link"
                  type="url"
                  value={formData.cta_link}
                  onChange={(e) => handleInputChange('cta_link', e.target.value)}
                  placeholder="https://yourwebsite.com/landing"
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of your offer or service"
                className="mt-2 h-24"
              />
            </div>

            <div>
              <Label htmlFor="creative_upload">Ad Creative *</Label>
              <div className="mt-2 space-y-4">
                {formData.creative_url ? (
                  <div className="relative">
                    <img 
                      src={formData.creative_url} 
                      alt="Campaign creative" 
                      className="max-w-full h-48 object-cover rounded-lg border"
                    />
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm"
                      onClick={() => handleInputChange('creative_url', '')}
                      className="mt-2"
                    >
                      Remove Image
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className={`w-8 h-8 mb-4 ${isUploading ? 'animate-spin' : 'text-gray-400'}`} />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> ad creative
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </label>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing Model */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-100">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Billing & Budget
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <Label>Billing Model *</Label>
              <Select value={formData.billing_model} onValueChange={(value) => handleInputChange('billing_model', value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly Subscription - ₹1,999/week</SelectItem>
                  <SelectItem value="monthly">Monthly Subscription - ₹6,999/month</SelectItem>
                  <SelectItem value="cpc">Cost Per Click (CPC)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* CAMPAIGN PERIOD INPUTS */}
            {(formData.billing_model === 'weekly' || formData.billing_model === 'monthly') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div>
                      <Label htmlFor="start_date">Campaign Start Date</Label>
                      <Input
                          id="start_date"
                          type="date"
                          value={formData.start_date}
                          onChange={(e) => handleInputChange('start_date', e.target.value)}
                          className="mt-2"
                          min={new Date().toISOString().split("T")[0]} // Prevent past dates
                      />
                  </div>
                  <div>
                      <Label htmlFor="end_date">Campaign End Date</Label>
                      <Input
                          id="end_date"
                          type="date"
                          value={formData.end_date}
                          onChange={(e) => handleInputChange('end_date', e.target.value)}
                          className="mt-2"
                          min={formData.start_date || new Date().toISOString().split("T")[0]}
                      />
                  </div>
              </div>
            )}


            {formData.billing_model === 'cpc' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cpc_rate">CPC Rate (₹) *</Label>
                  <Input
                    id="cpc_rate"
                    type="number"
                    step="0.01"
                    min="1"
                    value={formData.cpc_rate}
                    onChange={(e) => handleInputChange('cpc_rate', e.target.value)}
                    placeholder="10.00"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="total_budget">Total Budget (₹)</Label>
                  <Input
                    id="total_budget"
                    type="number"
                    min="100"
                    value={formData.total_budget}
                    onChange={(e) => handleInputChange('total_budget', e.target.value)}
                    placeholder="10000"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="daily_budget">Daily Budget (₹)</Label>
                  <Input
                    id="daily_budget"
                    type="number"
                    min="50"
                    value={formData.daily_budget}
                    onChange={(e) => handleInputChange('daily_budget', e.target.value)}
                    placeholder="500"
                    className="mt-2"
                  />
                </div>
              </div>
            )}

            {(formData.billing_model === 'weekly' || formData.billing_model === 'monthly') && (
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Base {formData.billing_model} fee:</span>
                      <span className="font-semibold">₹{pricing.baseFee.toFixed(2)}</span>
                    </div>
                    {pricing.hasPremiumPlacements && (
                      <div className="flex justify-between text-sm text-amber-600">
                        <span>Premium placement surcharge (5%):</span>
                        <span className="font-semibold">+ ₹{pricing.surcharge.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-bold text-lg text-green-600">
                      <span>Total Cost:</span>
                      <span>₹{pricing.totalFee.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Targeting & Placement */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-100">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Targeting & Placement
            </CardTitle>
            {pricing.hasPremiumPlacements && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertCircle className="w-4 h-4" />
                Premium placements incur 5% additional charges
              </div>
            )}
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Ad Placements */}
            <div>
              <Label className="text-base font-semibold">Ad Placement Locations</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                {[
                  { id: 'dashboard', label: 'Main Dashboard', premium: false },
                  { id: 'chatrooms', label: 'Chat Rooms', premium: true },
                  { id: 'stocks', label: 'Stock Pages', premium: true },
                  { id: 'polls', label: 'Polls Section', premium: true }
                ].map((placement) => (
                  <div key={placement.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <Checkbox
                      id={placement.id}
                      checked={formData.placement_locations.includes(placement.id)}
                      onCheckedChange={(checked) => handlePlacementChange(placement.id, checked)}
                    />
                    <Label htmlFor={placement.id} className="text-sm flex-1 cursor-pointer">
                      {placement.label}
                      {placement.premium && <Badge variant="secondary" className="ml-2 text-xs">+5%</Badge>}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Sector Targeting */}
            <div>
              <Label className="text-base font-semibold">Target Sectors (Optional)</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                {SECTOR_OPTIONS.map((sector) => (
                  <div key={sector} className="flex items-center space-x-2">
                    <Checkbox
                      id={`sector-${sector}`}
                      checked={formData.target_sectors.includes(sector)}
                      onCheckedChange={(checked) => handleSectorChange(sector, checked)}
                    />
                    <Label htmlFor={`sector-${sector}`} className="text-sm cursor-pointer">
                      {sector}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Leave empty to show to all users. Select specific sectors to target users interested in those areas.
              </p>
            </div>

            {/* Stock Targeting */}
            <div>
              <Label className="text-base font-semibold">Target Stocks (Optional)</Label>
              <div className="grid grid-cols-3 md:grid-cols-7 gap-3 mt-3">
                {STOCK_OPTIONS.map((stock) => (
                  <div key={stock} className="flex items-center space-x-2">
                    <Checkbox
                      id={`stock-${stock}`}
                      checked={formData.target_stocks.includes(stock)}
                      onCheckedChange={(checked) => handleStockChange(stock, checked)}
                    />
                    <Label htmlFor={`stock-${stock}`} className="text-xs cursor-pointer">
                      {stock}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Target users viewing specific stock pages or having these stocks in their portfolio.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || isUploading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isSubmitting ? 'Creating...' : isAdmin ? 'Create & Activate' : 'Submit for Approval'}
          </Button>
        </div>
      </form>
    </div>
  );
}
