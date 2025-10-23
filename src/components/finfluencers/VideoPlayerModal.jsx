import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Eye, Heart, Clock, Shield } from 'lucide-react';

export default function VideoPlayerModal({ open, onClose, video, influencer }) {
  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYouTubeVideoId(video?.video_url);
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : null;

  // Increment view count when video is opened
  useEffect(() => {
    if (open && video) {
      // Here you would typically call an API to increment the view count
      console.log('Incrementing view count for video:', video.id);
    }
  }, [open, video]);

  if (!video) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl p-0">
        <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
          {embedUrl ? (
            <iframe
              width="100%"
              height="100%"
              src={embedUrl}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center">
                <p className="text-lg mb-2">Video Unavailable</p>
                <p className="text-sm opacity-75">Unable to load video player</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 mb-3">
              {video.title}
            </DialogTitle>
          </DialogHeader>

          {/* Influencer Info */}
          {influencer && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg">
              <img
                src={influencer.profile_image_url}
                alt={influencer.display_name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-slate-900">{influencer.display_name}</h4>
                  {influencer.sebi_registered && (
                    <Shield className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <p className="text-sm text-slate-600">{influencer.bio}</p>
              </div>
            </div>
          )}

          {/* Video Stats */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-6 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{video.view_count?.toLocaleString()} views</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                <span>{video.like_count?.toLocaleString()} likes</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{video.duration}</span>
              </div>
            </div>
          </div>

          {/* Stock Mentions */}
          {video.stock_mentions && video.stock_mentions.length > 0 && (
            <div className="mb-4">
              <h5 className="font-semibold text-sm text-slate-700 mb-2">Stocks Mentioned:</h5>
              <div className="flex flex-wrap gap-2">
                {video.stock_mentions.map(stock => (
                  <Badge key={stock} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {stock}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {video.tags && video.tags.length > 0 && (
            <div className="mb-4">
              <h5 className="font-semibold text-sm text-slate-700 mb-2">Tags:</h5>
              <div className="flex flex-wrap gap-2">
                {video.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Content Description */}
          {video.content && (
            <div>
              <h5 className="font-semibold text-sm text-slate-700 mb-2">Description:</h5>
              <p className="text-sm text-slate-600 leading-relaxed">
                {video.content}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}