import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Users, UserCheck, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

export default function ReferralInfo({ referrals }) {
  const successfulSignups = referrals.filter(r => r.signup_completed).length;

  const getBadge = () => {
    if (successfulSignups >= 10) return 'Community Champion';
    if (successfulSignups >= 5) return 'Community Leader';
    if (successfulSignups >= 1) return 'Community Builder';
    return 'No badge yet';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Your Referral Status</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invites Sent</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referrals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful Signups</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successfulSignups}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Badge</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{getBadge()}</div>
          </CardContent>
        </Card>
      </div>
      <Link to={createPageUrl("ReferralDashboard")}>
        <Button variant="outline">View Referral Dashboard</Button>
      </Link>
    </div>
  );
}