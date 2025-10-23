
import React, { useState, useEffect, useMemo } from 'react';
import { User } from '@/api/entities';
import { createPageUrl } from '@/utils';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  MessageSquareWarning,
  DollarSign,
  Settings,
  HelpCircle,
  LogOut,
  Shield,
  Activity,
  Vote,
  AlertTriangle,
  Gem,
  Star,
  GraduationCap,
  Briefcase,
  BookOpen,
  Award,
  TrendingUp,
  BarChart3,
  PieChart,
  Target,
  FileText,
  MessageSquare,
  BarChart,
  Wallet,
  Bell,
  Sparkles,
  LifeBuoy,
  Calendar,
  Megaphone,
  // RotateCcw // Removed RotateCcw icon as Refund Management is no longer a standalone tab
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';

// Import hooks and components for dynamic entities
import { useEntityConfigs } from '../components/hooks/useEntityConfigs';
import GenericEntityManagement from '../components/common/GenericEntityManagement';

// Import specific management components
import DashboardHome from '../components/superadmin/DashboardHome';
import UserManagement from '../components/superadmin/users/UserManagement';
import AdvisorManagement from '../components/superadmin/AdvisorManagement';
import FinfluencerManagement from '../components/superadmin/FinfluencerManagement';
import ContentModeration from '../components/superadmin/ContentModeration';
import Financials from '../components/superadmin/Financials';
import PlatformSettings from '../components/superadmin/PlatformSettings';
import FeedbackAndSupport from '../components/superadmin/FeedbackAndSupport';
import PollManagement from '../components/superadmin/PollManagement';
import AlertsManagement from '../components/superadmin/alerts/AlertsManagement';
import SubscriptionManagement from '../components/superadmin/SubscriptionManagement';
import ActivityTracker from '../components/superadmin/ActivityTracker';
import EventsManagement from '../components/superadmin/EventsManagement';
import PledgeManagement from '../components/superadmin/PledgeManagement';
import AdManagement from '../components/superadmin/AdManagement';
import ChatRoomManagement from '../components/superadmin/ChatRoomManagement';
import ProductLifecycleManager from '../components/superadmin/ProductLifecycleManager';
// RefundManagement is now integrated into Financials, so no direct import here
// import RefundManagement from '../components/superadmin/RefundManagement'; 

// Icon mapping for dynamic entities - includes all icons used in static tabs and dynamic configs
const iconMap = {
  LayoutDashboard, Users, ShieldCheck, Star, MessageSquareWarning, Vote, AlertTriangle, Gem,
  DollarSign, Settings, HelpCircle, Shield, GraduationCap, Briefcase, BookOpen, Award,
  TrendingUp, BarChart3, PieChart, Activity, Target, MessageSquare, BarChart, Wallet, Bell, Sparkles, LifeBuoy, FileText,
  Calendar,
  Megaphone,
  // RotateCcw // Removed RotateCcw from iconMap as it's not used for a standalone tab
};

