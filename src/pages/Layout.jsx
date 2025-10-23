

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Home,
  MessageSquare,
  BarChart3,
  Star,
  Settings,
  TrendingUp,
  Users,
  Shield,
  Crown,
  CalendarDays,
  Briefcase,
  BookUser,
  LayoutDashboard,
  GraduationCap,
  Award,
  Loader2,
  Wallet,
  Megaphone,
  Vote, Target, Calendar, Sparkles, Bell, Activity, LifeBuoy, LogOut
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User } from '@/api/entities';
import NotificationPanel from "./components/notifications/NotificationPanel";
import { EntityConfigProvider } from './components/context/EntityConfigProvider';
import { useEntityConfigs } from './components/hooks/useEntityConfigs';
import { SubscriptionProvider } from './components/context/SubscriptionProvider';
import { useSubscription } from './components/hooks/useSubscription';
import { FeatureConfigProvider } from './components/context/FeatureConfigProvider';
import { usePageConfig } from './components/hooks/usePageConfig';
import PageAccessControl from './components/common/PageAccessControl';
import SubmitReviewModal from './components/reviews/SubmitReviewModal';
import { toast } from 'sonner';

const iconMap = {
  BookUser, Star, GraduationCap, Award, Shield, Users,
  Briefcase, Home, MessageSquare, BarChart3, TrendingUp, CalendarDays, Crown, LayoutDashboard, Settings, Megaphone,
  Wallet, Vote, Target, Calendar, Sparkles, Bell, Activity, LifeBuoy, LogOut
};

