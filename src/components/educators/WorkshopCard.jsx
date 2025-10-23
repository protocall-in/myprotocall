import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Users,
  Clock,
  Star,
  CheckCircle,
  Video,
  Award,
  AlertCircle
} from 'lucide-react';
import { format, isAfter, isBefore, addHours } from 'date-fns';

export default function WorkshopCard({ workshop, educator, canAccessPremium }) {
  const [showJoinModal, setShowJoinModal] = useState(false);

  const workshopDate = new Date(workshop.scheduled_date);
  const workshopEndTime = addHours(workshopDate, workshop.duration_hours);
  const now = new Date();
  
  const isUpcoming = isAfter(workshopDate, now);
  const isLive = isAfter(now, workshopDate) && isBefore(now, workshopEndTime);
  const isCompleted = isAfter(now, workshopEndTime);

  const getStatusBadge = () => {
    if (isLive) {
      return <Badge className="bg-red-500 text-white animate-pulse">
        <div className="w-2 h-2 bg-white rounded-full mr-1" />
        LIVE NOW
      </Badge>;
    } else if (isUpcoming) {
      return <Badge className="bg-blue-500 text-white">
        UPCOMING
      </Badge>;
    } else {
      return <Badge className="bg-gray-500 text-white">
        COMPLETED
      </Badge>;
    }
  };

  const handleJoin = () => {
    if (canAccessPremium) {
      if (isLive) {
        alert(`Joining live workshop: ${workshop.title}`);
      } else if (isUpcoming) {
        alert(`Registering for workshop: ${workshop.title}`);
      } else {
        alert("This workshop has ended. Check for recordings or upcoming sessions.");
      }
    } else {
      alert("Please subscribe to Premium to join workshops.");
    }
  };

  const isFull = workshop.current_enrollments >= workshop.max_participants;

  return (
    <Card className="shadow-lg border-0 bg-white flex flex-col">
      {/* Workshop Header */}
      <div className="relative bg-gradient-to-r from-purple-500 to-indigo-500 p-4 text-white">
        <div className="flex items-center justify-between">
          {getStatusBadge()}
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-300" />
            <span className="font-medium">{workshop.rating}</span>
          </div>
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="space-y-2">
          <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700">
            LIVE WORKSHOP
          </Badge>
          <CardTitle className="text-lg leading-tight">{workshop.title}</CardTitle>
        </div>

        {/* Educator */}
        {educator && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <img
              src={educator.profile_image_url}
              alt={educator.display_name}
              className="w-6 h-6 rounded-full"
            />
            <span className="font-medium">{educator.display_name}</span>
            {educator.verified && (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4 flex-1">
        <p className="text-sm text-slate-600 line-clamp-2">{workshop.description}</p>

        {/* Workshop Schedule */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800 font-medium text-sm">
            <Calendar className="w-4 h-4" />
            <span>{format(workshopDate, 'MMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2 text-blue-600 text-sm mt-1">
            <Clock className="w-4 h-4" />
            <span>{format(workshopDate, 'h:mm a')} - {format(workshopEndTime, 'h:mm a')}</span>
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Duration: {workshop.duration_hours} hours
          </div>
        </div>

        {/* Capacity Status */}
        <div className="bg-slate-50 p-3 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Participants:</span>
            <span className={`font-semibold ${isFull ? 'text-red-600' : 'text-slate-900'}`}>
              {workshop.current_enrollments} / {workshop.max_participants}
            </span>
          </div>
          <div className="mt-2 bg-slate-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                isFull ? 'bg-red-500' : 'bg-purple-600'
              }`}
              style={{ 
                width: `${Math.min((workshop.current_enrollments / workshop.max_participants) * 100, 100)}%` 
              }}
            />
          </div>
          {isFull && (
            <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
              <AlertCircle className="w-3 h-3" />
              <span>Workshop is full</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-4">
          <p className="text-2xl font-bold text-slate-900">₹{workshop.price}</p>
          <Button 
            onClick={handleJoin}
            className={`${
              isLive 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-gradient-to-r from-purple-600 to-indigo-600'
            } text-white`}
            disabled={!canAccessPremium || (isFull && !isLive)}
          >
            <Video className="w-4 h-4 mr-2" />
            {isLive ? 'Join Live' : isUpcoming ? 'Register' : 'View Recording'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}