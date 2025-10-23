import React, { useState, useEffect, useCallback } from "react";
import { Meeting } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, VideoOff, Users, Clock } from "lucide-react";

export default function MeetingControls({ chatRoomId, stockSymbol, onMeetingStart, onMeetingEnd }) {
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadActiveMeeting = useCallback(async () => {
    if (!chatRoomId) return;
    
    try {
      const meetings = await Meeting.filter({ 
        chat_room_id: chatRoomId, 
        status: 'active' 
      }, '-start_time', 1).catch(() => []);
      
      setActiveMeeting(meetings[0] || null);
    } catch (error) {
      console.error("Error loading meeting:", error);
    }
  }, [chatRoomId]);

  useEffect(() => {
    loadActiveMeeting();
  }, [loadActiveMeeting]);

  const startMeeting = async () => {
    setIsLoading(true);
    try {
      const meetingData = {
        chat_room_id: chatRoomId,
        stock_symbol: stockSymbol || 'GENERAL',
        meeting_url: `https://meet.google.com/${Math.random().toString(36).substring(7)}`,
        status: 'active',
        start_time: new Date().toISOString(),
        participant_count: 0,
        max_participants: 50
      };

      const meeting = await Meeting.create(meetingData);
      setActiveMeeting(meeting);
      onMeetingStart && onMeetingStart(meeting);
    } catch (error) {
      console.error("Error starting meeting:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const endMeeting = async () => {
    if (!activeMeeting) return;

    setIsLoading(true);
    try {
      await Meeting.update(activeMeeting.id, { 
        status: 'ended',
        end_time: new Date().toISOString()
      });
      setActiveMeeting(null);
      onMeetingEnd && onMeetingEnd();
    } catch (error) {
      console.error("Error ending meeting:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (activeMeeting) {
    return (
      <Card className="bg-gradient-to-r from-green-500 to-blue-600 text-white border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <div>
                <p className="font-semibold">Meeting Active</p>
                <p className="text-xs text-green-100">Join the live discussion</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-white/20 text-white">
                <Users className="w-3 h-3 mr-1" />
                {activeMeeting.participant_count || 0}
              </Badge>
              <Button 
                size="sm" 
                variant="secondary"
                onClick={() => window.open(activeMeeting.meeting_url, '_blank')}
                className="bg-white text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-300 border-2 border-transparent transition-all duration-300"
              >
                <Video className="w-4 h-4 mr-2" />
                Join
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={endMeeting}
                disabled={isLoading}
              >
                <VideoOff className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed border-2 border-slate-200 bg-slate-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Video className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-700">Start Live Meeting</p>
              <p className="text-xs text-slate-500">Connect with fellow traders</p>
            </div>
          </div>
          <Button 
            onClick={startMeeting}
            disabled={isLoading}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Video className="w-4 h-4 mr-2" />
            {isLoading ? 'Starting...' : 'Start'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}