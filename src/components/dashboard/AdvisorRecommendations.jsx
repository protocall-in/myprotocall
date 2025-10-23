import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Target, ArrowRight, TrendingUp, TrendingDown, Eye, Crown } from 'lucide-react';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useSubscription } from "../hooks/useSubscription";
import { User } from '@/api/entities'; // FIXED IMPORT

export default function AdvisorRecommendations({ recommendations }) {
  const { checkAccess, isLoading } = useSubscription();
  const [user, setUser] = useState(null);

  // Load user to check admin status
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

  // CRITICAL FIX: Admins always have access
  const isAdmin = user && ['admin', 'super_admin'].includes(user.app_role);
  const hasAccess = isAdmin || checkAccess({ type: 'admin_picks' });

  // Fallback sample data
  const sampleRecommendations = [
    {
      id: '1',
      title: 'RELIANCE - Strong Buy Recommendation',
      stock_symbol: 'RELIANCE',
      recommendation_type: 'buy',
      target_price: 2800,
      risk_level: 'medium',
      time_horizon: 'medium_term'
    },
    {
      id: '2',
      title: 'Banking Sector - Selective Approach',
      stock_symbol: 'HDFCBANK',
      recommendation_type: 'buy',
      target_price: 1850,
      risk_level: 'low',
      time_horizon: 'long_term'
    },
    {
      id: '3',
      title: 'IT Stocks - Wait and Watch',
      stock_symbol: 'TCS',
      recommendation_type: 'hold',
      target_price: 3600,
      risk_level: 'medium',
      time_horizon: 'short_term'
    }
  ];

  const recData = recommendations.length > 0 ? recommendations : sampleRecommendations;

  const getRecommendationIcon = (type) => {
    switch (type) {
      case 'buy': return <TrendingUp className="w-3 h-3" />;
      case 'sell': return <TrendingDown className="w-3 h-3" />;
      case 'watch': return <Eye className="w-3 h-3" />;
      default: return <Target className="w-3 h-3" />;
    }
  };

  const getRecommendationColor = (type) => {
    switch (type) {
      case 'buy': return 'bg-green-100 text-green-800 border-green-200';
      case 'sell': return 'bg-red-100 text-red-800 border-red-200';
      case 'watch': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-green-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Shield className="w-5 h-5 text-green-600" />
            Advisor Picks
            <Crown className="w-4 h-4 text-purple-600" />
          </CardTitle>
          <Badge className="bg-purple-100 text-purple-700 text-xs">
            Premium Only
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 relative">
        {/* Blurred Content */}
        <div className={!hasAccess ? 'locked-poll-card' : ''}>
          <div className="space-y-4">
            {recData.slice(0, 3).map((rec) => (
              <div key={rec.id} className="p-4 rounded-lg border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs font-semibold">
                        {rec.stock_symbol}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getRecommendationColor(rec.recommendation_type)}`}
                      >
                        {getRecommendationIcon(rec.recommendation_type)}
                        <span className="ml-1 capitalize">{rec.recommendation_type}</span>
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-sm text-slate-900">{rec.title}</h4>
                  </div>
                </div>
                
                {rec.target_price && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Target:</span>
                    <span className="font-semibold text-green-700">₹{rec.target_price}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs mt-2">
                  <Badge variant="outline" className={`text-xs ${
                    rec.risk_level === 'low' ? 'bg-green-50 text-green-700' :
                    rec.risk_level === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    {rec.risk_level} risk
                  </Badge>
                  <span className="text-slate-500 capitalize">{rec.time_horizon?.replace('_', ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Premium Overlay - HIDE FOR ADMINS */}
        {!isAdmin && !isLoading && !hasAccess && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
            <div className="text-center p-4">
              <div className="inline-flex items-center justify-center bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full p-3 mb-3">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Advisor Picks</h3>
              <p className="text-sm text-gray-600 mb-4">Access exclusive recommendations from verified advisors</p>
              <Link to={createPageUrl("Subscription")}>
                <Button size="sm" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                  <Crown className="w-4 h-4 mr-2" />
                  Unlock Premium
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}