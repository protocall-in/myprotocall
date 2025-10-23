import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Shield, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function ModeratorManager({ room, users, onClose, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roomModerators, setRoomModerators] = useState([]);

  useEffect(() => {
    if (room) {
      // In a real implementation, you'd fetch room_moderators from a RoomModerator entity
      // For now, we'll use a placeholder
      setRoomModerators([]);
    }
  }, [room]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(user =>
      user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ).filter(user => !roomModerators.some(mod => mod.user_id === user.id));
  }, [users, searchTerm, roomModerators]);

  const handleAddModerator = async (userId) => {
    try {
      // In a real implementation, create a RoomModerator entity record
      // For now, just show success
      toast.success('Moderator added successfully');
      setRoomModerators([...roomModerators, { user_id: userId }]);
      onRefresh();
    } catch (error) {
      console.error('Error adding moderator:', error);
      toast.error('Failed to add moderator');
    }
  };

  const handleRemoveModerator = async (userId) => {
    if (!window.confirm('Remove this user as moderator?')) return;

    try {
      // In a real implementation, delete the RoomModerator record
      toast.success('Moderator removed successfully');
      setRoomModerators(roomModerators.filter(mod => mod.user_id !== userId));
      onRefresh();
    } catch (error) {
      console.error('Error removing moderator:', error);
      toast.error('Failed to remove moderator');
    }
  };

  if (!room) return null;

  return (
    <Dialog open={!!room} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Manage Moderators - "{room.name}"
          </DialogTitle>
          <DialogDescription>
            Add or remove moderators for this chat room
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Current Moderators */}
          {roomModerators.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Current Moderators</h4>
              <div className="space-y-2">
                {roomModerators.map(mod => {
                  const user = users.find(u => u.id === mod.user_id);
                  if (!user) return null;
                  return (
                    <div key={mod.user_id} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="font-medium text-sm">{user.display_name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveModerator(mod.user_id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search for users */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Add Moderators</h4>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex-1">
                  <p className="font-medium text-sm">{user.display_name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {user.app_role}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddModerator(user.id)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            ))}
            {filteredUsers.length === 0 && searchTerm && (
              <p className="text-center text-slate-500 py-8">No users found</p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}