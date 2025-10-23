
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User, Investor, FundAllocation } from '@/api/entities';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Wallet,
  Download,
  FileText,
  UserCircle,
  ChevronDown,
  Shield,
  CheckCircle,
  Clock,
  LogOut,
  Home
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function InvestorLayout({ children, currentView }) { // Changed activePage to currentView
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [investor, setInvestor] = useState(null);
  const [investorStatus, setInvestorStatus] = useState('inactive');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadInvestorData = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);

        const investors = await Investor.filter({ user_id: currentUser.id });
        if (investors.length === 0) {
          toast.error('No investor profile found');
          navigate(createPageUrl('Dashboard'));
          return;
        }

        const investorData = investors[0];
        setInvestor(investorData);

        // Check allocations to determine status
        const allocations = await FundAllocation.filter({ investor_id: investorData.id });
        const hasActiveInvestments = allocations.some(a => a.status === 'active' && (a.total_invested || 0) > 0);
        setInvestorStatus(hasActiveInvestments ? 'active' : 'inactive');
      } catch (error) {
        console.error('Error loading investor:', error);
        toast.error('Failed to load investor profile');
        navigate(createPageUrl('Dashboard'));
      } finally {
        setIsLoading(false);
      }
    };

    loadInvestorData();
  }, [navigate]);

  // Modified navigationItems to include 'id' and 'badge' properties
  const navigationItems = [
    { id: 'wallet', path: 'InvestorDashboard_Wallet', label: 'Wallet', icon: Wallet, badge: 3 },
    { id: 'payouts', path: 'InvestorDashboard_Payouts', label: 'Payouts', icon: Download, badge: 1 },
    { id: 'reports', path: 'InvestorDashboard_Reports', label: 'Reports', icon: FileText, badge: 0 },
    { id: 'profile', path: 'InvestorDashboard_Profile', label: 'Profile', icon: UserCircle, badge: 0 },
  ];

  const handleLogout = async () => {
    try {
      await User.logout();
      navigate(createPageUrl('Login')); // Redirect to login after logout
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  const handleBackToDashboard = () => {
    navigate(createPageUrl('Dashboard'));
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Sidebar */}
      <aside className="w-72 bg-white/80 backdrop-blur-sm border-r border-slate-200 flex flex-col shadow-xl">
        {/* Logo Section */}
        <div className="h-20 flex items-center justify-center border-b border-slate-200 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-7 h-7" />
            Investor Portal
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button // Changed Link to button
                key={item.id}
                onClick={() => navigate(createPageUrl(item.path))} // Use navigate for internal routing
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                    : 'text-slate-600 hover:bg-white/60 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <Badge className="bg-red-500 text-white text-xs px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center animate-pulse">
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer - Back to Main Dashboard */}
        <div className="p-4 border-t border-slate-200 space-y-3">
          <button
            onClick={handleBackToDashboard}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
          >
            <Home className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Main Dashboard</span>
          </button>
          
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68bb21f4e5ccdcab161121f6/1dc7cf9b7_FinancialNetworkingLogoProtocol.png"
            alt="Protocol Logo"
            className="w-full"
          />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Investment Dashboard</h1>
            <p className="text-sm text-slate-500">Manage your portfolio</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Status Badge */}
            <Badge className={investorStatus === 'active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}>
              {investorStatus === 'active' ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 mr-1" />
                  Inactive
                </>
              )}
            </Badge>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-all">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={investor?.profile_image_url} alt={investor?.full_name} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      {investor?.full_name?.charAt(0) || 'I'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-semibold text-slate-900">{investor?.full_name}</p>
                    <p className="text-xs text-slate-500">{investor?.investor_code}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Investor Details</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <div className="px-2 py-3 space-y-3">
                  <div>
                    <p className="text-xs text-slate-500">Full Name</p>
                    <p className="font-medium text-sm">{investor?.full_name}</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="font-medium text-sm">{investor?.email}</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="font-medium text-sm">{investor?.mobile_number || 'Not provided'}</p>
                  </div>

                  {investor?.bank_account_number && (
                    <div>
                      <p className="text-xs text-slate-500">Bank Account</p>
                      <p className="font-medium text-sm">****{investor.bank_account_number.slice(-4)}</p>
                      <p className="text-xs text-slate-500">{investor.bank_name} - {investor.bank_ifsc_code}</p>
                    </div>
                  )}

                  {investor?.upi_id && (
                    <div>
                      <p className="text-xs text-slate-500">UPI ID</p>
                      <p className="font-medium text-sm">{investor.upi_id}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-slate-500">Profit Distribution</p>
                    <p className="font-medium text-sm capitalize">{investor?.profit_distribution_plan || 'Not set'}</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">KYC Status</p>
                    <Badge className={investor?.kyc_status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {investor?.kyc_status || 'Pending'}
                    </Badge>
                  </div>
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
