
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Star, CheckCircle, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { AdvisorReview, AdvisorPlan } from '@/api/entities';

export default function AdvisorCard({ advisor, currentUser }) {
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [displayPlan, setDisplayPlan] = useState({ price: 999, interval: 'monthly' });

  useEffect(() => {
    const loadAdvisorData = async () => {
      try {
        // Load reviews to calculate rating
        const reviews = await AdvisorReview.filter({ advisor_id: advisor.id, status: 'approved' });
        if (reviews.length > 0) {
          const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
          setAverageRating(Math.round(avgRating * 10) / 10);
        }
        setReviewCount(reviews.length);

        // Load lowest priced plan
        const plans = await AdvisorPlan.filter({ advisor_id: advisor.id, is_active: true });
        if (plans.length > 0) {
          const cheapestPlan = plans.reduce((min, plan) => plan.price < min.price ? plan : min);
          setDisplayPlan({
            price: cheapestPlan.price,
            interval: cheapestPlan.billing_interval
          });
        }
      } catch (error) {
        console.error("Error loading advisor data:", error);
      }
    };
    loadAdvisorData();
  }, [advisor.id]);

  // Only show verified advisors
  if (!advisor.status || advisor.status !== 'approved') {
    return null;
  }

  const truncatedBio = advisor.bio && advisor.bio.length > 120 ?
  advisor.bio.substring(0, 120) + '...' :
  advisor.bio || 'Professional stock market advisor';

  return (
    <Card className="flex flex-col shadow-lg hover:shadow-2xl transition-all duration-300 rounded-xl overflow-hidden border-0 bg-white">
            <CardHeader className="text-center p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-t-xl">
                <div className="flex justify-center mb-4">
                    <img
            src={advisor.profile_image_url || `https://avatar.vercel.sh/${advisor.display_name}.png`}
            alt={advisor.display_name}
            className="w-20 h-20 rounded-full border-4 border-white shadow-md object-cover" />

                </div>
                
                {/* Advisor Name and Badges */}
                <div className="space-y-2">
                    <CardTitle className="text-xl font-bold text-slate-800">
                        {advisor.display_name}
                    </CardTitle>
                    
                    {/* Trust Badges */}
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        {/* SEBI Verified Badge */}
                        <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-3 py-1 rounded-xl flex items-center gap-1 shadow-md">
                            <Shield className="w-3 h-3" />
                            SEBI Verified
                        </Badge>
                        
                        {/* Rating Badge */}
                        {averageRating > 0 &&
            <Badge
              variant="outline"
              className="bg-amber-50 border-amber-200 text-amber-800 text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1 shadow-sm">

                                <Star className="w-3 h-3 fill-current text-amber-500" />
                                {averageRating}/5
                            </Badge>
            }
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6 flex-1 space-y-4">
                {/* Bio */}
                <p className="text-sm text-slate-600 text-center leading-relaxed">
                    {truncatedBio}
                </p>

                {/* Specialization Tags */}
                <div className="flex flex-wrap gap-2 justify-center">
                    {advisor.specialization?.slice(0, 2).map((spec) =>
          <Badge key={spec} variant="secondary" className="text-xs bg-blue-100 text-blue-700 rounded-lg px-2 py-1">
                            {spec}
                        </Badge>
          )}
                </div>

                {/* Stats */}
                <div className="flex justify-around pt-4 border-t border-slate-100">
                    <div className="text-center">
                        <p className="font-bold text-lg text-slate-800">{advisor.follower_count || 0}</p>
                        <p className="text-xs text-slate-500">Subscribers</p>
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-lg text-slate-800">{reviewCount}</p>
                        <p className="text-xs text-slate-500">Reviews</p>
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-lg text-slate-800">{advisor.success_rate || 'N/A'}%</p>
                        <p className="text-xs text-slate-500">Success Rate</p>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="flex flex-col p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-b-xl">
                {/* Pricing */}
                <div className="text-center mb-4">
                    <span className="text-2xl font-bold text-slate-800">₹{displayPlan.price.toLocaleString()}</span>
                    <span className="text-slate-500 ml-1">/{displayPlan.interval.replace('ly', '')}</span>
                </div>
                
                {/* Subscribe Button */}
                <Link to={createPageUrl(`AdvisorProfile?id=${advisor.id}`)} className="w-full">
                    <Button className="justify-center whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-ring focus-visible:ring-offset-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 peer/menu-button w-full overflow-hidden p-2 text-left outline-none ring-sidebar-ring focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 h-8 text-sm rounded-xl mb-1 font-semibold shadow-md flex items-center gap-3 px-3 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg">
                        View Profile & Subscribe
                    </Button>
                </Link>
            </CardFooter>
        </Card>);

}