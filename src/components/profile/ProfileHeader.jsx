import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Award, Star, Settings } from 'lucide-react';
import TrustScoreBadge from '../ui/TrustScoreBadge';
import ProfileSettingsModal from './ProfileSettingsModal';

export default function ProfileHeader({ user, subscription, referrals }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!user) return null;

  const getReferralBadge = () => {
    const successfulSignups = referrals.filter(r => r.signup_completed).length;
    if (successfulSignups >= 10) return { name: 'Champion', icon: Award, color: 'text-yellow-500' };
    if (successfulSignups >= 5) return { name: 'Leader', icon: Star, color: 'text-slate-500' };
    if (successfulSignups >= 1) return { name: 'Builder', icon: Star, color: 'text-orange-500' };
    return null;
  };

  const referralBadge = getReferralBadge();

  return (
    <>
      <Card className="w-full bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-white shadow-md">
              <AvatarImage src={user.profile_image_url} alt={user.display_name} />
              <AvatarFallback className="text-xl">{user.display_name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-slate-900">{user.display_name}</h2>
              <p className="text-sm text-slate-600">{user.email}</p>
            </div>
            <div className="flex items-center gap-4">
              {referralBadge && (
                <div className={`flex items-center gap-1 text-sm font-semibold ${referralBadge.color}`}>
                  <referralBadge.icon className="w-4 h-4" />
                  <span>{referralBadge.name}</span>
                </div>
              )}
              <TrustScoreBadge score={user.trust_score} size="md" />
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <ProfileSettingsModal 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        user={user}
        subscription={subscription}
        referrals={referrals}
      />
    </>
  );
}