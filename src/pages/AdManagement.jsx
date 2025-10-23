
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AdCampaign, Vendor, User, AdTransaction, CampaignBilling } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Eye,
  DollarSign,
  TrendingUp,
  BarChart,
  Activity,
  PauseCircle,
  PlayCircle,
  Megaphone,
  AlertTriangle,
  Calendar,
  Download,
  PlusCircle,
  Edit,
  Trash2,
  Filter,
  RefreshCw,
  Upload
} from 'lucide-react';
import { toast } from "sonner";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { format } from 'date-fns';
import CreateCampaignForm from '../components/vendor/CreateCampaignForm';
import { UploadFile } from '@/api/integrations';

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  active: { label: 'Active', icon: PlayCircle, color: 'bg-green-100 text-green-800 border-green-200' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'bg-red-100 text-red-800 border-red-200' },
  paused: { label: 'Paused', icon: PauseCircle, color: 'bg-gray-100 text-gray-800 border-gray-200' },
  expired: { label: 'Expired', icon: AlertTriangle, color: 'bg-blue-100 text-blue-800 border-blue-200' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'bg-purple-100 text-purple-800 border-purple-200' },
  budget_exhausted: { label: 'Budget Exhausted', icon: AlertTriangle, color: 'bg-orange-100 text-orange-800 border-orange-200' }
};

const SECTOR_OPTIONS = [
  'Banking', 'IT Services', 'Pharmaceuticals', 'Automobiles', 'Textiles',
  'Steel', 'Oil & Gas', 'Power', 'Telecom', 'FMCG', 'Real Estate', 'Infrastructure'
];

const STOCK_OPTIONS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR', 'ICICIBANK', 'ITC',
  'KOTAKBANK', 'LT', 'ASIANPAINT', 'AXISBANK', 'MARUTI', 'BAJFINANCE', 'WIPRO'
];

