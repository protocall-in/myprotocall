import React, { useState, useEffect } from 'react';
import { Review } from '@/api/entities';
import { Card } from '@/components/ui/card';
import { Star, Facebook, Linkedin, Twitter, Instagram, Youtube } from 'lucide-react';
import { motion } from 'framer-motion';

const iconMap = {
  facebook: Facebook,
  linkedin: Linkedin,
  twitter: Twitter,
  instagram: Instagram,
  youtube: Youtube,
};

const platformColors = {
  facebook: 'hover:text-blue-600',
  linkedin: 'hover:text-blue-700',
  twitter: 'hover:text-blue-400',
  instagram: 'hover:text-pink-600',
  youtube: 'hover:text-red-600',
};

export default function ReviewScroller() {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      // Fetch only approved public reviews, sort by featured then date
      const allReviews = await Review.filter({ is_public: true, status: 'approved' }, '-created_date');
      
      // Sort: featured first, then by date
      const sortedReviews = allReviews.sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        return new Date(b.created_date) - new Date(a.created_date);
      });
      
      setReviews(sortedReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || reviews.length === 0) {
    return null;
  }

  // Split reviews into two rows for dual scrolling effect
  const midPoint = Math.ceil(reviews.length / 2);
  const firstRowReviews = reviews.slice(0, midPoint);
  const secondRowReviews = reviews.slice(midPoint);

  // Duplicate reviews for seamless infinite scroll
  const duplicatedFirstRow = [...firstRowReviews, ...firstRowReviews, ...firstRowReviews];
  const duplicatedSecondRow = [...secondRowReviews, ...secondRowReviews, ...secondRowReviews];

  const ReviewCard = ({ review }) => {
    const SocialIcon = review.social_platform ? iconMap[review.social_platform] : null;
    const platformColor = review.social_platform ? platformColors[review.social_platform] : '';
    
    return (
      <Card className="min-w-[350px] max-w-[350px] h-full bg-gradient-to-r from-blue-50 to-purple-50 border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300 p-5 relative">
        {/* Header: Profile + Social Icon */}
        <div className="flex items-start gap-3 mb-4">
          <img
            src={review.profile_url || 'https://via.placeholder.com/48'}
            alt={review.username}
            className="w-12 h-12 rounded-full border-2 border-purple-300 object-cover flex-shrink-0"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/48';
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base text-gray-900 truncate">{review.username}</p>
            <div className="flex mt-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                />
              ))}
            </div>
          </div>
          
          {/* Social Icon Link */}
          {SocialIcon && review.social_url && (
            <a
              href={review.social_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-gray-600 transition-colors duration-200 ${platformColor} flex-shrink-0`}
              title={`View on ${review.social_platform}`}
            >
              <SocialIcon size={20} />
            </a>
          )}
        </div>
        
        {/* Review Text */}
        <div className="relative">
          <p className="text-sm text-gray-700 leading-relaxed italic line-clamp-4">
            "{review.review_text}"
          </p>
        </div>
        
        {/* Decorative Quote Mark */}
        <div className="absolute bottom-3 right-3 text-purple-200 text-6xl font-serif leading-none pointer-events-none">
          "
        </div>
      </Card>
    );
  };

  return (
    <div className="w-full mt-10 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
          <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
          What Our Members Are Saying
        </h2>
        
        <div className="space-y-6">
          {/* First Row - Scroll Left */}
          <div className="relative overflow-hidden">
            <motion.div
              className="flex gap-6"
              animate={{
                x: [0, -(firstRowReviews.length * 374)], // 350px card + 24px gap
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: firstRowReviews.length * 8,
                  ease: "linear",
                },
              }}
            >
              {duplicatedFirstRow.map((review, index) => (
                <ReviewCard key={`row1-${review.id}-${index}`} review={review} />
              ))}
            </motion.div>
          </div>

          {/* Second Row - Scroll Right (Opposite Direction) */}
          {secondRowReviews.length > 0 && (
            <div className="relative overflow-hidden">
              <motion.div
                className="flex gap-6"
                animate={{
                  x: [-(secondRowReviews.length * 374), 0], // Start from left, move right
                }}
                transition={{
                  x: {
                    repeat: Infinity,
                    repeatType: "loop",
                    duration: secondRowReviews.length * 8,
                    ease: "linear",
                  },
                }}
              >
                {duplicatedSecondRow.map((review, index) => (
                  <ReviewCard key={`row2-${review.id}-${index}`} review={review} />
                ))}
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}