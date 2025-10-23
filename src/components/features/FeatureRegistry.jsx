
// Central registry mapping feature keys to their components and metadata
import React from 'react';
import { 
  MessageSquare, BarChart3, Calendar, Users, Crown, Shield, 
  TrendingUp, Bell, FileText, Target, Phone, Sparkles, 
  GraduationCap, Award, BookOpen, Zap, Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Placeholder component for features not yet implemented
const ComingSoonPlaceholder = ({ feature }) => (
  <div className="min-h-[400px] flex items-center justify-center bg-gradient-to-br from-slate-50 to-purple-50 rounded-xl border-2 border-dashed border-purple-200 p-8">
    <div className="text-center max-w-md">
      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <feature.icon className="w-8 h-8 text-purple-600" />
      </div>
      <h3 className="text-2xl font-bold text-slate-900 mb-2">{feature.name}</h3>
      <p className="text-slate-600 mb-4">{feature.description}</p>
      <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-semibold">
        <Sparkles className="w-4 h-4" />
        Coming Soon {feature.releaseDate && `(Est. ${feature.releaseDate})`}
      </div>
    </div>
  </div>
);

// Locked placeholder for users without access
const LockedPlaceholder = ({ feature, requiredPlan }) => (
  <div className="min-h-[400px] flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl border-2 border-slate-300 p-8 relative overflow-hidden">
    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10"></div>
    <div className="text-center max-w-md relative z-20">
      <div className="w-16 h-16 bg-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
        <Lock className="w-8 h-8 text-slate-600" />
      </div>
      <h3 className="text-2xl font-bold text-slate-900 mb-2">{feature.name}</h3>
      <p className="text-slate-600 mb-4">{feature.description}</p>
      <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
        <Crown className="w-4 h-4" />
        {requiredPlan} Plan Required
      </div>
      <Link to={createPageUrl("Subscription")}>
        <button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700">
          Upgrade Now
        </button>
      </Link>
    </div>
  </div>
);

// Feature Registry - maps feature keys to components and metadata
export const FEATURE_REGISTRY = {
  // ============ BASIC FEATURES (Fully Functional) ============
  general_chat_access: {
    key: 'general_chat_access',
    name: 'General Chat Rooms',
    description: 'Access to community chat rooms for discussions',
    icon: MessageSquare,
    tier: 'basic',
    status: 'live',
    visibility: ['basic', 'premium', 'vip'],
    releaseDate: null,
    component: () => <Link to={createPageUrl("ChatRooms")} className="block"><div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-xl hover:shadow-lg transition-all"><MessageSquare className="w-8 h-8 text-blue-600 mb-2" /><h3 className="font-bold text-lg">Chat Rooms</h3><p className="text-sm text-slate-600">Join community discussions</p></div></Link>
  },
  basic_stock_discussions: {
    key: 'basic_stock_discussions',
    name: 'Stock Discussions',
    description: 'Participate in basic stock market discussions',
    icon: TrendingUp,
    tier: 'basic',
    status: 'live',
    visibility: ['basic', 'premium', 'vip'],
    releaseDate: null,
    component: () => <Link to={createPageUrl("ChatRooms")} className="block"><div className="p-6 bg-green-50 border-2 border-green-200 rounded-xl hover:shadow-lg transition-all"><TrendingUp className="w-8 h-8 text-green-600 mb-2" /><h3 className="font-bold text-lg">Stock Discussions</h3><p className="text-sm text-slate-600">Discuss market trends and stocks</p></div></Link>
  },
  community_polls_participation: {
    key: 'community_polls_participation',
    name: 'Community Polls',
    description: 'Vote and participate in community polls',
    icon: BarChart3,
    tier: 'basic',
    status: 'live',
    visibility: ['basic', 'premium', 'vip'],
    releaseDate: null,
    component: () => <Link to={createPageUrl("Polls")} className="block"><div className="p-6 bg-purple-50 border-2 border-purple-200 rounded-xl hover:shadow-lg transition-all"><BarChart3 className="w-8 h-8 text-purple-600 mb-2" /><h3 className="font-bold text-lg">Community Polls</h3><p className="text-sm text-slate-600">Vote on market sentiment</p></div></Link>
  },
  market_overview_access: {
    key: 'market_overview_access',
    name: 'Market Overview',
    description: 'Access daily market summaries and insights',
    icon: TrendingUp,
    tier: 'basic',
    status: 'live',
    visibility: ['basic', 'premium', 'vip'],
    releaseDate: null,
    component: () => <Link to={createPageUrl("Dashboard")} className="block"><div className="p-6 bg-indigo-50 border-2 border-indigo-200 rounded-xl hover:shadow-lg transition-all"><TrendingUp className="w-8 h-8 text-indigo-600 mb-2" /><h3 className="font-bold text-lg">Market Overview</h3><p className="text-sm text-slate-600">Daily market insights</p></div></Link>
  },
  basic_trading_tips: {
    key: 'basic_trading_tips',
    name: 'Trading Tips',
    description: 'Get basic trading guidance and tips',
    icon: BookOpen,
    tier: 'basic',
    status: 'live',
    visibility: ['basic', 'premium', 'vip'],
    releaseDate: null,
    component: () => <Link to={createPageUrl("Dashboard")} className="block"><div className="p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl hover:shadow-lg transition-all"><BookOpen className="w-8 h-8 text-yellow-600 mb-2" /><h3 className="font-bold text-lg">Trading Tips</h3><p className="text-sm text-slate-600">Learn trading basics</p></div></Link>
  },

  // ============ PREMIUM FEATURES ============
  premium_chat_rooms: {
    key: 'premium_chat_rooms',
    name: 'Premium Chat Rooms',
    description: 'Access exclusive premium chat rooms with verified traders',
    icon: Crown,
    tier: 'premium',
    status: 'placeholder',
    visibility: ['premium', 'vip'],
    releaseDate: 'Q2 2025',
    component: (props) => <ComingSoonPlaceholder feature={FEATURE_REGISTRY.premium_chat_rooms} {...props} />
  },
  premium_polls: {
    key: 'premium_polls',
    name: 'Premium Polls',
    description: 'Access advisor-created premium polls and predictions',
    icon: BarChart3,
    tier: 'premium',
    status: 'live',
    visibility: ['premium', 'vip'],
    releaseDate: null,
    component: () => <Link to={createPageUrl("Polls")} className="block"><div className="p-6 bg-purple-50 border-2 border-purple-200 rounded-xl hover:shadow-lg transition-all"><Crown className="w-8 h-8 text-purple-600 mb-2" /><h3 className="font-bold text-lg">Premium Polls</h3><p className="text-sm text-slate-600">Advisor recommendations</p></div></Link>
  },
  premium_events: {
    key: 'premium_events',
    name: 'Premium Events',
    description: 'Attend exclusive premium events and webinars',
    icon: Calendar,
    tier: 'premium',
    status: 'live',
    visibility: ['premium', 'vip'],
    releaseDate: null,
    component: () => <Link to={createPageUrl("Events")} className="block"><div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-xl hover:shadow-lg transition-all"><Calendar className="w-8 h-8 text-blue-600 mb-2" /><h3 className="font-bold text-lg">Premium Events</h3><p className="text-sm text-slate-600">Exclusive webinars & events</p></div></Link>
  },
  admin_recommendations: {
    key: 'admin_recommendations',
    name: 'Admin Recommendations',
    description: 'Receive stock recommendations from platform administrators',
    icon: Shield,
    tier: 'premium',
    status: 'live',
    visibility: ['premium', 'vip'],
    releaseDate: null,
    component: () => <Link to={createPageUrl("Dashboard")} className="block"><div className="p-6 bg-green-50 border-2 border-green-200 rounded-xl hover:shadow-lg transition-all"><Shield className="w-8 h-8 text-green-600 mb-2" /><h3 className="font-bold text-lg">Admin Picks</h3><p className="text-sm text-slate-600">Expert recommendations</p></div></Link>
  },
  advisor_subscriptions: {
    key: 'advisor_subscriptions',
    name: 'Advisor Subscriptions',
    description: 'Subscribe to verified SEBI advisors for personalized guidance',
    icon: Award,
    tier: 'premium',
    status: 'live',
    visibility: ['premium', 'vip'],
    releaseDate: null,
    component: () => <Link to={createPageUrl("Advisors")} className="block"><div className="p-6 bg-indigo-50 border-2 border-indigo-200 rounded-xl hover:shadow-lg transition-all"><Award className="w-8 h-8 text-indigo-600 mb-2" /><h3 className="font-bold text-lg">SEBI Advisors</h3><p className="text-sm text-slate-600">Subscribe to verified advisors</p></div></Link>
  },
  exclusive_finfluencer_content: {
    key: 'exclusive_finfluencer_content',
    name: 'Finfluencer Content',
    description: 'Access exclusive content from top financial influencers',
    icon: GraduationCap,
    tier: 'premium',
    status: 'live',
    visibility: ['premium', 'vip'],
    releaseDate: null,
    component: () => <Link to={createPageUrl("Finfluencers")} className="block"><div className="p-6 bg-pink-50 border-2 border-pink-200 rounded-xl hover:shadow-lg transition-all"><GraduationCap className="w-8 h-8 text-pink-600 mb-2" /><h3 className="font-bold text-lg">Finfluencers</h3><p className="text-sm text-slate-600">Exclusive premium content</p></div></Link>
  },
  pledge_participation: {
    key: 'pledge_participation',
    name: 'Pledge Pool',
    description: 'Participate in community pledge system for stocks',
    icon: Target,
    tier: 'premium',
    status: 'live',
    visibility: ['premium', 'vip'],
    releaseDate: null,
    component: () => <Link to={createPageUrl("PledgePool")} className="block"><div className="p-6 bg-cyan-50 border-2 border-cyan-200 rounded-xl hover:shadow-lg transition-all"><Target className="w-8 h-8 text-cyan-600 mb-2" /><h3 className="font-bold text-lg">Pledge Pool</h3><p className="text-sm text-slate-600">Community trading pledges</p></div></Link>
  },
  advanced_analytics: {
    key: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Access advanced technical analysis tools and charts',
    icon: BarChart3,
    tier: 'premium',
    status: 'placeholder',
    visibility: ['premium', 'vip'],
    releaseDate: 'Q3 2025',
    component: (props) => <ComingSoonPlaceholder feature={FEATURE_REGISTRY.advanced_analytics} {...props} />
  },
  priority_support: {
    key: 'priority_support',
    name: 'Priority Support',
    description: 'Get priority customer support and faster response times',
    icon: Zap,
    tier: 'premium',
    status: 'placeholder',
    visibility: ['premium', 'vip'],
    releaseDate: 'Q2 2025',
    component: (props) => <ComingSoonPlaceholder feature={FEATURE_REGISTRY.priority_support} {...props} />
  },
  webinar_access: {
    key: 'webinar_access',
    name: 'Exclusive Webinars',
    description: 'Attend premium webinars hosted by market experts',
    icon: Calendar,
    tier: 'premium',
    status: 'partial',
    visibility: ['premium', 'vip'],
    releaseDate: null,
    component: () => <Link to={createPageUrl("Events")} className="block"><div className="p-6 bg-purple-50 border-2 border-purple-200 rounded-xl hover:shadow-lg transition-all"><Calendar className="w-8 h-8 text-purple-600 mb-2" /><h3 className="font-bold text-lg">Webinars</h3><p className="text-sm text-slate-600">Expert-led sessions</p></div></Link>
  },
  portfolio_tools: {
    key: 'portfolio_tools',
    name: 'Portfolio Tracking',
    description: 'Track your investment portfolio with advanced tools',
    icon: TrendingUp,
    tier: 'premium',
    status: 'live',
    visibility: ['premium', 'vip'],
    releaseDate: null,
    component: () => <Link to={createPageUrl("MyStocks")} className="block"><div className="p-6 bg-teal-50 border-2 border-teal-200 rounded-xl hover:shadow-lg transition-all"><TrendingUp className="w-8 h-8 text-teal-600 mb-2" /><h3 className="font-bold text-lg">Portfolio Tracker</h3><p className="text-sm text-slate-600">Manage your investments</p></div></Link>
  },

  // ============ VIP ELITE FEATURES ============
  one_on_one_consultation: {
    key: 'one_on_one_consultation',
    name: 'Direct Admin Consultation',
    description: 'Schedule one-on-one sessions with platform administrators',
    icon: Users,
    tier: 'vip',
    status: 'placeholder',
    visibility: ['vip'],
    releaseDate: 'Q3 2025',
    component: (props) => <ComingSoonPlaceholder feature={FEATURE_REGISTRY.one_on_one_consultation} {...props} />
  },
  personalized_stock_picks: {
    key: 'personalized_stock_picks',
    name: 'Personalized Stock Picks',
    description: 'Receive AI-powered personalized stock recommendations',
    icon: Sparkles,
    tier: 'vip',
    status: 'placeholder',
    visibility: ['vip'],
    releaseDate: 'Q4 2025',
    component: (props) => <ComingSoonPlaceholder feature={FEATURE_REGISTRY.personalized_stock_picks} {...props} />
  },
  advanced_pledge_analytics: {
    key: 'advanced_pledge_analytics',
    name: 'Advanced Pledge Analytics',
    description: 'Deep analytics and insights into pledge performance',
    icon: BarChart3,
    tier: 'vip',
    status: 'placeholder',
    visibility: ['vip'],
    releaseDate: 'Q3 2025',
    component: (props) => <ComingSoonPlaceholder feature={FEATURE_REGISTRY.advanced_pledge_analytics} {...props} />
  },
  risk_management_tools: {
    key: 'risk_management_tools',
    name: 'Risk Management Tools',
    description: 'Advanced tools for portfolio risk assessment and management',
    icon: Shield,
    tier: 'vip',
    status: 'placeholder',
    visibility: ['vip'],
    releaseDate: 'Q4 2025',
    component: (props) => <ComingSoonPlaceholder feature={FEATURE_REGISTRY.risk_management_tools} {...props} />
  },
  market_insider_insights: {
    key: 'market_insider_insights',
    name: 'Market Insider Insights',
    description: 'Exclusive market insights from industry insiders',
    icon: TrendingUp,
    tier: 'vip',
    status: 'placeholder',
    visibility: ['vip'],
    releaseDate: 'Q3 2025',
    component: (props) => <ComingSoonPlaceholder feature={FEATURE_REGISTRY.market_insider_insights} {...props} />
  },
  one_on_one_trading_sessions: {
    key: 'one_on_one_trading_sessions',
    name: 'Personal Trading Sessions',
    description: 'Private trading guidance sessions with expert traders',
    icon: Users,
    tier: 'vip',
    status: 'placeholder',
    visibility: ['vip'],
    releaseDate: 'Q4 2025',
    component: (props) => <ComingSoonPlaceholder feature={FEATURE_REGISTRY.one_on_one_trading_sessions} {...props} />
  },
  custom_alerts: {
    key: 'custom_alerts',
    name: 'Custom Alerts & Notifications',
    description: 'Set up personalized alerts for stocks and market movements',
    icon: Bell,
    tier: 'vip',
    status: 'partial',
    visibility: ['vip'],
    releaseDate: null,
    component: () => <Link to={createPageUrl("MyStocks")} className="block"><div className="p-6 bg-orange-50 border-2 border-orange-200 rounded-xl hover:shadow-lg transition-all"><Bell className="w-8 h-8 text-orange-600 mb-2" /><h3 className="font-bold text-lg">Custom Alerts</h3><p className="text-sm text-slate-600">Personalized notifications</p></div></Link>
  },
  research_reports: {
    key: 'research_reports',
    name: 'Premium Research Reports',
    description: 'Access in-depth research reports and market analysis',
    icon: FileText,
    tier: 'vip',
    status: 'placeholder',
    visibility: ['vip'],
    releaseDate: 'Q3 2025',
    component: (props) => <ComingSoonPlaceholder feature={FEATURE_REGISTRY.research_reports} {...props} />
  },
  whatsapp_support: {
    key: 'whatsapp_support',
    name: 'WhatsApp Support Group',
    description: 'Join exclusive WhatsApp group for instant support',
    icon: Phone,
    tier: 'vip',
    status: 'placeholder',
    visibility: ['vip'],
    releaseDate: 'Q2 2025',
    component: (props) => <ComingSoonPlaceholder feature={FEATURE_REGISTRY.whatsapp_support} {...props} />
  }
};

// Helper function to get feature metadata
export const getFeature = (featureKey) => {
  return FEATURE_REGISTRY[featureKey] || null;
};

// Helper function to get all features for a tier
export const getFeaturesByTier = (tier) => {
  return Object.values(FEATURE_REGISTRY).filter(f => f.tier === tier);
};

// Helper function to get feature status counts
export const getFeatureStatusCounts = () => {
  const counts = { live: 0, partial: 0, placeholder: 0 };
  Object.values(FEATURE_REGISTRY).forEach(feature => {
    counts[feature.status] = (counts[feature.status] || 0) + 1;
  });
  return counts;
};

// Helper function to get all visible features for a given user tier
export const getVisibleFeatures = (userTier, showAll = false) => {
  if (showAll) { // SuperAdmin access
    return Object.values(FEATURE_REGISTRY);
  }
  return Object.values(FEATURE_REGISTRY).filter(feature =>
    feature.visibility && feature.visibility.includes(userTier)
  );
};

export { ComingSoonPlaceholder, LockedPlaceholder };