function EditCampaignModal({ campaign, isOpen, onClose, onSave }) {
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
    placement_locations: ['dashboard'],
    start_date: '',
    end_date: '',
    edit_reason: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (campaign && isOpen) {
      setFormData({
        title: campaign.title || '',
        description: campaign.description || '',
        creative_url: campaign.creative_url || '',
        cta_link: campaign.cta_link || '',
        billing_model: campaign.billing_model || 'weekly',
        cpc_rate: campaign.cpc_rate || '',
        weekly_fee: campaign.weekly_fee || 1999,
        monthly_fee: campaign.monthly_fee || 6999,
        total_budget: campaign.total_budget || '',
        daily_budget: campaign.daily_budget || '',
        target_sectors: campaign.target_sectors || [],
        target_stocks: campaign.target_stocks || [],
        placement_locations: campaign.placement_locations || ['dashboard'],
        start_date: campaign.start_date ? new Date(campaign.start_date).toISOString().split('T')[0] : '',
        end_date: campaign.end_date ? new Date(campaign.end_date).toISOString().split('T')[0] : '',
        edit_reason: '' // Clear edit reason on modal open
      });
    }
  }, [campaign, isOpen]);

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

    if (file.size > 5 * 1024 * 1024) {
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
      if (updatedPlacements.length === 0) {
        updatedPlacements = ['dashboard'];
        toast.info('Dashboard placement is required as minimum');
      }
    }
    handleInputChange('placement_locations', updatedPlacements);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.creative_url || !formData.cta_link) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.edit_reason.trim()) {
      toast.error('Please provide a reason for editing this campaign');
      return;
    }

    if (formData.billing_model === 'cpc' && !formData.cpc_rate) {
      toast.error('Please set CPC rate for CPC campaigns');
      return;
    }

    if (['weekly', 'monthly'].includes(formData.billing_model) && (!formData.start_date || !formData.end_date)) {
      toast.error('Please select a start and end date for the campaign period.');
      return;
    }

    if (formData.start_date && formData.end_date && new Date(formData.end_date) <= new Date(formData.start_date)) {
      toast.error('End date must be after the start date.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        creative_url: formData.creative_url,
        cta_link: formData.cta_link.trim(),
        billing_model: formData.billing_model,
        target_sectors: formData.target_sectors,
        target_stocks: formData.target_stocks,
        placement_locations: formData.placement_locations,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        edit_reason: formData.edit_reason.trim(),
        is_edited: true,
        // Store original version for auditing if needed, though for now we're just updating the current campaign
        // original_version: campaign, 
        status: 'pending' // Reset to pending for re-approval
      };

      if (formData.billing_model === 'cpc') {
        updateData.cpc_rate = parseFloat(formData.cpc_rate);
        updateData.total_budget = formData.total_budget ? parseFloat(formData.total_budget) : null;
        updateData.daily_budget = formData.daily_budget ? parseFloat(formData.daily_budget) : null;
        // Clear fee-based fields if switching to CPC
        updateData.weekly_fee = null;
        updateData.monthly_fee = null;
      } else if (formData.billing_model === 'weekly') {
        updateData.weekly_fee = parseFloat(formData.weekly_fee);
        // Clear CPC-based fields if switching to weekly/monthly
        updateData.cpc_rate = null;
        updateData.total_budget = null;
        updateData.daily_budget = null;
        updateData.monthly_fee = null;
      } else if (formData.billing_model === 'monthly') {
        updateData.monthly_fee = parseFloat(formData.monthly_fee);
        // Clear CPC-based fields if switching to weekly/monthly
        updateData.cpc_rate = null;
        updateData.total_budget = null;
        updateData.daily_budget = null;
        updateData.weekly_fee = null;
      }

      await onSave(campaign.id, updateData);
      onClose();
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Failed to update campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatePricing = () => {
    const { billing_model, weekly_fee, monthly_fee, placement_locations } = formData;
    let baseFee = 0;
    
    if (billing_model === 'weekly') baseFee = parseFloat(weekly_fee) || 0;
    if (billing_model === 'monthly') baseFee = parseFloat(monthly_fee) || 0;
    
    const hasPremiumPlacements = placement_locations.some(p => p !== 'dashboard');
    const surcharge = hasPremiumPlacements && baseFee > 0 ? baseFee * 0.05 : 0;
    const totalFee = baseFee + surcharge;
    
    return { baseFee, surcharge, totalFee, hasPremiumPlacements };
  };

  const pricing = calculatePricing();

  if (!isOpen || !campaign) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-blue-600" />
            Edit Campaign: {campaign.title}
          </DialogTitle>
          <DialogDescription>
            Make changes to this campaign. After editing, it will need re-approval.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Campaign Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter campaign title"
                required
              />
            </div>
            <div>
              <Label htmlFor="cta_link">Destination URL *</Label>
              <Input
                id="cta_link"
                type="url"
                value={formData.cta_link}
                onChange={(e) => handleInputChange('cta_link', e.target.value)}
                placeholder="https://example.com"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your campaign"
              rows={3}
            />
          </div>

          {/* Creative Upload */}
          <div>
            <Label>Creative Image *</Label>
            <div className="mt-2 space-y-3">
              {formData.creative_url && (
                <div className="relative">
                  <img src={formData.creative_url} alt="Campaign creative" className="w-full max-h-48 object-contain rounded-lg border" />
                </div>
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="creative-upload"
                  disabled={isUploading}
                />
                <Label htmlFor="creative-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                    <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      {isUploading ? 'Uploading...' : 'Click to upload new image'}
                    </p>
                  </div>
                </Label>
              </div>
            </div>
          </div>

          {/* Billing Model */}
          <div>
            <Label>Billing Model</Label>
            <Select value={formData.billing_model} onValueChange={(value) => handleInputChange('billing_model', value)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cpc">Cost Per Click (CPC)</SelectItem>
                <SelectItem value="weekly">Weekly Subscription</SelectItem>
                <SelectItem value="monthly">Monthly Subscription</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Billing-specific fields */}
          {formData.billing_model === 'cpc' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="cpc_rate">CPC Rate (₹) *</Label>
                <Input
                  id="cpc_rate"
                  type="number"
                  step="0.01"
                  value={formData.cpc_rate}
                  onChange={(e) => handleInputChange('cpc_rate', e.target.value)}
                  placeholder="0.50"
                  required
                />
              </div>
              <div>
                <Label htmlFor="total_budget">Total Budget (₹)</Label>
                <Input
                  id="total_budget"
                  type="number"
                  value={formData.total_budget}
                  onChange={(e) => handleInputChange('total_budget', e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="daily_budget">Daily Budget (₹)</Label>
                <Input
                  id="daily_budget"
                  type="number"
                  value={formData.daily_budget}
                  onChange={(e) => handleInputChange('daily_budget', e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
          )}

          {formData.billing_model === 'weekly' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="weekly_fee">Weekly Fee (₹) *</Label>
                <Input
                  id="weekly_fee"
                  type="number"
                  value={formData.weekly_fee}
                  onChange={(e) => handleInputChange('weekly_fee', e.target.value)}
                  placeholder="1999"
                  required
                />
              </div>
              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {formData.billing_model === 'monthly' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="monthly_fee">Monthly Fee (₹) *</Label>
                <Input
                  id="monthly_fee"
                  type="number"
                  value={formData.monthly_fee}
                  onChange={(e) => handleInputChange('monthly_fee', e.target.value)}
                  placeholder="6999"
                  required
                />
              </div>
              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* Targeting */}
          <div className="space-y-4">
            <div>
              <Label>Target Sectors (Optional)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {SECTOR_OPTIONS.map((sector) => (
                  <div key={sector} className="flex items-center space-x-2">
                    <Checkbox
                      id={`sector-${sector}`}
                      checked={formData.target_sectors.includes(sector)}
                      onCheckedChange={(checked) => handleSectorChange(sector, checked)}
                    />
                    <Label htmlFor={`sector-${sector}`} className="text-sm">{sector}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Target Stocks (Optional)</Label>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                {STOCK_OPTIONS.map((stock) => (
                  <div key={stock} className="flex items-center space-x-2">
                    <Checkbox
                      id={`stock-${stock}`}
                      checked={formData.target_stocks.includes(stock)}
                      onCheckedChange={(checked) => handleStockChange(stock, checked)}
                    />
                    <Label htmlFor={`stock-${stock}`} className="text-sm font-mono">{stock}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Ad Placement (5% surcharge for premium placements)</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {[
                  { key: 'dashboard', label: 'Main Dashboard', premium: false },
                  { key: 'chatrooms', label: 'Chat Rooms', premium: true },
                  { key: 'stocks', label: 'Stock Pages', premium: true },
                  { key: 'polls', label: 'Polls Section', premium: true }
                ].map(({ key, label, premium }) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`placement-${key}`}
                      checked={formData.placement_locations.includes(key)}
                      onCheckedChange={(checked) => handlePlacementChange(key, checked)}
                    />
                    <Label htmlFor={`placement-${key}`} className="text-sm">
                      {label} {premium && <span className="text-amber-600">⭐</span>}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing Summary */}
          {['weekly', 'monthly'].includes(formData.billing_model) && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Pricing Summary</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Base Fee:</span>
                    <span>₹{pricing.baseFee.toFixed(2)}</span>
                  </div>
                  {pricing.hasPremiumPlacements && (
                    <div className="flex justify-between text-amber-600">
                      <span>Placement Surcharge (5%):</span>
                      <span>+₹{pricing.surcharge.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold border-t pt-1">
                    <span>Total:</span>
                    <span className="text-green-600">₹{pricing.totalFee.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Edit Reason */}
          <div>
            <Label htmlFor="edit_reason">Reason for Editing *</Label>
            <Textarea
              id="edit_reason"
              value={formData.edit_reason}
              onChange={(e) => handleInputChange('edit_reason', e.target.value)}
              placeholder="Explain why you're editing this campaign..."
              rows={3}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CampaignDetailsModal({ campaign, isOpen, onClose, onStatusUpdate, onEdit, onDelete }) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !campaign) return null;

  const handleAction = async (action) => {
    setIsProcessing(true);
    try {
      let success = false;
      
      switch (action) {
        case 'approve':
          success = await onStatusUpdate(campaign.id, 'active');
          break;
        case 'reject':
          if (!rejectionReason.trim()) {
            toast.error("Please provide a reason for rejection.");
            return;
          }
          success = await onStatusUpdate(campaign.id, 'rejected', rejectionReason);
          break;
        case 'pause':
          success = await onStatusUpdate(campaign.id, 'paused');
          break;
        case 'resume':
          success = await onStatusUpdate(campaign.id, 'active');
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
            success = await onDelete(campaign.id);
          }
          break;
      }
      
      if (success) {
        onClose();
        setRejectionReason('');
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateBillingInfo = () => {
    const { billing_model, weekly_fee, monthly_fee, placement_locations } = campaign;
    let baseFee = 0;
    
    if (billing_model === 'weekly') baseFee = weekly_fee || 0;
    if (billing_model === 'monthly') baseFee = monthly_fee || 0;
    
    const hasPremiumPlacements = placement_locations?.some(p => p !== 'dashboard');
    const surcharge = hasPremiumPlacements && baseFee > 0 ? baseFee * 0.05 : 0;
    const totalFee = baseFee + surcharge;
    
    return { baseFee, surcharge, totalFee, hasPremiumPlacements };
  };

  const billingInfo = calculateBillingInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999 }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-blue-600" />
            Campaign Review: {campaign.title}
          </DialogTitle>
          <DialogDescription>
            Review campaign details and take appropriate action.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Campaign Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Creative Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {campaign.creative_url ? (
                <div className="relative">
                  <img 
                    src={campaign.creative_url} 
                    alt={campaign.title} 
                    className="w-full max-h-64 object-contain rounded-lg border"
                  />
                </div>
              ) : (
                <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                  No creative uploaded
                </div>
              )}
            </CardContent>
          </Card>

          {/* Campaign Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Campaign Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>Vendor:</strong> {campaign.vendor?.company_name || 'Unknown'}</p>
                <p><strong>Description:</strong> {campaign.description || 'No description'}</p>
                <p><strong>CTA Link:</strong> 
                  <a href={campaign.cta_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-1 break-all">
                    {campaign.cta_link}
                  </a>
                </p>
                <p><strong>Status:</strong> 
                  <Badge className={`ml-2 ${statusConfig[campaign.status]?.color}`}>
                    {statusConfig[campaign.status]?.label}
                  </Badge>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Billing & Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>Billing Model:</strong> {campaign.billing_model?.toUpperCase()}</p>
                {campaign.billing_model === 'cpc' && (
                  <>
                    <p><strong>CPC Rate:</strong> ₹{campaign.cpc_rate}</p>
                    {campaign.total_budget && <p><strong>Total Budget:</strong> ₹{campaign.total_budget.toLocaleString()}</p>}
                    {campaign.daily_budget && <p><strong>Daily Budget:</strong> ₹{campaign.daily_budget.toLocaleString()}</p>}
                  </>
                )}
                
                {['weekly', 'monthly'].includes(campaign.billing_model) && (
                  <div className="p-3 bg-slate-50 rounded border">
                    <div className="flex justify-between"><span>Base Fee:</span> <span>₹{billingInfo.baseFee.toFixed(2)}</span></div>
                    {billingInfo.hasPremiumPlacements && (
                      <div className="flex justify-between text-amber-600"><span>Surcharge (5%):</span> <span>+₹{billingInfo.surcharge.toFixed(2)}</span></div>
                    )}
                    <div className="flex justify-between font-bold border-t pt-2 mt-2">
                      <span>Total:</span> <span className="text-green-600">₹{billingInfo.totalFee.toFixed(2)}</span>
                    </div>
                  </div>
                )}
                
                <p><strong>Impressions:</strong> {(campaign.impressions || 0).toLocaleString()}</p>
                <p><strong>Clicks:</strong> {(campaign.clicks || 0).toLocaleString()}</p>
                <p><strong>Revenue:</strong> ₹{(campaign.revenue_generated || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </CardContent>
            </Card>
          </div>

          {/* Targeting Info */}
          {(campaign.target_sectors?.length > 0 || campaign.target_stocks?.length > 0 || campaign.placement_locations?.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Targeting & Placement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {campaign.target_sectors?.length > 0 && (
                  <p><strong>Target Sectors:</strong> {campaign.target_sectors.join(', ')}</p>
                )}
                {campaign.target_stocks?.length > 0 && (
                  <p><strong>Target Stocks:</strong> {campaign.target_stocks.join(', ')}</p>
                )}
                <p><strong>Placements:</strong> {campaign.placement_locations?.join(', ') || 'Dashboard'}</p>
              </CardContent>
            </Card>
          )}

          {/* Campaign Period */}
          {(campaign.start_date || campaign.end_date) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Campaign Period</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>
                    {campaign.start_date ? format(new Date(campaign.start_date), 'PPP') : 'Not set'} → {' '}
                    {campaign.end_date ? format(new Date(campaign.end_date), 'PPP') : 'Not set'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Edit History */}
          {campaign.is_edited && (
            <Card className="bg-orange-50 border-orange-200">
              <CardHeader>
                <CardTitle className="text-base text-orange-800">Edited Campaign</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p><strong>Edit Reason:</strong> {campaign.edit_reason || 'No reason provided'}</p>
                <p className="text-orange-600 font-medium">This campaign requires re-approval after editing.</p>
              </CardContent>
            </Card>
          )}

          {/* Rejection Reason Input */}
          {campaign.status === 'pending' && (
            <div>
              <Label htmlFor="rejectionReason">Rejection Reason (optional)</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a clear reason if rejecting this campaign..."
                className="mt-2"
                rows={3}
              />
            </div>
          )}

          {/* Previous Rejection Reason */}
          {campaign.status === 'rejected' && campaign.rejection_reason && (
            <Card className="bg-red-50 border-red-200">
              <CardHeader>
                <CardTitle className="text-base text-red-800">Rejection Reason</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-red-700">
                <p>{campaign.rejection_reason}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Close
          </Button>
          
          {/* Action Buttons based on status */}
          {campaign.status === 'pending' && (
            <>
              <Button 
                variant="destructive" 
                onClick={() => handleAction('reject')}
                disabled={isProcessing}
              >
                <XCircle className="w-4 h-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Reject'}
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700" 
                onClick={() => handleAction('approve')}
                disabled={isProcessing}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Approve'}
              </Button>
            </>
          )}
          
          {campaign.status === 'active' && (
            <Button 
              variant="secondary" 
              onClick={() => handleAction('pause')}
              disabled={isProcessing}
            >
              <PauseCircle className="w-4 h-4 mr-2" />
              {isProcessing ? 'Processing...' : 'Pause'}
            </Button>
          )}
          
          {campaign.status === 'paused' && (
            <Button 
              className="bg-green-600 hover:bg-green-700" 
              onClick={() => handleAction('resume')}
              disabled={isProcessing}
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              {isProcessing ? 'Processing...' : 'Resume'}
            </Button>
          )}

          {/* Edit and Delete buttons (for non-active campaigns) */}
          {!['active'].includes(campaign.status) && (
            <>
              <Button 
                variant="outline" 
                onClick={() => onEdit(campaign)}
                disabled={isProcessing}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleAction('delete')}
                disabled={isProcessing}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdManagement({ user }) {
  const [campaigns, setCampaigns] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [billingRecords, setBillingRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreateCampaignModalOpen, setIsCreateCampaignModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [adminVendor, setAdminVendor] = useState(null);

  const loadAdData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [campaignData, vendorData, transactionData, billingData] = await Promise.all([
        AdCampaign.list('-created_date'),
        Vendor.list(),
        AdTransaction.list(),
        CampaignBilling.list().catch(() => [])
      ]);

      const vendorMap = new Map(vendorData.map(v => [v.id, v]));
      const campaignMap = new Map(campaignData.map(c => [c.id, c]));

      const enrichedCampaigns = campaignData.map(c => ({
        ...c,
        vendor: vendorMap.get(c.vendor_id),
      }));

      const enrichedBillingRecords = billingData.map(b => ({
        ...b,
        campaign: campaignMap.get(b.campaign_id),
        vendor: vendorMap.get(campaignMap.get(b.campaign_id)?.vendor_id),
      }));

      setCampaigns(enrichedCampaigns);
      setVendors(vendorData);
      setTransactions(transactionData);
      setBillingRecords(enrichedBillingRecords);

      // Create or find admin vendor for campaign creation
      let adminVendorRecord = vendorData.find(v => v.company_name === 'Platform Admin' && v.user_id === user.id);
      if (!adminVendorRecord) {
        adminVendorRecord = await Vendor.create({
          user_id: user.id,
          company_name: 'Platform Admin',
          website: 'https://protocol.com',
          status: 'approved',
          wallet_balance: 999999
        });
      }
      setAdminVendor(adminVendorRecord);

    } catch (error) {
      console.error("Error loading ad management data:", error);
      toast.error("Failed to load ad data.");
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadAdData();
  }, [loadAdData]);

  useEffect(() => {
    let filtered = campaigns;
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.vendor?.company_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredCampaigns(filtered);
  }, [campaigns, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    const totalRevenue = billingRecords.reduce((sum, bill) => sum + (bill.amount || 0), 0);
    const totalImpressions = campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    return {
      totalCampaigns: campaigns.length,
      pendingCampaigns: campaigns.filter(c => c.status === 'pending').length,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      totalRevenue,
      totalImpressions,
      totalClicks,
      ctr
    };
  }, [campaigns, billingRecords]);

  const analyticsData = useMemo(() => {
    const dailyData = {};

    transactions.forEach(t => {
      const date = format(new Date(t.created_date), 'yyyy-MM-dd');
      if (!dailyData[date]) {
        dailyData[date] = { date, impressions: 0, clicks: 0, revenue: 0 };
      }
      dailyData[date].revenue += t.amount || 0;
    });

    billingRecords.forEach(b => {
        const date = format(new Date(b.created_date), 'yyyy-MM-dd');
        if (!dailyData[date]) {
            dailyData[date] = { date, impressions: 0, clicks: 0, revenue: 0 };
        }
        dailyData[date].revenue += b.amount || 0;
    });

    return Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-30);
  }, [transactions, billingRecords]);

  const handleStatusUpdate = async (campaignId, newStatus, reason = '') => {
    try {
      const campaign = campaigns.find(c => c.id === campaignId);
      if (!campaign) {
        toast.error("Campaign not found.");
        return false;
      }

      const updateData = { status: newStatus };

      if (newStatus === 'rejected') {
        updateData.rejection_reason = reason;
      } else {
        updateData.rejection_reason = null; // Clear rejection reason if approved or other status
      }

      if (newStatus === 'active' && ['weekly', 'monthly'].includes(campaign.billing_model)) {
        const vendor = vendors.find(v => v.id === campaign.vendor_id);
        if (!vendor) {
          toast.error("Vendor not found for this campaign.");
          return false;
        }

        const hasPremiumPlacements = campaign.placement_locations?.some(p => p !== 'dashboard');
        const baseFee = campaign.billing_model === 'weekly' ? campaign.weekly_fee : campaign.monthly_fee;
        const surcharge = hasPremiumPlacements ? baseFee * 0.05 : 0;
        const totalFee = baseFee + surcharge;

        if (vendor.wallet_balance < totalFee) {
          toast.error(`Vendor has insufficient wallet balance. Required: ₹${totalFee.toFixed(2)}, Available: ₹${vendor.wallet_balance.toFixed(2)}`);
          return false;
        }

        // Deduct from wallet
        await Vendor.update(vendor.id, { 
          wallet_balance: vendor.wallet_balance - totalFee,
          total_spent: (vendor.total_spent || 0) + totalFee
        });

        // Create billing record
        await CampaignBilling.create({
          campaign_id: campaign.id,
          vendor_id: vendor.id,
          billing_model: campaign.billing_model,
          amount: totalFee,
          start_date: campaign.start_date || new Date().toISOString(), // Use campaign's specified dates or current if not set
          end_date: campaign.end_date || new Date(Date.now() + (campaign.billing_model === 'weekly' ? 7 : 30) * 24 * 60 * 60 * 1000).toISOString(),
          payment_status: 'paid',
          payment_date: new Date().toISOString(),
          invoice_number: `INV-${campaign.id.slice(-6)}-${Date.now()}`
        });

        // Update campaign start/end dates if they were not set before activation
        if (!campaign.start_date) updateData.start_date = new Date().toISOString();
        if (!campaign.end_date) updateData.end_date = new Date(Date.now() + (campaign.billing_model === 'weekly' ? 7 : 30) * 24 * 60 * 60 * 1000).toISOString();

        toast.success(`Campaign approved! Charged ₹${totalFee.toFixed(2)} from vendor's wallet.`);
      }
      
      // Clear `is_edited` flag and `edit_reason` upon approval/rejection
      if (newStatus === 'active' || newStatus === 'rejected') {
        updateData.is_edited = false;
        updateData.edit_reason = null;
      }

      await AdCampaign.update(campaignId, updateData);
      toast.success(`Campaign status updated to ${newStatus}.`);
      loadAdData();
      return true;
    } catch (error) {
      console.error("Error updating campaign status:", error);
      toast.error(`Failed to update status: ${error.message}`);
      return false;
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    try {
      await AdCampaign.delete(campaignId);
      toast.success("Campaign deleted successfully.");
      loadAdData();
      return true;
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast.error("Failed to delete campaign.");
      return false;
    }
  };

  const handleEditCampaign = (campaign) => {
    setEditingCampaign(campaign);
    setIsEditModalOpen(true);
  };

  const handleSaveEditedCampaign = async (campaignId, updateData) => {
    try {
      await AdCampaign.update(campaignId, updateData);
      toast.success("Campaign updated successfully! It's now pending re-approval.");
      loadAdData();
      setIsEditModalOpen(false);
      setEditingCampaign(null);
      return true;
    } catch (error) {
      console.error("Error saving edited campaign:", error);
      toast.error("Failed to save campaign edits.");
      return false;
    }
  };

  const handleCreateCampaign = () => {
    if (!adminVendor) {
      toast.error("Admin vendor not ready. Please try again.");
      return;
    }
    setIsCreateCampaignModalOpen(true);
  };

  const handleCampaignCreated = () => {
    setIsCreateCampaignModalOpen(false);
    loadAdData();
    toast.success("Admin campaign created successfully!");
  };

  const handleDownloadInvoice = (billingRecord) => {
    if (!billingRecord) {
        toast.error("No billing record selected for download.");
        return;
    }

    const invoiceContent = `
PROTOCOL - AD CAMPAIGN INVOICE
=====================================
Invoice ID: ${billingRecord.invoice_number || billingRecord.id}
Date: ${format(new Date(billingRecord.created_date), 'MMMM d, yyyy')}
Campaign: ${billingRecord.campaign?.title || 'N/A'}
Vendor: ${billingRecord.vendor?.company_name || 'N/A'}
Billing Model: ${billingRecord.billing_model?.toUpperCase()}
Amount: ₹${(billingRecord.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
Status: ${billingRecord.payment_status}
Period: ${billingRecord.start_date && billingRecord.end_date ? `${format(new Date(billingRecord.start_date), 'MMM d')} - ${format(new Date(billingRecord.end_date), 'MMM d, yyyy')}` : 'N/A'}

Thank you for your business!
=====================================
    `.trim();

    const blob = new Blob([invoiceContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${billingRecord.invoice_number || billingRecord.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Invoice downloaded successfully.`);
  };

  const openDetailsModal = (campaign) => {
    setSelectedCampaign(campaign);
    setIsDetailsModalOpen(true);
  };

  const StatCard = ({ title, value, icon: Icon, color, change }) => (
    <Card className="shadow-md border-0 bg-white">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color.bg}`}>
          <Icon className={`w-6 h-6 ${color.text}`} />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {change && <p className="text-xs text-gray-400">{change}</p>}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Loading Ad Management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Megaphone className="w-8 h-8" />
                Ad Management & Monetization
              </CardTitle>
              <CardDescription className="text-blue-100">
                Oversee vendor ad campaigns, track performance, and manage revenue.
              </CardDescription>
            </div>
            <Button
              onClick={loadAdData}
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-0"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`} 
          icon={DollarSign} 
          color={{bg: 'bg-green-100', text: 'text-green-600'}} 
          change="All-time ad revenue" 
        />
        <StatCard 
          title="Active Campaigns" 
          value={stats?.activeCampaigns || 0} 
          icon={Activity} 
          color={{bg: 'bg-blue-100', text: 'text-blue-600'}} 
          change={`${stats?.pendingCampaigns || 0} pending review`} 
        />
        <StatCard 
          title="Total Impressions" 
          value={(stats?.totalImpressions || 0).toLocaleString()} 
          icon={Eye} 
          color={{bg: 'bg-purple-100', text: 'text-purple-600'}} 
        />
        <StatCard 
          title="Click-Through Rate" 
          value={`${(stats?.ctr || 0).toFixed(2)}%`} 
          icon={TrendingUp} 
          color={{bg: 'bg-pink-100', text: 'text-pink-600'}} 
          change={`${(stats?.totalClicks || 0).toLocaleString()} total clicks`} 
        />
      </div>

      {/* Campaign Management */}
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle>Campaign Management</CardTitle>
                <div className="flex gap-2">
                    <Button
                      onClick={handleCreateCampaign}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                    >
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Create Campaign
                    </Button>

                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input 
                        placeholder="Search campaigns..." 
                        className="pl-9" 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {Object.entries(statusConfig).map(([key, {label}]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left">Campaign & Vendor</th>
                            <th className="px-6 py-3 text-left">Billing Model</th>
                            <th className="px-6 py-3 text-left">Campaign Period</th>
                            <th className="px-6 py-3 text-left">Performance</th>
                            <th className="px-6 py-3 text-left">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="6" className="text-center p-8">Loading campaigns...</td></tr>
                        ) : filteredCampaigns.length === 0 ? (
                            <tr><td colSpan="6" className="text-center p-8">
                              <div className="flex flex-col items-center py-8">
                                <Megaphone className="w-16 h-16 text-gray-300 mb-4" />
                                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Campaigns Found</h3>
                                <p className="text-gray-500 mb-4">
                                  {statusFilter !== 'all' ? `No ${statusConfig[statusFilter]?.label?.toLowerCase()} campaigns found.` : 'No campaigns created yet.'}
                                </p>
                                <Button onClick={handleCreateCampaign} className="bg-blue-600 hover:bg-blue-700">
                                  <PlusCircle className="w-4 h-4 mr-2" />
                                  Create First Campaign
                                </Button>
                              </div>
                            </td></tr>
                        ) : filteredCampaigns.map((campaign) => {
                            const StatusIcon = statusConfig[campaign.status]?.icon || Clock;
                            return (
                              <tr key={campaign.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="font-semibold">{campaign.title}</div>
                                    <div className="text-xs text-gray-500">{campaign.vendor?.company_name || 'Unknown Vendor'}</div>
                                    {campaign.is_edited && (
                                      <Badge variant="outline" className="text-xs mt-1 text-orange-600 border-orange-200">
                                        Edited - Needs Review
                                      </Badge>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="font-medium">{campaign.billing_model?.toUpperCase()}</div>
                                  <div className="text-xs text-gray-500 font-mono">
                                    {campaign.billing_model === 'cpc' && `₹${campaign.cpc_rate}/click`}
                                    {campaign.billing_model === 'weekly' && `₹${campaign.weekly_fee}/week`}
                                    {campaign.billing_model === 'monthly' && `₹${campaign.monthly_fee}/month`}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-1 text-xs text-gray-600">
                                    <Calendar className="w-3 h-3" />
                                    {campaign.start_date && campaign.end_date ? (
                                      <>
                                        {format(new Date(campaign.start_date), 'MMM d')} → {format(new Date(campaign.end_date), 'MMM d')}
                                      </>
                                    ) : (
                                      <span className="text-gray-400">Not scheduled</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-xs space-y-1">
                                      <div>👁️ {(campaign.impressions || 0).toLocaleString()}</div>
                                      <div>🖱️ {(campaign.clicks || 0).toLocaleString()}</div>
                                      <div>💰 ₹{(campaign.revenue_generated || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                  <Badge className={statusConfig[campaign.status]?.color}>
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {statusConfig[campaign.status]?.label}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => {
                                        setSelectedCampaign(campaign);
                                        setIsDetailsModalOpen(true);
                                      }}
                                    >
                                        <Eye className="w-4 h-4 mr-1" />
                                        Review
                                    </Button>
                                </td>
                            </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </CardContent>
      </Card>

      {/* Analytics */}
      {analyticsData && analyticsData.length > 0 && (
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <BarChart className="w-5 h-5" /> Performance Analytics
              </CardTitle>
              <CardDescription>Revenue trends over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(dateStr) => format(new Date(dateStr), 'MMM d')} />
                <YAxis />
                <Tooltip 
                  labelFormatter={(label) => format(new Date(label), 'MMMM d, yyyy')} 
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" name="Revenue (₹)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Billing History */}
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" /> Billing History & Invoices
            </CardTitle>
            <CardDescription>View and download records of campaign billings.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left">Invoice ID</th>
                            <th className="px-6 py-3 text-left">Campaign</th>
                            <th className="px-6 py-3 text-left">Vendor</th>
                            <th className="px-6 py-3 text-left">Amount</th>
                            <th className="px-6 py-3 text-left">Billing Date</th>
                            <th className="px-6 py-3 text-left">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {billingRecords.length === 0 ? (
                            <tr><td colSpan="7" className="text-center p-8 text-gray-500">No billing records found.</td></tr>
                        ) : billingRecords.map((record) => (
                            <tr key={record.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-mono text-xs">{record.invoice_number || record.id.substring(0, 8)}...</td>
                                <td className="px-6 py-4 font-semibold">{record.campaign?.title || 'N/A'}</td>
                                <td className="px-6 py-4 text-gray-600">{record.vendor?.company_name || 'N/A'}</td>
                                <td className="px-6 py-4 font-bold">₹{(record.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="px-6 py-4">{format(new Date(record.created_date), 'MMM d, yyyy')}</td>
                                <td className="px-6 py-4">
                                  <Badge variant="outline" className={`${record.payment_status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                    {record.payment_status}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Button variant="outline" size="sm" onClick={() => handleDownloadInvoice(record)}>
                                        <Download className="w-4 h-4 mr-1" />
                                        Invoice
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </CardContent>
      </Card>

      {/* Create Campaign Modal */}
      <Dialog open={isCreateCampaignModalOpen} onOpenChange={setIsCreateCampaignModalOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-purple-600" />
              Create Platform Ad Campaign
            </DialogTitle>
          </DialogHeader>
          {adminVendor ? (
            <CreateCampaignForm
              vendor={adminVendor}
              onSuccess={handleCampaignCreated}
              onCancel={() => setIsCreateCampaignModalOpen(false)}
              isAdmin={true}
            />
          ) : (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              Loading admin vendor information...
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Campaign Details Modal */}
      <CampaignDetailsModal
        campaign={selectedCampaign}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedCampaign(null);
        }}
        onStatusUpdate={handleStatusUpdate}
        onEdit={handleEditCampaign}
        onDelete={handleDeleteCampaign}
      />

      {/* Edit Campaign Modal */}
      <EditCampaignModal
        campaign={editingCampaign}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingCampaign(null);
        }}
        onSave={handleSaveEditedCampaign}
      />
    </div>
  );
}
