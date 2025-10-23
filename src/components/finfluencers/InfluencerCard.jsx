
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  Shield,
  Users,
  Star,
  ExternalLink,
  Youtube,
  Twitter,
  Instagram,
  Linkedin } from
'lucide-react';
import { createPageUrl } from '@/utils';

export default function InfluencerCard({ influencer, canAccessPremium }) {
  const socialIcons = {
    youtube: Youtube,
    twitter: Twitter,
    instagram: Instagram,
    linkedin: Linkedin
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm border-0">
      <CardHeader className="text-center pb-2">
        <div className="relative mx-auto">
          <img
            src={influencer.profile_image_url}
            alt={influencer.display_name}
            className="w-20 h-20 rounded-full object-cover mx-auto mb-3" />

          {influencer.verified &&
          <CheckCircle className="w-5 h-5 text-blue-500 absolute -bottom-1 -right-1 bg-white rounded-full" />
          }
        </div>
        
        <div className="space-y-2">
          <h3 className="font-bold text-lg text-slate-900">{influencer.display_name}</h3>
          <p className="text-sm text-slate-600">{influencer.bio}</p>
          
          <div className="flex flex-wrap gap-1 justify-center">
            {influencer.sebi_registered &&
            <Badge className="bg-green-100 text-green-800 text-xs">
                <Shield className="w-3 h-3 mr-1" />
                SEBI Registered
              </Badge>
            }
            {influencer.verified &&
            <Badge className="bg-blue-100 text-blue-800 text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            }
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Specializations */}
        <div className="flex flex-wrap gap-1 justify-center">
          {influencer.specialization?.slice(0, 2).map((spec) =>
          <Badge key={spec} variant="outline" className="text-xs">
              {spec}
            </Badge>
          )}
          {influencer.specialization?.length > 2 &&
          <Badge variant="outline" className="text-xs">
              +{influencer.specialization.length - 2}
            </Badge>
          }
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1">
              <Users className="w-4 h-4 text-slate-500" />
              <span className="font-semibold text-sm">
                {(influencer.follower_count / 1000).toFixed(0)}K
              </span>
            </div>
            <p className="text-xs text-slate-500">Followers</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="font-semibold text-sm">{influencer.success_rate}%</span>
            </div>
            <p className="text-xs text-slate-500">Success Rate</p>
          </div>
        </div>

        {/* Social Links */}
        {influencer.social_links &&
        <div className="flex justify-center gap-2">
            {Object.entries(influencer.social_links).map(([platform, url]) => {
            if (!url) return null;
            const Icon = socialIcons[platform];
            if (!Icon) return null;

            return (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-800 transition-colors">

                  <Icon className="w-4 h-4" />
                </a>);

          })}
          </div>
        }

        {/* Action Buttons */}
        <div className="space-y-2">
          <Link to={createPageUrl(`InfluencerProfile?id=${influencer.id}`)}>
            <Button variant="outline" className="peer/menu-button flex w-full items-center gap-2 overflow-hidden p-2 text-left outline-none ring-sidebar-ring focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 h-8 text-sm rounded-xl mb-1 font-semibold shadow-md flex items-center gap-3 px-3 py-2.5 transition-all duration-300 
bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 
hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg
">
              View Profile
            </Button>
          </Link>
          
          {influencer.subscription_price &&
          <div className="text-center">
              <p className="text-sm text-slate-600">
                Premium Content: ₹{influencer.subscription_price}/month
              </p>
              {!canAccessPremium &&
            <Link to={createPageUrl("Subscription")}>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 mt-2">
                    Subscribe to View
                  </Button>
                </Link>
            }
            </div>
          }
        </div>
      </CardContent>
    </Card>);

}
