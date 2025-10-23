import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User } from '@/api/entities';
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
  TrendingUp,
  Users,
  FileText,
  BarChart3,
  Activity,
  ChevronDown,
  Shield,
  LogOut,
  Home
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function FundManagerLayout({ children, activePage }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const currentUser = await User.me();
        
        // Only super_admin can access fund manager
        if (currentUser.app_role !== 'super_admin' && currentUser.app_role !== 'admin') {
          toast.error('Access denied: Admin privileges required');
          navigate(createPageUrl('Dashboard'));
          return;
        }

        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
        toast.error('Authentication failed');
        navigate(createPageUrl('Dashboard'));
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [navigate]);

  const navigationItems = [
    { path: 'FundManager_Plans', label: 'Fund Plans', icon: TrendingUp },
    { path: 'FundManager_Investors', label: 'Investors', icon: Users },
    { path: 'FundManager_Transactions', label: 'Transactions', icon: FileText },
    { path: 'FundManager_Allocations', label: 'Allocations', icon: BarChart3 },
    { path: 'FundManager_Reports', label: 'Reports', icon: Activity },
  ];

  const handleLogout = async () => {
    try {
      await User.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleBackToAdmin = () => {
    navigate(createPageUrl('SuperAdmin'));
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-purple-50">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-lg">
        {/* Logo Section */}
        <div className="h-20 flex items-center justify-center border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-7 h-7" />
            Fund Manager
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigationItems.map((item) => {
            const isActive = activePage === item.path.replace('FundManager_', '').toLowerCase();
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={createPageUrl(item.path)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                    : 'hover:bg-slate-100 text-slate-700 hover:text-indigo-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 space-y-3">
          <button
            onClick={handleBackToAdmin}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
          >
            <Home className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Admin Panel</span>
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
            <h1 className="text-2xl font-bold text-slate-900">Fund Management System</h1>
            <p className="text-sm text-slate-500">Manage investment funds and investors</p>
          </div>

          <div className="flex items-center gap-4">
            {/* SuperAdmin Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-all">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user?.profile_image_url} alt={user?.display_name} />
                    <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                      {user?.display_name?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-semibold text-slate-900">{user?.display_name}</p>
                    <p className="text-xs text-slate-500 uppercase">{user?.app_role}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Admin Profile</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <div className="px-2 py-3 space-y-2">
                  <div>
                    <p className="text-xs text-slate-500">Name</p>
                    <p className="font-medium text-sm">{user?.display_name}</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="font-medium text-sm">{user?.email}</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Role</p>
                    <p className="font-medium text-sm uppercase">{user?.app_role}</p>
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