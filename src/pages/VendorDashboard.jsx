
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AdCampaign, Vendor, User, AdTransaction, CampaignBilling } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Megaphone,
  PlusCircle,
  Clock,
  PlayCircle,
  XCircle,
  AlertTriangle,
  CheckCircle,
  Eye,
  BarChart3,
  TrendingUp,
  Activity,
  Search,
  Shield,
  Wallet,
  IndianRupee, // Changed from DollarSign to IndianRupee
  Receipt,
  Calendar,
  FileText, // Import FileText
  BarChart2 // Import BarChart2
} from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import CreateCampaignForm from '../components/vendor/CreateCampaignForm';
import { Link } from 'react-router-dom'; // Import Link
import FinancialStatement from '../components/entity/FinancialStatement'; // Import FinancialStatement

const statusConfig = {
  pending: { label: 'Pending Approval', icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  active: { label: 'Live Campaign', icon: PlayCircle, color: 'bg-green-100 text-green-800 border-green-200' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'bg-red-100 text-red-800 border-red-200' },
  paused: { label: 'Paused', icon: AlertTriangle, color: 'bg-gray-100 text-gray-800 border-gray-200' },
  expired: { label: 'Expired', icon: AlertTriangle, color: 'bg-blue-100 text-blue-800 border-blue-200' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'bg-purple-100 text-purple-800 border-purple-200' },
};

function AddFundsModal({ vendor, onFundsAdded }) {
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddFunds = async () => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error("Please enter a valid amount greater than zero.");
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Update vendor's wallet balance
      const newBalance = (vendor.wallet_balance || 0) + numericAmount;
      await Vendor.update(vendor.id, { wallet_balance: newBalance });

      // 2. Create a transaction record for the top-up
      await AdTransaction.create({
        vendor_id: vendor.id,
        amount: numericAmount,
        transaction_type: 'cpc_top_up',
        payment_id: `wallet_top_up_${Date.now()}`
      });

      toast.success(`₹${numericAmount.toFixed(2)} added to your wallet!`);
      onFundsAdded();
    } catch (error) {
      console.error("Error adding funds:", error);
      toast.error("Failed to add funds. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Wallet className="w-6 h-6 text-purple-600" />
          Add Funds to Wallet
        </DialogTitle>
      </DialogHeader>
      <div className="py-4 space-y-4">
        <p>Your current balance is <strong className="text-purple-700">₹{(vendor.wallet_balance || 0).toFixed(2)}</strong>.</p>
        <div>
          <label htmlFor="amount" className="text-sm font-medium">Amount to Add (₹)</label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g., 5000"
            className="mt-2"
          />
        </div>
        <Button onClick={handleAddFunds} disabled={isProcessing || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0} className="w-full bg-gradient-to-r from-purple-600 to-blue-600">
          {isProcessing ? "Processing..." : `Add ₹${parseFloat(amount || 0).toFixed(2)} to Wallet`}
        </Button>
        <p className="text-xs text-gray-500 text-center">This simulates a secure payment process. No real money will be charged.</p>
      </div>
    </DialogContent>
  );
}

function AnalyticsModal({ campaign }) {
  if (!campaign) return null;

  const ctr = campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0;
  const totalSpend = campaign.revenue_generated || 0;

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-blue-600" />
          Campaign Analytics: {campaign.title}
        </DialogTitle>
        <DialogDescription>
          Performance overview for your ad campaign.
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-4 pt-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Impressions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(campaign.impressions || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total times ad was shown</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(campaign.clicks || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total clicks on ad</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Click-Through Rate (CTR)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ctr.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">Clicks per 100 impressions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Based on clicks/fees</p>
          </CardContent>
        </Card>
      </div>
    </DialogContent>
  );
}

// Add EditCampaignModal component
function EditCampaignModal({ campaign, vendor, isOpen, onClose, onSuccess }) {
  if (!campaign || !isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-blue-600" />
            Edit Campaign: {campaign.title}
          </DialogTitle>
          <DialogDescription>
            Make changes to your campaign. It will need admin re-approval after editing.
          </DialogDescription>
        </DialogHeader>
        <CreateCampaignForm 
          vendor={vendor}
          editingCampaign={campaign}
          onSuccess={() => {
            onSuccess();
            onClose();
          }}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}


export default function VendorDashboard() {
  const [user, setUser] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [vendors, setVendors] = useState([]); // State for all vendors, used by admin
  const [campaigns, setCampaigns] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [billingRecords, setBillingRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminView, setIsAdminView] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false); // New state for analytics modal
  const [testVendorId, setTestVendorId] = useState(null);
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // New state for edit modal
  const [editingCampaign, setEditingCampaign] = useState(null); // New state for editing campaign
  const [activeTab, setActiveTab] = useState('overview'); // Default to overview tab

  const isMountedRef = useRef(true);

  // Add vendor wallet stats for SuperAdmin view - FIXED TO EXCLUDE ADMIN VENDORS
  const vendorWalletStats = useMemo(() => {
    if (!isAdminView || !Array.isArray(vendors)) return { totalBalance: 0, totalVendors: 0 };
    
    // Filter out admin/test vendors from the calculation
    const realVendors = vendors.filter(v => {
      // Exclude Platform Admin, Test Vendor, and any vendor created by admin users
      const isTestOrAdminVendor = v.company_name === 'Platform Admin' || 
                           v.company_name === 'Test Vendor (SuperAdmin)' ||
                           v.user_id === user?.id; // Exclude vendors owned by the current user if they are an admin
      return !isTestOrAdminVendor;
    });
    
    const totalBalance = realVendors.reduce((sum, v) => sum + (v.wallet_balance || 0), 0);
    const totalVendors = realVendors.length;
    
    return { totalBalance, totalVendors };
  }, [isAdminView, vendors, user]);

  const loadData = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setIsLoading(true);
    try {
      const currentUser = await User.me().catch((error) => {
        // If request was aborted, don't re-throw or toast
        if (error.message?.includes('aborted')) throw error;
        throw error;
      });
      
      if (!isMountedRef.current) return; // Check again after await
      setUser(currentUser);

      const isAdmin = ['admin', 'super_admin'].includes(currentUser.app_role);
      setIsAdminView(isAdmin);

      if (isAdmin) {
        const [allCampaigns, allVendors, allTransactions, allBillingRecords] = await Promise.all([
          AdCampaign.list('-created_date').catch((error) => {
            if (error.message?.includes('aborted')) return [];
            console.error("Error loading campaigns:", error);
            return [];
          }),
          Vendor.list().catch((error) => {
            if (error.message?.includes('aborted')) return [];
            console.error("Error loading vendors:", error);
            return [];
          }),
          AdTransaction.list().catch((error) => {
            if (error.message?.includes('aborted')) return [];
            console.error("Error loading transactions:", error);
            return [];
          }),
          CampaignBilling.list('-created_date').catch((error) => {
            if (error.message?.includes('aborted')) return [];
            console.error("Error loading billing:", error);
            return [];
          })
        ]);

        if (!isMountedRef.current) return; // Check again after Promise.all

        const vendorMap = new Map(allVendors.map(v => [v.id, v]));
        const enrichedCampaigns = allCampaigns.map(c => ({
          ...c,
          vendor: vendorMap.get(c.vendor_id),
          // Ensure these fields exist for display, default to 0/empty if not present
          impressions: c.impressions || 0,
          clicks: c.clicks || 0,
          revenue_generated: c.revenue_generated || 0,
          cpc_rate: c.cpc_rate || 0,
          weekly_fee: c.weekly_fee || 0,
          monthly_fee: c.monthly_fee || 0,
          total_budget: c.total_budget || null, // New: for budget tracking
          daily_budget: c.daily_budget || null, // New: for budget tracking
          spent_today: c.spent_today || 0, // New: for daily budget tracking
          target_sectors: c.target_sectors || [], // New: for displaying targeting
          target_stocks: c.target_stocks || [], // New: for displaying targeting
          placement_locations: c.placement_locations || [], // New: for displaying targeting
          is_edited: c.is_edited || false, // New: for indicating pending review after edit
        }));
        setCampaigns(enrichedCampaigns);
        setVendors(allVendors); // Store all vendors for admin wallet overview
        setTransactions(allTransactions);
        setBillingRecords(allBillingRecords);

        // Create or find a test vendor for SuperAdmin campaign creation
        let testVendor = allVendors.find(v => v.company_name === 'Test Vendor (SuperAdmin)');
        if (!testVendor) {
          testVendor = await Vendor.create({
            user_id: currentUser.id,
            company_name: 'Test Vendor (SuperAdmin)',
            website: 'https://test-vendor.example.com',
            status: 'approved',
            wallet_balance: 0
          });
        }
        if (!isMountedRef.current) return;
        setTestVendorId(testVendor.id);

      } else if (currentUser.app_role === 'vendor') {
        // Vendor: Load only their own data
        const vendors = await Vendor.filter({ user_id: currentUser.id }).catch((error) => {
          if (error.message?.includes('aborted')) return [];
          throw error;
        });
        
        if (!isMountedRef.current) return; // Check again after await
        
        if (vendors.length === 0) {
          toast.error("Vendor profile not found. Please contact support.");
          // If the component unmounted during the toast call
          if (!isMountedRef.current) return;
          setIsLoading(false);
          return;
        }
        const vendorProfile = vendors[0];
        
        // Ensure wallet_balance exists, if not initialize it
        if (vendorProfile.wallet_balance === undefined || vendorProfile.wallet_balance === null) {
          await Vendor.update(vendorProfile.id, { wallet_balance: 0 });
          vendorProfile.wallet_balance = 0;
        }

        if (!isMountedRef.current) return;
        setVendor(vendorProfile);

        const [vendorCampaigns, vendorTransactions, vendorBillingRecords] = await Promise.all([
          AdCampaign.filter({ vendor_id: vendorProfile.id }, '-created_date').catch((error) => {
            if (error.message?.includes('aborted')) return [];
            console.error("Error loading vendor campaigns:", error);
            return [];
          }),
          AdTransaction.filter({ vendor_id: vendorProfile.id }, '-created_date').catch((error) => {
            if (error.message?.includes('aborted')) return [];
            console.error("Error loading vendor transactions:", error);
            return [];
          }),
          CampaignBilling.filter({ vendor_id: vendorProfile.id }, '-created_date').catch((error) => {
            if (error.message?.includes('aborted')) return [];
            console.error("Error loading vendor billing:", error);
            return [];
          })
        ]);

        if (!isMountedRef.current) return; // Check again after Promise.all

        const enrichedVendorCampaigns = vendorCampaigns.map(c => ({
          ...c,
          impressions: c.impressions || 0,
          clicks: c.clicks || 0,
          revenue_generated: c.revenue_generated || 0,
          cpc_rate: c.cpc_rate || 0,
          weekly_fee: c.weekly_fee || 0,
          monthly_fee: c.monthly_fee || 0,
          total_budget: c.total_budget || null, // New
          daily_budget: c.daily_budget || null, // New
          spent_today: c.spent_today || 0, // New
          target_sectors: c.target_sectors || [], // New
          target_stocks: c.target_stocks || [], // New
          placement_locations: c.placement_locations || [], // New
          is_edited: c.is_edited || false, // New
        }));

        setCampaigns(enrichedVendorCampaigns);
        setTransactions(vendorTransactions);
        setBillingRecords(vendorBillingRecords);
      } else {
        // Other roles should not be here, redirect just in case
        window.location.href = createPageUrl('Dashboard');
        return;
      }

    } catch (error) {
      if (!isMountedRef.current || error.message?.includes('aborted')) {
        // Request was aborted or component unmounted, do nothing.
        return;
      }
      console.error("Error loading data:", error);
      toast.error("Failed to load dashboard data.");
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

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
        (c.vendor?.company_name && c.vendor.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredCampaigns(filtered);
  }, [campaigns, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    return {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      pendingCampaigns: campaigns.filter(c => c.status === 'pending').length,
      totalImpressions: campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0),
      totalClicks: campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0),
    };
  }, [campaigns]);

  const handleCampaignCreate = () => {
    setIsCreateModalOpen(false);
    loadData();
    setActiveTab('campaigns'); // Switch to campaigns tab after creation
    if (isAdminView) {
      toast.success("Test campaign created! You can now approve it in the Ad Management section.");
    } else {
      toast.success("Campaign created successfully! It is now pending approval.");
    }
  };

  const onFundsAdded = () => { // Renamed from handleFundsAdded to onFundsAdded
    setIsAddFundsModalOpen(false);
    loadData();
  };

  const openDetailsModal = (campaign) => {
    setSelectedCampaign(campaign);
    setIsDetailsModalOpen(true);
  };

  const handleEditCampaign = (campaign) => {
    setEditingCampaign(campaign);
    setIsEditModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Loading Vendor Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-700">Access denied. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {isAdminView ? 'Ad Campaign Overview' : 'Vendor Dashboard'}
              </h1>
              <p className="text-blue-100">
                {isAdminView ? 'Monitor all vendor advertising campaigns' : 'Manage your advertising campaigns and track performance'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-80">Welcome back,</div>
              <div className="text-xl font-semibold">{user.display_name}</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-transparent p-1 rounded-xl gap-2">
            <TabsTrigger 
              value="overview" 
              className="whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 h-12 px-6 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-3 py-3 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              <BarChart3 className="w-5 h-5" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="campaigns" 
              className="whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 h-12 px-6 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-3 py-3 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              <Megaphone className="w-5 h-5" />
              My Campaigns
            </TabsTrigger>
            <TabsTrigger 
              value="financials" 
              className="whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 h-12 px-6 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-3 py-3 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              <Receipt className="w-5 h-5" />
              Financials
            </TabsTrigger>
            <TabsTrigger 
              value="create" 
              className="whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 h-12 px-6 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-3 py-3 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              <PlusCircle className="w-5 h-5" />
              Create Campaign
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab Content */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="shadow-md border-0 bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <BarChart3 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Campaigns</p>
                      <p className="text-2xl font-bold text-gray-800">{stats.totalCampaigns}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md border-0 bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Activity className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Active Campaigns</p>
                      <p className="text-2xl font-bold text-gray-800">{stats.activeCampaigns}</p>
                      <p className="text-xs text-gray-400">{stats.pendingCampaigns} pending approval</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md border-0 bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Eye className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Impressions</p>
                      <p className="text-2xl font-bold text-gray-800">{(stats.totalImpressions || 0).toLocaleString()}</p>
                      <p className="text-xs text-gray-400">{(stats.totalClicks || 0).toLocaleString()} clicks</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Wallet Balance Card - Show appropriate version based on role */}
              {isAdminView ? (
                // SuperAdmin view - Show REAL vendor wallet overview (EXCLUDING ADMIN VENDORS)
                <Card className="shadow-md border-0 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-100 rounded-lg">
                        <Wallet className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Vendor Balance</p>
                        <p className="text-2xl font-bold text-gray-800">₹{vendorWalletStats.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-xs text-gray-400">{vendorWalletStats.totalVendors} real vendors</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : vendor ? (
                // Vendor view - Show their own wallet
                <Card className="shadow-md border-0 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <Wallet className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Wallet Balance</p>
                          <p className="text-2xl font-bold text-gray-800">₹{(vendor.wallet_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setIsAddFundsModalOpen(true)}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    >
                      <IndianRupee className="w-4 h-4 mr-2" /> {/* Changed to IndianRupee icon */}
                      Add Funds
                    </Button>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </TabsContent>

          {/* My Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mt-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                <Button
                  variant={statusFilter === 'all' ? "default" : "outline"}
                  onClick={() => setStatusFilter('all')}
                  className={`flex items-center gap-2 ${statusFilter === 'all' ? 'bg-gray-700 text-white' : ''}`}
                >
                  All
                </Button>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
                    className={`flex items-center gap-2 ${statusFilter === status ? 'bg-gray-700 text-white' : ''}`}
                  >
                    <config.icon className="w-4 h-4" />
                    {config.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Campaigns Table */}
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader>
                <CardTitle>Your Campaigns</CardTitle>
                <CardDescription>Manage and monitor your campaign performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left">Campaign</th>
                        {isAdminView && <th className="px-6 py-3 text-left">Vendor</th>}
                        <th className="px-6 py-3 text-left">Billing Model</th>
                        <th className="px-6 py-3 text-left">Campaign Period</th>
                        <th className="px-6 py-3 text-left">Budget Status</th>
                        <th className="px-6 py-3 text-left">Performance</th>
                        <th className="px-6 py-3 text-left">Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr><td colSpan={isAdminView ? "8" : "7"} className="text-center p-8">Loading campaigns...</td></tr>
                      ) : filteredCampaigns.length === 0 ? (
                        <tr><td colSpan={isAdminView ? "8" : "7"} className="text-center p-8">
                            <div className="flex flex-col items-center">
                              <Megaphone className="w-12 h-12 text-gray-400 mb-4" />
                              <h3 className="lg:text-lg font-semibold text-gray-600">No Campaigns Found</h3>
                              <p className="text-gray-500 mb-4">{isAdminView ? "No vendors have created campaigns yet." : "Create your first campaign to get started!"}</p>
                              <Button 
                                onClick={() => setActiveTab('create')} // Go to create tab
                                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2"
                              >
                                Create Campaign
                              </Button>
                            </div>
                          </td></tr>
                      ) : filteredCampaigns.map((campaign) => {
                        const StatusIcon = statusConfig[campaign.status]?.icon || Clock;
                        const budgetProgress = campaign.total_budget ? 
                          (((campaign.revenue_generated || 0) / campaign.total_budget) * 100) : 0;
                        const dailyBudgetProgress = campaign.daily_budget ? 
                          (((campaign.spent_today || 0) / campaign.daily_budget) * 100) : 0;
                        
                        return (
                          <tr key={campaign.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="font-semibold">{campaign.title}</div>
                              <div className="text-xs text-gray-500 flex gap-2 flex-wrap mt-1">
                                {campaign.target_sectors?.length > 0 && (
                                  <span>🎯 {campaign.target_sectors.slice(0,2).join(', ')}</span>
                                )}
                                {campaign.target_stocks?.length > 0 && (
                                  <span>📈 {campaign.target_stocks.slice(0,2).join(', ')}</span>
                                )}
                              </div>
                              <div className="text-xs text-blue-600 mt-1">
                                📍 {campaign.placement_locations?.join(', ') || 'Global'}
                              </div>
                            </td>
                            {isAdminView && <td className="px-6 py-4">{campaign.vendor?.company_name || 'N/A'}</td>}
                            <td className="px-6 py-4">
                              <div className="font-medium capitalize">{campaign.billing_model}</div>
                              <div className="text-xs text-gray-500 font-mono">
                                {campaign.billing_model === 'cpc' && `₹${(campaign.cpc_rate || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/click`}
                                {campaign.billing_model === 'weekly' && `₹${(campaign.weekly_fee || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/week`}
                                {campaign.billing_model === 'monthly' && `₹${(campaign.monthly_fee || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/month`}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Calendar className="w-3 h-3" />
                                {campaign.start_date && campaign.end_date ? (
                                  <>
                                    {new Date(campaign.start_date).toLocaleDateString()} → {new Date(campaign.end_date).toLocaleDateString()}
                                  </>
                                ) : (
                                  <span className="text-gray-400">Not scheduled</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {campaign.billing_model === 'cpc' && (campaign.total_budget || campaign.daily_budget) ? (
                                <div className="space-y-1">
                                  {campaign.total_budget && (
                                    <div>
                                      <div className="text-xs text-gray-500">Total: ₹{(campaign.revenue_generated || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} / ₹{campaign.total_budget.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                          className={`h-2 rounded-full ${budgetProgress >= 90 ? 'bg-red-500' : budgetProgress >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                          style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  )}
                                  {campaign.daily_budget && (
                                    <div>
                                      <div className="text-xs text-gray-500">Today: ₹{(campaign.spent_today || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} / ₹{campaign.daily_budget.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                                      <div className="w-full bg-gray-200 rounded-full h-1">
                                        <div
                                          className={`h-1 rounded-full ${dailyBudgetProgress >= 90 ? 'bg-red-500' : dailyBudgetProgress >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                          style={{ width: `${Math.min(dailyBudgetProgress, 100)}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">Not Applicable</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-xs">Impressions: {(campaign.impressions || 0).toLocaleString()}</div>
                              <div className="text-xs">Clicks: {(campaign.clicks || 0).toLocaleString()}</div>
                              <div className="text-xs">Revenue: ₹{(campaign.revenue_generated || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge className={`${statusConfig[campaign.status]?.color} flex items-center gap-1 w-fit`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig[campaign.status]?.label}
                              </Badge>
                              {campaign.is_edited && (
                                <div className="text-xs text-orange-600 mt-1">Edited - Pending Review</div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" size="sm" onClick={() => { setSelectedCampaign(campaign); setIsDetailsModalOpen(true); }}>
                                      <Eye className="w-4 h-4 mr-1" />
                                      Details
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => { setSelectedCampaign(campaign); setIsAnalyticsModalOpen(true); }}>
                                      <BarChart3 className="w-4 h-4 mr-1" />
                                      Analytics
                                  </Button>
                                  {!isAdminView && campaign.status !== 'active' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditCampaign(campaign)}
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      Edit
                                    </Button>
                                  )}
                                </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financials Tab */}
          <TabsContent value="financials" className="mt-6">
            {vendor && ( // Render FinancialStatement only if vendor profile is loaded for non-admin
              <FinancialStatement 
                entityType="vendor"
                entityId={vendor?.id}
                entityName={vendor?.company_name || 'Vendor'}
                transactions={transactions}
                billingRecords={billingRecords}
              />
            )}
            {!vendor && !isAdminView && (
              <p className="text-gray-500 text-center p-8">Vendor profile not found to display financial statements.</p>
            )}
            {isAdminView && (
              <p className="text-gray-500 text-center p-8">Financial statements for specific vendors are available through the Vendor's dashboard. This view does not show aggregated financial data.</p>
            )}
          </TabsContent>

          {/* Create Campaign Tab */}
          <TabsContent value="create" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white p-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="w-6 h-6 text-purple-600" />
                  {isAdminView ? "Create Test Ad Campaign" : "Launch a New Ad Campaign"}
                </CardTitle>
                <CardDescription>
                  {isAdminView ? "Create a test campaign for debugging or demonstration purposes." : "Fill in the details below to create your ad campaign. It will be reviewed by an administrator before going live."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg"
                >
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Start New Campaign Form
                </Button>
                <p className="text-sm text-gray-500 mt-4">Click the button above to open the campaign creation form in a new window.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modals - Kept outside Tabs for consistent behavior */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Megaphone className="w-6 h-6 text-purple-600" />
                {isAdminView ? "Create Test Ad Campaign" : "Create New Ad Campaign"}
              </DialogTitle>
              <DialogDescription>
                {isAdminView ? "Use this form to create a campaign that will automatically be approved for testing purposes." : "Fill out the details for your new ad campaign. It will be reviewed by an administrator before going live."}
              </DialogDescription>
            </DialogHeader>
            <CreateCampaignForm 
              vendor={isAdminView ? { id: testVendorId, wallet_balance: 9999999 } : vendor}
              onSuccess={handleCampaignCreate}
              onCancel={() => setIsCreateModalOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Add Funds Modal */}
        {!isAdminView && vendor && (
          <Dialog open={isAddFundsModalOpen} onOpenChange={setIsAddFundsModalOpen}>
            <AddFundsModal 
              vendor={vendor} 
              onFundsAdded={onFundsAdded}
            />
          </Dialog>
        )}

        {/* Campaign Details Modal */}
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="max-w-2xl">
            {selectedCampaign && (
              <>
                <DialogHeader>
                  <DialogTitle>Campaign Details: {selectedCampaign.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                  <Card>
                    <CardContent className="p-4">
                      {selectedCampaign.creative_url ? (
                        <img 
                          src={selectedCampaign.creative_url} 
                          alt={selectedCampaign.title} 
                          className="rounded-lg w-full object-contain max-h-64" 
                        />
                      ) : (
                        <div className="flex items-center justify-center h-48 bg-gray-100 text-gray-500 rounded-lg">
                          No creative image available
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 text-sm">Description:</p>
                      <p className="font-semibold">{selectedCampaign.description}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">CTA Link:</p>
                      {selectedCampaign.cta_link ? (
                        <a href={selectedCampaign.cta_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">
                          {selectedCampaign.cta_link}
                        </a>
                      ) : (
                        <p className="text-gray-500">N/A</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 text-sm">Status:</p> 
                      <Badge className={`ml-0 ${statusConfig[selectedCampaign.status]?.color}`}>
                        {statusConfig[selectedCampaign.status]?.label}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Billing Model:</p>
                      <p className="font-semibold capitalize">{selectedCampaign.billing_model}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-gray-500 text-sm">Impressions:</p>
                      <p className="font-semibold">{(selectedCampaign.impressions || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Clicks:</p>
                      <p className="font-semibold">{(selectedCampaign.clicks || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Revenue:</p>
                      <p className="font-semibold">₹{(selectedCampaign.revenue_generated || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 text-sm">Campaign Period:</p>
                      <p className="font-semibold">
                        {selectedCampaign.start_date && selectedCampaign.end_date ? 
                          `${new Date(selectedCampaign.start_date).toLocaleDateString()} → ${new Date(selectedCampaign.end_date).toLocaleDateString()}` : 
                          'Not scheduled'}
                      </p>
                    </div>
                    {/* Display billing model specific rates if available */}
                    {selectedCampaign.billing_model === 'cpc' && (
                      <div>
                        <p className="text-gray-500 text-sm">CPC Rate:</p>
                        <p className="font-semibold">₹{(selectedCampaign.cpc_rate || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/click</p>
                      </div>
                    )}
                    {selectedCampaign.billing_model === 'weekly' && (
                      <div>
                        <p className="text-gray-500 text-sm">Weekly Fee:</p>
                        <p className="font-semibold">₹{(selectedCampaign.weekly_fee || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/week</p>
                      </div>
                    )}
                    {selectedCampaign.billing_model === 'monthly' && (
                      <div>
                        <p className="text-gray-500 text-sm">Monthly Fee:</p>
                        <p className="font-semibold">₹{(selectedCampaign.monthly_fee || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/month</p>
                      </div>
                    )}
                  </div>
                  {/* Targeting Details */}
                  {(selectedCampaign.target_sectors?.length > 0 || selectedCampaign.target_stocks?.length > 0 || selectedCampaign.placement_locations?.length > 0) && (
                    <>
                      <h4 className="font-semibold mt-4 text-md">Targeting</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedCampaign.target_sectors?.length > 0 && (
                          <div>
                            <p className="text-gray-500 text-sm">Target Sectors:</p>
                            <p className="font-semibold">{selectedCampaign.target_sectors.join(', ')}</p>
                          </div>
                        )}
                        {selectedCampaign.target_stocks?.length > 0 && (
                          <div>
                            <p className="text-gray-500 text-sm">Target Stocks:</p>
                            <p className="font-semibold">{selectedCampaign.target_stocks.join(', ')}</p>
                          </div>
                        )}
                        {selectedCampaign.placement_locations?.length > 0 && (
                          <div>
                            <p className="text-gray-500 text-sm">Placement Locations:</p>
                            <p className="font-semibold">{selectedCampaign.placement_locations.join(', ')}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Campaign Analytics Modal */}
        <Dialog open={isAnalyticsModalOpen} onOpenChange={setIsAnalyticsModalOpen}>
            <AnalyticsModal campaign={selectedCampaign} />
        </Dialog>

        {/* Edit Campaign Modal */}
        <EditCampaignModal
          campaign={editingCampaign}
          vendor={vendor} // Pass the current vendor (or test vendor for admin)
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingCampaign(null);
          }}
          onSuccess={loadData}
        />
      </div>
    </div>
  );
}
