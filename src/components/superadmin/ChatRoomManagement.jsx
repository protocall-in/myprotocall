
import React, { useState, useEffect, useCallback } from 'react';
import { ChatRoom, Message, User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Plus,
  BarChart3,
  Users as UsersIcon,
  Activity,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

import ChatRoomTable from './chatrooms/ChatRoomTable';
import ChatRoomStats from './chatrooms/ChatRoomStats';
import ChatRoomFormModal from './chatrooms/ChatRoomFormModal';

export default function ChatRoomManagement({ user }) {
  const [chatRooms, setChatRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    premium: 0,
    totalParticipants: 0,
    totalMessages: 0,
    activeToday: 0
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [rooms, msgs, allUsers] = await Promise.all([
        ChatRoom.list('-created_date'),
        Message.list('-created_date', 1000),
        User.list()
      ]);

      setChatRooms(rooms);
      setMessages(msgs);
      setUsers(allUsers);

      // Calculate stats
      const today = new Date().toDateString();
      const activeToday = rooms.filter(r => 
        r.updated_date && new Date(r.updated_date).toDateString() === today
      ).length;

      setStats({
        total: rooms.length,
        active: rooms.filter(r => r.is_meeting_active).length,
        premium: rooms.filter(r => r.is_premium).length,
        totalParticipants: rooms.reduce((sum, r) => sum + (r.participant_count || 0), 0),
        totalMessages: msgs.length,
        activeToday
      });
    } catch (error) {
      console.error('Error loading chat room data:', error);
      toast.error('Failed to load chat room data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateRoom = async (roomData) => {
    try {
      await ChatRoom.create(roomData);
      toast.success('Chat room created successfully');
      setShowCreateModal(false);
      loadData();
    } catch (error) {
      console.error('Error creating chat room:', error);
      toast.error('Failed to create chat room');
    }
  };

  const handleUpdateRoom = async (roomId, roomData) => {
    try {
      await ChatRoom.update(roomId, roomData);
      toast.success('Chat room updated successfully');
      loadData();
    } catch (error) {
      console.error('Error updating chat room:', error);
      toast.error('Failed to update chat room');
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this chat room? This action cannot be undone.')) {
      return;
    }

    try {
      await ChatRoom.delete(roomId);
      toast.success('Chat room deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting chat room:', error);
      toast.error('Failed to delete chat room');
    }
  };

  const exportData = () => {
    const csvData = chatRooms.map(room => ({
      'Room Name': room.name,
      'Description': room.description || '',
      'Room Type': room.room_type,
      'Is Premium': room.is_premium ? 'Yes' : 'No',
      'Required Plan': room.required_plan || 'None',
      'Participants': room.participant_count || 0,
      'Stock Symbol': room.stock_symbol || '',
      'Created Date': new Date(room.created_date).toLocaleDateString(),
      'Active Meeting': room.is_meeting_active ? 'Yes' : 'No'
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvString = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chatrooms-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 font-medium">Loading Chat Room Management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Chat Room Management</h2>
          <p className="text-slate-600">Manage all chat rooms, participants, and messages</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={exportData} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowCreateModal(true)} className="bg-cyan-600 hover:bg-cyan-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Room
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-8 h-8" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm opacity-90">Total Rooms</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8" />
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm opacity-90">Active Now</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-violet-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Badge className="bg-white/20 text-white p-2">
                <MessageSquare className="w-4 h-4" />
              </Badge>
              <div>
                <p className="text-2xl font-bold">{stats.premium}</p>
                <p className="text-sm opacity-90">Premium Rooms</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <UsersIcon className="w-8 h-8" />
              <div>
                <p className="text-2xl font-bold">{stats.totalParticipants}</p>
                <p className="text-sm opacity-90">Participants</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-8 h-8" />
              <div>
                <p className="text-2xl font-bold">{stats.totalMessages}</p>
                <p className="text-sm opacity-90">Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-pink-500 to-rose-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8" />
              <div>
                <p className="text-2xl font-bold">{stats.activeToday}</p>
                <p className="text-sm opacity-90">Active Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="rooms" className="space-y-6">
        <TabsList className="grid grid-cols-2 bg-transparent rounded-lg p-1 gap-2">
          <TabsTrigger 
            value="rooms"
            className="whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md"
          >
            <MessageSquare className="w-4 h-4" />
            Manage Rooms
          </TabsTrigger>
          <TabsTrigger 
            value="analytics"
            className="whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rooms">
          <ChatRoomTable
            chatRooms={chatRooms}
            messages={messages}
            users={users}
            onUpdate={handleUpdateRoom}
            onDelete={handleDeleteRoom}
            onRefresh={loadData}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <ChatRoomStats
            chatRooms={chatRooms}
            messages={messages}
            users={users}
          />
        </TabsContent>
      </Tabs>

      {/* Create Room Modal */}
      <ChatRoomFormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateRoom}
        user={user}
      />
    </div>
  );
}
