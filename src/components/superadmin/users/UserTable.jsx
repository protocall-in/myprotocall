
import React, { useState, useEffect, useCallback } from 'react';
import { User, TrustScoreLog, Role, RoleTemplate, AuditLog } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Edit,
  Trash2,
  Ban,
  UserCheck,
  Plus,
  Minus,
  Users
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter // Added DialogFooter for the role modal
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Label } from '@/components/ui/label'; // Added Label import

export default function UserTable({ users, roles, currentAdmin, onUsersUpdate }) {
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showTrustModal, setShowTrustModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [scoreChange, setScoreChange] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  // Renamed newUserRole to selectedRole and newRoleTemplate to selectedTemplate
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [roleTemplates, setRoleTemplates] = useState([]); // Renamed 'templates' in outline to match existing 'roleTemplates'
  const [isLoading, setIsLoading] = useState(false);

  // Load role templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templates = await RoleTemplate.list();
        setRoleTemplates(templates.filter(t => t.is_active));
      } catch (error) {
        console.error('Error loading role templates:', error);
      }
    };
    loadTemplates();
  }, []);

  useEffect(() => {
    let filtered = [...users];

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.app_role === roleFilter);
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(user => !user.is_deactivated);
      } else if (statusFilter === 'suspended') {
        filtered = filtered.filter(user => user.is_deactivated);
      }
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter]);

  const canDeleteUser = (targetUser) => {
    if (!currentAdmin || !targetUser) return false;
    if (targetUser.id === currentAdmin.id) return false;
    return currentAdmin.app_role === 'super_admin';
  };

  const canEditUser = (targetUser) => {
    if (!currentAdmin || !targetUser) return false;
    if (targetUser.id === currentAdmin.id) return false;
    return ['super_admin', 'admin'].includes(currentAdmin.app_role);
  };

  const handleTrustScoreChange = (change) => {
    if (!selectedUser) return;

    const currentScore = selectedUser.trust_score || 50;
    const proposedNewScore = currentScore + change;
    
    // Clamp the score change to ensure final score stays within 0-100 range
    const clampedNewScore = Math.max(0, Math.min(100, proposedNewScore));
    
    // Calculate the actual change that results in the clamped new score
    const actualChange = clampedNewScore - currentScore;
    
    setScoreChange(actualChange);
  };

  const handleSaveTrustScore = async () => {
    if (!selectedUser || !adjustmentReason.trim()) {
      toast.error('Please provide a reason for the trust score change');
      return;
    }
    if (scoreChange === 0) {
      toast.info('No change in trust score to save.');
      return;
    }

    try {
      const currentScore = selectedUser.trust_score || 50;
      const newScore = Math.max(0, Math.min(100, currentScore + scoreChange));

      await User.update(selectedUser.id, { trust_score: newScore });
      await TrustScoreLog.create({
        user_id: selectedUser.id,
        change_amount: scoreChange,
        reason: adjustmentReason,
        new_score: newScore,
        moderator_id: currentAdmin.id
      });

      await AuditLog.create({
        admin_id: currentAdmin.id,
        admin_name: currentAdmin.display_name,
        action: 'TRUST_SCORE_CHANGED',
        entity_type: 'User',
        entity_id: selectedUser.id,
        details: `Changed trust score of user "${selectedUser.display_name}" from ${currentScore.toFixed(2)} to ${newScore.toFixed(2)}. Reason: "${adjustmentReason}"`
      });

      onUsersUpdate();
      toast.success(`Trust score updated to ${newScore.toFixed(2)}`);
      setShowTrustModal(false);
      setScoreChange(0);
      setAdjustmentReason('');
    } catch (error) {
      console.error('Error updating trust score:', error);
      toast.error('Failed to update trust score');
    }
  };

  // Renamed handleRoleUpdate to handleUpdateRole
  const handleUpdateRole = async () => {
    if (!selectedUser || (!selectedRole && !selectedTemplate)) {
      toast.error('No user selected or no role/template chosen.');
      return;
    }
    
    setIsLoading(true);
    try {
      const updateData = {};
      const originalRole = selectedUser.app_role;
      const originalTemplateName = selectedUser.role_template_name;

      if (selectedRole) {
        // Direct role assignment
        updateData.app_role = selectedRole;
        updateData.role_template_id = null;
        updateData.role_template_name = null;
        
        await AuditLog.create({
          admin_id: currentAdmin.id,
          admin_name: currentAdmin.display_name,
          action: 'USER_ROLE_UPDATED',
          entity_type: 'User',
          entity_id: selectedUser.id,
          details: `Changed role from ${originalRole} to ${selectedRole} for user ${selectedUser.display_name}`
        });
      } else if (selectedTemplate) {
        // Template assignment
        const template = roleTemplates.find(t => t.id === selectedTemplate);
        updateData.role_template_id = selectedTemplate;
        updateData.role_template_name = template?.name;
        updateData.app_role = 'custom'; // Templates implicitly set app_role to custom
        
        await AuditLog.create({
          admin_id: currentAdmin.id,
          admin_name: currentAdmin.display_name,
          action: 'USER_TEMPLATE_ASSIGNED',
          entity_type: 'User',
          entity_id: selectedUser.id,
          details: `Assigned template "${template?.name}" to user ${selectedUser.display_name} (Previous role: ${originalRole}, Previous template: ${originalTemplateName || 'None'})`
        });
      }
      
      await User.update(selectedUser.id, updateData);
      
      toast.success('User role updated successfully');
      setShowRoleModal(false);
      setSelectedUser(null); // Clear selected user after update
      setSelectedRole(''); // Clear selected role
      setSelectedTemplate(''); // Clear selected template
      
      // Call the correct callback function (assuming onUsersUpdate is the intended refresh)
      if (onUsersUpdate) {
        onUsersUpdate();
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspendUser = async () => {
    if (!selectedUser) return;
    try {
      const newStatus = !selectedUser.is_deactivated;
      await User.update(selectedUser.id, { is_deactivated: newStatus });

      await AuditLog.create({
        admin_id: currentAdmin.id,
        admin_name: currentAdmin.display_name,
        action: newStatus ? 'USER_SUSPENDED' : 'USER_UNSUSPENDED',
        entity_type: 'User',
        entity_id: selectedUser.id,
        details: `${newStatus ? 'Suspended' : 'Un-suspended'} user "${selectedUser.display_name}"`
      });

      onUsersUpdate();
      toast.success(newStatus ? 'User suspended successfully' : 'User un-suspended successfully');
      setShowSuspendDialog(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error suspending/un-suspending user:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await User.delete(selectedUser.id);

      await AuditLog.create({
        admin_id: currentAdmin.id,
        admin_name: currentAdmin.display_name,
        action: 'USER_DELETED',
        entity_type: 'User',
        entity_id: selectedUser.id,
        details: `Deleted user "${selectedUser.display_name}" (ID: ${selectedUser.id})`
      });

      onUsersUpdate();
      toast.success('User deleted successfully');
      setShowDeleteDialog(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const canManageUsers = ['super_admin', 'admin'].includes(currentAdmin?.app_role);
  const canSuspendUsers = ['super_admin', 'admin'].includes(currentAdmin?.app_role);
  const canModifyTrustScores = ['super_admin', 'admin', 'moderator'].includes(currentAdmin?.app_role);

  const roleColors = {
    super_admin: 'bg-red-500 text-white',
    admin: 'bg-orange-500 text-white',
    sub_admin: 'bg-yellow-500 text-black',
    finance: 'bg-blue-500 text-white',
    moderator: 'bg-purple-500 text-white',
    compliance: 'bg-indigo-500 text-white',
    trader: 'bg-green-500 text-white',
    custom: 'bg-gray-500 text-white',
    finfluencer: 'bg-pink-500 text-white',
    advisor: 'bg-teal-500 text-white',
    educator: 'bg-cyan-500 text-white', // Added color for new role
    vendor: 'bg-lime-500 text-white', // Added color for new role
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            User Management
          </CardTitle>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="trader">Trader</SelectItem>
                <SelectItem value="finfluencer">FinInfluencer</SelectItem>
                <SelectItem value="advisor">Advisor</SelectItem>
                <SelectItem value="educator">Educator</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="custom">Custom (Template)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3">User Details</th>
                  <th scope="col" className="px-6 py-3">Role & Template</th>
                  <th scope="col" className="px-6 py-3">Trust Score</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">Joined</th>
                  <th scope="col" className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className="bg-white border-b hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                             style={{ backgroundColor: user.profile_color || '#3B82F6' }}>
                          {user.profile_image_url ? (
                            <img src={user.profile_image_url} alt={user.display_name || 'User'} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            user.display_name?.charAt(0)?.toUpperCase() || 'U'
                          )}
                        </div>
                        <div>
                          <div className="font-semibold">{user.display_name || 'Unknown User'}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                          {user.mobile_number && (
                            <div className="text-xs text-slate-400">{user.mobile_number}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <Badge className={roleColors[user.app_role] || 'bg-gray-500 text-white'}>
                          {(user.app_role || 'trader').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                        {user.role_template_name && (
                          <Badge variant="outline" className="bg-purple-50 text-white">
                            {user.role_template_name}
                          </Badge>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold ${
                            (user.trust_score || 50) >= 75 ? 'text-green-600' :
                            (user.trust_score || 50) >= 40 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}
                        >
                          {(user.trust_score || 50).toFixed(2)}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <Badge className={user.is_deactivated ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                        {user.is_deactivated ? 'Suspended' : 'Active'}
                      </Badge>
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      {new Date(user.created_date).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {canModifyTrustScores && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setScoreChange(0);
                              setAdjustmentReason('');
                              setShowTrustModal(true);
                            }}
                            title="Adjust Trust Score"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Trust
                          </Button>
                        )}

                        {canManageUsers && user.id !== currentAdmin?.id && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                // Set initial values for selectedRole and selectedTemplate
                                setSelectedRole(user.app_role || '');
                                setSelectedTemplate(user.role_template_id || '');
                                setShowRoleModal(true);
                              }}
                              title="Edit Role/Template"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Role
                            </Button>

                            {canSuspendUsers && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowSuspendDialog(true);
                                }}
                                className={user.is_deactivated ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'}
                                title={user.is_deactivated ? 'Unsuspend User' : 'Suspend User'}
                              >
                                {user.is_deactivated ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                              </Button>
                            )}

                            {canDeleteUser(user) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowDeleteDialog(true);
                                }}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </>
                        )}
                        {user.id === currentAdmin?.id && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                            You
                          </Badge>
                        )}
                        {
                          !canModifyTrustScores && !canManageUsers && user.id !== currentAdmin?.id && (
                            <span className="text-xs text-slate-400 px-2">No actions</span>
                          )
                        }
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-2 text-sm font-medium text-slate-900">No users found</h3>
              <p className="mt-1 text-sm text-slate-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trust Score Adjustment Modal */}
      {selectedUser && (
        <Dialog open={showTrustModal} onOpenChange={setShowTrustModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Trust Score for {selectedUser.display_name}</DialogTitle>
              <DialogDescription>Adjust the user's score and provide a reason for the change. This will be logged.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="text-center">
                <p className="text-sm text-slate-600">Current Trust Score</p>
                <p className="text-5xl font-bold my-2">
                  {(selectedUser.trust_score || 50).toFixed(2)}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className={`text-xl font-semibold ${
                    scoreChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {scoreChange >= 0 ? `+${scoreChange}` : scoreChange}
                  </span>
                  <p className="text-gray-500">New Score: {((selectedUser.trust_score || 50) + scoreChange).toFixed(2)}</p>
                </div>
                
                {/* Score Range Indicator */}
                <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600">
                    Valid Range: 0.00 - 100.00 | 
                    Max Increase: +{(100 - (selectedUser.trust_score || 50)).toFixed(2)} | 
                    Max Decrease: -{(selectedUser.trust_score || 50)).toFixed(2)}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="scoreChange" className="block text-sm font-medium text-slate-700 mb-2">
                  Score Adjustment
                </Label>
                <Input
                  id="scoreChange"
                  type="number"
                  value={scoreChange}
                  onChange={(e) => handleTrustScoreChange(parseInt(e.target.value) || 0)}
                  min={-(selectedUser.trust_score || 50)}
                  max={100 - (selectedUser.trust_score || 50)}
                  step="1"
                  placeholder="Enter score change (e.g., +10 or -5)"
                  className="text-center text-lg font-semibold"
                />
                
                {/* Dynamic Quick Action Buttons */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <p className="text-xs text-slate-500 w-full mb-1">Quick Actions:</p>
                  
                  {/* Negative Actions */}
                  {(selectedUser.trust_score || 50) >= 20 && (
                    <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleTrustScoreChange(-20)}>-20</Button>
                  )}
                  {(selectedUser.trust_score || 50) >= 10 && (
                    <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleTrustScoreChange(-10)}>-10</Button>
                  )}
                  {(selectedUser.trust_score || 50) >= 5 && (
                    <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleTrustScoreChange(-5)}>-5</Button>
                  )}
                  
                  {/* Reset */}
                  <Button variant="outline" size="sm" onClick={() => handleTrustScoreChange(0)}>Reset</Button>
                  
                  {/* Positive Actions */}
                  {(100 - (selectedUser.trust_score || 50)) >= 5 && (
                    <Button variant="outline" size="sm" className="text-green-600" onClick={() => handleTrustScoreChange(5)}>+5</Button>
                  )}
                  {(100 - (selectedUser.trust_score || 50)) >= 10 && (
                    <Button variant="outline" size="sm" className="text-green-600" onClick={() => handleTrustScoreChange(10)}>+10</Button>
                  )}
                  {(100 - (selectedUser.trust_score || 50)) >= 20 && (
                    <Button variant="outline" size="sm" className="text-green-600" onClick={() => handleTrustScoreChange(20)}>+20</Button>
                  )}
                  {(100 - (selectedUser.trust_score || 50)) >= 50 && (
                    <Button variant="outline" size="sm" className="text-green-600" onClick={() => handleTrustScoreChange(50)}>+50</Button>
                  )}
                  
                  {/* Max Actions */}
                  {(100 - (selectedUser.trust_score || 50)) > 0 && (
                    <Button variant="outline" size="sm" className="text-blue-600 font-semibold" onClick={() => handleTrustScoreChange(100 - (selectedUser.trust_score || 50))}>
                      MAX (+{(100 - (selectedUser.trust_score || 50)).toFixed(0)})
                    </Button>
                  )}
                  {(selectedUser.trust_score || 50) > 0 && (
                    <Button variant="outline" size="sm" className="text-red-600 font-semibold" onClick={() => handleTrustScoreChange(-(selectedUser.trust_score || 50))}>
                      MIN (-{(selectedUser.trust_score || 50)).toFixed(0)})
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="reason" className="block text-sm font-medium text-slate-700 mb-2">
                  Reason for Change <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="reason"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Explain why you're adjusting this user's trust score..."
                  className="h-24"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowTrustModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveTrustScore} 
                disabled={!adjustmentReason.trim() || scoreChange === 0}
                className={scoreChange > 0 ? 'bg-green-600 hover:bg-green-700' : (scoreChange < 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400')}
              >
                {scoreChange > 0 ? 'Increase' : (scoreChange < 0 ? 'Decrease' : 'Update')} Trust Score
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Role/Template Assignment Modal */}
      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update User Role - {selectedUser?.display_name}</DialogTitle>
            <DialogDescription>
              Assign a role or role template to {selectedUser?.display_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Direct Role Assignment */}
            <div>
              <Label htmlFor="direct-role" className="text-sm font-medium mb-2 block">
                Direct Role Assignment
              </Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="direct-role">
                  <SelectValue placeholder="Select a role..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trader">Trader</SelectItem>
                  <SelectItem value="advisor">Advisor</SelectItem>
                  <SelectItem value="finfluencer">Finfluencer</SelectItem>
                  <SelectItem value="educator">Educator</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  {/* Keep Super Admin conditional for security/permissions */}
                  {currentAdmin?.app_role === 'super_admin' && (
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="text-center text-sm text-slate-500">— OR —</div>

            {/* Role Template Assignment */}
            <div>
              <Label htmlFor="role-template" className="text-sm font-medium mb-2 block">
                Role Template Assignment
              </Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger id="role-template">
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  {roleTemplates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                  {roleTemplates.length === 0 && (
                    <SelectItem value="none" disabled>
                      No templates available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate && (
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm text-slate-600">
                  {roleTemplates.find(t => t.id === selectedTemplate)?.description}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateRole}
              disabled={isLoading || (!selectedRole && !selectedTemplate)}
            >
              {isLoading ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend/Unsuspend Dialog */}
      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to {selectedUser?.is_deactivated ? 'un-suspend' : 'suspend'} {selectedUser?.display_name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action will {selectedUser?.is_deactivated ? 're-activate' : 'deactivate'} the user account for
              <span className="font-bold"> {selectedUser?.display_name}</span>.
              They will {selectedUser?.is_deactivated ? 'regain' : 'lose'} access to the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspendUser}
              className={selectedUser?.is_deactivated ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {selectedUser?.is_deactivated ? 'Un-suspend User' : 'Suspend User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account for
              <span className="font-bold"> {selectedUser?.display_name} </span>
              and remove all associated data from the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
