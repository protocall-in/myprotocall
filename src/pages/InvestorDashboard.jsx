
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Investor, FundAllocation, FundWallet, FundPayoutRequest, FundTransaction, FundPlan, FundInvoice, FundWithdrawalRequest, InvestmentRequest, Notification, InvestorRequest, InvestmentAllocation } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from
  '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from
  '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from
  "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from
  '@/components/ui/select';
import {
  Wallet,
  Download,
  FileText,
  UserCircle,
  Shield,
  CheckCircle,
  Clock,
  LogOut,
  Home,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  IndianRupee, // Changed from DollarSign to IndianRupee
  ArrowUpRight,
  ArrowDownRight,
  Edit,
  Phone,
  Mail,
  CreditCard,
  Smartphone,
  LifeBuoy,
  Activity,
  Target,
  PieChart as PieChartIcon,
  XCircle,
  UserCheck,
  AlertCircle,
  User as UserIcon, // Renamed to avoid conflict with User entity
  BarChart3, // Added for DashboardHomeView card
  Plus, // Added for BrowseFundPlansView
  Calendar, // Added for BrowseFundPlansView
  AlertTriangle, // Added for KYC Status in ProfileDropdown
  Send, // Added for WalletView payout button
  Settings, // Added for ProfileDropdownMenu
  Users, // Added for BrowseFundPlansView AUM
  Briefcase, // Added for BrowseFundPlansView existing investment display
  Layers, // Added for AllocationsView Units Held
  History, // Added for AllocationsView Transaction History
  ArrowDownLeft // Added for AllocationsView Transaction History (redemption)
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import PayoutRequestModal from '../components/investor/PayoutRequestModal';
import PaymentModal from '../components/investor/PaymentModal';
import WithdrawalRequestModal from '../components/investor/WithdrawalRequestModal';
import NotificationBell from '../components/investor/NotificationBell';
import { usePageNotifications } from '../components/hooks/usePageNotifications';
import { useConfirm } from '../components/hooks/useConfirm';
import { Skeleton } from '@/components/ui/skeleton'; // Added Skeleton import

function ProfileDropdown({ investor, onLogout, onNavigate }) {
  const getKYCStatusDisplay = () => {
    switch (investor?.kyc_status) {
      case 'verified':
        return (
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium">KYC: Verified</span>
          </div>);

      case 'pending':
        return (
          <div className="flex items-center gap-2 text-yellow-700">
            <Clock className="w-4 h-4" />
            <span className="font-medium">KYC: Pending Verification</span>
          </div>);

      case 'failed':
        return (
          <div className="flex items-center gap-2 text-red-700">
            <XCircle className="w-4 h-4" />
            <span className="font-medium">KYC: Rejected (Please re-upload)</span>
          </div>);

      default:
        return (
          <div className="flex items-center gap-2 text-gray-700">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">KYC: Not Submitted</span>
          </div>);

    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:bg-blue-50">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
            {investor?.full_name?.charAt(0)?.toUpperCase() || 'I'}
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm">{investor?.full_name || 'Investor'}</p>
            <p className="text-xs text-slate-500">{investor?.investor_code}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-3 py-2 border-b">
          <p className="font-semibold text-sm">{investor?.full_name}</p>
          <p className="text-xs text-slate-500">{investor?.investor_code}</p>
          <p className="text-xs text-slate-500 mt-1">{investor?.email}</p>
        </div>

        <div className="px-3 py-2 border-b bg-slate-50">
          {getKYCStatusDisplay()}
        </div>

        {/* Show rejection reason if failed */}
        {investor?.kyc_status === 'failed' && investor?.kyc_rejection_reason &&
          <div className="px-3 py-2 bg-red-50 border-b border-red-200">
            <p className="text-xs font-semibold text-red-900 mb-1">Rejection Reason:</p>
            <p className="text-xs text-red-800">{investor.kyc_rejection_reason}</p>
          </div>
        }

        <DropdownMenuItem onClick={() => onNavigate('profile')}>
          <UserIcon className="w-4 h-4 mr-2" />
          My Profile
        </DropdownMenuItem>

        {/* Removed 'Settings' item as no corresponding view or functionality exists */}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onLogout} className="text-red-600 cursor-pointer">
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>);

}

// Layout component to wrap the specific views
function InvestorLayout({
  investor,
  currentView,
  onNavigate,
  navigationItems,
  pendingInvestments,
  investorStatus,
  fundPlansMap,
  children
}) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Enhanced Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-lg">
        {/* Gradient Header Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-6 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>

          {/* Title */}
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white tracking-tight">Investor Portfolio</h2>
            <p className="text-blue-100 text-sm mt-1">Fund Management System</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          {/* Dashboard Home Button */}
          <button
            onClick={() => onNavigate('home')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-6 ${currentView === 'home'
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
              : 'hover:bg-slate-100 text-slate-700'
              }`
            }
            style={{ fontSize: '16px', fontWeight: 500 }}>

            <Home className="w-5 h-5" />
            <span>Dashboard</span>
          </button>

          {/* Pending Investments Alert */}
          {pendingInvestments.length > 0 &&
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold text-yellow-900">Pending Investments</span>
              </div>
              <p className="text-xs text-yellow-800 mb-2">
                {pendingInvestments.length} investment{pendingInvestments.length > 1 ? 's' : ''} awaiting allocation
              </p>
              <div className="space-y-1">
                {pendingInvestments.map((req) =>
                  <div key={req.id} className="text-xs bg-white rounded px-2 py-1 flex justify-between items-center">
                    <span className="flex-1">
                      <span className="font-semibold">{fundPlansMap[req.fund_plan_id]?.plan_name || 'Unknown Plan'}</span>
                      <span className="block text-slate-500 mt-0.5">₹{req.requested_amount.toLocaleString('en-IN')}</span>
                    </span>
                    <Badge className="bg-yellow-100 text-yellow-800 text-[10px] h-4">Pending</Badge>
                  </div>
                )}
              </div>
            </div>
          }

          {/* Divider */}
          <div className="border-t border-slate-200 mb-4"></div>

          {/* Menu Items with Standardized Styling */}
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = currentView === item.view;
              const Icon = item.icon;

              return (
                <button
                  key={item.view}
                  onClick={() => onNavigate(item.view)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'hover:bg-slate-100 text-slate-700'
                    }`
                  }
                  style={{ fontSize: '16px', fontWeight: 500 }}>

                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge > 0 &&
                    <Badge className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {item.badge}
                    </Badge>
                  }
                </button>);

            })}
          </div>
        </nav>

        {/* Logout Button - Bottom Section */}
        <div className="border-t border-slate-200 p-4">
          <button
            onClick={async () => {
              await User.logout();
              window.location.href = '/';
            }} className="text- w-full flex items-center gap-3 rounded-xl transition-all duration-200 hover:from-purple-100 hover:to-blue-100 bg-gradient-to-r from-purple-50 to-blue-50 "

            style={{ fontSize: '16px', fontWeight: 500 }}>

            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{investor?.full_name || 'Investor'}</h1>
            <p className="text-sm text-slate-600">Investor Code: {investor?.investor_code}</p>
          </div>

          <div className="flex items-center gap-4">
            <Badge className={investorStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
              {investorStatus === 'active' ?
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </> :

                <>
                  <Clock className="w-3 h-3 mr-1" />
                  Inactive
                </>
              }
            </Badge>

            {/* NOTIFICATION BELL */}
            <NotificationBell user={user} />

            <ProfileDropdown investor={investor} onLogout={async () => { await User.logout(); window.location.href = '/'; }} onNavigate={onNavigate} />
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-blue-50">
          {children}
        </main>
      </div>
    </div>);

}


// PUBLIC LANDING PAGE FOR NON-LOGGED-IN USERS
function InvestorLandingPage({ onRegisterClick }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68bb21f4e5ccdcab161121f6/1dc7cf9b2_FinancialNetworkingLogoProtocol.png"
                alt="Protocol Logo"
                className="h-12" />

              <div>
                <h1 className="text-2xl font-bold text-slate-900">Protocol Investment Fund</h1>
                <p className="text-sm text-slate-600">Secure & Transparent Investment Platform</p>
              </div>
            </div>
            <Button
              onClick={() => User.login(window.location.href)} // Changed from loginWithRedirect to login
              className="bg-gradient-to-r from-blue-600 to-purple-600">

              Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
            Welcome to Protocol Investment Dashboard
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Join our exclusive investment platform and access professionally managed funds with monthly returns
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Secure & Regulated</h3>
              <p className="text-slate-600">
                All investments are managed with strict compliance and security protocols
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardContent className="p-6  text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Monthly Returns</h3>
              <p className="text-slate-600">
                Receive consistent monthly profit distributions directly to your wallet
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Easy Withdrawals</h3>
              <p className="text-slate-600">
                Request withdrawals anytime with a simple 30-day notice period
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Registration CTA */}
        <Card className="border-0 shadow-2xl bg-gradient-to-r from-blue-600 to-purple-600">
          <CardContent className="p-12 text-center text-white">
            <h3 className="text-3xl font-bold mb-4">Ready to Start Investing?</h3>
            <p className="text-xl mb-8 text-blue-100">
              Register now and get access to our premium investment plans
            </p>
            <Button
              onClick={onRegisterClick}
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-6">

              Request Investor Access
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Disclaimer Section */}
      <section className="bg-yellow-50 border-t border-yellow-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-yellow-100 rounded-full flex-shrink-0">
              <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742-2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="text-lg font-bold text-yellow-900 mb-2">Investment Disclaimer</h4>
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Important:</strong> All investments are subject to market risks. Past performance is not indicative of future results.
                Please read all fund documents carefully before investing. Returns are not guaranteed and may vary based on market conditions.
                Protocol Investment Fund is regulated and operates under strict compliance guidelines. Investor protection and transparency are our top priorities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h3 className="text-3xl font-bold text-slate-900 mb-8 text-center">Frequently Asked Questions</h3>

        <div className="space-y-4">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <h4 className="font-bold text-slate-900 mb-2">How do I become an investor?</h4>
              <p className="text-slate-600">
                Click the "Request Investor Access" button above and fill out the registration form. Our team will review your application within 24-48 hours.
                Once approved, you'll receive an investor code and can start investing immediately.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <h4 className="font-bold text-slate-900 mb-2">What is the minimum investment amount?</h4>
              <p className="text-slate-600">
                Minimum investment varies by fund plan, typically starting from ₹10,000. Each fund plan has its own minimum and maximum investment limits,
                which you can view on the fund details page after registration.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <h4 className="font-bold text-slate-900 mb-2">How do profit distributions work?</h4>
              <p className="text-slate-600">
                Profits are distributed monthly or quarterly based on your selected plan. Profits are automatically credited to your investment wallet,
                and you can request a payout to your bank account at any time.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <h4 className="font-bold text-slate-900 mb-2">Can I withdraw my capital anytime?</h4>
              <p className="text-slate-600">
                Yes, but you must provide a 30-day notice period before withdrawing your capital. This allows the fund manager to liquidate positions
                without impacting market performance. Profit withdrawals have no notice period requirement.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <h4 className="font-bold text-slate-900 mb-2">Is my investment secure?</h4>
              <p className="text-slate-600">
                Yes. All funds are managed by certified fund managers and held in segregated accounts. We follow strict regulatory guidelines
                and provide complete transparency through regular portfolio reports and real-time dashboard updates.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h5 className="font-bold text-lg mb-4">Protocol Investment Fund</h5>
              <p className="text-slate-400 text-sm">
                A regulated investment platform providing professional fund management services with transparency and security.
              </p>
            </div>
            <div>
              <h5 className="font-bold text-lg mb-4">Contact</h5>
              <p className="text-slate-400 text-sm">
                Email: support@protocol.in<br />
                Phone: +91-80-4567-8900<br />
                Hours: Mon-Fri, 9 AM - 6 PM IST
              </p>
            </div>
            <div>
              <h5 className="font-bold text-lg mb-4">Quick Links</h5>
              <div className="space-y-2 text-sm">
                <a href="#" className="block text-slate-400 hover:text-white transition-colors">Terms & Conditions</a>
                <a href="#" className="block text-slate-400 hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="block text-slate-400 hover:text-white transition-colors">Risk Disclosure</a>
                <a href="#" className="block text-slate-400 hover:text-white transition-colors">Contact Support</a>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-sm text-slate-400">
            <p>&copy; {new Date().getFullYear()} Protocol Investment Fund. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>);

}

