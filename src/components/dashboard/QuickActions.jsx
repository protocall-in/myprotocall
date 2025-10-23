import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MessageSquare, BarChart3, Plus, Video } from "lucide-react";

export default function QuickActions() {
  const actions = [
    {
      title: "Join Live Chat",
      description: "Discuss with fellow traders",
      icon: MessageSquare,
      link: createPageUrl("ChatRooms"),
      gradient: "bg-gradient-to-br from-blue-500 to-indigo-600"
    },
    {
      title: "Create Poll",
      description: "Get community opinion",
      icon: BarChart3,
      link: createPageUrl("Polls"),
      gradient: "bg-gradient-to-br from-purple-500 to-violet-600"
    },
    {
      title: "Virtual Meeting",
      description: "Start group discussion",
      icon: Video,
      link: createPageUrl("ChatRooms"),
      gradient: "bg-gradient-to-br from-sky-500 to-blue-600"
    },
    {
      title: "View Events",
      description: "Join trading events",
      icon: Plus,
      link: createPageUrl("Events"),
      gradient: "bg-gradient-to-br from-green-500 to-emerald-600"
    }
  ];

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-purple-50">
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <Plus className="w-5 h-5 text-purple-600" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action, index) => (
            <Link key={index} to={action.link}>
              <div className={`h-auto px-4 py-4 w-full text-sm rounded-xl font-semibold shadow-md flex flex-col items-center justify-center gap-3 transition-all duration-300 ${action.gradient} text-white hover:shadow-lg cursor-pointer transform hover:scale-105 group`}>
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center group-hover:bg-opacity-30 transition-colors">
                  <action.icon className="w-4 h-4" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm mb-1">{action.title}</p>
                  <p className="text-xs opacity-90">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}