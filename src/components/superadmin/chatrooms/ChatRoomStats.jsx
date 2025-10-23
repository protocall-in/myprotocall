import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { TrendingUp, Users, MessageSquare, Crown } from 'lucide-react';

export default function ChatRoomStats({ chatRooms, messages, users }) {
  const analytics = useMemo(() => {
    // Room type distribution
    const roomTypeData = chatRooms.reduce((acc, room) => {
      acc[room.room_type] = (acc[room.room_type] || 0) + 1;
      return acc;
    }, {});

    const roomTypeChart = Object.keys(roomTypeData).map(type => ({
      name: type.replace('_', ' '),
      value: roomTypeData[type]
    }));

    // Access level distribution
    const accessLevels = [
      { name: 'Public', value: chatRooms.filter(r => !r.is_premium).length, color: '#10B981' },
      { name: 'Premium', value: chatRooms.filter(r => r.is_premium && r.required_plan === 'premium').length, color: '#8B5CF6' },
      { name: 'VIP', value: chatRooms.filter(r => r.is_premium && r.required_plan === 'vip').length, color: '#F59E0B' }
    ];

    // Message activity by day (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const messagesByDay = last7Days.map(date => {
      const dayMessages = messages.filter(m => 
        m.created_date && m.created_date.startsWith(date)
      );
      return {
        date: new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        messages: dayMessages.length
      };
    });

    // Top 5 most active rooms
    const roomActivity = chatRooms.map(room => ({
      name: room.name,
      messages: messages.filter(m => m.chat_room_id === room.id).length,
      participants: room.participant_count || 0
    })).sort((a, b) => b.messages - a.messages).slice(0, 5);

    // Hourly activity heatmap
    const hourlyActivity = Array.from({ length: 24 }, (_, hour) => {
      const hourMessages = messages.filter(m => {
        if (!m.created_date) return false;
        const msgHour = new Date(m.created_date).getHours();
        return msgHour === hour;
      });
      return {
        hour: `${hour}:00`,
        activity: hourMessages.length
      };
    });

    return {
      roomTypeChart,
      accessLevels,
      messagesByDay,
      roomActivity,
      hourlyActivity
    };
  }, [chatRooms, messages]);

  const COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#06B6D4'];

  return (
    <div className="space-y-6">
      {/* Top Performing Rooms */}
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Top 5 Most Active Rooms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.roomActivity.map((room, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{room.name}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {room.messages} messages
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {room.participants} participants
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Type Distribution */}
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader>
            <CardTitle>Room Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.roomTypeChart}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {analytics.roomTypeChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Access Level Distribution */}
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-purple-600" />
              Access Level Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.accessLevels}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Message Activity (Last 7 Days) */}
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader>
            <CardTitle>Message Activity (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.messagesByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="messages" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hourly Activity Heatmap */}
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader>
            <CardTitle>Hourly Activity Pattern</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.hourlyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="activity" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}