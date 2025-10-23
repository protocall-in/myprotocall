
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  AdCampaign,
  Vendor,
  User,
  CampaignBilling
} from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
  FileText
} from 'lucide-react';
import { toast } from "sonner";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { format } from 'date-fns';
import CreateCampaignForm from '../vendor/CreateCampaignForm';

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  active: { label: 'Active', icon: PlayCircle, color: 'bg-green-100 text-green-800 border-green-200' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'bg-red-100 text-red-800 border-red-200' },
  paused: { label: 'Paused', icon: PauseCircle, color: 'bg-gray-100 text-gray-800 border-gray-200' },
  expired: { label: 'Expired', icon: AlertTriangle, color: 'bg-blue-100 text-blue-800 border-blue-200' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'bg-purple-100 text-purple-800 border-purple-200' },
  budget_exhausted: { label: 'Budget Exhausted', icon: AlertTriangle, color: 'bg-orange-100 text-orange-800 border-orange-200' }
};

const billingStatusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800' },
  refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-800' }
};

// Edit Campaign Period Modal Component
function EditCampaignPeriodModal({ campaign, isOpen, onClose, onSave }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (campaign && isOpen) {
      setStartDate(campaign.start_date ? format(new Date(campaign.start_date), 'yyyy-MM-dd') : '');
      setEndDate(campaign.end_date ? format(new Date(campaign.end_date), 'yyyy-MM-dd') : '');
    }
  }, [campaign, isOpen]);

  const handleSave = async () => {
    if (!startDate || !endDate) {
      toast.error("Please provide both start and end dates.");
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      toast.error("End date must be after start date.");
      return;
    }

    setIsSaving(true);
    try {
      const success = await onSave(campaign.id, {
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString()
      });

      if (success) {
        onClose();
      }
    } catch (error) {
      console.error("Error saving campaign period:", error);
      toast.error("Failed to update campaign period.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !campaign) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Campaign Period</DialogTitle>
          <DialogDescription>
            Update the start and end dates for "{campaign.title}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="start_date">Start Date</Label>
            <Input
              id="start_date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_date">End Date</Label>
            <Input
              id="end_date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-black hover:bg-gray-800">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Campaign Details Modal Component
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
            setIsProcessing(false);
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
          } else {
            setIsProcessing(false);
            return;
          }
          break;
      }
      
      if (success) {
        onClose();
        setRejectionReason('');
      }
    } catch (error) {
      console.error('Action failed:', error);
      toast.error('Action failed. Please try again.');
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

          {/* Rejection Reason Input */}
          {campaign.status === 'pending' && (
            <div>
              <Label htmlFor="rejectionReason">Rejection Reason (if rejecting)</Label>
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

          <Button 
            variant="destructive" 
            onClick={() => handleAction('delete')}
            disabled={isProcessing}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdManagement({ user }) {
  const [campaigns, setCampaigns] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [billingRecords, setBillingRecords] = useState([]);
  const [filteredBillingRecords, setFilteredBillingRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [billingSearchTerm, setBillingSearchTerm] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditPeriodModalOpen, setIsEditPeriodModalOpen] = useState(false);
  const [isCreateCampaignModalOpen, setIsCreateCampaignModalOpen] = useState(false);
  const [adminVendor, setAdminVendor] = useState(null);

  const isMountedRef = useRef(true);

  const loadData = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setIsLoading(true);
    try {
      const [campaignsData, vendorsData, billingData] = await Promise.all([
        AdCampaign.list('-created_date').catch(() => []),
        Vendor.list().catch(() => []),
        CampaignBilling.list('-created_date').catch(() => [])
      ]);

      if (!isMountedRef.current) return;

      const vendorMap = new Map(vendorsData.map(v => [v.id, v]));
      const campaignMap = new Map(campaignsData.map(c => [c.id, c]));

      const enrichedCampaigns = campaignsData.map(c => ({
        ...c,
        vendor: vendorMap.get(c.vendor_id),
      }));

      const enrichedBillingRecords = billingData.map(b => ({
        ...b,
        campaign: campaignMap.get(b.campaign_id),
        vendor: vendorMap.get(b.vendor_id),
      }));

      setCampaigns(enrichedCampaigns);
      setVendors(vendorsData);
      setBillingRecords(enrichedBillingRecords);

      // Create or find admin vendor for campaign creation
      let adminVendorRecord = vendorsData.find(v => v.company_name === 'Platform Admin' && v.user_id === user.id);
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
      if (!isMountedRef.current || error.message?.includes('aborted')) return;
      console.error('Error loading ad management data:', error);
      toast.error('Failed to load ad data.');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user.id]);

  useEffect(() => {
    isMountedRef.current = true;
    loadData();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [loadData]);

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

  useEffect(() => {
    let filtered = billingRecords;
    if (billingSearchTerm) {
      filtered = filtered.filter(b =>
        b.invoice_number?.toLowerCase().includes(billingSearchTerm.toLowerCase()) ||
        b.campaign?.title.toLowerCase().includes(billingSearchTerm.toLowerCase()) ||
        b.vendor?.company_name.toLowerCase().includes(billingSearchTerm.toLowerCase())
      );
    }
    setFilteredBillingRecords(filtered);
  }, [billingRecords, billingSearchTerm]);

  const stats = useMemo(() => {
    const realVendors = vendors.filter(v => 
      v.company_name !== 'Platform Admin' && 
      v.user_id !== user?.id
    );
    
    return {
      totalRevenue: billingRecords.reduce((sum, record) => sum + (record.amount || 0), 0),
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      pendingCampaigns: campaigns.filter(c => c.status === 'pending').length,
      totalImpressions: campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0),
      totalClicks: campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0),
      ctr: campaigns.length > 0 ? 
        (campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0) / campaigns.reduce((sum, c) => sum + (c.impressions || 0), 1)) * 100 : 0,
      totalVendorBalance: realVendors.reduce((sum, vendor) => sum + (vendor.wallet_balance || 0), 0)
    };
  }, [campaigns, billingRecords, vendors, user]);

  const analyticsData = useMemo(() => {
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRevenue = billingRecords
        .filter(record => record.created_date && record.created_date.startsWith(dateStr))
        .reduce((sum, record) => sum + (record.amount || 0), 0);
      
      last30Days.push({
        date: dateStr,
        revenue: dayRevenue
      });
    }
    return last30Days;
  }, [billingRecords]);

  const handleStatusUpdate = async (campaignId, newStatus, reason) => {
    try {
      const updateData = { status: newStatus };
      if (reason) {
        updateData.rejection_reason = reason;
      }
      
      // Set start and end dates for approved campaigns
      if (newStatus === 'active') {
        const campaign = campaigns.find(c => c.id === campaignId);
        if (campaign && ['weekly', 'monthly'].includes(campaign.billing_model)) {
          if (!campaign.start_date) {
            updateData.start_date = new Date().toISOString();
          }
          if (!campaign.end_date) {
            const endDate = new Date();
            if (campaign.billing_model === 'weekly') {
              endDate.setDate(endDate.getDate() + 7);
            } else {
              endDate.setMonth(endDate.getMonth() + 1);
            }
            updateData.end_date = endDate.toISOString();
          }
        }
      }

      await AdCampaign.update(campaignId, updateData);
      
      toast.success(`Campaign ${newStatus === 'active' ? 'approved' : newStatus} successfully!`);
      loadData();
      return true;
    } catch (error) {
      console.error("Error updating campaign status:", error);
      toast.error("Failed to update campaign status.");
      return false;
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    try {
      await AdCampaign.delete(campaignId);
      toast.success("Campaign deleted successfully!");
      loadData();
      return true;
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast.error("Failed to delete campaign.");
      return false;
    }
  };

  const handleEditCampaignPeriod = (campaign) => {
    setSelectedCampaign(campaign);
    setIsEditPeriodModalOpen(true);
  };

  const handleSaveCampaignPeriod = async (campaignId, dates) => {
    try {
      await AdCampaign.update(campaignId, dates);
      toast.success("Campaign period updated successfully!");
      loadData();
      return true;
    } catch (error) {
      console.error("Error updating campaign period:", error);
      toast.error("Failed to update campaign period.");
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
    loadData();
    toast.success("Admin campaign created successfully!");
  };

  const openDetailsModal = (campaign) => {
    setSelectedCampaign(campaign);
    setIsDetailsModalOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Ad Management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Megaphone className="w-6 h-6 text-blue-600" />
                Ad Campaign Management
              </CardTitle>
              <p className="text-slate-600 mt-1">Manage vendor ad campaigns and track performance</p>
            </div>
            <Button
              onClick={handleCreateCampaign}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Admin Campaign
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-lg border-0 bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Revenue</p>
                <p className="text-3xl font-bold mt-2">₹{(stats.totalRevenue / 1000).toFixed(1)}k</p>
              </div>
              <DollarSign className="w-12 h-12 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Active Campaigns</p>
                <p className="text-3xl font-bold mt-2">{stats.activeCampaigns}</p>
              </div>
              <Activity className="w-12 h-12 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-500 to-pink-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Impressions</p>
                <p className="text-3xl font-bold mt-2">{(stats.totalImpressions / 1000).toFixed(1)}k</p>
              </div>
              <Eye className="w-12 h-12 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-500 to-red-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">CTR</p>
                <p className="text-3xl font-bold mt-2">{stats.ctr.toFixed(2)}%</p>
              </div>
              <TrendingUp className="w-12 h-12 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search campaigns or vendors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table - RESTORED PREVIOUS UI */}
      <Card>
        <CardHeader>
          <CardTitle>Campaigns ({filteredCampaigns.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No campaigns found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold text-sm text-slate-700 uppercase tracking-wider">Campaign & Vendor</th>
                    <th className="text-left p-4 font-semibold text-sm text-slate-700 uppercase tracking-wider">Billing Model</th>
                    <th className="text-left p-4 font-semibold text-sm text-slate-700 uppercase tracking-wider">Campaign Period</th>
                    <th className="text-left p-4 font-semibold text-sm text-slate-700 uppercase tracking-wider">Performance</th>
                    <th className="text-left p-4 font-semibold text-sm text-slate-700 uppercase tracking-wider">Status</th>
                    <th className="text-left p-4 font-semibold text-sm text-slate-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((campaign) => {
                    const StatusIcon = statusConfig[campaign.status]?.icon || Clock;
                    return (
                      <tr key={campaign.id} className="border-b hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div>
                            <p className="font-semibold text-slate-900">{campaign.title}</p>
                            <p className="text-sm text-slate-500">{campaign.vendor?.company_name || 'Unknown'}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-semibold text-slate-900">{campaign.billing_model?.toUpperCase()}</p>
                            {campaign.billing_model === 'cpc' && (
                              <p className="text-sm text-slate-500">₹{campaign.cpc_rate}/click</p>
                            )}
                            {campaign.billing_model === 'weekly' && campaign.weekly_fee && (
                              <p className="text-sm text-slate-500">₹{campaign.weekly_fee}/month</p>
                            )}
                            {campaign.billing_model === 'monthly' && campaign.monthly_fee && (
                              <p className="text-sm text-slate-500">₹{campaign.monthly_fee}/month</p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-slate-600">
                            {campaign.start_date && campaign.end_date ? (
                              <>
                                <Calendar className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm">
                                  {formatDate(campaign.start_date)} → {formatDate(campaign.end_date)}
                                </span>
                              </>
                            ) : (
                              <>
                                <Calendar className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm text-slate-400">Not scheduled</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-slate-700">
                            <p>Impressions: <span className="font-semibold">{(campaign.impressions || 0).toLocaleString()}</span></p>
                            <p>Clicks: <span className="font-semibold">{(campaign.clicks || 0).toLocaleString()}</span></p>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={statusConfig[campaign.status]?.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig[campaign.status]?.label}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDetailsModal(campaign)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              Review
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditCampaignPeriod(campaign)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing History & Invoices Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Billing History & Invoices
              </CardTitle>
              <p className="text-sm text-slate-600 mt-1">View and download records of campaign billings.</p>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search invoices..."
                value={billingSearchTerm}
                onChange={(e) => setBillingSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredBillingRecords.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No billing records found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold text-sm text-slate-700 uppercase tracking-wider">Invoice ID</th>
                    <th className="text-left p-4 font-semibold text-sm text-slate-700 uppercase tracking-wider">Campaign</th>
                    <th className="text-left p-4 font-semibold text-sm text-slate-700 uppercase tracking-wider">Vendor</th>
                    <th className="text-left p-4 font-semibold text-sm text-slate-700 uppercase tracking-wider">Amount</th>
                    <th className="text-left p-4 font-semibold text-sm text-slate-700 uppercase tracking-wider">Billing Date</th>
                    <th className="text-left p-4 font-semibold text-sm text-slate-700 uppercase tracking-wider">Status</th>
                    <th className="text-left p-4 font-semibold text-sm text-slate-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBillingRecords.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <p className="font-mono text-sm text-slate-700">{record.invoice_number || record.id.slice(-8).toUpperCase()}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-slate-900">{record.campaign?.title || 'N/A'}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-slate-700">{record.vendor?.company_name || 'Unknown'}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-slate-900">₹{(record.amount || 0).toLocaleString()}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-slate-700">{formatDate(record.created_date)}</p>
                      </td>
                      <td className="p-4">
                        <Badge className={billingStatusConfig[record.payment_status]?.color || 'bg-gray-100 text-gray-700'}>
                          {billingStatusConfig[record.payment_status]?.label || record.payment_status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Modals */}
      <CampaignDetailsModal
        campaign={selectedCampaign}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onStatusUpdate={handleStatusUpdate}
        onDelete={handleDeleteCampaign}
      />

      <EditCampaignPeriodModal
        campaign={selectedCampaign}
        isOpen={isEditPeriodModalOpen}
        onClose={() => setIsEditPeriodModalOpen(false)}
        onSave={handleSaveCampaignPeriod}
      />

      {adminVendor && (
        <Dialog open={isCreateCampaignModalOpen} onOpenChange={setIsCreateCampaignModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Admin Campaign</DialogTitle>
              <DialogDescription>
                Create a new ad campaign as Platform Admin
              </DialogDescription>
            </DialogHeader>
            <CreateCampaignForm
              vendor={adminVendor}
              onSuccess={handleCampaignCreated}
              onCancel={() => setIsCreateCampaignModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
