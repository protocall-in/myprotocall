
import React, { useState, useEffect } from 'react';
import { Review } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Star, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  EyeOff, 
  Award,
  Facebook,
  Linkedin,
  Twitter,
  Instagram,
  Youtube,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ReviewModeration({ user }) {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // Changed default to 'all'
  const [selectedReview, setSelectedReview] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    social_platform: '',
    social_url: '',
    is_featured: false,
    admin_notes: ''
  });

  useEffect(() => {
    loadReviews();
  }, [filter]);

  const loadReviews = async () => {
    try {
      setIsLoading(true);
      let fetchedReviews;
      
      if (filter === 'all') {
        fetchedReviews = await Review.list('-created_date');
      } else {
        fetchedReviews = await Review.filter({ status: filter }, '-created_date');
      }
      
      setReviews(fetchedReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (review) => {
    try {
      await Review.update(review.id, {
        status: 'approved',
        is_public: true
      });
      toast.success('Review approved and published');
      loadReviews();
    } catch (error) {
      console.error('Error approving review:', error);
      toast.error('Failed to approve review');
    }
  };

  const handleReject = async (review) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      await Review.update(review.id, {
        status: 'rejected',
        is_public: false,
        rejection_reason: reason
      });
      toast.success('Review rejected');
      loadReviews();
    } catch (error) {
      console.error('Error rejecting review:', error);
      toast.error('Failed to reject review');
    }
  };

  const handleToggleFeatured = async (review) => {
    try {
      await Review.update(review.id, {
        is_featured: !review.is_featured
      });
      toast.success(`Review ${!review.is_featured ? 'featured' : 'unfeatured'}`);
      loadReviews();
    } catch (error) {
      console.error('Error toggling featured:', error);
      toast.error('Failed to update review');
    }
  };

  const handleTogglePublic = async (review) => {
    try {
      await Review.update(review.id, {
        is_public: !review.is_public
      });
      toast.success(`Review ${!review.is_public ? 'published' : 'unpublished'}`);
      loadReviews();
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast.error('Failed to update review');
    }
  };

  const openEditModal = (review) => {
    setSelectedReview(review);
    setEditForm({
      social_platform: review.social_platform || '',
      social_url: review.social_url || '',
      is_featured: review.is_featured || false,
      admin_notes: review.admin_notes || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedReview) return;

    try {
      await Review.update(selectedReview.id, editForm);
      toast.success('Review updated successfully');
      setShowEditModal(false);
      loadReviews();
    } catch (error) {
      console.error('Error updating review:', error);
      toast.error('Failed to update review');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    
    const { color, icon: Icon } = variants[status] || variants.pending;
    
    return (
      <Badge className={`${color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const socialIcons = {
    facebook: Facebook,
    linkedin: Linkedin,
    twitter: Twitter,
    instagram: Instagram,
    youtube: Youtube
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Review Moderation</h2>
          <p className="text-gray-600">Manage user reviews and testimonials</p>
        </div>
        
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All Reviews</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold">{reviews.length}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {reviews.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {reviews.filter(r => r.status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Featured</p>
                <p className="text-2xl font-bold text-purple-600">
                  {reviews.filter(r => r.is_featured).length}
                </p>
              </div>
              <Award className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No reviews found</p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => {
            const SocialIcon = review.social_platform ? socialIcons[review.social_platform] : null;
            
            return (
              <Card key={review.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Profile */}
                    <img
                      src={review.profile_url || 'https://via.placeholder.com/48'}
                      alt={review.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{review.username}</h4>
                            {review.is_featured && (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <Award className="w-3 h-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                            {getStatusBadge(review.status)}
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={16}
                                  className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                                />
                              ))}
                            </div>
                            
                            {SocialIcon && review.social_url && (
                              <a
                                href={review.social_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                              >
                                <SocialIcon size={14} />
                                <span>View on {review.social_platform}</span>
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="text-sm text-gray-500">
                          {format(new Date(review.created_date), 'MMM d, yyyy')}
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4">"{review.review_text}"</p>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {review.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(review)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(review)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}

                        {review.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTogglePublic(review)}
                          >
                            {review.is_public ? (
                              <>
                                <EyeOff className="w-4 h-4 mr-1" />
                                Unpublish
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4 mr-1" />
                                Publish
                              </>
                            )}
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleFeatured(review)}
                        >
                          <Award className="w-4 h-4 mr-1" />
                          {review.is_featured ? 'Unfeature' : 'Feature'}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(review)}
                        >
                          Edit Details
                        </Button>
                      </div>

                      {review.rejection_reason && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800">
                            <strong>Rejection Reason:</strong> {review.rejection_reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Review Details</DialogTitle>
            <DialogDescription>
              Add social media links and admin notes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Social Platform</label>
              <Select
                value={editForm.social_platform}
                onValueChange={(value) => setEditForm({ ...editForm, social_platform: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Social URL</label>
              <Input
                value={editForm.social_url}
                onChange={(e) => setEditForm({ ...editForm, social_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Admin Notes</label>
              <Textarea
                value={editForm.admin_notes}
                onChange={(e) => setEditForm({ ...editForm, admin_notes: e.target.value })}
                placeholder="Internal notes..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_featured"
                checked={editForm.is_featured}
                onChange={(e) => setEditForm({ ...editForm, is_featured: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="is_featured" className="text-sm font-medium">
                Feature this review
              </label>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
