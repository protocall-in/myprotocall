import React, { useState, useEffect } from 'react';
import { Feedback, ContactInquiry } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  HelpCircle,
  MessageSquare,
  Eye,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Mail,
  User,
  Calendar,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { toast } from "sonner";

import ReviewModeration from './reviews/ReviewModeration';

export default function FeedbackAndSupport({ user }) {
  const [feedback, setFeedback] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [filteredFeedback, setFilteredFeedback] = useState([]);
  const [filteredInquiries, setFilteredInquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [activeTab, setActiveTab] = useState('feedback');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    feedbackStats: {
      total: 0,
      new: 0,
      underReview: 0,
      implemented: 0,
      rejected: 0
    },
    inquiryStats: {
      total: 0,
      new: 0,
      inProgress: 0,
      resolved: 0
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Filter feedback
    let filteredF = feedback;
    if (searchTerm) {
      filteredF = filteredF.filter((f) =>
        f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.feedback_text?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filteredF = filteredF.filter((f) => f.status === statusFilter);
    }
    setFilteredFeedback(filteredF);

    // Filter inquiries
    let filteredI = inquiries;
    if (searchTerm) {
      filteredI = filteredI.filter((i) =>
        i.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.message?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all' && ['new', 'in_progress', 'resolved'].includes(statusFilter)) {
      filteredI = filteredI.filter((i) => i.status === statusFilter);
    }
    setFilteredInquiries(filteredI);
  }, [feedback, inquiries, searchTerm, statusFilter]);

  const loadData = async () => {
    try {
      const [feedbackData, inquiryData] = await Promise.all([
        Feedback.list('-created_date'),
        ContactInquiry.list('-created_date')
      ]);

      setFeedback(feedbackData);
      setInquiries(inquiryData);

      // Calculate stats
      const feedbackStats = {
        total: feedbackData.length,
        new: feedbackData.filter((f) => f.status === 'new').length,
        underReview: feedbackData.filter((f) => f.status === 'under_review').length,
        implemented: feedbackData.filter((f) => f.status === 'implemented').length,
        rejected: feedbackData.filter((f) => f.status === 'rejected').length
      };

      const inquiryStats = {
        total: inquiryData.length,
        new: inquiryData.filter((i) => i.status === 'new').length,
        inProgress: inquiryData.filter((i) => i.status === 'in_progress').length,
        resolved: inquiryData.filter((i) => i.status === 'resolved').length
      };

      setStats({ feedbackStats, inquiryStats });

    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load feedback and inquiries.");
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (item, type) => {
    setSelectedItem({ ...item, type });
    setAdminNotes(item.admin_notes || '');
    setShowModal(true);
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!selectedItem) return;

    try {
      const { id, type } = selectedItem;
      const Entity = type === 'feedback' ? Feedback : ContactInquiry;

      await Entity.update(id, {
        status: newStatus,
        admin_notes: adminNotes
      });

      toast.success(`Status updated to ${newStatus}`);
      setShowModal(false);
      setSelectedItem(null);
      loadData();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status.");
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      new: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'New' },
      under_review: { color: 'bg-yellow-100 text-yellow-800', icon: Eye, label: 'Under Review' },
      in_progress: { color: 'bg-yellow-100 text-yellow-800', icon: Eye, label: 'In Progress' },
      implemented: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Implemented' },
      resolved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Resolved' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' }
    };
    return configs[status] || configs.new;
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <Card className="shadow-md border-0 bg-white">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs text-slate-500">{title}</p>
            <p className="text-lg font-bold text-slate-800">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTable = (data, type) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
          <tr>
            <th scope="col" className="px-6 py-3">Contact Info</th>
            <th scope="col" className="px-6 py-3">Content Preview</th>
            <th scope="col" className="px-6 py-3">Status</th>
            <th scope="col" className="px-6 py-3">Date</th>
            <th scope="col" className="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const statusConfig = getStatusConfig(item.status);
            const StatusIcon = statusConfig.icon;
            const displayName = type === 'feedback' ? item.name : item.full_name;
            const content = type === 'feedback' ? item.feedback_text : item.message;

            return (
              <tr key={item.id} className="bg-white border-b hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                      {displayName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="font-semibold">{displayName}</div>
                      <div className="text-xs text-slate-500">{item.email}</div>
                      {type === 'feedback' && item.user_role && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {item.user_role}
                        </Badge>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 max-w-sm">
                  <p className="truncate">{content}</p>
                  {type === 'inquiry' && item.subject && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      {item.subject.replace('_', ' ')}
                    </Badge>
                  )}
                </td>
                <td className="px-6 py-4">
                  <Badge className={`${statusConfig.color} border-0`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-slate-500">
                  <div>{new Date(item.created_date).toLocaleDateString()}</div>
                  <div className="text-xs">{new Date(item.created_date).toLocaleTimeString()}</div>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button variant="outline" size="sm" onClick={() => openModal(item, type)}>
                    <Eye className="w-4 h-4 mr-1" /> Review
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {data.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <div className="text-slate-400 mb-2">
            {type === 'feedback' ? <MessageSquare className="w-12 h-12 mx-auto" /> : <HelpCircle className="w-12 h-12 mx-auto" />}
          </div>
          <p className="text-slate-500">No {type} items found.</p>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return <div className="text-center p-12">Loading support data...</div>;
  }

  return (
    <div className="p-6 bg-slate-50 min-h-full space-y-6">
      {/* Header with Search and Filters */}
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            Support & Feedback Management
          </CardTitle>

          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search by name, email, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="implemented">Implemented</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs for Feedback, Support Inquiries, and Reviews */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-2xl bg-transparent p-1 rounded-xl gap-2">
          <TabsTrigger 
            value="feedback" 
            className="whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md"
          >
            <MessageSquare className="w-4 h-4" /> User Feedback ({stats.feedbackStats.total})
          </TabsTrigger>
          <TabsTrigger 
            value="inquiries" 
            className="whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md"
          >
            <HelpCircle className="w-4 h-4" /> Support Inquiries ({stats.inquiryStats.total})
          </TabsTrigger>
          <TabsTrigger 
            value="reviews" 
            className="whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md"
          >
            <Eye className="w-4 h-4" /> Reviews
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feedback" className="mt-4">
          {/* Feedback Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard title="Total Feedback" value={stats.feedbackStats.total} icon={MessageSquare} color="bg-blue-500" />
            <StatCard title="New" value={stats.feedbackStats.new} icon={Clock} color="bg-blue-500" />
            <StatCard title="Under Review" value={stats.feedbackStats.underReview} icon={Eye} color="bg-yellow-500" />
            <StatCard title="Implemented" value={stats.feedbackStats.implemented} icon={CheckCircle} color="bg-green-500" />
            <StatCard title="Rejected" value={stats.feedbackStats.rejected} icon={XCircle} color="bg-red-500" />
          </div>

          <Card className="shadow-lg border-0 bg-white mt-4">
            <CardHeader>
              <CardTitle>User Feedback Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {renderTable(filteredFeedback, 'feedback')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inquiries" className="mt-4">
          {/* Inquiry Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Inquiries" value={stats.inquiryStats.total} icon={HelpCircle} color="bg-purple-500" />
            <StatCard title="New" value={stats.inquiryStats.new} icon={Clock} color="bg-blue-500" />
            <StatCard title="In Progress" value={stats.inquiryStats.inProgress} icon={Eye} color="bg-yellow-500" />
            <StatCard title="Resolved" value={stats.inquiryStats.resolved} icon={CheckCircle} color="bg-green-500" />
          </div>

          <Card className="shadow-lg border-0 bg-white mt-4">
            <CardHeader>
              <CardTitle>Support Inquiries</CardTitle>
            </CardHeader>
            <CardContent>
              {renderTable(filteredInquiries, 'inquiry')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          <ReviewModeration user={user} />
        </TabsContent>
      </Tabs>

      {/* Review Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Review {selectedItem?.type === 'feedback' ? 'Feedback' : 'Inquiry'}
            </DialogTitle>
            <DialogDescription>
              From: {selectedItem?.type === 'feedback' ? selectedItem?.name : selectedItem?.full_name} ({selectedItem?.email})
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
              {/* Content Display */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">
                  {selectedItem.type === 'feedback' ? 'Feedback Content:' : 'Message Content:'}
                </h4>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {selectedItem.type === 'feedback' ? selectedItem.feedback_text : selectedItem.message}
                </p>
                {selectedItem.type === 'inquiry' && selectedItem.subject && (
                  <div className="mt-2">
                    <Badge variant="outline">Subject: {selectedItem.subject.replace('_', ' ')}</Badge>
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Contact Information:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Name:</strong> {selectedItem.type === 'feedback' ? selectedItem.name : selectedItem.full_name}</div>
                  <div><strong>Email:</strong> {selectedItem.email}</div>
                  {selectedItem.mobile_number && (
                    <div><strong>Mobile:</strong> {selectedItem.mobile_number}</div>
                  )}
                  {selectedItem.user_role && (
                    <div><strong>Role:</strong> {selectedItem.user_role}</div>
                  )}
                  <div><strong>Submitted:</strong> {new Date(selectedItem.created_date).toLocaleString()}</div>
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <Label htmlFor="admin_notes">Admin Notes & Response</Label>
                <Textarea
                  id="admin_notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add your response, notes, or action taken..."
                  className="mt-2"
                  rows={4}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>

                <div className="flex gap-2">
                  {selectedItem.type === 'feedback' ? (
                    <>
                      <Button
                        variant="ghost"
                        className="text-yellow-600 hover:text-yellow-800"
                        onClick={() => handleStatusUpdate('under_review')}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Under Review
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-green-600 hover:text-green-800"
                        onClick={() => handleStatusUpdate('implemented')}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Implemented
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-red-600 hover:text-red-800"
                        onClick={() => handleStatusUpdate('rejected')}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        className="text-yellow-600 hover:text-yellow-800"
                        onClick={() => handleStatusUpdate('in_progress')}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        In Progress
                      </Button>
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleStatusUpdate('resolved')}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Resolved
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}