function InnerLayout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isPublicPage, setIsPublicPage] = useState(false);
  const [isAuthCheckComplete, setIsAuthCheckComplete] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const { configs: entityConfigs, isLoading: configsLoading, error: configsError } = useEntityConfigs();
  const { isSubscribed, isLoading: subscriptionLoading } = useSubscription();
  const { getPageByKey, canAccessPage, getVisiblePages, isLoading: pageConfigLoading } = usePageConfig();

  const currentPageConfig = useMemo(() => {
    if (!currentPageName) return null;
    
    const featureKey = currentPageName
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
    
    return getPageByKey(featureKey);
  }, [currentPageName, getPageByKey]);

  const [pageAccessDenied, setPageAccessDenied] = useState(false);
  const [accessDenialReason, setAccessDenialReason] = useState(false);

  // ✅ FIX: Enhanced Auth Check with AbortController
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const checkAuthAndSettings = async () => {
      setIsAuthCheckComplete(false);
      try {
        const platformPublicRoutes = ['/login', '/signup', '/Dashboard', '/', '/InvestorDashboard'];
        const isCurrentlyPublic = platformPublicRoutes.includes(location.pathname);
        
        if (isMounted) {
          setIsPublicPage(isCurrentlyPublic);
        }

        const isImpersonating = localStorage.getItem('impersonated_user_id') !== null;

        let currentUser = null;
        try {
          currentUser = await User.me();
        } catch (error) {
          // ✅ FIX: Ignore abort errors
          if (error.name === 'AbortError' || error.message?.includes('aborted')) {
            console.log('[Layout] Auth check aborted (component unmounted)');
            return;
          }
          
          if (!isCurrentlyPublic && isMounted) {
            console.warn("User not authenticated for private page");
          }
        }

        if (!isMounted) return;

        if (currentUser && !isImpersonating && !currentUser.app_role) {
            const postRegDataStr = localStorage.getItem(`post_registration_data_${currentUser.email}`);
            if (postRegDataStr) {
                try {
                    const postRegData = JSON.parse(postRegDataStr);
                    await User.update(currentUser.id, postRegData);
                    localStorage.removeItem(`post_registration_data_${currentUser.email}`);
                    const updatedUser = await User.me();
                    if (isMounted) setUser(updatedUser);
                } catch (e) {
                    // ✅ FIX: Ignore abort errors
                    if (e.name === 'AbortError' || e.message?.includes('aborted')) {
                      return;
                    }
                    console.error("Error processing post-registration data:", e);
                    if (isMounted) setUser(currentUser);
                }
            } else if (isMounted) {
                setUser(currentUser);
            }
        } else if (isMounted) {
            setUser(currentUser);
        }
      } catch (error) {
        // ✅ FIX: Better error handling for aborted requests
        if (error.name === 'AbortError' || error.message?.includes('aborted')) {
          console.log('[Layout] Auth check cancelled');
          return;
        }
        
        if (isMounted) {
          console.error("Error during initial auth/settings check:", error);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsAuthCheckComplete(true);
        }
      }
    };

    checkAuthAndSettings();

    return () => {
      isMounted = false;
      abortController.abort(); // Cancel any pending requests
    };
  }, [location.pathname]);

  // --- HOOK 2: Role-based Redirection (UPDATED - SuperAdmin Bypass) ---
  useEffect(() => {
    if (isAuthCheckComplete && user) {
      // ✅ NEW: SuperAdmin/Admin can access ANY page - bypass all restrictions
      if (['admin', 'super_admin'].includes(user.app_role)) {
        return; // No redirection for SuperAdmin/Admin
      }

      // Regular users: Apply role-based redirection
      const isEntityUser = ['finfluencer', 'advisor', 'educator'].includes(user.app_role);
      const isOnEntityDashboard = location.pathname.includes('EntityDashboard');
      const isVendorUser = user.app_role === 'vendor';
      const isOnVendorDashboard = location.pathname.includes('VendorDashboard');

      if (isEntityUser && !isOnEntityDashboard) {
        window.location.href = createPageUrl("EntityDashboard");
      } else if (isVendorUser && !isOnVendorDashboard) {
        window.location.href = createPageUrl("VendorDashboard");
      }
    }
  }, [user, isAuthCheckComplete, location.pathname]);

  // NEW HOOK: Check page access control (UPDATED - SuperAdmin Bypass)
  useEffect(() => {
    if (!isAuthCheckComplete || pageConfigLoading) return;
    
    // ✅ NEW: SuperAdmin/Admin bypass all page access checks
    if (user && ['admin', 'super_admin'].includes(user.app_role)) {
      setPageAccessDenied(false);
      setAccessDenialReason(null);
      return;
    }
    
    if (!currentPageConfig) {
      setPageAccessDenied(false);
      setAccessDenialReason(null);
      return;
    }

    const hasAccess = canAccessPage(currentPageConfig, user, isSubscribed);
    
    if (!hasAccess) {
      let reason = 'access_denied';
      
      if (!user) {
        reason = 'not_authenticated';
      } else if (currentPageConfig.visibility_rule === 'subscribed_user' && !isSubscribed) {
        reason = 'not_subscribed';
      } else if (
        (currentPageConfig.visibility_rule === 'admin_only' && !['admin', 'super_admin'].includes(user.app_role)) ||
        (currentPageConfig.visibility_rule === 'super_admin_only' && user.app_role !== 'super_admin')
      ) {
        reason = 'insufficient_role';
      }
      
      setAccessDenialReason(reason);
      setPageAccessDenied(true);
    } else {
      setPageAccessDenied(false);
      setAccessDenialReason(null);
    }
  }, [currentPageConfig, user, isSubscribed, isAuthCheckComplete, pageConfigLoading, canAccessPage]);

  const displayNavigationItems = useMemo(() => {
    if (!isAuthCheckComplete || configsLoading || pageConfigLoading) {
        return [];
    }

    const skipSubscriptionCheck = !user || ['admin', 'super_admin'].includes(user?.app_role) || isPublicPage;
    
    if (!skipSubscriptionCheck && subscriptionLoading) {
        return [];
    }

    const navItemsMap = new Map();

    const visiblePages = getVisiblePages(user, isSubscribed);
    
    visiblePages
      .filter(page => page.route_path !== '/ReferralDashboard')
      .forEach(page => {
        const IconComponent = iconMap[page.icon_name] || Settings;
        
        const routeName = page.route_path.startsWith('/') ? page.route_path.substring(1) : page.route_path;
        const formattedRouteName = routeName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
        const pageUrl = createPageUrl(formattedRouteName);

        if (!navItemsMap.has(pageUrl)) {
          navItemsMap.set(pageUrl, {
            title: page.feature_name,
            url: pageUrl,
            icon: IconComponent,
            badge: page.status === 'placeholder' ? {
              text: 'Soon',
              color: 'bg-purple-50 text-purple-700 border-purple-200'
            } : page.status === 'partial' || page.status === 'beta' ? {
              text: 'Beta',
              color: 'bg-yellow-50 text-yellow-700 border-yellow-200'
            } : null,
            sortOrder: page.sort_order || 0
          });
        }
      });

    if (!configsError && Array.isArray(entityConfigs)) {
      entityConfigs
        .filter(config => config && config.enabled && config.user_visible)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        .forEach(config => {
          const displayTitle = config.display_name === 'Admin Picks' ? 'Advisor Picks' : config.display_name;
          
          let pageName;
          if (config.entity_name === 'FinInfluencer') {
            pageName = 'Finfluencers';
          } else if (config.entity_name === 'Educator') {
            pageName = 'Educators';
          } else if (config.entity_name === 'Advisor') {
            pageName = 'Advisors';
          } else {
            pageName = `${config.entity_name}s`;
          }
          
          const entityUrl = createPageUrl(pageName);
          const Icon = iconMap[config.icon_name] || Settings;
          
          if (!navItemsMap.has(entityUrl)) {
            navItemsMap.set(entityUrl, {
              title: displayTitle,
              url: entityUrl,
              icon: Icon,
              sortOrder: config.sort_order || 999
            });
          }
        });
    }

    // Add "Organize Events" for Advisors, Finfluencers, Educators
    if (user && ['advisor', 'finfluencer', 'educator'].includes(user.app_role)) {
      const organizeEventsUrl = createPageUrl('OrganizerDashboard');
      if (!navItemsMap.has(organizeEventsUrl)) {
        navItemsMap.set(organizeEventsUrl, {
          title: 'Organize Events',
          url: organizeEventsUrl,
          icon: CalendarDays,
          sortOrder: 500
        });
      }
    }

    const combinedNav = Array.from(navItemsMap.values())
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    return combinedNav;

  }, [user, configsLoading, entityConfigs, configsError, isAuthCheckComplete, isPublicPage, subscriptionLoading, isSubscribed, pageConfigLoading, getVisiblePages]);

  const handleLogout = useCallback(async () => {
    try {
      await User.logout();
      toast.success("Logged out successfully!");
      window.location.href = createPageUrl("Login");
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("Failed to log out. Please try again.");
    }
  }, []);

  // Conditional rendering based on auth check status and new page config loading
  if (!isAuthCheckComplete || pageConfigLoading || configsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  // If it's a public page and no user is logged in, render its content directly without the layout chrome
  if (isPublicPage && !user) {
    return <>{children}</>;
  }

  // If it's a private page and user is not authenticated, indicate redirection to login
  if (!user && !isPublicPage) {
    return (
        <div className="flex h-screen items-center justify-center bg-slate-100">
            <p>Redirecting to login...</p>
        </div>
    );
  }

  // Special override for SuperAdmin page: always render its content directly
  // This is handled by the general admin/super_admin bypass for role-based redirection and access checks now.
  // The specific "SuperAdmin" page is typically an internal tool, so rendering it directly without layout chrome is fine.
  if (currentPageName === 'SuperAdmin') {
    return <>{children}</>;
  }

  // Special override for InvestorDashboard and FundManager pages: render their content directly without the main layout
  if (currentPageName === 'InvestorDashboard' || currentPageName === 'FundManager' || currentPageName?.startsWith('InvestorDashboard_') || currentPageName?.startsWith('FundManager_')) {
    return <>{children}</>;
  }

  // ✅ UPDATED: If access to the current page is denied, render the PageAccessControl component
  // This now checks if the user is NOT an admin or super_admin before denying access.
  if (pageAccessDenied && currentPageConfig && user && !['admin', 'super_admin'].includes(user.app_role)) {
    return <PageAccessControl pageConfig={currentPageConfig} user={user} isSubscribed={isSubscribed} reason={accessDenialReason} />;
  }

  // ✅ UPDATED: If the current page is a placeholder, partial, or disabled, display a "Coming Soon" or "Under Development" message
  // This also checks if the user is NOT an admin or super_admin, allowing these roles to view pages regardless of status.
  if (currentPageConfig && ['placeholder', 'partial', 'disabled'].includes(currentPageConfig.status) && user && !['admin', 'super_admin'].includes(user.app_role)) {
    return <PageAccessControl pageConfig={currentPageConfig} user={user} isSubscribed={isSubscribed} reason={currentPageConfig.status} />;
  }

  return (
    <SidebarProvider>
      <style>
        {`
          .sidebar-content-scrollable {
            scrollbar-width: thin;
            scrollbar-color: #ccc #f1f1f1;
          }

          .sidebar-content-scrollable::-webkit-scrollbar {
            width: 6px;
          }

          .sidebar-content-scrollable::-webkit-scrollbar-track {
            background: #f1f1f1;
          }

          .sidebar-content-scrollable::-webkit-scrollbar-thumb {
            background: #ccc;
            border-radius: 3px;
          }

          .sidebar-content-scrollable::-webkit-scrollbar-thumb:hover {
            background: #aaa;
          }

          .sidebar-logo img {
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .btn-primary, button, .btn, [role="button"] {
            border-radius: 12px !important;
            transition: all 0.3s ease !important;
          }

          .btn-primary {
            background-image: linear-gradient(to right, #2563eb, #7c3aed) !important;
            color: white !important;
            border-radius: 12px !important;
            padding: 10px 20px !important;
            box-shadow: 0 4px 14px 0 rgb(0 0 0 / 10%) !important;
            border: none !important;
            font-weight: 600 !important;
          }

          .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px 0 rgb(0 0 0 / 15%) !important;
          }

          .bg-primary.text-primary-foreground {
            background-image: linear-gradient(to right, #2563eb, #7c3aed) !important;
            color: white !important;
            border-radius: 12px !important;
            padding: 10px 20px !important;
            box-shadow: 0 4px 14px 0 rgb(0 0 0 / 10%) !important;
            border: none !important;
            font-weight: 600 !important;
          }

          .bg-primary.text-primary-foreground:hover {
            background-image: linear-gradient(to right, #2563eb, #7c3aed) !important;
            opacity: 0.9;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px 0 rgb(0 0 0 / 15%) !important;
          }

          button[data-variant="outline"], .btn-outline {
            border-radius: 12px !important;
            border: 2px solid #e2e8f0 !important;
            background: white !important;
            transition: all 0.3s ease !important;
            font-weight: 500 !important;
          }

          button[data-variant="outline"]:hover, .btn-outline:hover {
            border-color: #3b82f6 !important;
            background: #f8fafc !important;
            transform: translateY(-1px) !important;
          }

          button[data-variant="ghost"], .btn-ghost {
            border-radius: 12px !important;
            background: transparent !important;
            transition: all 0.3s ease !important;
          }

          button[data-variant="ghost"]:hover, .btn-ghost:hover {
            background: rgba(59, 130, 246, 0.1) !important;
            transform: translateY(-1px) !important;
          }

          .bg-green-600, button.bg-green-600 {
            border-radius: 12px !important;
            box-shadow: 0 4px 14px 0 rgb(0 0 0 / 10%) !important;
            transition: all 0.3s ease !important;
          }

          .bg-green-600:hover, button.bg-green-600:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 20px 0 rgb(0 0 0 / 15%) !important;
          }

          .bg-red-600, button.bg-red-600 {
            border-radius: 12px !important;
            box-shadow: 0 44px 14px 0 rgb(0 0 0 / 10%) !important;
            transition: all 0.3s ease !important;
          }

          .bg-red-600:hover, button.bg-red-600:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 20px 0 rgb(0 0 0 / 15%) !important;
          }

          .bg-purple-600, button.bg-purple-600 {
            border-radius: 12px !important;
            box-shadow: 0 4px 14px 0 rgb(0 0 0 / 10%) !important;
            transition: all 0.3s ease !important;
          }

          .bg-purple-600:hover, button.bg-purple-600:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 20px 0 rgb(0 0 0 / 15%) !important;
          }

          .search-bar-input {
            height: 2.5rem !important;
            width: 100% !important;
            border-radius: 0.75rem !important;
            border: 1px solid #e2e8f0 !important;
            background-color: white !important;
            padding-top: 0.5rem !important;
            padding-bottom: 0.5rem !important;
            padding-right: 0.75rem !important;
            padding-left: 2.5rem !important;
            font-size: 0.875rem !important;
            color: #0f172a !important;
            outline: none !important;
            box-shadow: none !important;
            transition: all 0.2s ease-in-out !important;
          }

          .search-bar-input:focus {
              border-color: #3b82f6 !important;
              box-shadow: 0 0 0 1px #3b82f6 !important;
          }

          .finfluencer-tabs > [role="tablist"] {
            background: transparent !important;
            border: none !important;
            padding: 0 !important;
            gap: 0.5rem !important;
          }

          .finfluencer-tabs > [role="tablist"] > [data-state="inactive"] {
            /* Applied embossed gradient styling */
            background: linear-gradient(to right, #eff6ff, #f3e8ff) !important;
            color: #1e40af !important; /* Changed text color for better contrast with the light gradient */
            border-radius: 0.75rem !important;
            padding: 0.625rem 1.25rem !important;
            font-weight: 600 !important;
            box-shadow: 0 2px 8px 0 rgb(0 0 0 / 8%) !important; /* Subtle shadow for embossed effect */
            transition: all 0.3s ease !important;
            border: 1px solid #e5e7eb !important; /* Subtle border */
          }

          .finfluencer-tabs > [role="tablist"] > [data-state="inactive"]:hover {
            /* Stronger gradient on hover, mimicking active style */
            background: linear-gradient(to right, #2563eb, #7c3aed) !important;
            color: white !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 12px 0 rgb(0 0 0 / 12%) !important; /* Slightly stronger shadow */
            border: none !important; /* Match active style, which has no border */
          }

          .finfluencer-tabs > [role="tablist"] > [data-state="active"] {
            background: linear-gradient(to right, #2563eb, #7c3aed) !important;
            color: white !important;
            border-radius: 0.75rem !important;
            padding: 0.625rem 1.25rem !important;
            font-weight: 600 !important;
            box-shadow: 0 4px 14px 0 rgb(0 0 0 / 15%) !important;
            border: none !important;
          }

          .profile-nav-tabs {
            background: transparent !important;
            padding: 0 !important;
            border-radius: 0 !important;
          }

          .profile-nav-tabs [data-state="inactive"] {
            background: linear-gradient(to right, #eff6ff, #f3e8ff) !important;
            color: #1e40af !important;
            border-radius: 0.75rem !important;
            padding: 0.5rem 1rem !important;
            font-weight: 600 !important;
            box-shadow: 0 2px 8px 0 rgb(0 0 0 / 8%) !important;
            transition: all 0.3s ease !important;
            border: 1px solid #e5e7eb !important;
          }

          .profile-nav-tabs [data-state="inactive"]:hover {
            background: linear-gradient(to right, #2563eb, #7c3aed) !important;
            color: white !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 12px 0 rgb(0 0 0 / 12%) !important;
          }

          .profile-nav-tabs [data-state="active"] {
            background: linear-gradient(to right, #2563eb, #7c3aed) !important;
            color: white !important;
            border-radius: 0.75rem !important;
            padding: 0.5rem 1rem !important;
            font-weight: 600 !important;
            box-shadow: 0 4px 14px 0 rgb(0 0 0 / 15%) !important;
            border: none !important;
          }

          .alert-modal-tabs > [role="tablist"] {
            background: transparent !important;
            border: none !important;
            padding: 0 !important;
            gap: 0.5rem !important;
          }

          .alert-modal-tabs > [role="tablist"] > [data-state="inactive"] {
            background: linear-gradient(to right, #eff6ff, #f3e8ff) !important;
            color: #1e40af !important;
            border-radius: 0.75rem !important;
            padding: 0.625rem 1.25rem !important;
            font-weight: 600 !important;
            box-shadow: 0 2px 8px 0 rgb(0 0 0 / 8%) !important;
            transition: all 0.3s ease !important;
            border: 1px solid #e5e7eb !important;
          }

          .alert-modal-tabs > [role="tablist"] > [data-state="inactive"]:hover {
            background: linear-gradient(to right, #2563eb, #7c3aed) !important;
            color: white !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 12px 0 rgb(0 0 0 / 12%) !important;
          }

          .alert-modal-tabs > [role="tablist"] > [data-state="active"] {
            background: linear-gradient(to right, #2563eb, #7c3aed) !important;
            color: white !important;
            border-radius: 0.75rem !important;
            padding: 0.625rem 1.25rem !important;
            font-weight: 600 !important;
            box-shadow: 0 4px 14px 0 rgb(0 0 0 / 15%) !important;
            border: none !important;
          }

          .events-nav-tabs > [role="tablist"] {
            background: transparent !important;
            border: none !important;
            padding: 0 !important;
            gap: 0.5rem !important;
          }

          .events-nav-tabs > [role="tablist"] > [data-state="inactive"] {
            background: linear-gradient(to right, #eff6ff, #f3e8ff) !important;
            color: #1e40af !important;
            border-radius: 0.75rem !important;
            padding: 0.625rem 1.25rem !important;
            font-weight: 600 !important;
            box-shadow: 0 2px 8px 0 rgb(0 0 0 / 8%) !important;
            transition: all 0.3s ease !important;
            border: 1px solid #e5e7eb !important;
          }

          .events-nav-tabs > [role="tablist"] > [data-state="inactive"]:hover {
            background: linear-gradient(to right, #2563eb, #7c3aed) !important;
            color: white !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 12px 0 rgb(0 0 0 / 12%) !important;
          }

          .events-nav-tabs > [role="tablist"] > [data-state="active"] {
            background: linear-gradient(to right, #2563eb, #7c3aed) !important;
            color: white !important;
            border-radius: 0.75rem !important;
            padding: 0.625rem 1.25rem !important;
            font-weight: 600 !important;
            box-shadow: 0 4px 14px 0 rgb(0 0 0 / 15%) !important;
            border: none !important;
          }

          .locked-poll-card {
            filter: blur(2px);
            opacity: 0.7;
            pointer-events: none;
          }

          .locked-poll-card:hover {
            filter: blur(2px);
            opacity: 0.7;
          }

          .card, [data-ui="card"] {
            border-radius: 16px !important;
          }

          .badge, [data-ui="badge"] {
            border-radius: 8px !important;
          }

          input, .input, [data-ui="input"] {
            border-radius: 8px !important;
          }

          .select, [data-ui="select"] {
            border-radius: 8px !important;
          }
        `}
      </style>
      <div className="flex h-screen w-full bg-gray-50">
        <Sidebar className="border-r border-gray-200 bg-white hidden md:flex md:flex-col">
          <SidebarHeader className="border-b border-gray-200">
            <div className="sidebar-logo">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68bb21f4e5ccdcab161121f6/1dc7cf9b7_FinancialNetworkingLogoProtocol.png"
                alt="Protocol Logo" />
            </div>
          </SidebarHeader>

          <SidebarContent className="sidebar-content-scrollable flex-1 flex flex-col gap-2 overflow-y-auto p-3">
            {user &&
            <div className="mb-4">
                <Link to={createPageUrl("Profile")} className="block">
                  <div className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-md hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 cursor-pointer text-white">

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {user.profile_image_url ?
                      <img src={user.profile_image_url} alt={user.display_name} className="w-10 h-10 rounded-full object-cover" /> :

                      user.display_name?.charAt(0)?.toUpperCase() || 'U'
                      }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate text-sm">{user.display_name || 'Trader'}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            }

            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 py-2">
                Trading Hub
              </SidebarGroupLabel>
              <SidebarMenu>
                  {displayNavigationItems.map((item) =>
                  <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                      asChild
                      className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 transition-all duration-200 rounded-xl mb-1 ${
                      location.pathname === item.url ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold shadow-md' : ''}`
                      }>
                        <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                          {/* NEW: Display general badges from page_config, if available */}
                          {item.badge && (
                            <Badge variant="outline" className={`ml-auto text-xs ${item.badge.color}`}>
                              {item.badge.text}
                            </Badge>
                          )}
                          {/* Existing subscription badge logic, retained for specific conditional display */}
                          {item.title === 'Subscription' && user && !['admin', 'super_admin'].includes(user.app_role) && (
                            isSubscribed ? (
                              <Badge variant="outline" className="ml-auto bg-green-50 text-green-700 text-xs border-green-200">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="ml-auto bg-purple-50 text-purple-700 text-xs border-purple-200">
                                Premium
                              </Badge>
                            )
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupContent>
                <div className="px-3 py-2 space-y-3">
                  {user && !isSubscribed && !['admin', 'super_admin', 'vendor'].includes(user.app_role) && ( 
                    <Link to={createPageUrl("Subscription")} className="block">
                       <div className="rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 p-4 text-white shadow-md cursor-pointer hover:shadow-lg transition-all">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                           <Crown className="w-4 h-4"/>
                           Upgrade to Premium
                        </h3>
                        <p className="text-xs opacity-80 mt-1">Unlock advisor picks, premium polls, and exclusive content</p>
                      </div>
                    </Link>
                  )}
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-200 p-4 mt-auto">
            {/* Add Review Link */}
            <Button
              variant="outline"
              className="w-full mb-3 border-slate-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-300 transition-all duration-300"
              onClick={() => setShowReviewModal(true)}
            >
              <Star className="w-4 h-4 mr-2 text-yellow-500 fill-yellow-500" />
              Write a Review
            </Button>
            
            <div className="flex items-center gap-3">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68bb21f4e5ccdcab161121f6/1dc7cf9b7_FinancialNetworkingLogoProtocol.png"
                alt="Protocol Logo"
                className="w-10 h-10 rounded-lg object-cover" />

              <div className="flex-1 min-w-0">
                <p className="text-gray-900 text-sm font-semibold truncate">Protocol</p>
                <p className="text-xs text-gray-500 truncate">Protected Identity</p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header with Logout */}
          <header className="bg-white border-b border-gray-200 px-4 py-3 md:hidden flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68bb21f4e5ccdcab161121f6/1dc7cf9b7_FinancialNetworkingLogoProtocol.png"
                alt="Protocol Logo"
                className="h-8" />
            </div>
            <div className="flex items-center gap-2"> {/* Wrapper for NotificationPanel and Logout */}
              <NotificationPanel />
              {user && (
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                  <LogOut className="h-5 w-5" />
                </Button>
              )}
            </div>
          </header>

          {/* Impersonation Banner */}
          {user && user.isImpersonated && (
            <div className="bg-yellow-400 text-yellow-900 px-4 py-2 text-center text-sm font-semibold flex items-center justify-center gap-4">
              <span>You are impersonating: <strong>{user.display_name}</strong> ({user.email})</span>
              <button 
                onClick={() => {
                  localStorage.removeItem('impersonated_user_id');
                  window.location.reload();
                }}
                className="bg-yellow-800 text-white px-3 py-1 rounded-md text-xs hover:bg-yellow-900"
              >
                Exit Impersonation
              </button>
            </div>
          )}

          {/* Desktop Notification Panel with Logout */}
          <div className="hidden md:flex justify-end items-center gap-3 p-4 bg-white border-b border-gray-200">
            <NotificationPanel />
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await User.logout();
                  toast.success('Logged out successfully');
                  window.location.href = createPageUrl("Login"); // Redirect to login page
                } catch (error) {
                  console.error("Error logging out:", error);
                  toast.error('Failed to logout');
                }
              }}
              className="bg-gradient-to-r from-blue-50 to-purple-50 text-slate-900 border-purple-200 hover:from-blue-100 hover:to-purple-100 transition-all duration-300"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Review Modal */}
      <SubmitReviewModal
        open={showReviewModal}
        onClose={() => setShowReviewModal(false)}
      />
    </SidebarProvider>
  );
}


// The main export now wraps the application with EntityConfigProvider, SubscriptionProvider, and FeatureConfigProvider
export default function Layout({ children, currentPageName }) {
  return (
    <EntityConfigProvider>
      <SubscriptionProvider>
        <FeatureConfigProvider>
          <InnerLayout currentPageName={currentPageName}>
            {children}
          </InnerLayout>
        </FeatureConfigProvider>
      </SubscriptionProvider>
    </EntityConfigProvider>
  );
}

