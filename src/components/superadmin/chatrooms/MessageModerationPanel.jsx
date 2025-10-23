import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Message } from '@/api/entities';
import { Search, Trash2, AlertTriangle, Image as ImageIcon, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function MessageModerationPanel({ room, messages, users, onClose, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMessages = useMemo(() => {
    if (!messages) return [];
    return messages.filter(msg =>
      msg.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      users.find(u => u.id === msg.user_id)?.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [messages, searchTerm, users]);

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      await Message.delete(messageId);
      toast.success('Message deleted successfully');
      onRefresh();
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user?.display_name || 'Unknown User';
  };

  if (!room) return null;

  return (
    <Dialog open={!!room} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Messages in "{room.name}"</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Message Count */}
          <div className="flex items-center justify-between">
            <Badge variant="outline">{filteredMessages.length} messages</Badge>
            <Badge className="bg-blue-100 text-blue-800">
              {room.participant_count || 0} participants
            </Badge>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500">No messages found</p>
              </div>
            ) : (
              filteredMessages.map(msg => (
                <div key={msg.id} className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-slate-900">{getUserName(msg.user_id)}</span>
                        {msg.is_bot && (
                          <Badge className="bg-purple-100 text-purple-800 text-xs">Bot</Badge>
                        )}
                        {msg.message_type !== 'text' && (
                          <Badge variant="outline" className="text-xs">
                            {msg.message_type?.replace('_', ' ')}
                          </Badge>
                        )}
                        <span className="text-xs text-slate-500">
                          {new Date(msg.created_date).toLocaleString()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{msg.content}</p>
                      
                      {msg.file_url && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
                          {msg.file_url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                            <ImageIcon className="w-4 h-4" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                          <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {msg.file_name || 'View file'}
                          </a>
                        </div>
                      )}

                      {msg.mentioned_stock && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          ${msg.mentioned_stock}
                        </Badge>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}