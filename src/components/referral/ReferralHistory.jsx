import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, UserPlus, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function ReferralHistory({ referrals }) {
  const getStatusBadge = (referral) => {
    if (referral.is_active_member) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Active Member</Badge>;
    } else if (referral.signup_completed) {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Signed Up</Badge>;
    } else if (referral.invitee_email) {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Invited</Badge>;
    } else {
      return <Badge className="bg-slate-100 text-slate-800 border-slate-200">Link Generated</Badge>;
    }
  };

  const getStatusIcon = (referral) => {
    if (referral.is_active_member) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (referral.signup_completed) {
      return <UserPlus className="w-4 h-4 text-blue-500" />;
    } else {
      return <Clock className="w-4 h-4 text-orange-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-600" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {referrals.length > 0 ? (
          <div className="space-y-3">
            {referrals.slice(0, 10).map((referral) => (
              <div key={referral.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                {getStatusIcon(referral)}
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {referral.invitee_email ? `Invited ${referral.invitee_email}` : 'Referral link created'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {format(new Date(referral.created_date), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                {getStatusBadge(referral)}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-700 mb-2">No referral activity yet</h3>
            <p className="text-sm text-slate-600">Start sharing your referral link to see activity here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}