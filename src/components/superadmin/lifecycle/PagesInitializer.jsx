import React, { useState } from 'react';
import { FeatureConfig } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

// Registry of all existing pages in the application
const EXISTING_PAGES = [
  { key: 'dashboard', name: 'Dashboard', route: '/Dashboard', icon: 'Home', tier: 'basic', description: 'Main trading dashboard with market overview' },
  { key: 'chat_rooms', name: 'Chat Rooms', route: '/ChatRooms', icon: 'MessageSquare', tier: 'basic', description: 'Stock discussion chat rooms' },
  { key: 'polls', name: 'Community Polls', route: '/Polls', icon: 'BarChart3', tier: 'basic', description: 'Community voting on stock picks' },
  { key: 'my_stocks', name: 'My Investments', route: '/MyStocks', icon: 'TrendingUp', tier: 'basic', description: 'Portfolio tracking and management' },
  { key: 'events', name: 'Events', route: '/Events', icon: 'Calendar', tier: 'basic', description: 'Community events and webinars' },
  { key: 'pledge_pool', name: 'Pledge Pool', route: '/PledgePool', icon: 'Wallet', tier: 'premium', description: 'Group investment pledging system' },
  { key: 'advisors', name: 'Advisors', route: '/Advisors', icon: 'ShieldCheck', tier: 'premium', description: 'SEBI registered investment advisors' },
  { key: 'finfluencers', name: 'Content Creators', route: '/Finfluencers', icon: 'Star', tier: 'basic', description: 'Financial influencers and courses' },
  { key: 'educators', name: 'Educators', route: '/Educators', icon: 'GraduationCap', tier: 'premium', description: 'Financial education courses' },
  { key: 'subscription', name: 'Subscription', route: '/Subscription', icon: 'Crown', tier: 'basic', description: 'Upgrade subscription plans' },
  { key: 'profile', name: 'Profile', route: '/Profile', icon: 'User', tier: 'basic', description: 'User profile and settings' },
  { key: 'feedback', name: 'Feedback', route: '/Feedback', icon: 'MessageCircle', tier: 'basic', description: 'Submit feedback to improve Protocol' },
  { key: 'admin_panel', name: 'Admin Panel', route: '/AdminPanel', icon: 'Shield', tier: 'basic', description: 'Admin management panel', visibility_rule: 'admin_only' },
  { key: 'super_admin', name: 'Super Admin', route: '/SuperAdmin', icon: 'LayoutDashboard', tier: 'basic', description: 'Super admin control panel', visibility_rule: 'super_admin_only' },
  { key: 'entity_dashboard', name: 'Entity Dashboard', route: '/EntityDashboard', icon: 'Briefcase', tier: 'basic', description: 'Dashboard for advisors/finfluencers', visibility_rule: 'admin_only' },
  { key: 'vendor_dashboard', name: 'Vendor Dashboard', route: '/VendorDashboard', icon: 'Megaphone', tier: 'basic', description: 'Dashboard for ad vendors', visibility_rule: 'admin_only' },
  { key: 'investor_dashboard', name: 'Investor Dashboard', route: '/InvestorDashboard', icon: 'TrendingUp', tier: 'vip', description: 'Fund investor dashboard' },
  { key: 'fund_manager', name: 'Fund Manager', route: '/FundManager', icon: 'Briefcase', tier: 'vip', description: 'Fund management portal', visibility_rule: 'admin_only' },
];

export default function PagesInitializer({ user }) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [initResult, setInitResult] = useState(null);

  const initializePages = async () => {
    setIsInitializing(true);
    setInitResult(null);

    try {
      // Get existing page configs
      const existingConfigs = await FeatureConfig.list();
      const existingKeys = new Map(existingConfigs.map(c => [c.feature_key, c]));

      const created = [];
      const skipped = [];

      for (const page of EXISTING_PAGES) {
        if (existingKeys.has(page.key)) {
          skipped.push(page.name);
          continue;
        }

        const payload = {
          feature_key: page.key,
          feature_name: page.name,
          description: page.description,
          module_type: page.module_type || 'page', 
          route_path: page.route,
          icon_name: page.icon,
          tier: page.tier,
          status: page.status || 'live', 
          visibility_rule: page.visibility_rule || 'authenticated',
          visible_to_users: page.visible_to_users !== undefined ? page.visible_to_users : true, 
          sort_order: page.sort_order !== undefined ? page.sort_order : 0, 
          developer_notes: page.developer_notes || undefined,
          last_status_change_date: new Date().toISOString(),
          changed_by_admin_id: user.id,
          changed_by_admin_name: user.display_name || user.email,
          reason_for_change: 'Auto-initialized from existing pages'
        };

        await FeatureConfig.create(payload);
        created.push(page.name);
      }

      setInitResult({
        success: true,
        created: created.length,
        skipped: skipped.length,
        createdList: created,
        skippedList: skipped
      });

      toast.success(`Initialized ${created.length} pages successfully!`);
    } catch (error) {
      console.error('Error initializing pages:', error);
      setInitResult({
        success: false,
        error: error.message
      });
      toast.error('Failed to initialize pages');
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Pages Auto-Initialization
        </CardTitle>
        <p className="text-sm text-slate-600">
          Automatically populate existing application pages into the Product Lifecycle Manager
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">What this does:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Scans all {EXISTING_PAGES.length} existing pages in the application</li>
                <li>Creates FeatureConfig records for pages not yet registered</li>
                <li>Sets status to "live" and makes them visible to users</li>
                <li>Skips pages that are already configured</li>
              </ul>
            </div>
          </div>
        </div>

        <Button
          onClick={initializePages}
          disabled={isInitializing}
          className="w-full bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          {isInitializing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Initializing Pages...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Initialize All Pages
            </>
          )}
        </Button>

        {initResult && (
          <div className={`p-4 rounded-lg border ${
            initResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {initResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <div className="flex-1">
                {initResult.success ? (
                  <>
                    <p className="font-semibold text-green-900 mb-2">
                      Initialization Complete!
                    </p>
                    <div className="text-sm text-green-800 space-y-2">
                      <p>✅ Created: {initResult.created} pages</p>
                      <p>⏭️ Skipped: {initResult.skipped} pages (already exist)</p>
                      
                      {initResult.createdList.length > 0 && (
                        <div className="mt-3">
                          <p className="font-semibold mb-1">Created Pages:</p>
                          <ul className="list-disc list-inside pl-2">
                            {initResult.createdList.map((name, idx) => (
                              <li key={idx}>{name}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-red-900 mb-2">Initialization Failed</p>
                    <p className="text-sm text-red-800">{initResult.error}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}