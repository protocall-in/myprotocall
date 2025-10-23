
import React, { useState, useEffect } from 'react';
import { ModerationLog, User, ChatRoom } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Shield,
  AlertTriangle,
  Eye,
  CheckCircle,
  XCircle,
  MessageSquare,
  User as UserIcon,
  Clock,
  Search,
  Filter
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function ContentModeration() {
  const [moderationLogs, setModerationLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
    dismissed: 0,
    escalated: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  });

  useEffect(() => {
    loadModerationLogs();
  }, []);

  useEffect(() => {
    let filtered = moderationLogs;
    
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.user?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.message_content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.violation_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (severityFilter !== 'all') {
      filtered = filtered.filter(log => log.severity === severityFilter);
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(log => log.status === statusFilter);
    }
    
    setFilteredLogs(filtered);
  }, [moderationLogs, searchTerm, severityFilter, statusFilter]);

  const loadModerationLogs = async () => {
    try {
      const logs = await ModerationLog.list('-created_date');
      
      // Get user and chat room info for context
      const userIds = [...new Set(logs.map(log => log.user_id))];
      const chatRoomIds = [...new Set(logs.map(log => log.chat_room_id).filter(Boolean))];
      
      const [users, chatRooms] = await Promise.all([
        userIds.length > 0 ? User.filter({ id: { '$in': userIds } }) : Promise.resolve([]),
        chatRoomIds.length > 0 ? ChatRoom.filter({ id: { '$in': chatRoomIds } }) : Promise.resolve([])
      ]);

      const usersMap = new Map(users.map(u => [u.id, u]));
      const chatRoomsMap = new Map(chatRooms.map(c => [c.id, c]));

      const enrichedLogs = logs.map(log => ({
        ...log,
        user: usersMap.get(log.user_id),
        chatRoom: chatRoomsMap.get(log.chat_room_id)
      }));

      setModerationLogs(enrichedLogs);

      // Calculate stats
      const stats = {
        total: enrichedLogs.length,
        pending: enrichedLogs.filter(l => l.status === 'pending').length,
        reviewed: enrichedLogs.filter(l => l.status === 'reviewed').length,
        dismissed: enrichedLogs.filter(l => l.status === 'dismissed').length,
        escalated: enrichedLogs.filter(l => l.status === 'escalated').length,
        critical: enrichedLogs.filter(l => l.severity === 'critical').length,
        high: enrichedLogs.filter(l => l.severity === 'high').length,
        medium: enrichedLogs.filter(l => l.severity === 'medium').length,
        low: enrichedLogs.filter(l => l.severity === 'low').length
      };
      setStats(stats);

    } catch (error) {
      console.error('Error loading moderation logs:', error);
      toast.error('Failed to load moderation reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (logId, newStatus) => {
    try {
      await ModerationLog.update(logId, {
        status: newStatus,
        admin_reviewed: true,
        admin_notes: adminNotes
      });

      setModerationLogs(prev => prev.map(log =>
        log.id === logId 
          ? { ...log, status: newStatus, admin_reviewed: true, admin_notes: adminNotes }
          : log
      ));

      toast.success(`Content marked as ${newStatus}`);
      setShowDetailsModal(false);
      setAdminNotes('');
      
    } catch (error) {
      console.error('Error updating moderation status:', error);
      toast.error('Failed to update moderation status');
    }
  };

  const openDetailsModal = (log) => {
    setSelectedLog(log);
    setAdminNotes(log.admin_notes || '');
    setShowDetailsModal(true);
  };

  const violationTypeConfig = {
    scam: { color: 'bg-red-500', label: 'Scam/Fraud', icon: '⚠️' },
    personal_info: { color: 'bg-orange-500', label: 'Personal Info Leak', icon: '🔒' },
    harassment: { color: 'bg-purple-500', label: 'Harassment', icon: '🚫' },
    inappropriate: { color: 'bg-pink-500', label: 'Inappropriate Content', icon: '❌' },
    spam: { color: 'bg-yellow-500', label: 'Spam', icon: '📢' }
  };

  const severityConfig = {
    critical: { color: 'text-red-600 bg-red-100', label: 'Critical' },
    high: { color: 'text-orange-600 bg-orange-100', label: 'High' },
    medium: { color: 'text-yellow-600 bg-yellow-100', label: 'Medium' },
    low: { color: 'text-blue-600 bg-blue-100', label: 'Low' }
  };

  const statusConfig = {
    pending: { color: 'text-yellow-600 bg-yellow-100', label: 'Pending Review', icon: Clock },
    reviewed: { color: 'text-blue-600 bg-blue-100', label: 'Reviewed', icon: Eye },
    dismissed: { color: 'text-gray-600 bg-gray-100', label: 'Dismissed', icon: XCircle },
    escalated: { color: 'text-red-600 bg-red-100', label: 'Escalated', icon: AlertTriangle }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-600" />
            Content Moderation & Safety
          </CardTitle>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mt-4">
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-xs text-slate-600">Total Reports</p>
              <p className="text-lg font-bold text-slate-800">{stats.total}</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-xs text-yellow-600">Pending</p>
              <p className="text-lg font-bold text-yellow-800">{stats.pending}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-600">Reviewed</p>
              <p className="text-lg font-bold text-blue-800">{stats.reviewed}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600">Dismissed</p>
              <p className="text-lg font-bold text-gray-800">{stats.dismissed}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-xs text-red-600">Critical</p>
              <p className="text-lg font-bold text-red-800">{stats.critical}</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <p className="text-xs text-orange-600">High</p>
              <p className="text-lg font-bold text-orange-800">{stats.high}</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-xs text-yellow-600">Medium</p>
              <p className="text-lg font-bold text-yellow-800">{stats.medium}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-600">Low</p>
              <p className="text-lg font-bold text-blue-800">{stats.low}</p>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search by user, content, or violation type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full md:w-[140px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Violation Details</th>
                  <th scope="col" className="px-6 py-3">User & Content</th>
                  <th scope="col" className="px-6 py-3">Severity</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">Reported</th>
                  <th scope="col" className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="6" className="text-center p-8">Loading moderation reports...</td></tr>
                ) : filteredLogs.map(log => {
                  const violationConfig = violationTypeConfig[log.vilation_type] || {};
                  const severityStyle = severityConfig[log.severity] || {};
                  const statusStyle = statusConfig[log.status] || {};
                  const StatusIcon = statusStyle.icon || Clock;
                  
                  return (
                    <tr key={log.id} className="bg-white border-b hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="text-lg">{violationConfig.icon}</div>
                          <div>
                            <div className="font-semibold text-slate-800">{violationConfig.label}</div>
                            <div className="text-xs text-slate-500">
                              Action: <span className="font-medium">{log.action_taken}</span>
                            </div>
                            {log.chatRoom && (
                              <div className="text-xs text-slate-400">
                                Room: {log.chatRoom.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-slate-400" />
                            <span className="font-medium">{log.user?.display_name || 'Unknown User'}</span>
                          </div>
                          <div className="text-xs text-slate-600 max-w-xs">
                            <div className="bg-slate-50 p-2 rounded border-l-2 border-slate-300">
                              "{log.message_content?.substring(0, 100)}
                              {log.message_content?.length > 100 ? '...' : ''}"
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <Badge className={`${severityStyle.color} border-0`}>
                          {severityStyle.label}
                        </Badge>
                      </td>
                      
                      <td className="px-6 py-4">
                        <Badge className={`${statusStyle.color} border-0`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusStyle.label}
                        </Badge>
                      </td>
                      
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(log.created_date).toLocaleDateString()}
                        <div className="text-xs">
                          {new Date(log.created_date).toLocaleTimeString()}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetailsModal(log)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                          
                          {log.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:text-green-800"
                                onClick={() => handleStatusUpdate(log.id, 'dismissed')}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-800"
                                onClick={() => handleStatusUpdate(log.id, 'escalated')}
                              >
                                <AlertTriangle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredLogs.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <Shield className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-2 text-sm font-medium text-slate-900">No moderation reports</h3>
              <p className="mt-1 text-sm text-slate-500">
                {moderationLogs.length === 0 
                  ? "No content violations have been detected."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Review Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Content Moderation Review</DialogTitle>
            <DialogDescription>
              Review the flagged content and take appropriate action
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-6">
              {/* Violation Summary */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">{violationTypeConfig[selectedLog.violation_type]?.icon}</div>
                  <div>
                    <h3 className="font-semibold text-red-800">
                      {violationTypeConfig[selectedLog.violation_type]?.label}
                    </h3>
                    <p className="text-sm text-red-600">
                      Severity: {selectedLog.severity} • Action Taken: {selectedLog.action_taken}
                    </p>
                  </div>
                </div>
              </div>

              {/* User Information */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">User Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Display Name</p>
                    <p className="font-medium">{selectedLog.user?.display_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Email</p>
                    <p className="font-medium">{selectedLog.user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Trust Score</p>
                    <p className="font-medium">{selectedLog.user?.trust_score || 50}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">User Role</p>
                    <p className="font-medium">{selectedLog.user?.app_role}</p>
                  </div>
                </div>
              </div>

              {/* Flagged Content */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Flagged Message Content</h4>
                <div className="bg-white p-3 rounded border-l-4 border-red-500">
                  <p className="text-sm">{selectedLog.message_content}</p>
                </div>
                {selectedLog.chatRoom && (
                  <p className="text-xs text-slate-500 mt-2">
                    Posted in: <span className="font-medium">{selectedLog.chatRoom.name}</span>
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  Detected on: {new Date(selectedLog.created_date).toLocaleString()}
                </p>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="text-sm font-medium">Admin Review Notes</label>
                <Textarea
                  placeholder="Add your review comments and decision rationale..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="mt-2"
                  rows={4}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Cancel Review
                </Button>
                
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    className="text-green-600 hover:text-green-800"
                    onClick={() => handleStatusUpdate(selectedLog.id, 'dismissed')}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Dismiss (False Positive)
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="text-blue-600 hover:text-blue-800"
                    onClick={() => handleStatusUpdate(selectedLog.id, 'reviewed')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Reviewed
                  </Button>
                  
                  <Button
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => handleStatusUpdate(selectedLog.id, 'escalated')}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Escalate Violation
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
