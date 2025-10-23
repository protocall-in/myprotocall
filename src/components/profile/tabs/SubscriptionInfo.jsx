import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Calendar, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

export default function SubscriptionInfo({ subscription }) {
  if (!subscription) {
    return (
      <div className="text-center">
        <p className="mb-4">You are currently on the free plan.</p>
        <Link to={createPageUrl("Subscription")}>
          <Button>
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Premium
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Crown className="w-5 h-5" />
          Your Subscription
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-lg capitalize">{subscription.plan_type} Plan</span>
          <span className="text-sm text-green-600 font-semibold flex items-center gap-1">
            <CheckCircle className="w-4 h-4" /> Active
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <Calendar className="w-4 h-4" />
          <span>Renews on {format(new Date(subscription.end_date), 'MMMM d, yyyy')}</span>
        </div>
        <Link to={createPageUrl("Subscription")}>
          <Button variant="outline">Manage Subscription</Button>
        </Link>
      </CardContent>
    </Card>
  );
}