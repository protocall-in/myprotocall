
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Gift, Award, TrendingUp } from 'lucide-react';

export default function ProfileCreditsSection({ user, referrals }) {
  // Calculate credits based on referrals and other activities
  const successfulReferrals = referrals.filter((r) => r.signup_completed).length;
  const referralCredits = successfulReferrals * 100; // 100 credits per successful referral
  const bonusCredits = user.trust_score >= 80 ? 500 : user.trust_score >= 60 ? 250 : 0; // Bonus for high trust score
  const totalCredits = referralCredits + bonusCredits;

  const creditSources = [
  {
    title: "Referral Rewards",
    amount: referralCredits,
    description: `${successfulReferrals} successful referrals × 100 credits`,
    icon: Award,
    color: "text-blue-600"
  },
  {
    title: "Trust Score Bonus",
    amount: bonusCredits,
    description: bonusCredits > 0 ? `High trust score (${Math.round(user.trust_score)}/100)` : "Earn more with higher trust score",
    icon: Star,
    color: "text-purple-600"
  }];


  return (
    <div className="space-y-6">
      {/* Total Credits */}
      <Card className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Star className="w-6 h-6" />
            Total Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">{totalCredits.toLocaleString()}</div>
            <div className="text-lg opacity-90">Protocol Credits</div>
          </div>
        </CardContent>
      </Card>

      {/* Credit Sources */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
            <CardTitle>Credit Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
            <div className="grid gap-4">
                {creditSources.map((source, index) =>
            <Card key={index}>
                    <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full bg-slate-100 ${source.color}`}>
                        <source.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                        <h4 className="font-semibold">{source.title}</h4>
                        <p className="text-sm text-slate-600">{source.description}</p>
                        </div>
                        <div className="text-right">
                        <div className="text-xl font-bold">{source.amount.toLocaleString()}</div>
                        <div className="text-xs text-slate-500">credits</div>
                        </div>
                    </div>
                    </CardContent>
                </Card>
            )}
            </div>
        </CardContent>
      </Card>
      

      {/* How to Earn More */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Earn More Credits
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 p-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Gift className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold">Invite More Traders</h4>
                <p className="text-sm text-slate-600">Earn 100 credits for each successful referral</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-semibold">Increase Trust Score</h4>
                <p className="text-sm text-slate-600">Higher trust scores unlock bonus credit multipliers</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-semibold">Active Participation</h4>
                <p className="text-sm text-slate-600">Engage in community discussions and events</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>);

}