
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InvestorRequest, Investor, User, FundWallet, Notification } from '@/api/entities';
import { CheckCircle, XCircle, Eye, Loader2, AlertTriangle, User as UserIcon, DollarSign, Building, Clock, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function InvestorRequestsManager({ onUpdate }) {
  const [requests, setRequests] = useState([]);
  const [investors, setInvestors] = useState([]); // Changed from object to array as per outline
  const [isLoading, setIsLoading] = useState(true);
  const [showApprovalModal, setShowApprovalModal] = useState(false); // Reordered as per outline
  const [showDetailsModal, setShowDetailsModal] = useState(false); // Reordered as per outline
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedInvestorProfile, setSelectedInvestorProfile] = useState(null); // New state variable
  const [showRejectionModal, setShowRejectionModal] = useState(false); // Reordered as per outline
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const reqs = await InvestorRequest.list('-created_date');
      setRequests(reqs);

      // Load all investors to sync profile data
      await new Promise(resolve => setTimeout(resolve, 2000));
      const invs = await Investor.list();
      setInvestors(invs); // Set investors as an array
    } catch (error) {
      console.error('Error loading investor requests:', error);
      if (!error.message?.includes('Rate limit')) {
        toast.error('Failed to load investor requests');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskProfileForExperience = (experience) => {
    const riskMap = {
      beginner: 'Conservative',
      intermediate: 'Moderate',
      advanced: 'Aggressive'
    };
    return riskMap[experience] || 'Conservative';
  };

  const handleViewDetails = async (request) => {
    setSelectedRequest(request);

    // Find the corresponding investor profile if request is approved
    // Since 'investors' is now an array, use .find()
    const investorProfile = investors.find(inv => inv.user_id === request.user_id);
    setSelectedInvestorProfile(investorProfile);

    setShowDetailsModal(true);
  };


  const handleApprove = async () => {
    if (!selectedRequest) return;

    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const allUsers = await User.list();
      let existingUser = allUsers.find(u => u.email === selectedRequest.email);

      let userId = selectedRequest.user_id;

      if (existingUser && existingUser.id !== selectedRequest.user_id) {
        console.log(`⚠️ Found existing user ${existingUser.id} for email ${selectedRequest.email}`);
        userId = existingUser.id;
      }

      // CRITICAL FIX: Check if investor already exists for this user_id
      await new Promise(resolve => setTimeout(resolve, 2000));
      const existingInvestors = await Investor.filter({ user_id: userId });

      if (existingInvestors.length > 0) {
        // Investor already exists - update the request and notify
        const existingInvestor = existingInvestors[0];

        await InvestorRequest.update(selectedRequest.id, {
          status: 'rejected',
          rejection_reason: `Investor account already exists with code: ${existingInvestor.investor_code}. Cannot create duplicate investor accounts.`,
          reviewed_at: new Date().toISOString()
        });

        await Notification.create({
          user_id: userId,
          title: 'Duplicate Investor Request',
          message: `You already have an active investor account with code ${existingInvestor.investor_code}. Your duplicate request has been rejected.`,
          type: 'warning',
          page: 'general'
        });

        toast.error(`⚠️ Investor already exists: ${existingInvestor.investor_code}. Request rejected to prevent duplicates.`);

        setShowApprovalModal(false);
        setSelectedRequest(null);
        setAdminNotes('');
        await loadRequests();
        if (onUpdate) onUpdate();
        setIsProcessing(false);
        return;
      }

      const investorCode = `INV${Date.now()}`;

      // Auto-assign risk profile based on investment experience
      const riskProfile = getRiskProfileForExperience(selectedRequest.investment_experience).toLowerCase();

      await new Promise(resolve => setTimeout(resolve, 2000));
      const newInvestor = await Investor.create({
        user_id: userId,
        investor_code: investorCode,
        full_name: selectedRequest.full_name,
        email: selectedRequest.email,
        mobile_number: selectedRequest.mobile_number,
        pan_number: selectedRequest.pan_number || null,
        bank_account_number: selectedRequest.bank_account_number || null,
        bank_ifsc_code: selectedRequest.bank_ifsc_code || null,
        bank_name: selectedRequest.bank_name || null,
        risk_profile: riskProfile, // Auto-assigned based on experience
        kyc_status: 'pending',
        status: 'active',
        total_invested: 0,
        current_value: 0,
        total_profit_loss: 0
      });

      await new Promise(resolve => setTimeout(resolve, 2000));
      await FundWallet.create({
        investor_id: newInvestor.id,
        available_balance: 0,
        locked_balance: 0,
        total_deposited: 0,
        total_withdrawn: 0
      });

      await new Promise(resolve => setTimeout(resolve, 2000));
      await InvestorRequest.update(selectedRequest.id, {
        status: 'approved',
        admin_notes: adminNotes || `Approved with ${riskProfile} risk profile based on ${selectedRequest.investment_experience} experience`,
        reviewed_at: new Date().toISOString()
      });

      await new Promise(resolve => setTimeout(resolve, 2000));
      await Notification.create({
        user_id: userId,
        title: 'Investor Access Approved',
        message: `Your investor access request has been approved. Your investor code is ${investorCode}. Risk Profile: ${riskProfile.charAt(0).toUpperCase() + riskProfile.slice(1)}. You can now start investing in our funds.`,
        type: 'info',
        page: 'investor'
      });

      toast.success(`✅ Investor approved! Code: ${investorCode} | Risk Profile: ${riskProfile.charAt(0).toUpperCase() + riskProfile.slice(1)}`);

      setShowApprovalModal(false);
      setSelectedRequest(null);
      setAdminNotes('');
      await loadRequests();
      if (onUpdate) onUpdate();

    } catch (error) {
      console.error('Error approving investor:', error);
      toast.error('Failed to approve investor request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      await InvestorRequest.update(selectedRequest.id, {
        status: 'rejected',
        rejection_reason: rejectionReason,
        reviewed_at: new Date().toISOString()
      });

      await new Promise(resolve => setTimeout(resolve, 2000));
      await Notification.create({
        user_id: selectedRequest.user_id,
        title: 'Investor Request Rejected',
        message: `Your investor access request has been rejected. Reason: ${rejectionReason}`,
        type: 'warning',
        page: 'general'
      });

      toast.success('Investor request rejected');

      setShowRejectionModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
      await loadRequests();
      if (onUpdate) onUpdate();

    } catch (error) {
      console.error('Error rejecting investor:', error);
      toast.error('Failed to reject investor request');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      under_review: { label: 'Under Review', className: 'bg-blue-100 text-blue-800' },
      approved: { label: 'Approved', className: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800' }
    };
    const { label, className } = config[status] || config.pending;
    return <Badge className={className}>{label}</Badge>;
  };

  const getInvestorCodeForRequest = (request) => {
    if (request.status !== 'approved') return null;
    // Since 'investors' is now an array, use .find()
    const investor = investors.find(inv => inv.user_id === request.user_id);
    return investor ? investor.investor_code : null;
  };

  const getExperienceBadge = (experience) => {
    const config = {
      beginner: {
        label: 'Beginner',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        description: '0-2 years'
      },
      intermediate: {
        label: 'Intermediate',
        className: 'bg-purple-100 text-purple-800 border-purple-200',
        description: '2-5 years'
      },
      advanced: {
        label: 'Advanced',
        className: 'bg-green-100 text-green-800 border-green-200',
        description: '5+ years'
      }
    };

    const { label, className, description } = config[experience] || config.beginner;

    return (
      <Badge className={`${className} border`}>
        <span>{label}</span>
        <span className="ml-1 text-xs opacity-75">({description})</span>
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Investor Access Requests</h2>
        <p className="text-slate-600 mt-1">Review and approve investor registration requests</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-slate-500">Total Requests</div>
            <div className="text-2xl font-bold text-slate-900">{requests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-slate-500">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">
              {requests.filter(r => r.status === 'pending' || r.status === 'under_review').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-slate-500">Approved</div>
            <div className="text-2xl font-bold text-green-600">
              {requests.filter(r => r.status === 'approved').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-slate-500">Rejected</div>
            <div className="text-2xl font-bold text-red-600">
              {requests.filter(r => r.status === 'rejected').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>No investor requests found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-1 cursor-help">
                          Investment Experience
                          <AlertTriangle className="w-3 h-3 text-slate-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Used to auto-assign risk profile:</p>
                          <ul className="text-xs mt-1 space-y-1">
                            <li>• Beginner → Conservative</li>
                            <li>• Intermediate → Moderate</li>
                            <li>• Advanced → Aggressive</li>
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead>Investor Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => {
                  const investorCode = getInvestorCodeForRequest(request);
                  const experienceBadge = getExperienceBadge(request.investment_experience);

                  return (
                    <TableRow key={request.id}>
                      <TableCell>
                        {new Date(request.created_date).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell className="font-medium">{request.full_name}</TableCell>
                      <TableCell>{request.email}</TableCell>
                      <TableCell>{request.mobile_number}</TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              {experienceBadge}
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                Risk Profile: <strong>{getRiskProfileForExperience(request.investment_experience)}</strong>
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        {investorCode ? (
                          <Badge className="bg-blue-100 text-blue-800 font-mono">
                            {investorCode}
                          </Badge>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(request)} // Use new handleViewDetails
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {(request.status === 'pending' || request.status === 'under_review') && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowApprovalModal(true);
                                }}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowRejectionModal(true);
                                }}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedRequest && (
        <>
          {/* Investor Profile Modal (renamed from Details Modal) */}
          <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <UserIcon className="w-6 h-6 text-blue-600" />
                  Investor Profile
                </DialogTitle>
                <p className="text-sm text-slate-600 mt-1">
                  {selectedInvestorProfile ? 'Live profile data synced from investor dashboard' : 'Application data'}
                </p>
              </DialogHeader>
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-5">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <UserIcon className="w-5 h-5" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-slate-600">Full Name</Label>
                      <p className="font-medium text-slate-900">
                        {selectedInvestorProfile?.full_name || selectedRequest.full_name}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">Email</Label>
                      <p className="font-medium text-slate-900">
                        {selectedInvestorProfile?.email || selectedRequest.email}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">Mobile</Label>
                      <p className="font-medium text-slate-900">
                        {selectedInvestorProfile?.mobile_number || selectedRequest.mobile_number}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">PAN Number</Label>
                      <p className="font-medium text-slate-900">
                        {selectedInvestorProfile?.pan_number || selectedRequest.pan_number || 'Not provided'}
                      </p>
                    </div>
                    {selectedInvestorProfile && (
                      <>
                        <div>
                          <Label className="text-sm text-slate-600">Investor Code</Label>
                          <Badge className="bg-blue-100 text-blue-800 font-mono mt-1">
                            {selectedInvestorProfile.investor_code}
                          </Badge>
                        </div>
                        <div>
                          <Label className="text-sm text-slate-600">KYC Status</Label>
                          <div className="mt-1">
                            {selectedInvestorProfile.kyc_status === 'verified' ? (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            ) : selectedInvestorProfile.kyc_status === 'pending' ? (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800 border-red-200">
                                <XCircle className="w-3 h-3 mr-1" />
                                Rejected
                              </Badge>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Financial Profile */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-5">
                  <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Financial Profile
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-slate-600">Annual Income Range</Label>
                      <Badge className="bg-green-100 text-green-800 border-green-200 mt-1">
                        {selectedRequest.annual_income_range ?
                          selectedRequest.annual_income_range.replace(/_/g, ' ').replace(/l/g, 'L').toUpperCase()
                          : 'Not provided'}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">Investment Experience</Label>
                      <div className="mt-1">
                        {getExperienceBadge(selectedRequest.investment_experience)}
                      </div>
                    </div>
                    {selectedInvestorProfile && (
                      <>
                        <div>
                          <Label className="text-sm text-slate-600">Risk Profile</Label>
                          <Badge className="bg-green-700 text-white mt-1">
                            {selectedInvestorProfile.risk_profile || getRiskProfileForExperience(selectedRequest.investment_experience)}
                          </Badge>
                        </div>
                        <div>
                          <Label className="text-sm text-slate-600">Total Invested</Label>
                          <p className="font-bold text-green-900 text-lg mt-1">
                            ₹{(selectedInvestorProfile.total_invested || 0).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {!selectedInvestorProfile && ( // Show this block only if no live investor profile
                    <div className="bg-green-100 border border-green-300 rounded-lg p-3 mt-3">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-700" />
                        <span className="text-sm font-semibold text-green-900">Auto-Assigned Risk Profile:</span>
                        <Badge className="bg-green-700 text-white">
                          {getRiskProfileForExperience(selectedRequest.investment_experience)}
                        </Badge>
                      </div>
                      <p className="text-xs text-green-700 mt-1">
                        Based on {selectedRequest.investment_experience} investment experience level
                      </p>
                    </div>
                  )}
                </div>

                {/* Bank Details - SYNCED FROM INVESTOR PROFILE */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-5">
                  <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Bank Details
                    {selectedInvestorProfile && (
                      <Badge className="bg-purple-100 text-purple-800 text-xs ml-2">
                        Live Data
                      </Badge>
                    )}
                  </h3>
                  {/* Use investor profile data if available, otherwise use request data */}
                  {(selectedInvestorProfile?.bank_name || selectedInvestorProfile?.bank_account_number || selectedInvestorProfile?.bank_ifsc_code ||
                    selectedRequest.bank_name || selectedRequest.bank_account_number || selectedRequest.bank_ifsc_code || selectedInvestorProfile?.upi_id) ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-slate-600">Bank Name</Label>
                        <p className="font-medium text-slate-900">
                          {selectedInvestorProfile?.bank_name || selectedRequest.bank_name || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-slate-600">Account Number</Label>
                        <p className="font-medium text-slate-900 font-mono">
                          {selectedInvestorProfile?.bank_account_number || selectedRequest.bank_account_number || 'Not provided'}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-sm text-slate-600">IFSC Code</Label>
                        <p className="font-medium text-slate-900 font-mono">
                          {selectedInvestorProfile?.bank_ifsc_code || selectedRequest.bank_ifsc_code || 'Not provided'}
                        </p>
                      </div>
                      {selectedInvestorProfile?.upi_id && (
                        <div className="col-span-2">
                          <Label className="text-sm text-slate-600">UPI ID</Label>
                          <p className="font-medium text-slate-900 font-mono">
                            {selectedInvestorProfile.upi_id}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-purple-100 border border-purple-200 rounded-lg p-3">
                      <p className="text-sm text-purple-800">
                        <AlertTriangle className="w-4 h-4 inline mr-2" />
                        Bank details not provided yet. Investor can update these in their profile.
                      </p>
                    </div>
                  )}
                </div>

                {/* Request Status & Timeline */}
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200 rounded-lg p-5">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Request Status & Timeline
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-slate-600">Application Status</Label>
                      <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">Submitted On</Label>
                      <p className="font-medium text-slate-900">
                        {new Date(selectedRequest.created_date).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    {selectedRequest.reviewed_at && (
                      <div>
                        <Label className="text-sm text-slate-600">Reviewed On</Label>
                        <p className="font-medium text-slate-900">
                          {new Date(selectedRequest.reviewed_at).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}
                    {selectedInvestorProfile && (
                      <div>
                        <Label className="text-sm text-slate-600">Account Status</Label>
                        <Badge className={
                          selectedInvestorProfile.status === 'active'
                            ? 'bg-green-100 text-green-800 mt-1'
                            : 'bg-gray-100 text-gray-800 mt-1'
                        }>
                          {selectedInvestorProfile.status?.toUpperCase()}
                        </Badge>
                      </div>
                    )}
                    {selectedRequest.admin_notes && (
                      <div className="col-span-2">
                        <Label className="text-sm text-slate-600">Admin Notes</Label>
                        <p className="font-medium text-slate-700 bg-white rounded p-2 mt-1 border border-slate-200">
                          {selectedRequest.admin_notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rejection Details */}
                {selectedRequest.status === 'rejected' && selectedRequest.rejection_reason && (
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-5">
                    <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                      <XCircle className="w-5 h-5" />
                      Rejection Details
                    </h3>
                    <p className="text-red-800 text-sm">{selectedRequest.rejection_reason}</p>
                  </div>
                )}

                {/* Data Source Indicator */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    {selectedInvestorProfile ? (
                      <>
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                        <strong>Live Profile Data:</strong> This information is synced from the investor's current profile. Any updates made by the investor are reflected here in real-time.
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                        <strong>Application Data:</strong> This shows the information submitted during registration. Investor account is not yet created.
                      </>
                    )}
                  </p>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedRequest(null);
                  setSelectedInvestorProfile(null);
                }}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Approve Investor Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p>Are you sure you want to approve this investor request?</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="font-semibold">{selectedRequest.full_name}</p>
                  <p className="text-sm text-slate-600">{selectedRequest.email}</p>
                </div>
                <div>
                  <Label>Admin Notes (Optional)</Label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add any notes about this approval..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowApprovalModal(false)} disabled={isProcessing}>
                  Cancel
                </Button>
                <Button onClick={handleApprove} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showRejectionModal} onOpenChange={setShowRejectionModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject Investor Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p>Please provide a reason for rejecting this request:</p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="font-semibold">{selectedRequest.full_name}</p>
                  <p className="text-sm text-slate-600">{selectedRequest.email}</p>
                </div>
                <div>
                  <Label>Rejection Reason *</Label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this request is being rejected..."
                    rows={4}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRejectionModal(false)} disabled={isProcessing}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isProcessing || !rejectionReason.trim()}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
