
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, MessageSquare, BarChart3, Users, Clock, Star } from "lucide-react";
import TrustScoreBadge from "../ui/TrustScoreBadge";

export default function RecentActivity() {
  const activities = [
  {
    type: "poll",
    icon: BarChart3,
    title: "New poll created for RELIANCE",
    description: "Should we buy the dip?",
    time: "2 min ago",
    color: "text-purple-600"
  },
  {
    type: "chat",
    icon: MessageSquare,
    title: "Active discussion in TCS room",
    description: "15 traders discussing Q3 results",
    time: "5 min ago",
    color: "text-blue-600"
  },
  {
    type: "join",
    icon: Users,
    title: "5 new traders joined",
    description: "Community growing strong",
    time: "10 min ago",
    color: "text-green-600"
  },
  {
    type: "poll",
    icon: BarChart3,
    title: "Poll result: HDFC Bank",
    description: "65% voted BUY",
    time: "15 min ago",
    color: "text-purple-600"
  }];


  const trustedUsers = [
  { name: 'TraderJoe', score: 98 },
  { name: 'CryptoKing', score: 95 },
  { name: 'StockSensei', score: 92 }];


  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50">
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <Activity className="w-5 h-5 text-blue-600" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 divide-y">
        <div className="p-6 space-y-4">
          {activities.map((activity, index) =>
          <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50">
              <div className={`p-2 rounded-full bg-slate-100 ${activity.color}`}>
                <activity.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-slate-900">{activity.title}</h4>
                <p className="text-xs text-slate-500 mt-1">{activity.description}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span className="text-xs text-slate-400">{activity.time}</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="p-6">
            <h4 className="font-semibold text-sm text-slate-900 mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                Top Trusted Users
            </h4>
            <ul className="space-y-2">
                {trustedUsers.map((user) =>
            <li key={user.name} className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">{user.name}</span>
                        <TrustScoreBadge score={user.score} size="xs" />
                    </li>
            )}
            </ul>
        </div>
      </CardContent>
    </Card>);

}