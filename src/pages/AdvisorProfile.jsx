
import React, { useState, useEffect } from 'react';
import { Advisor, AdvisorPlan, AdvisorPost, AdvisorSubscription, AdvisorReview, User, PlatformSetting, CommissionTracking, Notification as NotificationEntity } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Link, useSearchParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Star, Users, Lock, Shield, BarChart3, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import PaymentModal from '../components/subscription/PaymentModal';
import ReviewSection from '../components/advisors/ReviewSection';
import ReviewForm from '../components/advisors/ReviewForm';

export default function AdvisorProfile() {
  const [searchParams] = useSearchParams();
  const advisorId = searchParams.get('id');

  const [advisor, setAdvisor] = useState(null);
  const [plans, setPlans] = useState([]);
  const [posts, setPosts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [userReview, setUserReview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState([0, 0, 0, 0, 0]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    if (!advisorId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    // Helper functions for rate limit handling - moved inside useEffect
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const fetchWithRetry = async (fetchFn, retries = 2, delayMs = 1000) => {
      for (let i = 0; i <= retries; i++) {
        try {
          return await fetchFn();
        } catch (error) {
          // Keep original, more robust rate limit check
          const isRateLimit = error?.message?.includes('Rate limit') || error?.message?.includes('429') || error?.status === 429;
          const isLastAttempt = i === retries;
          
          if (isRateLimit && !isLastAttempt) {
            const waitTime = delayMs * Math.pow(2, i);
            console.log(`Rate limit hit, retrying in ${waitTime}ms... (attempt ${i + 1}/${retries + 1})`);
            await delay(waitTime);
            continue;
          }
          
          if (isLastAttempt || !isRateLimit) {
            throw error;
          }
        }
      }
    };

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Phase 1: Load user data first (most critical)
        const user = await fetchWithRetry(() => User.me().catch(() => null), 2, 800);
        if (!isMounted) return;
        setCurrentUser(user);
        await delay(600);

        // Phase 2: Load advisor data
        const advisorData = await fetchWithRetry(() => Advisor.get(advisorId), 2, 800);
        if (!isMounted) return;
        setAdvisor(advisorData);
        await delay(600);

        // Phase 3: Load plans
        let advisorPlans = [];
        try {
          advisorPlans = await fetchWithRetry(
            () => AdvisorPlan.filter({ advisor_id: advisorId, is_active: true }), 
            2, 
            800
          );
          if (!isMounted) return;
          setPlans(advisorPlans);
          await delay(600);
        } catch (error) {
          console.warn("Error fetching advisor plans:", error.message);
          if (isMounted) setPlans([]); // Ensure state is updated only if mounted
        }

        // Phase 4: Load reviews
        let advisorReviews = [];
        try {
          advisorReviews = await fetchWithRetry(
            () => AdvisorReview.filter({ advisor_id: advisorId, status: 'approved' }, '-created_date'),
            2,
            800
          );
          if (!isMounted) return;
          setReviews(advisorReviews);

          // Calculate average rating and distribution
          if (advisorReviews.length > 0) {
            const avgRating = advisorReviews.reduce((sum, review) => sum + review.rating, 0) / advisorReviews.length;
            setAverageRating(Math.round(avgRating * 10) / 10);

            const distribution = [0, 0, 0, 0, 0];
            advisorReviews.forEach((review) => {
              if (review.rating >= 1 && review.rating <= 5) {
                distribution[review.rating - 1]++;
              }
            });
            setRatingDistribution(distribution);
          } else {
            setAverageRating(0);
            setRatingDistribution([0, 0, 0, 0, 0]);
          }
          await delay(600);
        } catch (error) {
          console.warn("Error fetching reviews:", error.message);
          if (isMounted) setReviews([]); // Ensure state is updated only if mounted
        }

        // Phase 5: Load user-specific data if logged in
        if (user) {
          try {
            const userSub = await fetchWithRetry(
              () => AdvisorSubscription.filter({ user_id: user.id, advisor_id: advisorId, status: 'active' }, '', 1),
              2,
              800
            );
            if (!isMounted) return;

            if (userSub.length > 0) {
              setSubscription(userSub[0]);
              await delay(600);

              // Load posts only if subscribed
              try {
                const advisorPosts = await fetchWithRetry(
                  () => AdvisorPost.filter({ advisor_id: advisorId, status: 'published' }, '-created_date', 10),
                  2,
                  800
                );
                if (!isMounted) return;
                setPosts(advisorPosts);
              } catch (error) {
                console.warn("Error fetching posts:", error.message);
                if (isMounted) setPosts([]); // Ensure state is updated only if mounted
              }
            }

            // Check for existing review
            try {
              const existingReview = await fetchWithRetry(
                () => AdvisorReview.filter({ user_id: user.id, advisor_id: advisorId }, '', 1),
                2,
                800
              );
              if (!isMounted) return;
              if (existingReview.length > 0) {
                setUserReview(existingReview[0]);
              }
            } catch (error) {
              console.warn("Error fetching user review:", error.message);
            }
          } catch (error) {
            console.warn("Error fetching user subscriptions:", error.message);
          }
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Failed to fetch advisor profile:", error);
        toast.error("Could not load advisor profile.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [advisorId]);

  const handlePlanSelect = (plan) => {
    if (!currentUser) {
      toast.info("Please log in to subscribe.");
      return;
    }
    if (currentUser.app_role === 'basic' || !currentUser.app_role) {
      toast.error("Free users cannot subscribe. Please upgrade your platform membership first.", {
        action: <Link to={createPageUrl("Subscription")}><Button size="sm">Upgrade</Button></Link>
      });
      return;
    }
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (plan, paymentInfo) => {
    if (!currentUser || !advisor) return;

    // Helper functions for this handler
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const fetchWithRetry = async (fetchFn, retries = 2, delayMs = 1000) => {
      for (let i = 0; i <= retries; i++) {
        try {
          return await fetchFn();
        } catch (error) {
          const isRateLimit = error?.message?.includes('Rate limit') || error?.message?.includes('429') || error?.status === 429;
          const isLastAttempt = i === retries;
          
          if (isRateLimit && !isLastAttempt) {
            const waitTime = delayMs * Math.pow(2, i);
            await delay(waitTime);
            continue;
          }
          
          if (isLastAttempt || !isRateLimit) {
            throw error;
          }
        }
      }
    };

    try {
      // Fetch commission rate with retry
      const settings = await fetchWithRetry(
        () => PlatformSetting.filter({ setting_key: 'global_commission_rate' }),
        2,
        800
      );
      const commissionRate = settings.length > 0 ? parseFloat(settings[0].setting_value) : 20;

      // Create AdvisorSubscription
      const subData = {
        user_id: currentUser.id,
        advisor_id: advisor.id,
        plan_id: plan.id,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        payment_id: paymentInfo.payment_id
      };
      const newSubscription = await AdvisorSubscription.create(subData);
      setSubscription(newSubscription);

      // Create CommissionTracking
      const platform_fee = plan.price * (commissionRate / 100);
      const advisor_payout = plan.price - platform_fee;
      await CommissionTracking.create({
        subscription_id: newSubscription.id,
        advisor_id: advisor.id,
        user_id: currentUser.id,
        gross_amount: plan.price,
        platform_commission_rate: commissionRate,
        platform_fee: platform_fee,
        advisor_payout: advisor_payout,
        transaction_date: new Date().toISOString()
      });

      // Update advisor follower count
      await Advisor.update(advisor.id, { follower_count: (advisor.follower_count || 0) + 1 });

      // Fetch posts now that user is subscribed
      await delay(600);
      const advisorPosts = await fetchWithRetry(
        () => AdvisorPost.filter({ advisor_id: advisorId, status: 'published' }, '-created_date', 10),
        2,
        800
      );
      setPosts(advisorPosts);

      toast.success(`You are now subscribed to ${advisor.display_name}!`);
    } catch (error) {
      console.error("Subscription processing failed:", error);
      toast.error("An error occurred during subscription. Please contact support.");
    } finally {
      setShowPaymentModal(false);
      setSelectedPlan(null);
    }
  };

  const handleReviewSubmit = async (rating, reviewText) => {
    if (!currentUser || !advisor) return;

    // Helper functions for this handler
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const fetchWithRetry = async (fetchFn, retries = 2, delayMs = 1000) => {
      for (let i = 0; i <= retries; i++) {
        try {
          return await fetchFn();
        } catch (error) {
          const isRateLimit = error?.message?.includes('Rate limit') || error?.message?.includes('429') || error?.status === 429;
          const isLastAttempt = i === retries;
          
          if (isRateLimit && !isLastAttempt) {
            const waitTime = delayMs * Math.pow(2, i);
            await delay(waitTime);
            continue;
          }
          
          if (isLastAttempt || !isRateLimit) {
            throw error;
          }
        }
      }
    };

    try {
      if (userReview) {
        // Update existing review
        await AdvisorReview.update(userReview.id, { rating, review: reviewText });
        setUserReview({ ...userReview, rating, review: reviewText });
        toast.success("Review updated successfully!");
      } else {
        // Create new review
        const newReview = await AdvisorReview.create({
          advisor_id: advisor.id,
          user_id: currentUser.id,
          rating,
          review: reviewText,
          status: 'approved' // Assuming new reviews are approved for immediate display
        });
        setUserReview(newReview);
        toast.success("Review submitted successfully!");
      }

      // Refresh reviews and recalculate average
      await delay(600);
      const updatedReviews = await fetchWithRetry(
        () => AdvisorReview.filter({ advisor_id: advisorId, status: 'approved' }, '-created_date'),
        2,
        800
      );
      setReviews(updatedReviews);

      if (updatedReviews.length > 0) {
        const avgRating = updatedReviews.reduce((sum, review) => sum + review.rating, 0) / updatedReviews.length;
        setAverageRating(Math.round(avgRating * 10) / 10);

        const distribution = [0, 0, 0, 0, 0];
        updatedReviews.forEach((review) => {
          if (review.rating >= 1 && review.rating <= 5) {
            distribution[review.rating - 1]++;
          }
        });
        setRatingDistribution(distribution);
      } else {
        setAverageRating(0);
        setRatingDistribution([0, 0, 0, 0, 0]);
      }

    } catch (error) {
      console.error("Failed to submit review:", error);
      toast.error("Failed to submit review. Please try again.");
    }
  };

  // Check if user can leave a review (has active or expired subscription)
  const canLeaveReview = currentUser && (subscription ||
  // You might want to check for expired subscriptions too
  false);


  if (isLoading) {
    return <div className="p-6"><Skeleton className="h-screen w-full" /></div>;
  }

  if (!advisor) {
    return <div className="p-6 text-center">Advisor not found.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-4xl mx-auto space-y-8">
                <Link to={createPageUrl("Advisors")}>
                    <Button variant="outline" className="justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 mb-4 flex items-center gap-2 w-auto hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Advisors
                    </Button>
                </Link>
                {/* Enhanced Advisor Header */}
                <Card className="overflow-hidden border-0 shadow-xl rounded-xl">
                    <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 h-32 rounded-t-xl" />
                    <div className="p-8 flex items-start gap-8 -mt-16">
                        <img
              src={advisor.profile_image_url || `https://avatar.vercel.sh/${advisor.display_name}.png`}
              alt={advisor.display_name}
              className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-2xl object-cover" />

                        <div className="pt-16 flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                <h1 className="text-3xl font-bold text-slate-800">{advisor.display_name}</h1>
                                
                                {/* Trust Badges */}
                                <Badge className="bg-green-500 hover:bg-green-600 text-white font-medium px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-md">
                                    <Shield className="w-4 h-4" />
                                    SEBI Verified
                                </Badge>
                                
                                {averageRating > 0 &&
                <Badge
                  variant="outline"
                  className="bg-amber-50 border-amber-200 text-amber-800 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm">

                                        <Star className="w-4 h-4 fill-current text-amber-500" />
                                        {averageRating}/5
                                    </Badge>
                }
                            </div>
                            
                            {/* Stats Row */}
                            <div className="flex items-center gap-6 mb-4 text-sm text-slate-600">
                                <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    <span>{advisor.follower_count || 0} Subscribers</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <BarChart3 className="w-4 h-4" />
                                    <span>{advisor.success_rate || 'N/A'}% Success Rate</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-500" />
                                    <span>{reviews.length} Reviews</span>
                                </div>
                            </div>
                            
                            <p className="text-slate-600 leading-relaxed">{advisor.bio}</p>
                            
                            {/* Specialization Tags */}
                            <div className="flex flex-wrap gap-2 mt-4">
                                {advisor.specialization?.map((spec) =>
                <Badge key={spec} variant="secondary" className="bg-blue-100 text-blue-700 rounded-lg px-3 py-1">
                                        {spec}
                                    </Badge>
                )}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Rating Summary Card */}
                {reviews.length > 0 &&
        <Card className="rounded-xl shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Star className="w-5 h-5 text-yellow-500" />
                                Rating Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Overall Rating */}
                                <div className="text-center">
                                    <div className="text-6xl font-bold text-slate-800 mb-2">{averageRating}</div>
                                    <div className="flex justify-center mb-2">
                                        {[1, 2, 3, 4, 5].map((star) =>
                  <Star
                    key={star}
                    className={`w-6 h-6 ${
                    star <= Math.round(averageRating) ?
                    'text-yellow-500 fill-current' :
                    'text-gray-300'}`
                    } />

                  )}
                                    </div>
                                    <p className="text-slate-600">Based on {reviews.length} reviews</p>
                                </div>
                                
                                {/* Rating Distribution */}
                                <div className="space-y-2">
                                    {[5, 4, 3, 2, 1].map((rating) =>
                <div key={rating} className="flex items-center gap-3">
                                            <span className="text-sm w-8">{rating}★</span>
                                            <Progress
                    value={reviews.length > 0 ? ratingDistribution[rating - 1] / reviews.length * 100 : 0}
                    className="flex-1 h-2" />

                                            <span className="text-sm w-8 text-slate-600 text-right">
                                                {ratingDistribution[rating - 1]}
                                            </span>
                                        </div>
                )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
        }

                {/* Subscription Plans */}
                <Card className="rounded-xl shadow-lg">
                    <CardHeader><CardTitle>Subscription Plans</CardTitle></CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        {plans.map((plan) =>
            <Card key={plan.id} className="p-6 border-2 border-purple-200 shadow-md rounded-xl">
                                <h3 className="text-xl font-bold">{plan.name}</h3>
                                <p className="text-sm text-slate-500 capitalize">{plan.billing_interval} Plan</p>
                                <div className="my-4">
                                    <span className="text-4xl font-extrabold">₹{plan.price}</span>
                                    <span className="text-slate-500">/{plan.billing_interval.replace('ly', '')}</span>
                                </div>
                                <ul className="space-y-2 text-sm mb-6">
                                    {plan.features?.map((feature, i) =>
                <li key={i} className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                            <span>{feature}</span>
                                        </li>
                )}
                                </ul>
                                {subscription?.plan_id === plan.id ?
              <Button disabled className="w-full" variant="secondary">Currently Subscribed</Button> :

              <Button onClick={() => handlePlanSelect(plan)} className="w-full btn-primary">
                                        Subscribe to {plan.name}
                                    </Button>
              }
                            </Card>
            )}
                    </CardContent>
                </Card>

                {/* Reviews Section */}
                <Card className="rounded-xl shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-500" />
                            Reviews & Ratings
                            {reviews.length > 0 &&
              <Badge variant="outline" className="rounded-lg">
                                    {averageRating}/5 ({reviews.length} reviews)
                                </Badge>
              }
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {canLeaveReview &&
            <ReviewForm
              onSubmit={handleReviewSubmit}
              existingReview={userReview}
              advisorName={advisor.display_name} />

            }
                        
                        <ReviewSection reviews={reviews} />
                    </CardContent>
                </Card>

                {/* Advisory Posts */}
                <Card className="rounded-xl shadow-lg">
                    <CardHeader><CardTitle>Recent Advisory Posts</CardTitle></CardHeader>
                    <CardContent>
                        {subscription ?
            posts.length > 0 ?
            <div className="space-y-4">
                                {posts.map((post) =>
              <div key={post.id} className="p-4 border rounded-xl bg-slate-50">
                                        <h4 className="font-semibold">{post.title}</h4>
                                        <p className="text-sm text-slate-600 mt-1">{post.content}</p>
                                        <Badge variant="outline" className="mt-2 rounded-lg">{post.stock_symbol}</Badge>
                                    </div>
              )}
                                </div> :
            <p className="text-slate-500">No posts from this advisor yet.</p> :

            <div className="text-center p-8 bg-slate-100 rounded-xl">
                                <Lock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                <h3 className="font-semibold text-lg">Content Locked</h3>
                                <p className="text-slate-600 mb-4">Subscribe to one of the plans above to view exclusive advisory posts.</p>
                            </div>
            }
                    </CardContent>
                </Card>
            </div>
            
            <PaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        plan={selectedPlan}
        onPaymentSuccess={handlePaymentSuccess} />

        </div>);

}
