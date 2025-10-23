
import React, { useState, useEffect, useRef } from 'react';
import { Advisor, User, AdvisorReview, CommissionTracking } from '@/api/entities';
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
  FileText,
  Users,
  AlertCircle,
  Percent,
  ShieldCheck,
  DollarSign
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from
"@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from
"@/components/ui/dialog";
import { toast } from "sonner";
import {
  Tabs, TabsList, TabsTrigger, TabsContent
} from
"@/components/ui/tabs";
import { Label } from '@/components/ui/label';

// Import the new component
import AdvisorPricingCommission from './advisors/AdvisorPricingCommission';

export default function AdvisorManagement() {
  const [advisors, setAdvisors] = useState([]);
  const [filteredAdvisors, setFilteredAdvisors] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAdvisor, setSelectedAdvisor] = useState(null);
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

  const isMounted = useRef(true); // Using useRef for the mounted state

  // Define loadAdvisors once in the component scope
  const loadAdvisors = async () => {
    setIsLoading(true); // Set loading state at the start
    try {
      const advisorApplications = await Advisor.list('-created_date');

      const validObjectIdRegex = /^[0-9a-fA-F]{24}$/;
      const userIds = advisorApplications
        .map((a) => a.user_id)
        .filter((id) => id && validObjectIdRegex.test(id));

      console.log(`Found ${advisorApplications.length} advisors, ${userIds.length} with valid user IDs`);

      let users = [];
      if (userIds.length > 0) {
        users = await User.filter({ id: { '$in': userIds } }).catch((error) => {
          console.error('Error loading users for advisors:', error);
          return [];
        });
      }

      if (!isMounted.current) return; // Prevent state updates if component unmounted

      const usersMap = new Map(users.map((u) => [u.id, u]));

      const populatedAdvisors = advisorApplications.map((app) => ({
        ...app,
        user: usersMap.get(app.user_id),
        display_name: app.display_name || usersMap.get(app.user_id)?.display_name || `Advisor ${app.id?.slice(-6) || 'Unknown'}`
      }));

      setAdvisors(populatedAdvisors);

      const stats = {
        total: populatedAdvisors.length,
        pending: populatedAdvisors.filter((a) => a.status === 'pending_approval').length,
        approved: populatedAdvisors.filter((a) => a.status === 'approved').length,
        rejected: populatedAdvisors.filter((a) => a.status === 'rejected').length,
        suspended: populatedAdvisors.filter((a) => a.status === 'suspended').length
      };
      setStats(stats);

    } catch (error) {
      if (isMounted.current) { // Only show toast if component is still mounted
        console.error("Error loading advisor applications:", error);
        toast.error('Failed to load advisor applications');
      }
    } finally {
      if (isMounted.current) { // Only update isLoading if component is still mounted
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    isMounted.current = true; // Set mounted flag when component mounts
    loadAdvisors(); // Call the unified loadAdvisors function

    return () => {
      isMounted.current = false; // Set unmounted flag when component unmounts
    };
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  useEffect(() => {
    let filtered = advisors;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter((a) =>
        a.user?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.sebi_registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAdvisors(filtered);
  }, [advisors, statusFilter, searchTerm]);


  const handleStatusChange = async (advisorId, newStatus) => {
    try {
      const updateData = {
        status: newStatus,
        admin_notes: reviewNotes,
        commission_override_rate: commissionOverride === '' ? null : parseFloat(commissionOverride)
      };

      await Advisor.update(advisorId, updateData);

      const advisorToUpdate = advisors.find((a) => a.id === advisorId);
      if (newStatus === 'approved' && advisorToUpdate?.user_id) {
        await User.update(advisorToUpdate.user_id, { app_role: 'advisor' });
      }

      toast.success(`Advisor status updated to ${newStatus}`);
      loadAdvisors();
      setShowDetailsModal(false);
      setReviewNotes('');
      setCommissionOverride('');
    } catch (error) {
      console.error('Error updating advisor status:', error);
      toast.error('Failed to update advisor status');
    }
  };

  const openDetailsModal = (advisor) => {
    setSelectedAdvisor(advisor);
    setReviewNotes('');
    setCommissionOverride(advisor.commission_override_rate === null ? '' : advisor.commission_override_rate);
    setShowDetailsModal(true);
  };

  const statusConfig = {
    pending_approval: {
      icon: Clock,
      color: 'text-yellow-500 bg-yellow-100',
      label: 'Pending Review',
      description: 'Application under review'
    },
    approved: {
      icon: CheckCircle,
      color: 'text-green-500 bg-green-100',
      label: 'Approved',
      description: 'Active advisor'
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
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            SEBI Advisor Management & Approvals
          </CardTitle>

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

          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search by name, email, or SEBI number..."
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
                <SelectItem value="pending_approval">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="management" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-transparent p-1 rounded-xl gap-2">
          <TabsTrigger
            value="management"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg"
          >
            <Users className="w-4 h-4 mr-2" />
            Advisor Management
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
                      <th scope="col" className="px-6 py-3">Advisor Details</th>
                      <th scope="col" className="px-6 py-3">SEBI Registration</th>
                      <th scope="col" className="px-6 py-3">Status</th>
                      <th scope="col" className="px-6 py-3">Application Date</th>
                      <th scope="col" className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ?
                      <tr><td colSpan="5" className="text-center p-8">Loading applications...</td></tr> :
                      filteredAdvisors.length === 0 ?
                        <tr><td colSpan="5" className="text-center py-8">
                          <Users className="mx-auto h-12 w-12 text-slate-400" />
                          <h3 className="mt-2 text-sm font-medium text-slate-900">No advisor applications found</h3>
                          <p className="mt-1 text-sm text-slate-500">Try adjusting your search or filter criteria.</p>
                        </td></tr> :
                        filteredAdvisors.map((app) => {
                          const config = statusConfig[app.status] || {};
                          const IconComponent = config.icon || Clock;

                          return (
                            <tr key={app.id} className="bg-white border-b hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 font-medium text-slate-900">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-purple-600" />
                                  </div>
                                  <div>
                                    <div className="font-semibold">{app.user?.display_name || app.display_name || 'Unknown User'}</div>
                                    <div className="text-xs text-slate-500">{app.user?.email || 'N/A'}</div>
                                    {app.bio && <div className="text-xs text-slate-400 max-w-xs truncate">{app.bio}</div>}
                                  </div>
                                </div>
                              </td>

                              <td className="px-6 py-4">
                                <div className="space-y-1">
                                  <div className="font-mono text-sm">{app.sebi_registration_number || 'Not Provided'}</div>
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

                                  {app.sebi_document_url &&
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      asChild>

                                      <a href={app.sebi_document_url} target="_blank" rel="noopener noreferrer">
                                        <FileText className="w-4 h-4 mr-1" />
                                        Document
                                      </a>
                                    </Button>
                                  }

                                  {app.status === 'pending_approval' &&
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <AdvisorPricingCommission />
        </TabsContent>
      </Tabs>

      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Advisor Application Review</DialogTitle>
            <DialogDescription>
              Review the advisor application and take appropriate action
            </DialogDescription>
          </DialogHeader>

          {selectedAdvisor &&
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Advisor Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Display Name</p>
                    <p className="font-medium">{selectedAdvisor.user?.display_name || selectedAdvisor.display_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Email</p>
                    <p className="font-medium">{selectedAdvisor.user?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">SEBI Registration</p>
                    <p className="font-medium font-mono">{selectedAdvisor.sebi_registration_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Application Date</p>
                    <p className="font-medium">{new Date(selectedAdvisor.created_date).toLocaleDateString()}</p>
                  </div>
                </div>

                {selectedAdvisor.bio &&
                  <div className="mt-4">
                    <p className="text-sm text-slate-600">Bio</p>
                    <p className="text-sm">{selectedAdvisor.bio}</p>
                  </div>
                }

                {selectedAdvisor.specialization && selectedAdvisor.specialization.length > 0 &&
                  <div className="mt-4">
                    <p className="text-sm text-slate-600 mb-2">Specializations</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedAdvisor.specialization.map((spec, idx) =>
                        <Badge key={idx} variant="outline">{spec}</Badge>
                      )}
                    </div>
                  </div>
                }
              </div>

              {selectedAdvisor.sebi_document_url &&
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">SEBI Document</h4>
                  <Button asChild variant="outline">
                    <a href={selectedAdvisor.sebi_document_url} target="_blank" rel="noopener noreferrer">
                      <FileText className="w-4 h-4 mr-2" />
                      View SEBI Registration Document
                    </a>
                  </Button>
                </div>
              }

              <div>
                <label className="text-sm font-medium">Review Notes (Optional)</label>
                <Textarea
                  placeholder="Add any notes about this application review..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="mt-2" />

              </div>

              <div className="bg-slate-50 p-4 rounded-lg">
                <Label htmlFor="commission_override_rate" className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Percent className="w-4 h-4 text-slate-500" />
                  Commission Override Rate (%)
                </Label>
                <Input
                  id="commission_override_rate"
                  type="number"
                  placeholder="e.g., 15 (leave blank for global default)"
                  value={commissionOverride}
                  onChange={(e) => setCommissionOverride(e.target.value)} />

                <p className="text-xs text-slate-500 mt-1">Set a custom commission rate for this advisor. This overrides the global default commission rate for this specific advisor.</p>
              </div>

              {selectedAdvisor.status === 'pending_approval' &&
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailsModal(false)}>

                    Cancel
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-red-600 hover:text-red-800"
                    onClick={() => handleStatusChange(selectedAdvisor.id, 'rejected')}>

                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Application
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleStatusChange(selectedAdvisor.id, 'approved')}>

                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Advisor
                  </Button>
                </div>
              }

              {selectedAdvisor.status === 'approved' &&
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailsModal(false)}>

                    Close
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-orange-600 hover:text-orange-800"
                    onClick={() => handleStatusChange(selectedAdvisor.id, 'suspended')}>

                    <AlertCircle className="w-4 h-4 mr-2" />
                    Suspend Advisor
                  </Button>
                </div>
              }

              {selectedAdvisor.status === 'suspended' &&
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailsModal(false)}>

                    Close
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleStatusChange(selectedAdvisor.id, 'approved')}>

                    <CheckCircle className="w-4 h-4 mr-2" />
                    Reactivate Advisor
                  </Button>
                </div>
              }
            </div>
          }
        </DialogContent>
      </Dialog>
    </div>);

}
