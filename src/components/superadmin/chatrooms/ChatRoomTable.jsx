import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Edit,
  Trash2,
  Users,
  MessageSquare,
  Video,
  Crown,
  Shield,
  Eye,
  Lock
} from 'lucide-react';
import ChatRoomFormModal from './ChatRoomFormModal';
import MessageModerationPanel from './MessageModerationPanel';
import ModeratorManager from './ModeratorManager';

export default function ChatRoomTable({ chatRooms, messages, users, onUpdate, onDelete, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRoomForMessages, setSelectedRoomForMessages] = useState(null);
  const [selectedRoomForModerators, setSelectedRoomForModerators] = useState(null);

  const filteredRooms = useMemo(() => {
    return chatRooms.filter(room => {
      const matchesSearch = searchTerm === '' ||
        room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.stock_symbol?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === 'all' || room.room_type === typeFilter;
      const matchesPlan = planFilter === 'all' || room.required_plan === planFilter;
      
      const isActive = room.is_meeting_active || (room.participant_count && room.participant_count > 0);
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && isActive) ||
        (statusFilter === 'inactive' && !isActive);

      return matchesSearch && matchesType && matchesPlan && matchesStatus;
    });
  }, [chatRooms, searchTerm, typeFilter, planFilter, statusFilter]);

  const handleEdit = (room) => {
    setSelectedRoom(room);
    setShowEditModal(true);
  };

  const handleSave = async (roomData) => {
    try {
      if (selectedRoom) {
        await onUpdate(selectedRoom.id, roomData);
        setShowEditModal(false);
        setSelectedRoom(null);
      }
    } catch (error) {
      console.error('Error updating room:', error);
    }
  };

  const getRoomTypeIcon = (roomType) => {
    switch (roomType) {
      case 'premium': return <Crown className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'premium_admin': return <Shield className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getRoomTypeColor = (roomType) => {
    switch (roomType) {
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'premium_admin': return 'bg-indigo-100 text-indigo-800';
      case 'stock_specific': return 'bg-green-100 text-green-800';
      case 'sector': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanBadgeColor = (plan) => {
    switch (plan) {
      case 'vip': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
      case 'premium': return 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white';
      case 'basic': return 'bg-gray-200 text-gray-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Get admin user for passing to modal
  const adminUser = users.find(u => u.app_role === 'admin' || u.app_role === 'super_admin') || users[0];

  return (
    <>
      <Card className="shadow-lg border-0 bg-white">
        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search rooms by name, description, or stock symbol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Room Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="stock_specific">Stock Specific</SelectItem>
                <SelectItem value="sector">Sector</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="premium_admin">Premium Admin</SelectItem>
              </SelectContent>
            </Select>

            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                <tr>
                  <th className="px-6 py-3">Room Details</th>
                  <th className="px-6 py-3">Type & Access</th>
                  <th className="px-6 py-3">Engagement</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map(room => {
                  const roomMessages = messages.filter(m => m.chat_room_id === room.id);
                  const isActive = room.is_meeting_active || (room.participant_count && room.participant_count > 0);

                  return (
                    <tr key={room.id} className="bg-white border-b hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{room.name}</span>
                            {room.is_premium && (
                              <Lock className="w-3 h-3 text-purple-600" />
                            )}
                            {isActive && (
                              <Badge className="bg-green-100 text-green-700 text-xs">
                                Live
                              </Badge>
                            )}
                            {room.is_meeting_active && (
                              <Badge className="bg-blue-100 text-blue-700 text-xs flex items-center gap-1">
                                <Video className="w-3 h-3" />
                                Meeting
                              </Badge>
                            )}
                          </div>
                          {room.description && (
                            <p className="text-xs text-slate-500">{room.description}</p>
                          )}
                          {room.stock_symbol && (
                            <Badge variant="outline" className="text-xs">
                              {room.stock_symbol}
                            </Badge>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <Badge className={`${getRoomTypeColor(room.room_type)} flex items-center gap-1 w-fit`}>
                            {getRoomTypeIcon(room.room_type)}
                            {room.room_type?.replace('_', ' ')}
                          </Badge>
                          {room.required_plan && (
                            <Badge className={`${getPlanBadgeColor(room.required_plan)} text-xs`}>
                              {room.required_plan.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Users className="w-3 h-3" />
                            <span>{room.participant_count || 0} participants</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <MessageSquare className="w-3 h-3" />
                            <span>{roomMessages.length} messages</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(room.created_date).toLocaleDateString()}
                        <div>{new Date(room.created_date).toLocaleTimeString()}</div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedRoomForMessages(room)}
                            title="View Messages"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedRoomForModerators(room)}
                            title="Manage Moderators"
                          >
                            <Shield className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(room)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(room.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredRooms.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-sm font-medium text-slate-900">No chat rooms found</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {chatRooms.length === 0
                    ? "No chat rooms have been created yet."
                    : "Try adjusting your search or filter criteria."
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Room Modal - Pass user prop */}
      <ChatRoomFormModal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedRoom(null);
        }}
        room={selectedRoom}
        onSave={handleSave}
        user={adminUser}
      />

      {/* Messages Panel */}
      <MessageModerationPanel
        room={selectedRoomForMessages}
        messages={messages.filter(m => m.chat_room_id === selectedRoomForMessages?.id)}
        users={users}
        onClose={() => setSelectedRoomForMessages(null)}
        onRefresh={onRefresh}
      />

      {/* Moderators Panel */}
      <ModeratorManager
        room={selectedRoomForModerators}
        users={users}
        onClose={() => setSelectedRoomForModerators(null)}
        onRefresh={onRefresh}
      />
    </>
  );
}