export default function SuperAdmin() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [platformStats, setPlatformStats] = useState({
    totalUsers: 0,
    pendingModeration: 0,
    totalRevenue: 0,
    pendingAdvisors: 0
  });
  // New state variables for unread counts
  const [unreadFeedbackCount, setUnreadFeedbackCount] = useState(0); // Placeholder
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);     // Placeholder

  // Load dynamic entity configurations and get the refresh function
  const { configs: entityConfigs, isLoading: configsLoading, refresh: refreshEntityConfigs } = useEntityConfigs();

  // Define static tabs with value, label, icon, description, and color
  const staticTabs = useMemo(() => [
    { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Analytics & Overview', color: 'text-blue-600' },
    { value: 'users', label: 'User Management', icon: Users, description: 'Manage All Users', color: 'text-green-600' },
    { value: 'chatrooms', label: 'Chat Room Management', icon: MessageSquare, description: 'Manage Chat Rooms & Messages', color: 'text-cyan-600' },
    { value: 'content', label: 'Content Moderation', icon: MessageSquareWarning, description: 'Review Flagged Content', color: 'text-red-600' },
    { value: 'polls', label: 'Polls & Pledges', icon: Vote, description: 'Manage Community Polls & Pledges', color: 'text-cyan-600' },
    { value: 'pledge-management', label: 'Pledge Management', icon: Target, description: 'Manage Pledge Sessions & Executions', color: 'text-purple-600' },
    { value: 'ad-management', label: 'Ad Management', icon: Megaphone, description: 'Manage Vendor Ad Campaigns', color: 'text-teal-500' },
    { value: 'events', label: 'Events Management', icon: Calendar, description: 'Organize and manage community events', color: 'text-purple-500' },
    { value: 'lifecycle', label: 'Product Lifecycle Manager', icon: TrendingUp, description: 'Manage features, pages, and releases', color: 'text-indigo-600' },
    { value: 'financials', label: 'Financials', icon: Wallet, description: 'Revenue & Payouts', color: 'text-yellow-600' },
    { value: 'subscriptions', label: 'Subscriptions', icon: Sparkles, description: 'Plans, Pricing & Promos', color: 'text-rose-600' },
    // Removed standalone Refund Management tab
    { value: 'alerts', label: 'System Alerts', icon: Bell, description: 'Monitor System Alerts', color: 'text-orange-600' },
    { value: 'activity', label: 'Activity Tracker', icon: Activity, description: 'Monitor user and system activities', color: 'text-purple-600' },
    { value: 'feedback', label: 'Feedback & Support', icon: LifeBuoy, description: 'Feedback & Inquiries', color: 'text-indigo-600' },
    { value: 'settings', label: 'Platform Settings', icon: Settings, description: 'Platform Configuration', color: 'text-gray-600' },
  ], []);

  // Generate dynamic tabs from entity configurations with better error handling
  const dynamicTabs = useMemo(() => {
    if (configsLoading || !user || !Array.isArray(entityConfigs)) return [];

    try {
      const entitiesToDisplay = entityConfigs
        .filter(config => config && config.enabled && config.admin_visible && config.management_enabled)
        .sort((a, b) => {
          // Prioritize Advisor then FinInfluencer, then by sort_order
          const orderMap = { 'Advisor': -2, 'FinInfluencer': -1 };
          const aOrder = orderMap[a.entity_name] !== undefined ? orderMap[a.entity_name] : (a.sort_order || 999);
          const bOrder = orderMap[b.entity_name] !== undefined ? orderMap[b.entity_name] : (b.sort_order || 999);
          return aOrder - bOrder;
        });

      return entitiesToDisplay.map(config => {
        const IconComponent = iconMap[config.icon_name] || Shield;
        return {
          value: config.entity_name, // Use entity_name as value for direct mapping in renderContent
          label: config.display_name,
          icon: IconComponent,
          description: config.description,
          color: config.color || 'text-blue-600',
        };
      });
    } catch (error) {
      console.error('Error generating dynamic tabs:', error);
      return [];
    }
  }, [entityConfigs, configsLoading, user]);

  // Combine all tabs for rendering
  const allTabs = useMemo(() => {
    return [...staticTabs, ...dynamicTabs];
  }, [staticTabs, dynamicTabs]);


  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const currentUser = await User.me();
        // Check for specific roles 'super_admin' or 'admin'
        if (currentUser.app_role !== 'super_admin' && currentUser.app_role !== 'admin') {
          window.location.href = createPageUrl('Dashboard');
          return;
        }
        setUser(currentUser);
        await loadPlatformStats();
        // Fetch actual counts if available
        // setUnreadFeedbackCount(await fetchFeedbackCount());
        // setUnreadAlertsCount(await fetchAlertsCount());
      } catch (error) {
        console.error('Admin check error:', error);
        window.location.href = createPageUrl('Dashboard'); // Redirect on error
      } finally {
        setIsLoading(false);
      }
    };
    checkAdmin();
  }, []);

  const loadPlatformStats = async () => {
    try {
      const users = await User.list().catch(() => []);
      setPlatformStats({
        totalUsers: users.length,
        pendingModeration: 0, // Placeholder, fetch actual data if available
        totalRevenue: 240000, // Placeholder
        pendingAdvisors: 0 // Placeholder
      });
    } catch (error) {
      console.error("Error loading platform stats:", error);
    }
  };

  const renderContent = () => {
    const activeEntityConfig = entityConfigs.find(e => e.entity_name === activeTab);

    switch (activeTab) {
      case 'dashboard':
        return <DashboardHome user={user} platformStats={platformStats} />;
      case 'users':
        return <UserManagement user={user} refreshEntityConfigs={refreshEntityConfigs} />;
      case 'chatrooms':
        return <ChatRoomManagement user={user} />;
      case 'content':
        return <ContentModeration user={user} />;
      case 'polls':
        return <PollManagement user={user} />;
      case 'pledge-management':
        return <PledgeManagement user={user} />;
      case 'ad-management':
        return <AdManagement user={user} />;
      case 'events':
        return <EventsManagement user={user} />;
      case 'lifecycle':
        return <ProductLifecycleManager user={user} />;
      case 'financials':
        return <Financials user={user} />;
      case 'subscriptions':
        return <SubscriptionManagement user={user} />;
      // Removed standalone Refund Management case
      case 'alerts':
        return <AlertsManagement user={user} />;
      case 'activity':
        return <ActivityTracker user={user} />;
      case 'feedback':
        return <FeedbackAndSupport user={user} />;
      case 'settings':
        return <PlatformSettings user={user} />;
      case 'Advisor':
        return <AdvisorManagement user={user} entityConfig={activeEntityConfig} refreshEntityConfigs={refreshEntityConfigs} />;
      case 'FinInfluencer':
        return <FinfluencerManagement user={user} entityConfig={activeEntityConfig} refreshEntityConfigs={refreshEntityConfigs} />;
      default:
        // Handle any other dynamic entity generically
        if (activeEntityConfig) {
          return <GenericEntityManagement user={user} entityConfig={activeEntityConfig} refreshEntityConfigs={refreshEntityConfigs} />;
        }
        return <DashboardHome user={user} platformStats={platformStats} />; // Fallback
    }
  };

  if (isLoading || configsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Loading Super Admin Panel...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Access denied. Redirecting...</p>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-screen bg-gradient-to-br from-slate-100 to-slate-200 font-sans">
      {/* Sidebar */}
      <aside className="w-72 flex-shrink-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-200 flex flex-col shadow-2xl">
        <div className="h-20 flex items-center justify-center border-b border-slate-700 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Super Admin
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider px-2">Administration</div>
          <TabsList className="w-full grid grid-cols-1 h-auto bg-transparent p-0 space-y-1">
            {allTabs.map(tab => {
              const isActive = activeTab === tab.value;
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={`group flex items-center w-full justify-start px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 min-h-[60px] ${
                    isActive
                      ? '' // styles handled by data-[state=active]
                      : 'hover:bg-slate-700/50 hover:scale-102 text-left text-slate-200'
                  }`}
                >
                  <div className="w-5 h-5 mr-3 flex items-center justify-center flex-shrink-0">
                    {Icon && <Icon className={`w-5 h-5 ${isActive ? 'text-white' : tab.color}`} />}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold leading-tight">{tab.label}</div>
                    <div className={`text-xs leading-tight mt-0.5 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                      {tab.description}
                    </div>
                  </div>
                  {tab.value === 'feedback' && unreadFeedbackCount > 0 && (
                    <Badge className="ml-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">
                        {unreadFeedbackCount}
                    </Badge>
                  )}
                  {tab.value === 'alerts' && unreadAlertsCount > 0 && (
                    <Badge className="ml-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">
                        {unreadAlertsCount}
                    </Badge>
                  )}
                  {isActive && (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse flex-shrink-0"></div>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </nav>
        <div className="p-4 border-t border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <img
                src={user.profile_image_url || `https://avatar.vercel.sh/${user.email}.png`}
                alt="Admin"
                className="w-12 h-12 rounded-full ring-2 ring-blue-500"
              />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900"></div>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white">{user.display_name}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/50">
                  {user.app_role}
                </Badge>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
          <button
            onClick={async () => {
              await User.logout();
              window.location.href = createPageUrl('Dashboard');
            }}
            className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-auto">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center px-8 justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {(() => {
                const currentNavItem = allTabs.find(item => item.value === activeTab);
                const IconComponent = currentNavItem?.icon;
                return IconComponent ? <IconComponent className={`w-8 h-8 ${currentNavItem.color}`} /> : null;
              })()}
              <div>
                <h1 className="text-2xl font-bold text-slate-800">{allTabs.find(item => item.value === activeTab)?.label}</h1>
                <p className="text-sm text-slate-500">
                  {allTabs.find(item => item.value === activeTab)?.description}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Activity className="w-4 h-4 text-green-500" />
              <span>System Healthy</span>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {user.app_role}
            </Badge>
          </div>
        </header>

        <div className="flex-1 p-8 bg-gradient-to-br from-slate-50 to-white overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <TabsContent value={activeTab} className="mt-0">
              {renderContent()}
            </TabsContent>
          </div>
        </div>
      </main>
    </Tabs>
  );
}
