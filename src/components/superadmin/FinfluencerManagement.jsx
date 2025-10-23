
import React, { useState, useEffect, useRef } from 'react';
import { FinInfluencer, User, Course } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Eye,
  Star,
  AlertCircle,
  FileText,
  Users,
  Percent,
  DollarSign // Added DollarSign import
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"; // Added Tabs imports
import { toast } from "sonner";

// Import the new component
import FinfluencerPricingCommission from './finfluencers/FinfluencerPricingCommission';

export default function FinfluencerManagement() {
  const [finfluencers, setFinfluencers] = useState([]);
  const [filteredFinfluencers, setFilteredFinfluencers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFinfluencer, setSelectedFinfluencer] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [commissionOverride, setCommissionOverride] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    suspended: 0
  });

  const isMountedRef = useRef(true); // Ref to track if the component is mounted

  // This `loadFinfluencers` is the globally accessible function called by useEffect and handleStatusChange
  const loadFinfluencers = async () => {
    setIsLoading(true);
    try {
      const applications = await FinInfluencer.list('-created_date');

      // If the component unmounted while fetching, stop further processing
      if (!isMountedRef.current) return;

      const validObjectIdRegex = /^[0-9a-fA-F]{24}$/;
      const userIds = applications.
      map((a) => a.user_id).
      filter((id) => id && validObjectIdRegex.test(id));

      let users = [];
      if (userIds.length > 0) {
        users = await User.filter({ id: { '$in': userIds } }).catch(() => []);
      }

      // If the component unmounted while fetching users, stop further processing
      if (!isMountedRef.current) return;

      const usersMap = new Map(users.map((u) => [u.id, u]));

      const populatedFinfluencers = applications.map((app) => ({
        ...app,
        user: usersMap.get(app.user_id),
        display_name: app.display_name || app.user?.display_name || `Finfluencer ${app.id?.slice(-6) || 'Unknown'}`
      }));

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setFinfluencers(populatedFinfluencers);
        setStats({
          total: populatedFinfluencers.length,
          pending: populatedFinfluencers.filter((a) => a.status === 'pending').length,
          approved: populatedFinfluencers.filter((a) => a.status === 'approved').length,
          rejected: populatedFinfluencers.filter((a) => a.status === 'rejected').length,
          suspended: populatedFinfluencers.filter((a) => a.status === 'suspended').length
        });
      }

    } catch (error) {
      console.error("Error loading finfluencer applications:", error);
      // Only show toast if component is still mounted
      if (isMountedRef.current) {
        toast.error('Failed to load finfluencer applications');
      }
    } finally {
      // Only update loading state if component is still mounted
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    // Set isMountedRef to true on mount
    isMountedRef.current = true;
    loadFinfluencers();

    // Cleanup function: Set isMountedRef to false on unmount
    return () => {
      isMountedRef.current = false;
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  useEffect(() => {
    let filtered = finfluencers;
    if (statusFilter !== 'all') {
      filtered = filtered.filter((f) => f.status === statusFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter((f) =>
      f.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredFinfluencers(filtered);
  }, [finfluencers, statusFilter, searchTerm]);

  const handleStatusChange = async (finfluencerId, newStatus) => {
    try {
      const updateData = {
        status: newStatus,
        admin_notes: reviewNotes,
        commission_override_rate: commissionOverride === '' ? null : parseFloat(commissionOverride)
      };

      await FinInfluencer.update(finfluencerId, updateData);

      const finfluencerToUpdate = finfluencers.find((f) => f.id === finfluencerId);
      if (newStatus === 'approved' && finfluencerToUpdate?.user_id) {
        await User.update(finfluencerToUpdate.user_id, { app_role: 'finfluencer' });
      }

      toast.success(`Finfluencer status updated to ${newStatus}`);
      loadFinfluencers();
      setShowDetailsModal(false);
      setReviewNotes('');
      setCommissionOverride('');
    } catch (error) {
      console.error('Error updating finfluencer status:', error);
      toast.error('Failed to update status');
    }
  };

  const openDetailsModal = (finfluencer) => {
    setSelectedFinfluencer(finfluencer);
    setReviewNotes('');
    setCommissionOverride(finfluencer.commission_override_rate !== null ? String(finfluencer.commission_override_rate) : '');
    setShowDetailsModal(true);
  };

  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'text-yellow-500 bg-yellow-100',
      label: 'Pending Review',
      description: 'Application under review'
    },
    approved: {
      icon: CheckCircle,
      color: 'text-green-500 bg-green-100',
      label: 'Approved',
      description: 'Active finfluencer'
    },
    rejected: {
      icon: XCircle,
      color: 'text-red-500 bg-red-100',
      label: 'Rejected',
      description: 'Application rejected'
    },
    suspended: {
      icon: AlertCircle,
      color: 'text-gray-500 bg-gray-100',
      label: 'Suspended',
      description: 'Temporarily suspended'
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-600" />
            Finfluencer Management & Approvals
          </CardTitle>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-600">Total Applications</p>
              <p className="text-xl font-bold text-blue-800">{stats.total}</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-xs text-yellow-600">Pending Review</p>
              <p className="text-xl font-bold text-yellow-800">{stats.pending}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-xs text-green-600">Approved</p>
              <p className="text-xl font-bold text-green-800">{stats.approved}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-xs text-red-600">Rejected</p>
              <p className="text-xl font-bold text-red-800">{stats.rejected}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600">Suspended</p>
              <p className="text-xl font-bold text-gray-800">{stats.suspended}</p>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search by name, email, or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10" />

            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs for different sections */}
      <Tabs defaultValue="management" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-transparent p-1 rounded-xl gap-2">
          <TabsTrigger
            value="management"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg"
          >
            <Star className="w-4 h-4 mr-2" />
            Finfluencer Management
          </TabsTrigger>
          <TabsTrigger
            value="pricing"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Pricing & Commissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="management">
          <Card className="shadow-lg border-0 bg-white">
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                    <tr>
                      <th scope="col" className="px-6 py-3">Finfluencer Details</th>
                      <th scope="col" className="px-6 py-3">Specialization</th>
                      <th scope="col" className="px-6 py-3">Status</th>
                      <th scope="col" className="px-6 py-3">Application Date</th>
                      <th scope="col" className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ?
                    <tr><td colSpan="5" className="text-center p-8">Loading applications...</td></tr> :
                    filteredFinfluencers.map((app) => {
                      const config = statusConfig[app.status] || {};
                      const IconComponent = config.icon || Clock;

                      return (
                        <tr key={app.id} className="bg-white border-b hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900">
                            <div className="flex items-center gap-3">
                              <img
                                src={app.profile_image_url || `https://avatar.vercel.sh/${app.user?.email || app.display_name}.png`}
                                alt={app.display_name}
                                className="w-10 h-10 rounded-full object-cover" />

                              <div>
                                <div className="font-semibold">{app.display_name}</div>
                                <div className="text-xs text-slate-500">{app.user?.email || 'N/A'}</div>
                                {app.bio && <div className="text-xs text-slate-400 max-w-xs truncate">{app.bio}</div>}
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              {app.specialization && app.specialization.length > 0 &&
                              <div className="flex flex-wrap gap-1">
                                  {app.specialization.slice(0, 2).map((spec, idx) =>
                                <Badge key={idx} variant="outline" className="text-xs">
                                      {spec}
                                    </Badge>
                                )}
                                  {app.specialization.length > 2 &&
                                <Badge variant="outline" className="text-xs">
                                      +{app.specialization.length - 2} more
                                    </Badge>
                                }
                                </div>
                              }
                              <div className="text-xs text-slate-500">
                                Followers: {app.follower_count || 0}
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4">
                            <Badge className={`${config.color} border-0`}>
                              <IconComponent className="w-3 h-3 mr-1" />
                              {config.label}
                            </Badge>
                          </td>
                          
                          <td className="px-6 py-4 text-slate-500">
                            {new Date(app.created_date).toLocaleDateString()}
                          </td>
                          
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDetailsModal(app)}>

                                <Eye className="w-4 h-4 mr-1" />
                                Review
                              </Button>
                              
                              {/* Document Button - For portfolio or media samples */}
                              {(app.portfolio_url || app.social_links && Object.values(app.social_links).some((link) => link)) &&
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (app.portfolio_url) {
                                    window.open(app.portfolio_url, '_blank');
                                  } else if (app.social_links?.youtube) {
                                    window.open(app.social_links.youtube, '_blank');
                                  } else {
                                    toast.info('No portfolio or primary social link available');
                                  }
                                }}>

                                  <FileText className="w-4 h-4 mr-1" />
                                  Portfolio
                                </Button>
                              }
                              
                              {app.status === 'pending' &&
                              <>
                                  <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600 hover:text-green-800"
                                  onClick={() => handleStatusChange(app.id, 'approved')}>

                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-800"
                                  onClick={() => handleStatusChange(app.id, 'rejected')}>

                                    <XCircle className="w-4 h-4 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              }
                            </div>
                          </td>
                        </tr>);

                    })}
                  </tbody>
                </table>
              </div>

              {filteredFinfluencers.length === 0 && !isLoading &&
              <div className="text-center py-8">
                  <Star className="mx-auto h-12 w-12 text-slate-400" />
                  <h3 className="mt-2 text-sm font-medium text-slate-900">No finfluencer applications found</h3>
                  <p className="mt-1 text-sm text-slate-500">Try adjusting your search or filter criteria.</p>
                </div>
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <FinfluencerPricingCommission />
        </TabsContent>
      </Tabs>

      {/* Finfluencer Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Finfluencer Application Review</DialogTitle>
            <DialogDescription>
              Review the finfluencer application and take appropriate action
            </DialogDescription>
          </DialogHeader>
          
          {selectedFinfluencer &&
          <div className="space-y-6">
              {/* Finfluencer Profile */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Finfluencer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Display Name</p>
                    <p className="font-medium">{selectedFinfluencer.display_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Email</p>
                    <p className="font-medium">{selectedFinfluencer.user?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Followers</p>
                    <p className="font-medium">{selectedFinfluencer.follower_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Application Date</p>
                    <p className="font-medium">{new Date(selectedFinfluencer.created_date).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {selectedFinfluencer.bio &&
              <div className="mt-4">
                    <p className="text-sm text-slate-600">Bio</p>
                    <p className="text-sm">{selectedFinfluencer.bio}</p>
                  </div>
              }
                
                {selectedFinfluencer.specialization && selectedFinfluencer.specialization.length > 0 &&
              <div className="mt-4">
                    <p className="text-sm text-slate-600 mb-2">Specializations</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedFinfluencer.specialization.map((spec, idx) =>
                  <Badge key={idx} variant="outline">{spec}</Badge>
                  )}
                    </div>
                  </div>
              }
              </div>

              {/* Social Links */}
              {selectedFinfluencer.social_links && Object.keys(selectedFinfluencer.social_links).length > 0 &&
            <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Social Media Links</h4>
                  <div className="space-y-1">
                    {Object.entries(selectedFinfluencer.social_links).map(([platform, url]) =>
                url &&
                <div key={platform} className="text-sm">
                          <span className="font-medium capitalize">{platform}:</span>{' '}
                          <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline">

                            {url}
                          </a>
                        </div>

                )}
                  </div>
                </div>
            }

              {/* Review Notes */}
              <div>
                <label className="text-sm font-medium">Review Notes (Optional)</label>
                <Textarea
                placeholder="Add any notes about this application review..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="mt-2" />

              </div>

              {/* Commission Override */}
              <div className="bg-slate-50 p-4 rounded-lg">
                  <label htmlFor="commission_override_rate" className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Percent className="w-4 h-4 text-slate-500" />
                    Commission Override Rate (%)
                  </label>
                  <Input
                id="commission_override_rate"
                type="number"
                placeholder="e.g., 15 (leave blank for global default)"
                value={commissionOverride}
                onChange={(e) => setCommissionOverride(e.target.value)} />

                   <p className="text-xs text-slate-500 mt-1">Set a custom commission rate for this finfluencer. Leave blank to use the global default.</p>
              </div>

              {/* Action Buttons */}
              {selectedFinfluencer.status === 'pending' &&
            <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                variant="outline"
                onClick={() => setShowDetailsModal(false)}>

                    Cancel
                  </Button>
                  <Button
                variant="ghost"
                className="text-red-600 hover:text-red-800"
                onClick={() => handleStatusChange(selectedFinfluencer.id, 'rejected')}>

                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Application
                  </Button>
                  <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleStatusChange(selectedFinfluencer.id, 'approved')}>

                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Finfluencer
                  </Button>
                </div>
            }

              {selectedFinfluencer.status === 'approved' &&
            <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                variant="outline"
                onClick={() => setShowDetailsModal(false)}>

                    Close
                  </Button>
                  <Button
                variant="ghost"
                className="text-orange-600 hover:text-orange-800"
                onClick={() => handleStatusChange(selectedFinfluencer.id, 'suspended')}>

                    <AlertCircle className="w-4 h-4 mr-2" />
                    Suspend Finfluencer
                  </Button>
                </div>
            }

              {selectedFinfluencer.status === 'suspended' &&
            <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                variant="outline"
                onClick={() => setShowDetailsModal(false)}>

                    Close
                  </Button>
                  <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleStatusChange(selectedFinfluencer.id, 'approved')}>

                    <CheckCircle className="w-4 h-4 mr-2" />
                    Reactivate Finfluencer
                  </Button>
                </div>
            }
            </div>
          }
        </DialogContent>
      </Dialog>
    </div>);

}
