
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Users, CheckCircle, Star, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function FinInfluencers() {
  // Sample FinInfluencers data
  const sampleInfluencers = [
    {
      id: '1',
      display_name: 'Akshat Shrivastava',
      bio: 'Investment Banking Expert | Stock Market Educator',
      specialization: ['Technical Analysis', 'Value Investing'],
      follower_count: 125000,
      verified: true,
      success_rate: 78.5,
      profile_image_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      latest_post: {
        title: 'Market Outlook for Q4 2024',
        post_type: 'video',
        thumbnail_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=300&h=200&fit=crop',
        view_count: 12500,
        like_count: 890
      }
    },
    {
      id: '2',
      display_name: 'Pranjal Kamra',
      bio: 'Personal Finance & Investment Strategist',
      specialization: ['Mutual Funds', 'Portfolio Management'],
      follower_count: 89000,
      verified: true,
      success_rate: 82.1,
      profile_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      latest_post: {
        title: 'Top 5 Blue Chip Stocks for 2024',
        post_type: 'video',
        thumbnail_url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=300&h=200&fit=crop',
        view_count: 8200,
        like_count: 645
      }
    },
    {
      id: '3',
      display_name: 'Rachana Ranade',
      bio: 'CA | Stock Market Trainer | YouTuber',
      specialization: ['Options Trading', 'Risk Management'],
      follower_count: 156000,
      verified: true,
      success_rate: 75.8,
      profile_image_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b734?w=150&h=150&fit=crop&crop=face',
      latest_post: {
        title: 'Banking Sector Analysis - Buy or Sell?',
        post_type: 'video',
        thumbnail_url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=300&h=200&fit=crop',
        view_count: 15300,
        like_count: 1234
      }
    }
  ];

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-purple-50">
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <Star className="w-5 h-5 text-purple-600" />
          FinInfluencers
        </CardTitle>
        <p className="text-sm text-slate-600">Expert market insights from verified influencers</p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {sampleInfluencers.map(influencer => (
            <div key={influencer.id} className="flex gap-4 p-4 rounded-xl border bg-gradient-to-br from-white to-slate-50 hover:shadow-lg transition-all duration-200">
              {/* Profile Section */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <img
                    src={influencer.profile_image_url}
                    alt={influencer.display_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {influencer.verified && (
                    <CheckCircle className="w-4 h-4 text-blue-500 absolute -bottom-1 -right-1 bg-white rounded-full" />
                  )}
                </div>
              </div>

              {/* Content Section */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-slate-900">{influencer.display_name}</h4>
                    <p className="text-xs text-slate-600 mb-2">{influencer.bio}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-2">
                      {influencer.specialization.map(spec => (
                        <Badge key={spec} variant="outline" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{(influencer.follower_count / 1000).toFixed(0)}K followers</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        <span>{influencer.success_rate}% success</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Latest Post */}
                <div className="mt-3 p-2 bg-slate-50 rounded-lg">
                  <div className="flex gap-3">
                    <div className="relative flex-shrink-0">
                      <img
                        src={influencer.latest_post.thumbnail_url}
                        alt={influencer.latest_post.title}
                        className="w-16 h-12 rounded object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded">
                        <Play className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-medium text-slate-900 truncate">{influencer.latest_post.title}</h5>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>{(influencer.latest_post.view_count / 1000).toFixed(1)}K views</span>
                        </div>
                        <span>•</span>
                        <span>{influencer.latest_post.like_count} likes</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <Link to={createPageUrl("Finfluencers")}>
            <Button className="btn-primary">
              View All FinInfluencers
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
