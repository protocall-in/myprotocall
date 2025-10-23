import React, { useState, useEffect } from 'react';
import { Advisor, AdvisorRecommendation } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Shield, TrendingUp, TrendingDown, Lock, ArrowRight } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdvisorRecommendedStocks() {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { checkAccess } = useSubscription();
  const hasAccess = checkAccess({ type: 'premium' });

  useEffect(() => {
    let isMounted = true;

    const fetchAdvisorRecommendations = async () => {
      try {
        // Get recent advisor recommendations
        const recs = await AdvisorRecommendation.list('-created_date', 3);
        
        // Get advisor details for each recommendation
        const recsWithAdvisors = await Promise.all(
          recs.map(async (rec) => {
            try {
              const advisor = await Advisor.get(rec.created_by);
              return {
                ...rec,
                advisor_name: advisor?.display_name || 'Expert Advisor',
                advisor_image: advisor?.profile_image_url,
              };
            } catch (error) {
              return {
                ...rec,
                advisor_name: 'Expert Advisor',
                advisor_image: null,
              };
            }
          })
        );

        if (isMounted) {
          setRecommendations(recsWithAdvisors);
        }
      } catch (error) {
        console.error("Error fetching advisor recommendations:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAdvisorRecommendations();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-white animate-pulse">
        <CardHeader className="border-b">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  const getRecommendationIcon = (type) => {
    switch (type) {
      case 'buy': return <TrendingUp className="w-3 h-3 text-green-600" />;
      case 'sell': return <TrendingDown className="w-3 h-3 text-red-600" />;
      default: return <Shield className="w-3 h-3 text-blue-600" />;
    }
  };

  const getRecommendationColor = (type) => {
    switch (type) {
      case 'buy': return 'bg-green-100 text-green-800 border-green-200';
      case 'sell': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-white relative overflow-hidden">
      <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-slate-900 text-sm">
            <Shield className="w-4 h-4 text-purple-600" />
            Advisor Picks
            <Crown className="w-3 h-3 text-purple-600" />
          </CardTitle>
          <Link to={createPageUrl("Advisors")}>
            <Button variant="ghost" size="sm" className="text-xs">
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className={`p-4 ${!hasAccess ? 'locked-poll-card' : ''}`}>
        <div className="space-y-3">
          {recommendations.slice(0, 2).map((rec) => (
            <div key={rec.id} className="p-3 rounded-lg border bg-gradient-to-r from-white to-slate-50 hover:shadow-sm transition-all">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                  {rec.advisor_image ? (
                    <img src={rec.advisor_image} alt={rec.advisor_name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    rec.advisor_name?.charAt(0)?.toUpperCase() || 'A'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs font-semibold">
                      {rec.stock_symbol}
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${getRecommendationColor(rec.recommendation_type)}`}>
                      {getRecommendationIcon(rec.recommendation_type)}
                      <span className="ml-1 capitalize">{rec.recommendation_type}</span>
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 mb-1">{rec.advisor_name}</p>
                  
                  {hasAccess ? (
                    <div className="space-y-1">
                      <p className="text-xs text-slate-700 line-clamp-2">{rec.content?.substring(0, 80)}...</p>
                      {rec.target_price && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Target:</span>
                          <span className="font-semibold text-green-700">₹{rec.target_price}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Premium analysis available</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Premium Overlay */}
      {!hasAccess && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
          <div className="text-center p-3">
            <div className="inline-flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full p-2 mb-2">
              <Lock className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-gray-900 text-sm mb-1">Advisor Picks</h4>
            <p className="text-xs text-gray-600">Upgrade for full analysis</p>
          </div>
        </div>
      )}
    </Card>
  );
}