import React, { useState, useEffect } from 'react';
import { Review, User } from '@/api/entities';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Star, Send, Facebook, Linkedin, Twitter } from 'lucide-react';
import { toast } from 'sonner';

export default function SubmitReviewModal({ open, onClose }) {
  const [user, setUser] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [socialPlatform, setSocialPlatform] = useState('');
  const [socialUrl, setSocialUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const validateUrl = (url) => {
    if (!url) return true; // Empty is OK
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please log in to submit a review');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!reviewText.trim()) {
      toast.error('Please write your review');
      return;
    }

    if (reviewText.trim().length < 20) {
      toast.error('Review must be at least 20 characters');
      return;
    }

    // Validate social URL if provided
    if (socialUrl && !validateUrl(socialUrl)) {
      toast.error('Please enter a valid URL for the social link');
      return;
    }

    // If social URL is provided, platform must be selected
    if (socialUrl && !socialPlatform) {
      toast.error('Please select a social platform for your link');
      return;
    }

    setIsSubmitting(true);

    try {
      await Review.create({
        user_id: user.id,
        username: user.display_name || user.email.split('@')[0],
        profile_url: user.profile_image_url || '',
        review_text: reviewText.trim(),
        rating: rating,
        social_platform: socialPlatform || null,
        social_url: socialUrl || null,
        is_public: false,
        status: 'pending'
      });

      toast.success('Thank you! Your review has been submitted for approval.');
      
      // Reset form
      setRating(0);
      setReviewText('');
      setSocialPlatform('');
      setSocialUrl('');
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const socialIcons = {
    facebook: Facebook,
    linkedin: Linkedin,
    twitter: Twitter,
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Share Your Experience</DialogTitle>
          <DialogDescription>
            Help others discover Protocol by sharing your honest feedback
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Star Rating */}
          <div>
            <Label className="block text-sm font-medium mb-2">Your Rating *</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={
                      star <= (hoverRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {rating === 5 && 'Excellent! 🎉'}
                {rating === 4 && 'Great! 👍'}
                {rating === 3 && 'Good! 👌'}
                {rating === 2 && 'Fair 😐'}
                {rating === 1 && 'Needs Improvement 😕'}
              </p>
            )}
          </div>

          {/* Review Text */}
          <div>
            <Label className="block text-sm font-medium mb-2">Your Review *</Label>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with Protocol. What did you like? How has it helped you? (Minimum 20 characters)"
              rows={5}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {reviewText.length}/500 characters
            </p>
          </div>

          {/* Social Platform (Optional) */}
          <div>
            <Label className="block text-sm font-medium mb-2">
              Social Platform (Optional)
            </Label>
            <Select value={socialPlatform} onValueChange={setSocialPlatform}>
              <SelectTrigger>
                <SelectValue placeholder="Where did you post your review?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>None</SelectItem>
                <SelectItem value="facebook">
                  <div className="flex items-center gap-2">
                    <Facebook size={16} />
                    Facebook
                  </div>
                </SelectItem>
                <SelectItem value="linkedin">
                  <div className="flex items-center gap-2">
                    <Linkedin size={16} />
                    LinkedIn
                  </div>
                </SelectItem>
                <SelectItem value="twitter">
                  <div className="flex items-center gap-2">
                    <Twitter size={16} />
                    Twitter
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Social URL (Optional) */}
          <div>
            <Label className="block text-sm font-medium mb-2">
              Social Link (Optional)
            </Label>
            <Input
              value={socialUrl}
              onChange={(e) => setSocialUrl(e.target.value)}
              placeholder="https://facebook.com/your-review-link"
              type="url"
            />
            <p className="text-xs text-gray-500 mt-1">
              Link to your review on social media (if applicable)
            </p>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0 || !reviewText.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Review
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}