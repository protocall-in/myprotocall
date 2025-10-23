import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Eye, Heart, Clock, Lock, Shield } from 'lucide-react';
import VideoPlayerModal from './VideoPlayerModal';

export default function VideoCard({ video, influencer, canAccessPremium }) {
  const [showPlayer, setShowPlayer] = useState(false);

  const canWatch = !video.is_premium || canAccessPremium;

  const handleWatch = () => {
    if (canWatch) {
      setShowPlayer(true);
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-all duration-300 bg-white border-0 overflow-hidden">
        <div className="relative">
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-48 object-cover"
          />
          
          {/* Play Button Overlay */}
          <div 
            onClick={handleWatch}
            className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center cursor-pointer group"
          >
            <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              {video.is_premium && !canAccessPremium ? (
                <Lock className="w-6 h-6 text-slate-600" />
              ) : (
                <Play className="w-6 h-6 text-slate-600 ml-1" />
              )}
            </div>
          </div>

          {/* Duration Badge */}
          <Badge className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white">
            <Clock className="w-3 h-3 mr-1" />
            {video.duration}
          </Badge>

          {/* Premium Badge */}
          {video.is_premium && (
            <Badge className="absolute top-2 right-2 bg-purple-600">
              <Lock className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>

        <CardHeader className="pb-2">
          <h3 className="font-semibold text-lg text-slate-900 line-clamp-2">
            {video.title}
          </h3>
          
          {influencer && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <img
                src={influencer.profile_image_url}
                alt={influencer.display_name}
                className="w-6 h-6 rounded-full"
              />
              <span>{influencer.display_name}</span>
              {influencer.sebi_registered && (
                <Shield className="w-4 h-4 text-green-500" />
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Stock Mentions */}
          {video.stock_mentions && video.stock_mentions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {video.stock_mentions.slice(0, 3).map(stock => (
                <Badge key={stock} variant="outline" className="text-xs">
                  {stock}
                </Badge>
              ))}
              {video.stock_mentions.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{video.stock_mentions.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-slate-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{(video.view_count / 1000).toFixed(1)}K views</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                <span>{video.like_count}</span>
              </div>
            </div>
          </div>

          {/* Action */}
          {video.is_premium && !canAccessPremium ? (
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Lock className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-purple-700 font-medium">Premium Content</p>
              <p className="text-xs text-purple-600 mt-1">
                Subscribe to view this video
              </p>
              <Button size="sm" className="mt-2 bg-purple-600 hover:bg-purple-700">
                Upgrade Now
              </Button>
            </div>
          ) : (
            <Button 
              onClick={handleWatch}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Watch Now
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Video Player Modal */}
      <VideoPlayerModal
        open={showPlayer}
        onClose={() => setShowPlayer(false)}
        video={video}
        influencer={influencer}
      />
    </>
  );
}