// REGISTRATION REQUEST FORM FOR LOGGED-IN USERS
function InvestorRegistrationForm({ user, onSuccess, onLogout }) {
  const [formData, setFormData] = useState({
    full_name: user?.display_name || '',
    email: user?.email || '',
    mobile_number: '',
    annual_income_range: 'below_5l',
    investment_experience: 'beginner'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.full_name || !formData.email || !formData.mobile_number) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await InvestorRequest.create({
        user_id: user.id,
        full_name: formData.full_name,
        email: formData.email,
        mobile_number: formData.mobile_number,
        annual_income_range: formData.annual_income_range,
        investment_experience: formData.investment_experience,
        status: 'pending'
      });

      toast.success('✅ Registration request submitted! We will review your application within 24-48 hours.');

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error submitting registration:', error);
      toast.error('Failed to submit registration request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl">
            <CardTitle className="text-2xl">Request Investor Access</CardTitle>
            <p className="text-blue-100 mt-2">Fill out the form below to apply for investor registration</p>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label>Full Legal Name *</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                  className="mt-1" />

              </div>

              <div>
                <Label>Email Address *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                  required
                  className="mt-1" />

              </div>

              <div>
                <Label>Mobile Number *</Label>
                <Input
                  value={formData.mobile_number}
                  onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                  placeholder="+91 XXXXX XXXXX"
                  required
                  className="mt-1" />

              </div>

              <div>
                <Label>Annual Income Range *</Label>
                <select
                  value={formData.annual_income_range}
                  onChange={(e) => setFormData({ ...formData, annual_income_range: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg"
                  required>

                  <option value="below_5l">Below ₹5 Lakhs</option>
                  <option value="5l_to_10l">₹5 - 10 Lakhs</option>
                  <option value="10l_to_25l">₹10 - 25 Lakhs</option>
                  <option value="25l_to_50l">₹25 - 50 Lakhs</option>
                  <option value="above_50l">Above ₹50 Lakhs</option>
                </select>
              </div>

              <div>
                <Label>Investment Experience *</Label>
                <select
                  value={formData.investment_experience}
                  onChange={(e) => setFormData({ ...formData, investment_experience: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg"
                  required>

                  <option value="beginner">Beginner (0-2 years)</option>
                  <option value="intermediate">Intermediate (2-5 years)</option>
                  <option value="advanced">Advanced (5+ years)</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-semibold mb-2">📋 What happens next?</p>
                <ul className="space-y-1 text-xs">
                  <li>• Your application will be reviewed by our compliance team</li>
                  <li>• You will receive a notification within 24-48 hours</li>
                  <li>• Once approved, you'll receive an investor code and can start investing immediately</li>
                  <li>• You may be asked to complete KYC verification</li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-lg py-6">

                {isSubmitting ?
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </> :

                  'Submit Registration Request'
                }
              </Button>
            </form>
            {onLogout &&
              <Button
                onClick={onLogout}
                variant="ghost"
                className="w-full mt-4 text-slate-500 hover:text-slate-700">

                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            }
          </CardContent>
        </Card>
      </div>
    </div>);

}

// Dashboard Home View - Optimized API Calls
function DashboardHomeView({ investor, allocations, wallet, onRefresh }) {
  const [fundPlans, setFundPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadFundPlans = async () => {
      try {
        const plans = await FundPlan.list();
        if (isMounted) {
          setFundPlans(plans);
        }
      } catch (error) {
        console.error('Error loading fund plans:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadFundPlans();

    return () => {
      isMounted = false;
    };
  }, []);

  // PHASE 2: Calculate from allocations (NOT from investor.total_invested)
  const totalInvested = allocations
    .filter((a) => a.status === 'active')
    .reduce((sum, alloc) => sum + (alloc.total_invested || 0), 0);

  const totalCurrentValue = allocations
    .filter((a) => a.status === 'active')
    .reduce((sum, alloc) => sum + (alloc.current_value || 0), 0);

  const totalProfitLoss = totalCurrentValue - totalInvested;
  const profitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested * 100).toFixed(2) : 0;

  const chartData = allocations
    .filter((a) => a.status === 'active')
    .slice(0, 5)
    .map((alloc, index) => {
      const plan = fundPlans.find((p) => p.id === alloc.fund_plan_id);
      return {
        name: plan?.plan_name?.slice(0, 15) || `Plan ${index + 1}`,
        value: alloc.current_value || 0,
        invested: alloc.total_invested || 0
      };
    });

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>);

  }

  return (
    <div className="p-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {investor?.full_name}!</h1>
        <p className="text-indigo-100">Investor Code: <span className="font-bold">{investor?.investor_code}</span></p>
      </div>

      {/* Portfolio Stats - Modified as per code_outline for cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Invested</p>
                <p className="text-3xl font-bold mt-2">₹{totalInvested.toLocaleString('en-IN')}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Current Value</p>
                <p className="text-3xl font-bold mt-2">₹{totalCurrentValue.toLocaleString('en-IN')}</p>
              </div>
              <Wallet className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-lg bg-gradient-to-br ${totalProfitLoss >= 0 ? 'from-green-500 to-emerald-600' : 'from-red-500 to-rose-600'} text-white`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/90 text-sm">Total P/L</p>
                <p className="text-3xl font-bold mt-2">₹{totalProfitLoss.toLocaleString('en-IN')}</p>
              </div>
              {totalProfitLoss >= 0 ? <TrendingUp className="w-8 h-8 text-white/80" /> : <TrendingDown className="w-8 h-8 text-white/80" />}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">Available Balance</p>
                <p className="text-3xl font-bold mt-2">₹{(wallet?.available_balance || 0).toLocaleString('en-IN')}</p>
              </div>
              <IndianRupee className="w-8 h-8 text-amber-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Performance Chart */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Portfolio Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ?
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, '']} />

                  <Legend />
                  <Line type="monotone" dataKey="invested" stroke="#8b5cf6" strokeWidth={2} name="Invested" />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} name="Current Value" />
                </LineChart>
              </ResponsiveContainer> :

              <div className="h-[300px] flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p>No portfolio data yet</p>
                  <p className="text-sm text-slate-400 mt-1">Invest in a fund to see your performance</p>
                </div>
              </div>
            }
          </CardContent>
        </Card>

        {/* Asset Allocation Chart */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-purple-600" />
              Asset Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ?
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value">

                    {chartData.map((entry, index) =>
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    )}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                </PieChart>
              </ResponsiveContainer> :

              <div className="h-[300px] flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <PieChartIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p>No allocations yet</p>
                  <p className="text-sm text-slate-400 mt-1">Invest to see asset distribution</p>
                </div>
              </div>
            }
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => window.location.hash = 'browse'}
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-auto py-4">

              <div className="flex flex-col items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                <span>Browse Fund Plans</span>
              </div>
            </Button>
            <Button
              onClick={() => window.location.hash = 'wallet'}
              variant="outline"
              className="h-auto py-4">

              <div className="flex flex-col items-center gap-2">
                <Wallet className="w-6 h-6" />
                <span>Add Money to Wallet</span>
              </div>
            </Button>
            <Button
              onClick={() => window.location.hash = 'payouts'}
              variant="outline"
              className="h-auto py-4">

              <div className="flex flex-col items-center gap-2">
                <Download className="w-6 h-6" />
                <span>View Payouts</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Allocations */}
      {allocations.length > 0 &&
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Your Investments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allocations.filter((a) => a.status === 'active').slice(0, 5).map((alloc) => {
                const plan = fundPlans.find((p) => p.id === alloc.fund_plan_id);
                const pl = (alloc.current_value || 0) - (alloc.total_invested || 0);
                const plPercent = alloc.total_invested > 0 ? (pl / alloc.total_invested * 100).toFixed(2) : 0;

                return (
                  <div key={alloc.id} className="p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{plan?.plan_name || 'Unknown Plan'}</p>
                        <p className="text-sm text-slate-600 mt-1">
                          Invested: ₹{(alloc.total_invested || 0).toLocaleString('en-IN')} •
                          Current: ₹{(alloc.current_value || 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {pl >= 0 ? '+' : ''}₹{Math.abs(pl).toLocaleString('en-IN')}
                        </p>
                        <p className={`text-sm ${pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {pl >= 0 ? '+' : ''}{plPercent}%
                        </p>
                      </div>
                    </div>
                  </div>);

              })}
            </div>
          </CardContent>
        </Card>
      }
    </div>);

}

// Investment Request Modal
function InvestmentRequestModal({ isOpen, onClose, plan, investor, wallet, onSuccess }) {
  const [investAmount, setInvestAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { confirm, ConfirmDialog } = useConfirm();

  useEffect(() => {
    if (plan) {
      setInvestAmount(plan.minimum_investment?.toString() || '');
    }
  }, [plan]);

  const handleInvest = async () => {
    if (!investAmount || parseFloat(investAmount) <= 0) {
      toast.error('Please enter a valid investment amount');
      return;
    }

    const amount = parseFloat(investAmount);

    if (plan.minimum_investment && amount < plan.minimum_investment) {
      toast.error(`Minimum investment is ₹${plan.minimum_investment.toLocaleString('en-IN')}`);
      return;
    }

    if (plan.maximum_investment && amount > plan.maximum_investment) {
      toast.error(`Maximum investment is ₹${plan.maximum_investment.toLocaleString('en-IN')}`);
      return;
    }

    if (!wallet || wallet.available_balance < amount) {
      toast.error('Insufficient wallet balance');
      return;
    }

    const confirmed = await confirm({
      title: 'Confirm Investment',
      message: `Invest ₹${amount.toLocaleString('en-IN')} in ${plan.plan_name}? This amount will be debited from your wallet.`,
      confirmText: 'Confirm Investment',
      cancelText: 'Cancel',
      variant: 'success'
    });

    if (!confirmed) return;

    setIsProcessing(true);

    try {
      // Step 1: Deduct from wallet immediately
      await FundWallet.update(wallet.id, {
        available_balance: wallet.available_balance - amount,
        locked_balance: (wallet.locked_balance || 0) + amount
      });

      // Step 2: Create Investment Request
      await InvestmentRequest.create({
        investor_id: investor.id,
        fund_plan_id: plan.id,
        requested_amount: amount,
        status: 'pending_execution',
        payment_method: 'wallet',
        notes: `New investment request for ${plan.plan_name}`
      });

      // Step 3: Send notification to Fund Managers
      const admins = await User.filter({ app_role: 'super_admin' });
      for (const admin of admins) {
        if (admin.id === investor.user_id) continue;

        await Notification.create({
          user_id: admin.id,
          title: `New Investment Request`,
          message: `Investor ${investor.full_name} (${investor.investor_code}) invested ₹${amount.toLocaleString('en-IN')} in ${plan.plan_name} — pending execution`,
          type: 'info',
          page: 'allocation',
          meta: JSON.stringify({
            investor_id: investor.id,
            fund_plan_id: plan.id,
            amount: amount,
            action: 'investment_request_created'
          })
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error creating investment request:', error);
      toast.error('Failed to submit investment request');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invest in {plan?.plan_name}</DialogTitle>
          <DialogDescription>
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900">{plan?.plan_name}</h4>
              <p className="text-sm text-blue-700 mt-1">Expected Return: {plan?.expected_return_percent}% per month</p>
              <p className="text-sm text-blue-700 mt-1">Minimum Investment: ₹{plan?.minimum_investment?.toLocaleString('en-IN')}</p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="investAmount">Amount to Invest</Label>
            <Input
              id="investAmount"
              type="number"
              value={investAmount}
              onChange={(e) => setInvestAmount(e.target.value)}
              placeholder="Enter amount"
              className="mt-1" />

            {plan?.minimum_investment &&
              <p className="text-xs text-slate-500 mt-1">
                Minimum investment: ₹{plan.minimum_investment.toLocaleString('en-IN')}
              </p>
            }
            {plan?.maximum_investment &&
              <p className="text-xs text-slate-500 mt-1">
                Maximum investment: ₹{plan.maximum_investment.toLocaleString('en-IN')}
              </p>
            }
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">Available Wallet Balance:</span>
              <span className="font-semibold">₹{(wallet?.available_balance || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Balance After Investment:</span>
              <span className="font-semibold">
                ₹{((wallet?.available_balance || 0) - parseFloat(investAmount || 0)).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleInvest}
            disabled={isProcessing || !investAmount || parseFloat(investAmount) < (plan?.minimum_investment || 0) || parseFloat(investAmount) > (plan?.maximum_investment || Infinity) || (wallet?.available_balance || 0) < parseFloat(investAmount || 0)}
            className="bg-gradient-to-r from-blue-600 to-purple-600">

            {isProcessing ?
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </> :

              'Confirm Investment'
            }
          </Button>
        </DialogFooter>
      </DialogContent>
      <ConfirmDialog />
    </Dialog>);

}

// Browse Fund Plans View - UPDATED UI DESIGN
function BrowseFundPlansView({ investor, wallet, allocations }) {
  const [fundPlans, setFundPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedAllocation, setSelectedAllocation] = useState(null);

  useEffect(() => {
    loadData();
  }, [investor]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [plans] = await Promise.all([
        FundPlan.filter({ is_active: true })
        // allocations are passed as a prop, no need to re-fetch here if it's already available
      ]);
      setFundPlans(plans);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load fund plans');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvest = (plan) => {
    const availableBalance = wallet?.available_balance || 0;
    const minimumRequired = plan.minimum_investment || 0;
    const hasExistingInvestment = allocations.some((a) => a.fund_plan_id === plan.id && a.status === 'active');

    if (!wallet) {
      toast.error('Wallet not found. Please contact support.');
      return;
    }

    if (!hasExistingInvestment && availableBalance < minimumRequired) {
      toast.error(
        `Insufficient wallet balance. You need ₹${minimumRequired.toLocaleString('en-IN')} to start investing in ${plan.plan_name}, but you have only ₹${availableBalance.toLocaleString('en-IN')}. Please add funds to your wallet first.`,
        { duration: 5000 }
      );
      return;
    }

    if (hasExistingInvestment && availableBalance <= 0) {// For top-ups, we just need any positive balance. The modal will enforce the requested amount check.
      toast.error(
        `You have no available balance in your wallet to add to this investment. Please add funds first.`,
        { duration: 5000 }
      );
      return;
    }

    setSelectedPlan(plan);
    setShowInvestModal(true);
  };

  const handleWithdraw = (allocation) => {
    setSelectedAllocation(allocation);
    setShowWithdrawalModal(true);
  };

  const handleInvestmentSuccess = () => {
    setShowInvestModal(false);
    setSelectedPlan(null);
    toast.success('Investment request submitted successfully! Pending Fund Manager approval.');
    loadData(); // Reload data to refresh allocations
  };

  const handleWithdrawalSuccess = () => {
    setShowWithdrawalModal(false);
    setSelectedAllocation(null);
    toast.success('Withdrawal request submitted successfully! Pending Fund Manager approval.');
    loadData(); // Reload data to refresh allocations
  };

  const getReturnDisplay = (plan) => {
    if (plan.expected_return_percent) {
      return `${plan.expected_return_percent}%`;
    }
    return 'Variable';
  };

  const getPeriodDisplay = (plan) => {
    if (!plan.investment_period) return 'Flexible';
    const period = plan.investment_period.replace(/_/g, ' ');
    return period.split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getPayoutDisplay = (plan) => {
    if (!plan.profit_payout_frequency) return 'Variable';
    return plan.profit_payout_frequency.charAt(0).toUpperCase() + plan.profit_payout_frequency.slice(1);
  };

  // Helper function to check if investor can invest in a plan
  const canInvestInPlan = (plan) => {
    const availableBalance = wallet?.available_balance || 0;
    const minimumRequired = plan.minimum_investment || 0;
    const hasExistingInvestment = allocations.some((a) => a.fund_plan_id === plan.id && a.status === 'active');

    // If no existing investment, check if wallet balance meets minimum required
    if (!hasExistingInvestment) {
      return availableBalance >= minimumRequired;
    }
    // If existing investment, only check if there's *any* balance to potentially top-up
    // The modal will then perform a more detailed check against the entered top-up amount
    return availableBalance > 0;
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-64 w-full" />
      </div>);

  }

  const availableBalance = wallet?.available_balance || 0;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Browse Investment Plans</h1>
        <p className="text-slate-600">Choose a fund plan that matches your investment goals</p>
      </div>

      {/* Investment Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-yellow-900 mb-1">Investment Disclaimer:</p>
          <p className="text-sm text-yellow-800">All investments are subject to market risks. Please read the fund documents carefully before investing.</p>
        </div>
      </div>

      {/* Wallet Balance Warning - Show if low balance */}
      {availableBalance < 10000 && // Arbitrary threshold for "low balance" warning
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-900 mb-1">Low Wallet Balance</p>
            <p className="text-sm text-red-800">Your current wallet balance is ₹{availableBalance.toLocaleString('en-IN')}. Please add funds to invest in plans.</p>
          </div>
          <Button
            onClick={() => window.location.hash = 'wallet'}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white">

            Add Funds
          </Button>
        </div>
      }

      {/* Fund Plans Grid */}
      {fundPlans.length === 0 ?
        <Card className="border-0 shadow-md">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Active Plans Available</h3>
            <p className="text-slate-600">Please check back later for investment opportunities</p>
          </CardContent>
        </Card> :

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fundPlans.map((plan) => {
            // Check if investor has existing allocation in this plan
            const existingAllocation = allocations.find((a) => a.fund_plan_id === plan.id && a.status === 'active');
            const hasInvestment = !!existingAllocation;
            const canInvest = canInvestInPlan(plan);
            const minimumRequired = plan.minimum_investment || 0;

            return (
              <Card key={plan.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                {/* Header with Gradient Background */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-2xl font-bold">{plan.plan_name}</h3>
                    <Badge className="bg-green-500 text-white border-0 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Active
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>Investors</span>
                    </div>
                    <span className="font-semibold">{plan.total_investors || 0}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm mt-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>AUM</span>
                    </div>
                    <span className="font-semibold">₹{((plan.total_aum || 0) / 100000).toFixed(2)}L</span>
                  </div>
                </div>

                {/* Card Body */}
                <CardContent className="p-6 space-y-4">
                  {/* Show existing investment details if applicable */}
                  {hasInvestment &&
                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-4 text-white mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="w-4 h-4" />
                        <span className="text-sm font-medium">Your Investment</span>
                        <Badge className="ml-auto bg-white/20 text-white border-0 text-xs">Active</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-purple-100">Current</p>
                          <p className="text-lg font-bold">₹{(existingAllocation.current_value || 0).toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-purple-100">Units</p>
                          <p className="text-lg font-bold">{(existingAllocation.units_held || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  }

                  {/* Expected Return */}
                  <div className="bg-green-50 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-green-700">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-medium">Expected Return</span>
                    </div>
                    <span className="text-lg font-bold text-green-800">{getReturnDisplay(plan)} /mo</span>
                  </div>

                  {/* Minimum Investment */}
                  <div className="bg-blue-50 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-700">
                      <IndianRupee className="w-4 h-4" />
                      <span className="text-sm font-medium">Min. Investment</span>
                    </div>
                    <span className="text-lg font-bold text-blue-800">₹{(plan.minimum_investment || 0).toLocaleString('en-IN')}</span>
                  </div>

                  {/* Period and Payout */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-purple-700 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-medium">Period</span>
                      </div>
                      <p className="font-semibold text-purple-900">{getPeriodDisplay(plan)}</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-orange-700 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-medium">Payout</span>
                      </div>
                      <p className="font-semibold text-orange-900">{getPayoutDisplay(plan)}</p>
                    </div>
                  </div>

                  {/* Notice Period */}
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-slate-700 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-medium">Notice Period</span>
                    </div>
                    <p className="font-semibold text-slate-900">{plan.notice_period_days || 30} days</p>
                  </div>

                  {/* Insufficient Balance Warning */}
                  {!canInvest &&
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-red-800">
                        <p className="font-semibold">Insufficient Balance</p>
                        <p>You need ₹{minimumRequired.toLocaleString('en-IN')} but have ₹{availableBalance.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  }

                  {/* Action Buttons */}
                  {hasInvestment ?
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleInvest(plan)}
                        disabled={availableBalance <= 0} // For top-ups, just need any balance
                        className={`flex-1 ${availableBalance > 0 ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' : 'bg-slate-300 cursor-not-allowed'} text-white`}
                        title={availableBalance <= 0 ? 'Insufficient wallet balance' : 'Add more to this investment'}>

                        <Plus className="w-4 h-4 mr-2" />
                        Invest More
                      </Button>
                      <Button
                        onClick={() => handleWithdraw(existingAllocation)}
                        variant="outline"
                        className="flex-1 border-2 border-red-200 text-red-700 hover:bg-red-50">

                        <Download className="w-4 h-4 mr-2" />
                        Withdraw
                      </Button>
                    </div> :

                    <Button
                      onClick={() => handleInvest(plan)}
                      disabled={!canInvest}
                      className={`w-full ${canInvest ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : 'bg-slate-300 cursor-not-allowed'} text-white py-6 text-base font-semibold`}
                      title={!canInvest ? 'Insufficient wallet balance. Please add funds first.' : 'Start investing in this plan'}>

                      <Briefcase className="w-5 h-5 mr-2" />
                      {canInvest ? 'Invest Now' : 'Insufficient Balance'}
                    </Button>
                  }
                </CardContent>
              </Card>);

          })}
        </div>
      }

      {/* Investment Request Modal */}
      {showInvestModal && selectedPlan &&
        <InvestmentRequestModal
          investor={investor}
          plan={selectedPlan}
          wallet={wallet}
          isOpen={showInvestModal}
          onClose={() => {
            setShowInvestModal(false);
            setSelectedPlan(null);
          }}
          onSuccess={handleInvestmentSuccess} />

      }

      {/* Withdrawal Modal */}
      {showWithdrawalModal && selectedAllocation &&
        <WithdrawalRequestModal
          investor={investor}
          wallet={wallet}
          allocations={[selectedAllocation]}
          isOpen={showWithdrawalModal}
          onClose={() => {
            setShowWithdrawalModal(false);
            setSelectedAllocation(null);
          }}
          onSuccess={handleWithdrawalSuccess} />

      }
    </div>);

}

// My Investments View - ENHANCED UI WITH GRANULAR REPORTING
function AllocationsView({ investor, wallet }) {
  const [fundAllocations, setFundAllocations] = useState([]);
  const [fundPlans, setFundPlans] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [expandedAllocationId, setExpandedAllocationId] = useState(null);

  useEffect(() => {
    loadData();
  }, [investor]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allocs, plans, txns] = await Promise.all([
        FundAllocation.filter({ investor_id: investor.id }),
        FundPlan.list(),
        FundTransaction.filter({ investor_id: investor.id }, '-transaction_date')]
      );
      setFundAllocations(allocs);
      setFundPlans(plans);
      setTransactions(txns);
    } catch (error) {
      console.error('Error loading allocations:', error);
      toast.error('Failed to load investments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = (allocation) => {
    setSelectedAllocation(allocation);
    setShowWithdrawalModal(true);
  };

  const handleWithdrawalSuccess = () => {
    setShowWithdrawalModal(false);
    setSelectedAllocation(null);
    toast.success('Withdrawal request submitted successfully!');
    loadData();
  };

  const toggleExpand = (allocationId) => {
    setExpandedAllocationId(expandedAllocationId === allocationId ? null : allocationId);
  };

  const getPlanForAllocation = (allocation) => {
    return fundPlans.find((p) => p.id === allocation.fund_plan_id);
  };

  const getTransactionsForAllocation = (allocationId) => {
    return transactions.filter((t) => t.allocation_id === allocationId);
  };

  const calculateROI = (allocation) => {
    if (!allocation.total_invested || allocation.total_invested === 0) return 0;
    return (((allocation.current_value || 0) - allocation.total_invested) / allocation.total_invested * 100).toFixed(2);
  };

  const calculateDaysHeld = (allocation) => {
    if (!allocation.initial_investment_date) return 0;
    const investDate = new Date(allocation.initial_investment_date);
    const today = new Date();
    const diffTime = Math.abs(today - investDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-64 w-full" />
      </div>);

  }

  const activeAllocations = fundAllocations.filter((a) => a.status === 'active');
  const totalInvested = activeAllocations.reduce((sum, a) => sum + (a.total_invested || 0), 0);
  const totalCurrentValue = activeAllocations.reduce((sum, a) => sum + (a.current_value || 0), 0);
  const totalProfitLoss = totalCurrentValue - totalInvested;
  const totalROI = totalInvested > 0 ? ((totalCurrentValue - totalInvested) / totalInvested * 100).toFixed(2) : 0;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">My Investments</h1>
        <p className="text-slate-600">Detailed view and analytics of your investment portfolio</p>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-500 rounded-lg">
                <IndianRupee className="w-5 h-5 text-white" />
              </div>
              <Badge variant="outline" className="text-xs bg-white">Total</Badge>
            </div>
            <p className="text-sm text-blue-700 mb-1">Total Invested</p>
            <p className="text-2xl font-bold text-blue-900">₹{totalInvested.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-500 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <Badge variant="outline" className="text-xs bg-white">Current</Badge>
            </div>
            <p className="text-sm text-purple-700 mb-1">Current Value</p>
            <p className="text-2xl font-bold text-purple-900">₹{totalCurrentValue.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-lg ${totalProfitLoss >= 0 ? 'bg-gradient-to-br from-green-50 to-green-100' : 'bg-gradient-to-br from-red-50 to-red-100'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${totalProfitLoss >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                {totalProfitLoss >= 0 ?
                  <TrendingUp className="w-5 h-5 text-white" /> :

                  <TrendingDown className="w-5 h-5 text-white" />
                }
              </div>
              <Badge variant="outline" className="text-xs bg-white">P&L</Badge>
            </div>
            <p className={`text-sm mb-1 ${totalProfitLoss >= 0 ? 'text-green-700' : 'text-red-700'}`}>Total Profit/Loss</p>
            <p className={`text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-green-900' : 'text-red-900'}`}>
              ₹{Math.abs(totalProfitLoss).toLocaleString('en-IN')}
            </p>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-lg ${totalROI >= 0 ? 'bg-gradient-to-br from-emerald-50 to-emerald-100' : 'bg-gradient-to-br from-orange-50 to-orange-100'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${totalROI >= 0 ? 'bg-emerald-500' : 'bg-orange-500'}`}>
                <Target className="w-5 h-5 text-white" />
              </div>
              <Badge variant="outline" className="text-xs bg-white">ROI</Badge>
            </div>
            <p className={`text-sm mb-1 ${totalROI >= 0 ? 'text-emerald-700' : 'text-orange-700'}`}>Return on Investment</p>
            <p className={`text-2xl font-bold ${totalROI >= 0 ? 'text-emerald-900' : 'text-orange-900'}`}>
              {totalROI >= 0 ? '+' : ''}{totalROI}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Investments */}
      {activeAllocations.length === 0 ?
        <Card className="border-0 shadow-md">
          <CardContent className="p-12 text-center">
            <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Active Investments</h3>
            <p className="text-slate-600 mb-6">Start investing to build your portfolio</p>
            <Button
              onClick={() => window.location.hash = 'browse'}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">

              Browse Investment Plans
            </Button>
          </CardContent>
        </Card> :

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Active Investments ({activeAllocations.length})
          </h2>

          {activeAllocations.map((allocation) => {
            const plan = getPlanForAllocation(allocation);
            const allocationTransactions = getTransactionsForAllocation(allocation.id);
            const roi = calculateROI(allocation);
            const daysHeld = calculateDaysHeld(allocation);
            const isExpanded = expandedAllocationId === allocation.id;

            return (
              <Card key={allocation.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                {/* Card Header with Gradient */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-1">{plan?.plan_name || 'Unknown Plan'}</h3>
                      <p className="text-sm text-indigo-100">{plan?.plan_code || 'N/A'}</p>
                    </div>
                    <Badge className="bg-green-500 text-white border-0 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Active
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-indigo-200 mb-1">Total Invested</p>
                      <p className="text-xl font-bold">₹{(allocation.total_invested || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-indigo-200 mb-1">Current Value</p>
                      <p className="text-xl font-bold">₹{(allocation.current_value || 0).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>

                {/* Card Content - Performance Metrics */}
                <CardContent className="p-6 space-y-4">
                  {/* Performance Overview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-slate-600 mb-2">
                        <Target className="w-4 h-4" />
                        <span className="text-xs font-medium">Profit/Loss</span>
                      </div>
                      <p className={`text-lg font-bold ${allocation.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {allocation.profit_loss >= 0 ? '+' : ''}₹{Math.abs(allocation.profit_loss || 0).toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-slate-600 mb-2">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs font-medium">ROI</span>
                      </div>
                      <p className={`text-lg font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {roi >= 0 ? '+' : ''}{roi}%
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-slate-600 mb-2">
                        <Layers className="w-4 h-4" />
                        <span className="text-xs font-medium">Units Held</span>
                      </div>
                      <p className="text-lg font-bold text-slate-900">
                        {(allocation.units_held || 0).toFixed(4)}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-slate-600 mb-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-medium">Days Held</span>
                      </div>
                      <p className="text-lg font-bold text-slate-900">
                        {daysHeld} days
                      </p>
                    </div>
                  </div>

                  {/* Investment Details */}
                  <div className="border-t border-slate-200 pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 mb-1">Investment Date</p>
                        <p className="font-semibold text-slate-900">
                          {allocation.initial_investment_date ? new Date(allocation.initial_investment_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          }) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">Average NAV</p>
                        <p className="font-semibold text-slate-900">₹{(allocation.average_nav || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">Last Updated</p>
                        <p className="font-semibold text-slate-900">
                          {allocation.last_transaction_date ? new Date(allocation.last_transaction_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short'
                          }) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Expand/Collapse Transaction History */}
                  <div className="border-t border-slate-200 pt-4">
                    <Button
                      variant="ghost"
                      onClick={() => toggleExpand(allocation.id)}
                      className="w-full justify-between hover:bg-slate-50">

                      <span className="flex items-center gap-2 text-slate-700 font-medium">
                        <History className="w-4 h-4" />
                        Transaction History ({allocationTransactions.length})
                      </span>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </Button>

                    {isExpanded &&
                      <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                        {allocationTransactions.length === 0 ?
                          <p className="text-sm text-slate-500 text-center py-4">No transactions yet</p> :

                          allocationTransactions.map((txn) =>
                            <div key={txn.id} className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${txn.transaction_type === 'purchase' || txn.transaction_type === 'investment_topup' ? 'bg-green-100' :
                                  txn.transaction_type === 'dividend' || txn.transaction_type === 'profit_payout' ? 'bg-blue-100' :
                                    txn.transaction_type === 'redemption' || txn.transaction_type === 'withdrawal' || txn.transaction_type === 'management_fee' ? 'bg-red-100' :
                                      'bg-slate-100'
                                  }`}>
                                  {(txn.transaction_type === 'purchase' || txn.transaction_type === 'investment_topup' || txn.transaction_type === 'dividend' || txn.transaction_type === 'profit_payout') && <ArrowUpRight className="w-4 h-4 text-green-600" />}
                                  {(txn.transaction_type === 'redemption' || txn.transaction_type === 'withdrawal' || txn.transaction_type === 'management_fee') && <ArrowDownLeft className="w-4 h-4 text-red-600" />}
                                  {!(txn.transaction_type === 'purchase' || txn.transaction_type === 'investment_topup' || txn.transaction_type === 'dividend' || txn.transaction_type === 'profit_payout' || txn.transaction_type === 'redemption' || txn.transaction_type === 'withdrawal' || txn.transaction_type === 'management_fee') && <IndianRupee className="w-4 h-4 text-slate-600" />}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900 text-sm capitalize">
                                    {txn.transaction_type.replace(/_/g, ' ')}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {new Date(txn.transaction_date).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`font-bold text-sm ${txn.transaction_type === 'redemption' || txn.transaction_type === 'withdrawal' || txn.transaction_type === 'management_fee' ? 'text-red-600' : 'text-green-600'
                                  }`}>
                                  {txn.transaction_type === 'redemption' || txn.transaction_type === 'withdrawal' || txn.transaction_type === 'management_fee' ? '-' : '+'}₹{(txn.amount || 0).toLocaleString('en-IN')}
                                </p>
                                {txn.units &&
                                  <p className="text-xs text-slate-500">{txn.units.toFixed(4)} units</p>
                                }
                              </div>
                            </div>
                          )
                        }
                      </div>
                    }
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                    <Button
                      variant="outline"
                      onClick={() => handleWithdraw(allocation)}
                      className="flex-1 border-2 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300">

                      <Download className="w-4 h-4 mr-2" />
                      Request Withdrawal
                    </Button>
                    <Button
                      onClick={() => {
                        window.location.hash = 'browse';
                      }}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white">

                      <Plus className="w-4 h-4 mr-2" />
                      Invest More
                    </Button>
                  </div>
                </CardContent>
              </Card>);

          })}
        </div>
      }

      {/* Withdrawal Modal */}
      {showWithdrawalModal && selectedAllocation &&
        <WithdrawalRequestModal
          investor={investor}
          wallet={wallet}
          allocations={[selectedAllocation]}
          isOpen={showWithdrawalModal}
          onClose={() => {
            setShowWithdrawalModal(false);
            setSelectedAllocation(null);
          }}
          onSuccess={handleWithdrawalSuccess} />

      }
    </div>);

}


// Enhanced Wallet View - Fixed Add Money Modal NaN Issue
function WalletView({ investor, wallet, allocations, onRefresh }) {
  const [transactions, setTransactions] = useState([]);
  const [loadedInvoices, setLoadedInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false); // Added missing state variable
  const [addAmount, setAddAmount] = useState('');
  const [totalPayouts, setTotalPayouts] = useState(0);
  const [totalWithdrawals, setTotalWithdrawals] = useState(0);

  // Calculate locked balance as total invested amount
  const totalInvested = allocations
    .filter((a) => a.status === 'active')
    .reduce((sum, alloc) => sum + (alloc.total_invested || 0), 0);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!investor?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        console.log('📊 Loading Wallet Data for Investor:', investor.id);

        await delay(500);
        const txns = await FundTransaction.filter({ investor_id: investor.id }, '-transaction_date', 20).catch((err) => {
          console.error('Error loading transactions:', err);
          return [];
        });
        console.log('✅ Transactions loaded:', txns.length);

        await delay(500);
        const payouts = await FundPayoutRequest.filter({ investor_id: investor.id, status: 'processed' }).catch((err) => {
          console.error('Error loading payouts:', err);
          return [];
        });
        console.log('✅ Payouts loaded:', payouts.length);

        await delay(500);
        const withdrawals = await FundWithdrawalRequest.filter({ investor_id: investor.id, status: 'processed' }).catch((err) => {
          console.error('Error loading withdrawals:', err);
          return [];
        });
        console.log('✅ Withdrawals loaded:', withdrawals.length);

        await delay(500);
        const invs = await FundInvoice.filter({ investor_id: investor.id }, '-invoice_date').catch((err) => {
          console.error('Error loading invoices:', err);
          return [];
        });
        console.log('✅ Invoices loaded:', invs.length);

        if (isMounted) {
          setTransactions(txns);
          setLoadedInvoices(invs);

          const totalPayout = payouts.reduce((sum, p) => sum + (p.requested_amount || 0), 0);
          const totalWithdrawal = withdrawals.reduce((sum, w) => sum + (w.withdrawal_amount || 0), 0);

          setTotalPayouts(totalPayout);
          setTotalWithdrawals(totalWithdrawal);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error loading wallet data:', error);
          if (!error.message?.includes('Rate limit')) {
            toast.error('Failed to load some wallet data');
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [investor?.id]);

  const handleAddMoneyClick = () => {
    if (!addAmount || parseFloat(addAmount) <= 0) {
      toast.error('Please enter a valid amount to add.');
      return;
    }
    setShowAddMoneyModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowAddMoneyModal(false);
    setAddAmount('');
    if (onRefresh) onRefresh();
  };

  const handlePayoutSuccess = () => {// Added handlePayoutSuccess
    setShowPayoutModal(false);
    if (onRefresh) onRefresh();
  };

  // Check if payout request is allowed based on KYC status
  const canRequestPayout = investor?.kyc_status === 'verified';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>);

  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Wallet</h1>
          <p className="text-slate-600 mt-1">Manage your investment funds</p>
        </div>
      </div>

      {/* Wallet Balance Card with Request Payout Button */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-5 h-5 text-blue-100" />
                <p className="text-blue-100 text-sm">Available Balance</p>
              </div>
              <h1 className="text-5xl font-bold">
                ₹{(wallet?.available_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h1>
              <p className="text-blue-100 text-sm mt-2">Ready for investment or withdrawal</p>
            </div>

            {/* Request Payout Button - Top Right Corner */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => setShowPayoutModal(true)}
                disabled={
                  investor?.kyc_status !== 'verified' ||
                  (wallet?.available_balance || 0) <= 0
                }
                className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">

                <Download className="w-4 h-4" />
                Request Payout
              </Button>

              {/* Helper Text for Disabled State */}
              {investor?.kyc_status !== 'verified' &&
                <div className="bg-yellow-500/20 border border-yellow-300/30 rounded-lg px-3 py-2 text-xs text-yellow-100 max-w-[200px]">
                  <Shield className="w-3 h-3 inline mr-1" />
                  KYC verification required
                </div>
              }

              {investor?.kyc_status === 'verified' && (wallet?.available_balance || 0) <= 0 &&
                <div className="bg-blue-500/20 border border-blue-300/30 rounded-lg px-3 py-2 text-xs text-blue-100 max-w-[200px]">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  No balance available
                </div>
              }
            </div>
          </div>

          {/* Balance Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-white/20">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-blue-100" />
                <p className="text-blue-100 text-sm">Locked Balance</p>
              </div>
              <p className="text-2xl font-bold">₹{totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ArrowUpRight className="w-4 h-4 text-blue-100" />
                <p className="text-blue-100 text-sm">Total Deposited</p>
              </div>
              <p className="text-2xl font-bold">₹{(wallet?.total_deposited || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ArrowDownRight className="w-4 h-4 text-blue-100" />
                <p className="text-blue-100 text-sm">Total Payouts</p>
              </div>
              <p className="text-2xl font-bold">₹{totalPayouts.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Download className="w-4 h-4 text-blue-100" />
                <p className="text-blue-100 text-sm">Total Withdrawals</p>
              </div>
              <p className="text-2xl font-bold">₹{totalWithdrawals.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Money Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Add Money to Wallet
          </CardTitle>
          <p className="text-slate-600 mt-1">Supports INR (Indian Rupees) via UPI/Bank Transfer.</p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Amount (INR)</Label>
              <Input
                type="number"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder="Enter amount"
                className="mt-1" />

            </div>
            <Button
              onClick={handleAddMoneyClick}
              disabled={!addAmount || parseFloat(addAmount) <= 0}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">

              <Plus className="w-4 h-4 mr-2" />
              Add Money
            </Button>
          </div>
          <div className="flex gap-2 mt-3">
            {[500, 1000, 5000, 10000].map((amt) =>
              <Button
                key={amt}
                variant="outline"
                size="sm"
                onClick={() => setAddAmount(amt.toString())}>

                ₹{amt}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transaction History & Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction History */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ?
              <div className="py-8 text-center text-slate-500">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm">No transactions yet</p>
              </div> :

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transactions.map((txn) => {
                  const creditTypes = ['wallet_deposit', 'dividend', 'refund', 'profit_payout'];
                  const isCredit = creditTypes.includes(txn.transaction_type);

                  return (
                    <div key={txn.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isCredit ? 'bg-green-100' : 'bg-red-100'}`}>
                          {isCredit ?
                            <ArrowDownRight className="w-5 h-5 text-green-600" /> :
                            <ArrowUpRight className="w-5 h-5 text-red-600" />
                          }
                        </div>
                        <div>
                          <p className="font-medium capitalize text-sm text-slate-900">
                            {txn.transaction_type.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(txn.transaction_date).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                          {txn.payment_method &&
                            <p className="text-xs text-slate-400 capitalize">
                              {txn.payment_method.replace('_', ' ')}
                            </p>
                          }
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                          {isCredit ? '+' : '-'}₹{(txn.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                        <Badge className={txn.status === 'completed' ? 'bg-green-100 text-green-700 text-xs' : 'bg-yellow-100 text-yellow-700 text-xs'}>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {txn.status}
                        </Badge>
                      </div>
                    </div>);

                })}
              </div>
            }
          </CardContent>
        </Card>

        {/* Invoices */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadedInvoices.length === 0 ?
              <div className="py-8 text-center text-slate-500">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm">No invoices available</p>
              </div> :

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {loadedInvoices.map((invoice) =>
                  <div key={invoice.id} className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-sm">{invoice.invoice_number}</p>
                      <Badge variant="outline" className="text-xs capitalize">{invoice.invoice_type}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">
                      {new Date(invoice.invoice_date).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold">₹{(invoice.net_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (invoice.invoice_url) {
                            window.open(invoice.invoice_url, '_blank');
                          } else {
                            toast.info('Invoice URL not available.');
                          }
                        }}>

                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            }
          </CardContent>
        </Card>
      </div>

      {/* Payment Modal for Add Money */}
      {showAddMoneyModal && addAmount && parseFloat(addAmount) > 0 &&
        <PaymentModal
          isOpen={showAddMoneyModal}
          onClose={() => {
            setShowAddMoneyModal(false);
          }}
          amount={addAmount}
          investor={investor}
          wallet={wallet}
          purpose="wallet_deposit"
          onSuccess={handlePaymentSuccess} />

      }

      {/* Payout Request Modal */}
      {showPayoutModal &&
        <PayoutRequestModal
          investor={investor}
          wallet={wallet}
          isOpen={showPayoutModal}
          onClose={() => setShowPayoutModal(false)}
          onSuccess={handlePayoutSuccess} />

      }
    </div>);

}

// Enhanced Payouts & Withdrawals View with Proper State Management
function PayoutsView({ investor, wallet, allocations, onRefresh }) {
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [fundPlans, setFundPlans] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedRequestType, setSelectedRequestType] = useState(null);

  // Load requests function
  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const [withdrawals, payouts, plans] = await Promise.all([
        FundWithdrawalRequest.filter({ investor_id: investor.id }, '-created_date'),
        FundPayoutRequest.filter({ investor_id: investor.id }, '-created_date'),
        FundPlan.list()]
      );

      const plansMap = plans.reduce((acc, plan) => {
        acc[plan.id] = plan;
        return acc;
      }, {});

      setWithdrawalRequests(withdrawals);
      setPayoutRequests(payouts);
      setFundPlans(plansMap);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  }, [investor.id]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleWithdrawalSuccess = () => {
    setShowWithdrawalModal(false);
    // Refresh the table
    loadRequests();
    if (onRefresh) {
      onRefresh();
    }
  };

  const handlePayoutSuccess = () => {
    setShowPayoutModal(false);
    // Refresh the table
    loadRequests();
    if (onRefresh) {
      onRefresh();
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
      case 'pending_execution':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'processed':
      case 'paid':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
      case 'pending_execution':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processed':
      case 'paid':
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'pending_execution':
        return 'Pending'; // Can be adjusted to 'Pending Execution' if desired
      case 'approved':
        return 'Approved';
      case 'processed':
      case 'paid':
      case 'completed':
        return 'Paid';
      case 'rejected':
        return 'Rejected';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const getTimeline = (request, type) => {
    const steps = [];

    steps.push({
      label: 'Request Submitted',
      date: request.created_date,
      completed: true,
      active: false
    });

    if (request.status === 'approved' || request.status === 'processed' || request.status === 'paid' || request.status === 'completed') {
      steps.push({
        label: 'Approved by Fund Manager',
        date: request.reviewed_at || request.processed_date || new Date().toISOString(),
        completed: true,
        active: false
      });
    } else if (request.status === 'rejected' || request.status === 'failed') {
      steps.push({
        label: 'Rejected',
        date: request.reviewed_at || new Date().toISOString(),
        completed: true,
        active: false,
        error: true
      });
      return steps;
    } else {
      steps.push({
        label: 'Pending Approval',
        date: null,
        completed: false,
        active: true
      });
      return steps;
    }

    if (request.status === 'processed' || request.status === 'paid' || request.status === 'completed') {
      steps.push({
        label: type === 'withdrawal' ? 'Funds Credited to Wallet' : 'Payout Completed',
        date: request.processed_date,
        completed: true,
        active: false
      });
    } else {
      steps.push({
        label: type === 'withdrawal' ? 'Awaiting Fund Transfer' : 'Awaiting Payout',
        date: null,
        completed: false,
        active: true
      });
    }

    return steps;
  };

  const handleViewTimeline = (request, type) => {
    setSelectedRequest(request);
    setSelectedRequestType(type);
    setShowTimelineModal(true);
  };

  // Create unified requests table
  const allRequests = [
    ...withdrawalRequests.map((w) => ({
      ...w,
      type: 'Withdrawal',
      amount: w.withdrawal_amount,
      fund_plan_name: fundPlans[w.fund_plan_id]?.plan_name || 'N/A',
      request_type: 'withdrawal',
      processed_date: w.processed_date || null
    })),
    ...payoutRequests.map((p) => ({
      ...p,
      type: 'Payout',
      amount: p.requested_amount,
      fund_plan_name: '-', // Payouts are from wallet, not a specific plan
      request_type: 'payout',
      processed_date: p.processed_date || null
    }))].
    sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>);

  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Payouts & Withdrawals</h1>
          <p className="text-slate-600 mt-1">Manage fund withdrawals and payout requests</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowWithdrawalModal(true)}
            variant="secondary"
            className="bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700">

            <IndianRupee className="w-4 h-4 mr-2" />
            Request Fund Withdrawal
          </Button>
          <Button
            onClick={() => setShowPayoutModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">

            <Download className="w-4 h-4 mr-2" />
            Request Payout
          </Button>
        </div>
      </div>

      {/* Unified Requests Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            All Requests
          </CardTitle>
          <p className="text-sm text-slate-600 mt-1">Complete history of withdrawals and payouts</p>
        </CardHeader>
        <CardContent className="p-6">
          {allRequests.length === 0 ?
            <div className="py-12 text-center text-slate-500">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Requests Yet</h3>
              <p className="text-sm">You haven't made any withdrawal or payout requests.</p>
              <div className="flex gap-3 justify-center mt-4">
                <Button
                  onClick={() => setShowWithdrawalModal(true)}
                  className="bg-gradient-to-r from-red-500 to-pink-600">

                  <IndianRupee className="w-4 h-4 mr-2" />
                  Request Withdrawal
                </Button>
                <Button
                  onClick={() => setShowPayoutModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600">

                  <Download className="w-4 h-4 mr-2" />
                  Request Payout
                </Button>
              </div>
            </div> :

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Fund Plan</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Amount</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Requested At</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Processed At</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allRequests.map((request) =>
                    <tr key={`${request.request_type}-${request.id}`} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4">
                        <Badge variant="outline" className={request.type === 'Withdrawal' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}>
                          {request.type}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-medium text-slate-900">{request.fund_plan_name}</p>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <p className="text-sm font-bold text-slate-900">
                          ₹{(request.amount || 0).toLocaleString('en-IN')}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge className={`${getStatusColor(request.status)} border flex items-center gap-1 justify-center w-fit mx-auto`}>
                          {getStatusIcon(request.status)}
                          <span className="capitalize">{getStatusLabel(request.status)}</span>
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <p className="text-sm text-slate-700">
                          {new Date(request.created_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(request.created_date).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {request.processed_date ?
                          <>
                            <p className="text-sm text-slate-700">
                              {new Date(request.processed_date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(request.processed_date).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </> :

                          <p className="text-xs text-slate-400">-</p>
                        }
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewTimeline(request, request.request_type)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">

                          <FileText className="w-4 h-4 mr-1" />
                          VIEW
                        </Button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          }
        </CardContent>
      </Card>

      {/* Timeline Modal */}
      {showTimelineModal && selectedRequest &&
        <Dialog open={showTimelineModal} onOpenChange={setShowTimelineModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Request Progress Timeline
              </DialogTitle>
              <DialogDescription>
                {selectedRequestType === 'withdrawal' ? 'Fund Withdrawal Request' : 'Payout Request'} #{selectedRequest.id.slice(0, 8)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Request Details */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-xs text-slate-500">Amount</p>
                  <p className="text-lg font-bold text-slate-900">
                    ₹{(selectedRequest.amount || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <Badge className={`${getStatusColor(selectedRequest.status)} border mt-1`}>
                    {getStatusIcon(selectedRequest.status)}
                    <span className="capitalize ml-1">{getStatusLabel(selectedRequest.status)}</span>
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Requested On</p>
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(selectedRequest.created_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                {selectedRequestType === 'withdrawal' && selectedRequest.expected_processing_date &&
                  <div>
                    <p className="text-xs text-slate-500">Expected Processing</p>
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(selectedRequest.expected_processing_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                }
              </div>

              {/* Timeline */}
              <div className="relative">
                <div className="text-sm font-semibold text-slate-700 mb-4">Progress Timeline</div>
                {getTimeline(selectedRequest, selectedRequestType).map((step, idx) =>
                  <div key={idx} className="flex gap-4 pb-6 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step.completed ? step.error ? 'bg-red-100' : 'bg-green-100' :
                        step.active ? 'bg-blue-100 animate-pulse' : 'bg-slate-100'
                        }`}>
                        {step.completed ?
                          step.error ? <XCircle className="w-5 h-5 text-red-600" /> : <CheckCircle className="w-5 h-5 text-green-600" /> :

                          step.active ? <Clock className="w-5 h-5 text-blue-600" /> : <Clock className="w-5 h-5 text-slate-400" />
                        }
                      </div>
                      {idx < getTimeline(selectedRequest, selectedRequestType).length - 1 &&
                        <div className={`w-0.5 h-full min-h-[40px] ${step.completed ? step.error ? 'bg-red-200' : 'bg-green-200' : 'bg-slate-200'
                          }`} />
                      }
                    </div>

                    <div className="flex-1 pb-2">
                      <p className={`font-semibold ${step.completed ? step.error ? 'text-red-900' : 'text-slate-900' : 'text-slate-600'}`}>
                        {step.label}
                      </p>
                      {step.date &&
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(step.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      }
                      {step.active &&
                        <p className="text-xs text-blue-600 mt-1">In progress...</p>
                      }
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Notes */}
              {selectedRequest.admin_notes &&
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900 mb-1">Admin Notes:</p>
                  <p className="text-sm text-blue-800">{selectedRequest.admin_notes}</p>
                </div>
              }

              {/* Rejection Reason */}
              {selectedRequest.rejection_reason &&
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm font-semibold text-red-900 mb-1">Rejection Reason:</p>
                  <p className="text-sm text-red-800">{selectedRequest.rejection_reason}</p>
                </div>
              }

              {/* UTR Number (for payouts) */}
              {selectedRequestType === 'payout' && selectedRequest.utr_number &&
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-semibold text-green-900 mb-1">UTR Number:</p>
                  <p className="text-sm text-green-800 font-mono">{selectedRequest.utr_number}</p>
                </div>
              }
            </div>

            <DialogFooter>
              <Button onClick={() => setShowTimelineModal(false)} variant="outline">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }

      {/* Modals */}
      {showWithdrawalModal &&
        <WithdrawalRequestModal
          investor={investor}
          wallet={wallet}
          allocations={allocations} // Pass all aggregated allocations for selection
          isOpen={showWithdrawalModal}
          onClose={() => setShowWithdrawalModal(false)}
          onSuccess={handleWithdrawalSuccess} />

      }

      {showPayoutModal &&
        <PayoutRequestModal
          investor={investor}
          wallet={wallet}
          isOpen={showPayoutModal}
          onClose={() => setShowPayoutModal(false)}
          onSuccess={handlePayoutSuccess} />

      }
    </div>);

}

// C. Reports Tab with Allocations Table - UPDATED
function ReportsView({ investor }) {
  const [allTransactions, setAllTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [fundPlans, setFundPlans] = useState({});

  useEffect(() => {
    let isMounted = true;

    const loadReportsData = async () => {
      if (!investor?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        // Load all transactions
        await delay(500);
        const txns = await FundTransaction.filter({ investor_id: investor.id }, '-transaction_date').catch((err) => {
          console.error('Error loading transactions:', err);
          return [];
        });

        // Load fund plans for display
        await delay(500);
        const plans = await FundPlan.list().catch(() => []);
        const plansMap = plans.reduce((acc, plan) => {
          acc[plan.id] = plan;
          return acc;
        }, {});

        if (isMounted) {
          console.log('📊 Loaded transactions:', txns.length);
          setAllTransactions(txns);
          setFilteredTransactions(txns);
          setFundPlans(plansMap);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error loading reports data:', error);
          if (!error.message?.includes('Rate limit')) {
            toast.error('Failed to load transaction data');
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadReportsData();

    return () => {
      isMounted = false;
    };
  }, [investor?.id]);

  useEffect(() => {
    let filtered = [...allTransactions];

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter((t) => t.transaction_type === selectedType);
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date();
      const startDate = new Date();

      switch (dateRange) {
        case '7days':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          break;
      }

      filtered = filtered.filter((t) => new Date(t.transaction_date) >= startDate);
    }

    setFilteredTransactions(filtered);
  }, [selectedType, dateRange, allTransactions]);

  const getTransactionTypeLabel = (type) => {
    const labels = {
      wallet_deposit: 'Wallet Deposit',
      wallet_withdrawal: 'Wallet Withdrawal',
      purchase: 'Fund Purchase',
      redemption: 'Fund Redemption',
      dividend: 'Dividend',
      profit_payout: 'Profit Payout',
      management_fee: 'Management Fee',
      investment_topup: 'Investment Topup',
      withdrawal: 'Fund Withdrawal'
    };
    return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getTransactionTypeColor = (type) => {
    const colors = {
      wallet_deposit: 'bg-green-100 text-green-800',
      wallet_withdrawal: 'bg-red-100 text-red-800',
      purchase: 'bg-blue-100 text-blue-800',
      redemption: 'bg-orange-100 text-orange-800',
      dividend: 'bg-purple-100 text-purple-800',
      profit_payout: 'bg-teal-100 text-teal-800',
      management_fee: 'bg-gray-100 text-gray-800',
      investment_topup: 'bg-indigo-100 text-indigo-800',
      withdrawal: 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const downloadCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    const headers = ['Date', 'Type', 'Fund Plan', 'Amount', 'Units', 'NAV', 'Status', 'Payment Method', 'Notes'];
    const rows = filteredTransactions.map((txn) => [
      new Date(txn.transaction_date).toLocaleString('en-IN'),
      getTransactionTypeLabel(txn.transaction_type),
      txn.fund_plan_id ? fundPlans[txn.fund_plan_id]?.plan_name || 'N/A' : 'N/A',
      txn.amount || 0,
      txn.units || 'N/A',
      txn.nav || 'N/A',
      txn.status,
      txn.payment_method || 'N/A',
      txn.notes || '']
    );

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].
      join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Transaction report downloaded successfully!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>);

  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Transaction Reports</h1>
          <p className="text-slate-600 mt-1">View and export your transaction history</p>
        </div>
        <Button onClick={downloadCSV} className="bg-gradient-to-r from-blue-600 to-purple-600">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="typeFilter" className="text-sm font-semibold mb-2 block">Transaction Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger id="typeFilter">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="wallet_deposit">Wallet Deposits</SelectItem>
                  <SelectItem value="wallet_withdrawal">Wallet Withdrawals</SelectItem>
                  <SelectItem value="purchase">Fund Purchases</SelectItem>
                  <SelectItem value="redemption">Fund Redemptions</SelectItem>
                  <SelectItem value="dividend">Dividends</SelectItem>
                  <SelectItem value="profit_payout">Profit Payouts</SelectItem>
                  <SelectItem value="management_fee">Management Fees</SelectItem>
                  <SelectItem value="investment_topup">Investment Topups</SelectItem>
                  <SelectItem value="withdrawal">Fund Withdrawals</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dateFilter" className="text-sm font-semibold mb-2 block">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger id="dateFilter">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                  <SelectItem value="1year">Last 1 Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Showing {filteredTransactions.length} of {allTransactions.length} transactions
            </p>
          </div>

          {filteredTransactions.length === 0 ?
            <div className="py-12 text-center text-slate-500">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p>No transactions found</p>
              <p className="text-sm text-slate-400 mt-2">Try adjusting your filters</p>
            </div> :

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase whitespace-nowrap">Date & Time</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase whitespace-nowrap">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase whitespace-nowrap">Fund Plan</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase whitespace-nowrap">Amount</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase whitespace-nowrap">Units</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase whitespace-nowrap">NAV</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase whitespace-nowrap">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredTransactions.map((txn) =>
                    <tr key={txn.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                        {new Date(txn.transaction_date).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge className={`${getTransactionTypeColor(txn.transaction_type)} text-xs`}>
                          {getTransactionTypeLabel(txn.transaction_type)}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700 whitespace-nowrap">
                        {txn.fund_plan_id ? fundPlans[txn.fund_plan_id]?.plan_name || 'N/A' : '-'}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900 whitespace-nowrap">
                        ₹{(txn.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-slate-600 whitespace-nowrap">
                        {txn.units ? txn.units.toFixed(4) : '-'}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-slate-600 whitespace-nowrap">
                        {txn.nav ? `₹${txn.nav.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge className={
                          txn.status === 'completed' ? 'bg-green-100 text-green-800' :
                            txn.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                        }>
                          {txn.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500 max-w-xs truncate">
                        {txn.notes || '-'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          }
        </CardContent>
      </Card>
    </div>);

}

// Profile View
function ProfileView({ investor, user, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: investor.full_name || '',
    email: investor.email || '',
    mobile_number: investor.mobile_number || '',
    pan_number: investor.pan_number || '',
    bank_account_number: investor.bank_account_number || '',
    bank_ifsc_code: investor.bank_ifsc_code || '',
    bank_name: investor.bank_name || '',
    upi_id: investor.upi_id || ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Investor.update(investor.id, formData);
      toast.success('Profile updated successfully');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Investor Profile</h1>
          <p className="text-slate-600 mt-1">Manage your personal and financial information</p>
        </div>
        {!isEditing ?
          <Button onClick={() => setIsEditing(true)} variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button> :

          <div className="flex gap-2">
            <Button onClick={() => setIsEditing(false)} variant="outline" disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-to-r from-blue-600 to-purple-600">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </div>
        }
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-blue-600" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Full Name</Label>
              {isEditing ?
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="mt-1" /> :


                <p className="mt-1 font-medium">{investor.full_name}</p>
              }
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              {isEditing ?
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1"
                  type="email" /> :


                <p className="mt-1 font-medium">{investor.email}</p>
              }
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Mobile Number
              </Label>
              {isEditing ?
                <Input
                  value={formData.mobile_number}
                  onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                  className="mt-1" /> :


                <p className="mt-1 font-medium">{investor.mobile_number || 'Not provided'}</p>
              }
            </div>

            <div>
              <Label>PAN Number</Label>
              {isEditing ?
                <Input
                  value={formData.pan_number}
                  onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
                  className="mt-1"
                  maxLength={10} /> :


                <p className="mt-1 font-medium">{investor.pan_number || 'Not provided'}</p>
              }
            </div>

            <div>
              <Label>Investor Code</Label>
              <p className="mt-1 font-mono text-sm bg-slate-100 p-2 rounded">{investor.investor_code}</p>
            </div>

            <div>
              <Label>KYC Status</Label>
              <Badge className={
                investor.kyc_status === 'verified' ? 'bg-green-100 text-green-800 mt-1' :
                  investor.kyc_status === 'pending' ? 'bg-yellow-100 text-yellow-800 mt-1' :
                    'bg-red-100 text-red-800 mt-1'
              }>
                {investor.kyc_status || 'Pending'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-600" />
              Financial Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Bank Account Number</Label>
              {isEditing ?
                <Input
                  value={formData.bank_account_number}
                  onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                  className="mt-1" /> :


                <p className="mt-1 font-medium">
                  {investor.bank_account_number ? `****${investor.bank_account_number.slice(-4)}` : 'Not provided'}
                </p>
              }
            </div>

            <div>
              <Label>Bank IFSC Code</Label>
              {isEditing ?
                <Input
                  value={formData.bank_ifsc_code}
                  onChange={(e) => setFormData({ ...formData, bank_ifsc_code: e.target.value.toUpperCase() })}
                  className="mt-1" /> :


                <p className="mt-1 font-medium">{investor.bank_ifsc_code || 'Not provided'}</p>
              }
            </div>

            <div>
              <Label>Bank Name</Label>
              {isEditing ?
                <Input
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="mt-1" /> :


                <p className="mt-1 font-medium">{investor.bank_name || 'Not provided'}</p>
              }
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                UPI ID
              </Label>
              {isEditing ?
                <Input
                  value={formData.upi_id}
                  onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                  className="mt-1"
                  placeholder="yourname@upi" /> :


                <p className="mt-1 font-medium">{investor.upi_id || 'Not provided'}</p>
              }
            </div>

            <div>
              <Label>Profit Distribution Plan</Label>
              <p className="mt-1 font-medium capitalize">{investor.profit_distribution_plan || 'Monthly'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investment Summary */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Investment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-slate-500">Total Invested</p>
              <p className="text-2xl font-bold text-blue-600">₹{(investor.total_invested || 0).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Current Value</p>
              <p className="text-2xl font-bold text-green-600">₹{(investor.current_value || 0).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Profit/Loss</p>
              <p className={`text-2xl font-bold ${(investor.total_profit_loss || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                ₹{Math.abs(investor.total_profit_loss || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Account Status</p>
              <Badge className={investor.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {investor.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>);

}

// Support View
function SupportView({ investor }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      toast.success('Support request submitted successfully!');
      setSubject('');
      setMessage('');
    } catch (error) {
      console.error('Error submitting support request:', error);
      toast.error('Failed to submit support request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Support</h1>
        <p className="text-slate-600 mt-1">Get help with your investment account</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Form */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-blue-600" />
              Contact Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What do you need help with?"
                  required
                  className="mt-1" />

              </div>

              <div>
                <Label>Message</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue or question..."
                  required
                  rows={6}
                  className="mt-1" />

              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600">

                {isSubmitting ?
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </> :

                  'Submit Request'
                }
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Help */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Quick Help</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">📧 Email Support</h3>
              <p className="text-sm text-blue-700">support@protocol.in</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900 mb-2">📞 Phone Support</h3>
              <p className="text-sm text-green-700">+91-80-4567-8900</p>
              <p className="text-xs text-green-600 mt-1">Mon-Fri, 9 AM - 6 PM IST</p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-900 mb-2">🕒 Business Hours</h3>
              <p className="text-sm text-purple-700">Monday to Friday</p>
              <p className="text-sm text-purple-700">9:00 AM - 6:00 PM IST</p>
            </div>

            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h3 className="font-semibold text-amber-900 mb-2">⚡ Average Response Time</h3>
              <p className="text-sm text-amber-700">Within 24 hours</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQs */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <h3 className="font-semibold text-slate-900 mb-2">How do I request a payout?</h3>
            <p className="text-sm text-slate-600">Go to the Payouts & Withdrawals page and click "Request Payout". Fill in the required details and submit your request.</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg">
            <h3 className="font-semibold text-slate-900 mb-2">What is the minimum investment amount?</h3>
            <p className="text-sm text-slate-600">The minimum investment amount varies by fund plan. Check the plan details for specific information.</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg">
            <h3 className="font-semibold text-slate-900 mb-2">How long does KYC verification take?</h3>
            <p className="text-sm text-slate-600">KYC verification typically takes 1-2 business days after you submit all required documents.</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg">
            <h3 className="font-semibold text-slate-900 mb-2">When will I receive profit distributions?</h3>
            <p className="text-sm text-slate-600">Profit distributions are made according to your selected plan (monthly or quarterly) on the first week of each period.</p>
          </div>
        </CardContent>
      </Card>
    </div>);

}

// Main Component - Fixed Registration Flow
export default function InvestorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [investor, setInvestor] = useState(null);
  const [allocations, setAllocations] = useState([]); // This is FundAllocation (aggregated)
  const [wallet, setWallet] = useState(null);
  const [pendingInvestments, setPendingInvestments] = useState([]);
  const [investorStatus, setInvestorStatus] = useState('inactive');
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState('home');
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [hasUserChecked, setHasUserChecked] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null); // Track pending request
  const [refreshKey, setRefreshKey] = useState(0); // Add a key to trigger refresh for the main useEffect
  const [fundPlansMap, setFundPlansMap] = useState({}); // State to store fund plans map
  const [hasInvestorAccess, setHasInvestorAccess] = useState(false); // Added hasInvestorAccess state

  // Memoize user?.id to prevent unnecessary re-renders of usePageNotifications
  // This helps to prevent potential rate limit issues if the 'user' object reference changes frequently
  // but the 'id' itself remains the same, which could cause usePageNotifications to re-fetch unnecessarily.
  const userId = useMemo(() => user?.id, [user?.id]);

  // Page-specific notification hooks - Only load when user is available
  const walletNotifs = usePageNotifications(userId, 'wallet');
  const payoutNotifs = usePageNotifications(userId, 'payout');
  const reportNotifs = usePageNotifications(userId, 'report'); // This refers to the notifications for the reports page, which is now transactions

  useEffect(() => {
    const hash = window.location.hash.replace('#', '') || 'home';
    setCurrentView(hash);
  }, [location]);

  // Mark notifications as read when visiting a page - with delay and error handling
  useEffect(() => {
    if (!user || !investor) return;

    const markPageNotificationsRead = async () => {
      try {
        // Wait 3 seconds before marking as read to ensure badge is visible
        await new Promise((resolve) => setTimeout(resolve, 3000));

        switch (currentView) {
          case 'wallet':
            if (walletNotifs.count > 0) {
              await walletNotifs.markAsRead();
            }
            break;
          case 'payouts':
            if (payoutNotifs.count > 0) {
              await payoutNotifs.markAsRead();
            }
            break;
          case 'reports': // This 'reports' now refers to the transaction reports
            if (reportNotifs.count > 0) {
              await reportNotifs.markAsRead();
            }
            break;
          default:
            break;
        }
      } catch (error) {
        // Silently handle errors - don't show to user, just log
        console.error('Error marking notifications as read:', error);
      }
    };

    markPageNotificationsRead();
  }, [currentView, user, investor, walletNotifs, payoutNotifs, reportNotifs]);

  const loadInvestorData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Try to get current user
      let currentUser = null;
      try {
        currentUser = await User.me();
      } catch (error) {
        // User not logged in - show landing page
        setUser(null);
        setHasUserChecked(true);
        setIsLoading(false);
        setHasInvestorAccess(false);
        return;
      }

      setUser(currentUser);
      setHasUserChecked(true);

      // Add delays between API calls to avoid network congestion
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      // Fetch all fund plans upfront
      await delay(500);
      const allPlans = await FundPlan.list().catch((e) => {
        console.error("Failed to load fund plans:", e);
        return [];
      });
      const plansMap = allPlans.reduce((acc, plan) => {
        acc[plan.id] = plan;
        return acc;
      }, {});
      setFundPlansMap(plansMap);

      // Check if user has investor record
      await delay(1000);
      const investors = await Investor.filter({ user_id: currentUser.id }).catch((e) => {
        console.error("Failed to load investor data:", e);
        return [];
      });

      if (investors.length === 0) {
        // User logged in but no investor record - check for pending request
        await delay(1000);
        const requests = await InvestorRequest.filter({ user_id: currentUser.id }, '-created_date').catch((e) => {
          console.error("Failed to load investor requests:", e);
          return [];
        });

        if (requests.length > 0) {
          const latestRequest = requests[0];
          setPendingRequest(latestRequest);

          if (latestRequest.status === 'pending' || latestRequest.status === 'under_review') {
            setInvestorStatus('pending_approval');
            setShowRegistrationForm(false);
            setInvestor(null);
            setIsLoading(false);
            setHasInvestorAccess(false);
            return;
          } else if (latestRequest.status === 'rejected') {
            toast.error('Your previous registration was rejected. You can submit a new request.');
            setShowRegistrationForm(true);
            setInvestor(null);
            setIsLoading(false);
            setHasInvestorAccess(false);
            return;
          }
        } else {
          setShowRegistrationForm(true);
        }

        setInvestor(null);
        setIsLoading(false);
        setHasInvestorAccess(false);
        return;
      }

      // If investor record exists
      let investorData = investors[0];
      setPendingRequest(null);

      // CRITICAL FIX: Ensure investor status is active
      if (investorData.status !== 'active') {
        console.log(`Investor ${investorData.id} status was '${investorData.status}', setting to 'active'.`);
        await Investor.update(investorData.id, { status: 'active' });
        investorData = { ...investorData, status: 'active' };
      }

      // Load related data with delays and error handling
      await delay(1000);
      const allocs = await FundAllocation.filter({ investor_id: investorData.id }).catch((e) => {
        console.error("Failed to load fund allocations (aggregated):", e);
        return [];
      });

      await delay(1000);
      const walletResult = await FundWallet.filter({ investor_id: investorData.id }).catch((e) => {
        console.error("Failed to load fund wallet:", e);
        return [];
      });
      const walletData = walletResult.length > 0 ? walletResult[0] : null;

      await delay(1000);
      const pendingRequests = await InvestmentRequest.filter({ investor_id: investorData.id, status: 'pending_execution' }, '-created_date').catch((e) => {
        console.error("Failed to load pending investment requests:", e);
        return [];
      });

      const calculatedTotalInvested = allocs
        .filter((a) => a.status === 'active')
        .reduce((sum, a) => sum + (a.total_invested || 0), 0);

      const calculatedCurrentValue = allocs
        .filter((a) => a.status === 'active')
        .reduce((sum, a) => sum + (a.current_value || 0), 0);

      if (investorData.total_invested !== calculatedTotalInvested ||
        investorData.current_value !== calculatedCurrentValue) {
        const updatePayload = {
          total_invested: calculatedTotalInvested,
          current_value: calculatedCurrentValue,
          total_profit_loss: calculatedCurrentValue - calculatedTotalInvested
        };

        try {
          await Investor.update(investorData.id, updatePayload);
          investorData = { ...investorData, ...updatePayload };
        } catch (error) {
          console.error('Error updating investor totals:', error);
        }
      }

      setInvestor(investorData);
      setAllocations(allocs);
      setWallet(walletData);
      setPendingInvestments(pendingRequests);
      setInvestorStatus(investorData.status);
      setHasInvestorAccess(true);

    } catch (error) {
      console.error('Error loading investor data:', error);
      if (error.name !== 'AbortError' && error.message !== 'Request aborted' && !error.message?.includes('Network Error')) {
        toast.error('Failed to load investor data');
      }
      setHasInvestorAccess(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvestorData();
  }, [loadInvestorData, refreshKey]); // Kept refreshKey in useEffect to trigger reload

  const handleRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  const handleNavigate = (view) => {
    setCurrentView(view);
    window.location.hash = view;
  };

  const handleRegistrationSuccess = async () => {
    setShowRegistrationForm(false);
    toast.success('Registration submitted successfully! Awaiting approval.');
    window.location.reload();
  };

  // Define navigation items dynamically to include badges - only show badges when count > 0
  const navigationItems = [
    { view: 'profile', label: 'Profile', icon: UserIcon },
    { view: 'browse', label: 'Investment Plans', icon: TrendingUp },
    { view: 'allocations', label: 'My Investments', icon: Activity },
    {
      view: 'wallet',
      label: 'My Wallet',
      icon: Wallet,
      badge: walletNotifs.count > 0 ? walletNotifs.count : undefined
    },
    {
      view: 'payouts',
      label: 'Payouts & Withdrawals',
      icon: Download,
      badge: payoutNotifs.count > 0 ? payoutNotifs.count : undefined
    },
    {
      view: 'reports', // This now specifically points to the transaction reports
      label: 'Statements', // Updated label for clarity
      icon: FileText,
      badge: reportNotifs.count > 0 ? reportNotifs.count : undefined
    },
    { view: 'support', label: 'Support', icon: LifeBuoy }];


  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>);

  }

  // Not logged in - show landing page
  if (!hasUserChecked || !user) {
    return (
      <InvestorLandingPage
        onRegisterClick={() => User.login(window.location.href)} />);


  }

  // If logged in, but needs to register
  if (showRegistrationForm && user && !investor) {
    return <InvestorRegistrationForm user={user} onSuccess={handleRegistrationSuccess} onLogout={async () => { await User.logout(); window.location.href = '/'; }} />;
  }

  // FIX: User has pending request - show locked dashboard with banner
  if (investorStatus === 'pending_approval' || pendingRequest && (pendingRequest.status === 'pending' || pendingRequest.status === 'under_review')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        {/* Header with Pending Badge */}
        <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68bb21f4e5ccdcab161121f6/1dc7cf9b2_FinancialNetworkingLogoProtocol.png"
                  alt="Protocol Logo"
                  className="h-12" />

                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Investor Dashboard</h1>
                  <p className="text-sm text-slate-600">Registration Pending</p>
                </div>
              </div>

              {/* User Dropdown with Pending Badge */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 hover:bg-slate-100 rounded-xl px-4 py-2 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-500 to-orange-600 flex items-center justify-center text-white font-semibold">
                      {user.display_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm text-slate-900">{user.display_name}</p>
                      <div className="flex items-center gap-1">
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pending</Badge>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleNavigate('profile')}>
                    <UserIcon className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={async () => { await User.logout(); window.location.href = '/'; }} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Pending Approval Banner */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-2xl">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-yellow-600" />
              </div>

              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Registration Pending Approval
              </h2>

              <p className="text-lg text-slate-700 mb-8 max-w-2xl mx-auto">
                Your registration is pending Fund Manager approval. You'll be notified once approved and can start investing.
              </p>

              {/* Registration Details */}
              {pendingRequest &&
                <div className="bg-white rounded-xl p-6 max-w-md mx-auto mb-8">
                  <h3 className="font-semibold text-slate-900 mb-4">Submitted Information</h3>
                  <div className="space-y-3 text-left">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Name:</span>
                      <span className="font-medium text-slate-900">{pendingRequest.full_name || user.display_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Email:</span>
                      <span className="font-medium text-slate-900">{pendingRequest.email || user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Status:</span>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {pendingRequest.status === 'under_review' ? 'Under Review' : 'Pending'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Submitted:</span>
                      <span className="font-medium text-slate-900">
                        {new Date(pendingRequest.created_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              }

              {/* What Happens Next */}
              <div className="bg-blue-50 rounded-xl p-6 max-w-2xl mx-auto">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2 justify-center">
                  <AlertCircle className="w-5 h-5" />
                  What Happens Next?
                </h3>
                <ul className="space-y-2 text-sm text-blue-800 text-left max-w-md mx-auto">
                  <li className="flex gap-2">
                    <span>1.</span>
                    <span>Fund Manager will review your registration details</span>
                  </li>
                  <li className="flex gap-2">
                    <span>2.</span>
                    <span>You'll receive an email and in-app notification once approved</span>
                  </li>
                  <li className="flex gap-2">
                    <span>3.</span>
                    <span>After approval, you can access investment plans and start investing</span>
                  </li>
                </ul>
              </div>

              <Button
                onClick={() => window.location.href = createPageUrl('Dashboard')} // Refresh the page to trigger re-evaluation
                className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600">

                <Home className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>);

  }

  // User is approved investor - show full dashboard
  return (
    <InvestorLayout
      investor={investor}
      currentView={currentView}
      onNavigate={handleNavigate}
      navigationItems={navigationItems}
      pendingInvestments={pendingInvestments}
      investorStatus={investorStatus}
      fundPlansMap={fundPlansMap} // Pass fundPlansMap
    >
      {currentView === 'home' && investor && <DashboardHomeView investor={investor} wallet={wallet} allocations={allocations} onRefresh={handleRefresh} />}
      {currentView === 'browse' && investor && <BrowseFundPlansView investor={investor} wallet={wallet} allocations={allocations} />}
      {currentView === 'allocations' && investor && <AllocationsView investor={investor} wallet={wallet} />}
      {currentView === 'wallet' && investor && <WalletView investor={investor} wallet={wallet} allocations={allocations} onRefresh={handleRefresh} />}
      {currentView === 'payouts' && investor && <PayoutsView investor={investor} wallet={wallet} allocations={allocations} onRefresh={handleRefresh} />}
      {currentView === 'reports' && investor && <ReportsView investor={investor} />}
      {currentView === 'profile' && investor && <ProfileView investor={investor} user={user} onUpdate={handleRefresh} />}
      {currentView === 'support' && investor && <SupportView investor={investor} />}
    </InvestorLayout>);

}


// New KYC Approval Modal Component
function KYCApprovalModal({ isOpen, onClose, investorId, currentKycStatus, currentKycReason, onKycUpdateSuccess }) {
  const [kycStatus, setKycStatus] = useState(currentKycStatus || 'pending');
  const [rejectionReason, setRejectionReason] = useState(currentKycReason || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [investorName, setInvestorName] = useState(''); // To display investor name in modal

  useEffect(() => {
    setKycStatus(currentKycStatus || 'pending');
    setRejectionReason(currentKycReason || '');
    if (investorId) {
      const fetchInvestorName = async () => {
        try {
          const investorEntity = await Investor.get(investorId);
          setInvestorName(investorEntity?.full_name || `Investor ID: ${investorId}`);
        } catch (error) {
          console.error("Failed to fetch investor name for modal:", error);
          setInvestorName(`Investor ID: ${investorId}`);
        }
      };
      fetchInvestorName();
    }
  }, [isOpen, investorId, currentKycStatus, currentKycReason]);

  const handleSubmit = async () => {
    if (kycStatus === 'failed' && !rejectionReason.trim()) {
      toast.error('Rejection reason is required for failed KYC status.');
      return;
    }

    setIsSubmitting(true);
    try {
      await Investor.update(investorId, {
        kyc_status: kycStatus,
        kyc_rejection_reason: kycStatus === 'failed' ? rejectionReason.trim() : null
      });
      toast.success(`KYC status for ${investorName} updated to ${kycStatus}.`);
      if (onKycUpdateSuccess) onKycUpdateSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating KYC status:', error);
      toast.error('Failed to update KYC status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update KYC Status</DialogTitle>
          <DialogDescription>
            Review and update the KYC status for <span className="font-semibold text-slate-800">{investorName}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="kyc-status" className="text-right">
              Status
            </Label>
            <Select value={kycStatus} onValueChange={setKycStatus}>
              <SelectTrigger id="kyc-status" className="col-span-3">
                <SelectValue placeholder="Select KYC status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {kycStatus === 'failed' &&
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rejection-reason" className="text-right">
                Reason
              </Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason"
                className="col-span-3" />

            </div>
          }
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || kycStatus === currentKycStatus && rejectionReason === currentKycReason}
            className="bg-gradient-to-r from-blue-600 to-purple-600">

            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
