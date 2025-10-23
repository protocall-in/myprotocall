
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Role, Permission, RolePermission, AuditLog, User, RoleTemplate } from '@/api/entities'; // Added RoleTemplate
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from
"@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from
"@/components/ui/alert-dialog";
import { PlusCircle, Edit, Trash2, ShieldCheck, FileDown, Table, Copy, Shield } from 'lucide-react';
import { toast } from "sonner";
import RoleTemplateManager from './RoleTemplateManager';
import AuditLogViewer from './AuditLogViewer';

// Default permissions structure - UPDATED to use 'permission_key' and new set of permissions
const DEFAULT_PERMISSIONS = [
  { permission_key: 'users.view', category: 'User Management', description: 'View user profiles and basic information' },
  { permission_key: 'users.edit', category: 'User Management', description: 'Edit user profiles and settings' },
  { permission_key: 'users.delete', category: 'User Management', description: 'Delete user accounts' },
  { permission_key: 'users.roles', category: 'User Management', description: 'Assign and manage user roles' },
  
  { permission_key: 'content.view', category: 'Content Management', description: 'View content and posts' },
  { permission_key: 'content.moderate', category: 'Content Management', description: 'Moderate and review flagged content' },
  { permission_key: 'content.delete', category: 'Content Management', description: 'Delete inappropriate content' },
  
  { permission_key: 'financial.view', category: 'Financial Management', description: 'View financial reports and data' },
  { permission_key: 'financial.edit', category: 'Financial Management', description: 'Edit financial settings and process payouts' },
  { permission_key: 'financial.export', category: 'Financial Management', description: 'Export financial reports' },
  
  { permission_key: 'settings.view', category: 'Platform Settings', description: 'View platform configuration' },
  { permission_key: 'settings.edit', category: 'Platform Settings', description: 'Edit platform settings and configuration' },
  
  { permission_key: 'analytics.view', category: 'Analytics & Reports', description: 'View analytics dashboards and reports' },
  { permission_key: 'analytics.export', category: 'Analytics & Reports', description: 'Export reports and analytics data' },
  
  { permission_key: 'support.view', category: 'Support Management', description: 'View support tickets and inquiries' },
  { permission_key: 'support.respond', category: 'Support Management', description: 'Respond to support requests' }
];

export default function RolesAndPermissions({ onDataChange, currentAdmin }) {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [templates, setTemplates] = useState([]); // New state for role templates
  const [auditLogs, setAuditLogs] = useState([]); // New state for audit logs
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [deletingRole, setDeletingRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matrix');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_system_role: false
  });

  const loadData = useCallback(async (signal) => {
    try {
      // First, check and initialize default permissions if they don't exist
      let fetchedPermissions = await Permission.list({ signal });
      if (fetchedPermissions.length === 0) {
        // Use the updated DEFAULT_PERMISSIONS constant which uses 'permission_key'
        await Promise.all(DEFAULT_PERMISSIONS.map((perm) => Permission.create(perm, { signal })));
        fetchedPermissions = await Permission.list({ signal }); // Re-fetch after creation
      }

      // Now fetch all other data in parallel, handling potential aborts or errors gracefully
      const [
        rolesData,
        rolePermissionsData,
        templatesData,
        auditLogsData
      ] = await Promise.all([
        Role.list('-created_date', { signal }).catch((error) => {
          if (error.name !== 'AbortError') console.error('Error fetching roles:', error);
          return [];
        }),
        RolePermission.list({ signal }).catch((error) => {
          if (error.name !== 'AbortError') console.error('Error fetching role permissions:', error);
          return [];
        }),
        RoleTemplate.list({ signal }).catch((error) => {
          if (error.name !== 'AbortError') console.error('Error fetching role templates:', error);
          return [];
        }),
        currentAdmin?.app_role === 'super_admin'
          ? AuditLog.list('-created_date', { signal }).catch((error) => {
              if (error.name !== 'AbortError') console.error('Error fetching audit logs:', error);
              return [];
            })
          : Promise.resolve([]) // Return empty array if not super_admin
      ]);

      // Deduplicate roles by name to prevent UI issues from bad data
      const uniqueRoles = rolesData.filter((role, index, self) =>
        index === self.findIndex((r) => r.name === role.name)
      );

      // Sort roles to ensure a consistent and logical order
      uniqueRoles.sort((a, b) => {
        if (a.is_system_role && !b.is_system_role) return -1;
        if (!a.is_system_role && b.is_system_role) return 1;
        if (a.name === 'super_admin' && b.name !== 'super_admin') return -1;
        if (b.name === 'super_admin' && a.name !== 'super_admin') return 1;
        if (a.name === 'admin' && b.name !== 'admin') return -1;
        if (b.name === 'admin' && a.name !== 'admin') return 1;
        return a.name.localeCompare(b.name);
      });

      return {
        fetchedRoles: uniqueRoles,
        fetchedPermissions: fetchedPermissions,
        fetchedRolePermissions: rolePermissionsData,
        fetchedTemplates: templatesData,
        fetchedAuditLogs: auditLogsData
      };
    } catch (error) {
      // Only log if it's not an abort error, as abort errors are expected on unmount
      if (error.name !== 'AbortError') {
        console.error('Error loading roles and permissions data:', error);
        toast.error('Failed to load necessary data.');
      }
      return null;
    }
  }, [currentAdmin]); // currentAdmin is a dependency because it affects audit log fetching

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    let isMounted = true;
    setIsLoading(true);

    const fetchData = async () => {
      const data = await loadData(signal);
      if (isMounted && data) {
        setRoles(data.fetchedRoles);
        setPermissions(data.fetchedPermissions);
        setRolePermissions(data.fetchedRolePermissions);
        setTemplates(data.fetchedTemplates);
        setAuditLogs(data.fetchedAuditLogs);
      }
      if (isMounted) { // Ensure isLoading is set to false even if data loading failed or was aborted
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      abortController.abort(); // Abort any ongoing fetches when component unmounts
    };
  }, [loadData]); // loadData is a dependency

  const handleDataChange = useCallback(async () => {
    setIsLoading(true); // Indicate reloading
    // For manual refreshes, we don't necessarily need an AbortController unless specifically desired
    const data = await loadData();
    if (data) {
      setRoles(data.fetchedRoles);
      setPermissions(data.fetchedPermissions);
      setRolePermissions(data.fetchedRolePermissions);
      setTemplates(data.fetchedTemplates);
      setAuditLogs(data.fetchedAuditLogs);
    }
    setIsLoading(false); // Finished reloading
    if (onDataChange) onDataChange(); // Notify parent component if a handler is provided
  }, [loadData, onDataChange]);

  const permissionsByCategory = useMemo(() => {
    return permissions.reduce((acc, perm) => {
      if (!acc[perm.category]) acc[perm.category] = [];
      acc[perm.category].push(perm);
      return acc;
    }, {});
  }, [permissions]);

  const hasPermission = (roleId, permissionId) => {
    return rolePermissions.some((rp) => rp.role_id === roleId && rp.permission_id === permissionId);
  };

  const handlePermissionToggle = async (role, permission) => {
    if (!currentAdmin) {
      toast.error('Admin user data not loaded.');
      return;
    }
    if (role.is_system_role || !role.is_editable) {
      toast.error('Cannot modify permissions for system roles');
      return;
    }

    try {
      const existing = rolePermissions.find((rp) => rp.role_id === role.id && rp.permission_id === permission.id);

      if (existing) {
        await RolePermission.delete(existing.id);
        setRolePermissions((prev) => prev.filter((rp) => rp.id !== existing.id));

        await AuditLog.create({
          admin_id: currentAdmin.id,
          admin_name: currentAdmin.display_name,
          action: 'PERMISSION_REVOKED',
          entity_type: 'Role',
          entity_id: role.id,
          details: `Revoked permission "${permission.description}" from role "${role.name}"`
        });
      } else {
        const newRolePerm = await RolePermission.create({
          role_id: role.id,
          permission_id: permission.id
        });
        setRolePermissions((prev) => [...prev, newRolePerm]);

        await AuditLog.create({
          admin_id: currentAdmin.id,
          admin_name: currentAdmin.display_name,
          action: 'PERMISSION_GRANTED',
          entity_type: 'Role',
          entity_id: newRolePerm.role_id,
          details: `Granted permission "${permission.description}" to role "${role.name}"`
        });
      }

      toast.success('Permissions updated');
      handleDataChange(); // Reload all data after change
    } catch (error) {
      console.error('Error updating permission:', error);
      toast.error('Failed to update permission');
    }
  };

  const openModal = (role = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description || '',
        is_system_role: role.is_system_role
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        description: '',
        is_system_role: false
      });
    }
    setShowRoleModal(true);
  };

  const handleSaveRole = async () => {
    if (!currentAdmin) {
      toast.error('Admin user data not loaded.');
      return;
    }
    try {
      const roleData = {
        name: formData.name,
        description: formData.description,
        is_system_role: formData.is_system_role,
        is_editable: !formData.is_system_role,
        is_deletable: !formData.is_system_role
      };

      if (editingRole) {
        await Role.update(editingRole.id, roleData);
        await AuditLog.create({
          admin_id: currentAdmin.id,
          admin_name: currentAdmin.display_name,
          action: 'ROLE_UPDATED',
          entity_type: 'Role',
          entity_id: editingRole.id,
          details: `Updated role "${formData.name}"`
        });
      } else {
        const newRole = await Role.create(roleData);
        await AuditLog.create({
          admin_id: currentAdmin.id,
          admin_name: currentAdmin.display_name,
          action: 'ROLE_CREATED',
          entity_type: 'Role',
          entity_id: newRole.id,
          details: `Created new role "${formData.name}"`
        });
      }

      toast.success(`Role ${editingRole ? 'updated' : 'created'} successfully`);
      setShowRoleModal(false);
      handleDataChange(); // Reload all data after change
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error('Failed to save role');
    }
  };

  const handleDeleteRole = async () => {
    if (!currentAdmin) {
      toast.error('Admin user data not loaded.');
      return;
    }
    if (!deletingRole) return;
    try {
      // Delete associated permissions first
      const relatedPermissions = rolePermissions.filter((rp) => rp.role_id === deletingRole.id);
      await Promise.all(relatedPermissions.map((rp) => RolePermission.delete(rp.id)));

      await Role.delete(deletingRole.id);
      await AuditLog.create({
        admin_id: currentAdmin.id,
        admin_name: currentAdmin.display_name,
        action: 'ROLE_DELETED',
        entity_type: 'Role',
        entity_id: deletingRole.id,
        details: `Deleted role "${deletingRole.name}"`
      });

      toast.success('Role deleted successfully');
      setShowDeleteDialog(false);
      setDeletingRole(null);
      handleDataChange(); // Reload all data after change
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Failed to delete role');
    }
  };

  const exportMatrix = () => {
    const data = [];
    const headers = ['Permission', ...roles.map((r) => r.name)];
    data.push(headers);

    permissions.forEach((permission) => {
      const row = [permission.description];
      roles.forEach((role) => {
        row.push(hasPermission(role.id, permission.id) ? 'Yes' : 'No');
      });
      data.push(row);
    });

    const csvContent = data.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `permissions-matrix-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const canManageRoles = currentAdmin?.app_role === 'super_admin';
  // const canAssignRoles = currentAdmin ? ['super_admin', 'admin'].includes(currentAdmin.app_role) : false; // This variable is not used anywhere, keeping for context but can be removed

  const tabsTriggerClassName = "whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md";

  if (isLoading) {
    return (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-transparent p-1 rounded-xl gap-2">
          <TabsTrigger value="matrix" className={tabsTriggerClassName}>
            <Table className="w-4 h-4 mr-2" />
            Permissions Matrix
          </TabsTrigger>
          <TabsTrigger value="templates" className={tabsTriggerClassName}>
            <Copy className="w-4 h-4 mr-2" />
            Role Templates
          </TabsTrigger>
          {currentAdmin?.app_role === 'super_admin' && (
            <TabsTrigger value="audit" className={tabsTriggerClassName}>
              <Shield className="w-4 h-4 mr-2" />
              Audit Log
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="matrix" className="mt-4">
          <Card className="shadow-lg border-0 bg-white">
            <CardContent>
              <div className="text-center py-16">Loading roles and permissions...</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>);

  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-transparent p-1 rounded-xl gap-2">
        <TabsTrigger value="matrix" className={tabsTriggerClassName}>
          <Table className="w-4 h-4 mr-2" />
          Permissions Matrix
        </TabsTrigger>
        <TabsTrigger value="templates" className={tabsTriggerClassName}>
          <Copy className="w-4 h-4 mr-2" />
          Role Templates
        </TabsTrigger>
        {currentAdmin?.app_role === 'super_admin' && (
          <TabsTrigger value="audit" className={tabsTriggerClassName}>
            <Shield className="w-4 h-4 mr-2" />
            Audit Log
          </TabsTrigger>
        )}
      </TabsList>
      
      <TabsContent value="matrix" className="mt-4">
        <div className="flex justify-between items-center mb-4">
          <Card className="shadow-lg border-0 bg-white w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    Permissions Matrix
                  </CardTitle>
                  <CardDescription>
                    Assign or revoke specific permissions for each role. Changes are saved automatically.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={exportMatrix}>
                    <FileDown className="w-4 h-4 mr-2" />
                    Export Matrix
                  </Button>
                  {canManageRoles &&
                    <Button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Create Role
                    </Button>
                  }
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3 text-left font-semibold text-slate-700 sticky left-0 bg-slate-100 z-10 min-w-[250px]">Permission</th>
                      {roles.map((role) =>
                        <th key={role.id} className="p-3 text-center font-semibold text-slate-700 min-w-[150px]">
                          <div className="flex items-center justify-center gap-2">
                            <span>{role.name.replace(/_/g, ' ')}</span>
                            {canManageRoles &&
                              <>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openModal(role)}>
                                  <Edit className="w-3 h-3" />
                                </Button>
                                {role.is_deletable &&
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-red-500"
                                    onClick={() => {
                                      setDeletingRole(role);
                                      setShowDeleteDialog(true);
                                    }}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                }
                              </>
                            }
                            {role.is_system_role && <Badge variant="outline" className="text-xs">System</Badge>}
                          </div>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {Object.entries(permissionsByCategory).map(([category, categoryPerms]) =>
                      <React.Fragment key={category}>
                        <tr className="bg-slate-100">
                          <td className="p-3 font-semibold text-slate-800 sticky left-0 bg-slate-100 z-10" colSpan={roles.length + 1}>
                            {category}
                          </td>
                        </tr>
                        {categoryPerms.map((permission) =>
                          <tr key={permission.id} className="border-b hover:bg-slate-50">
                            <td className="p-3 text-slate-700 sticky left-0 bg-white z-10 border-r">
                              {permission.description}
                            </td>
                            {roles.map((role) =>
                              <td key={role.id} className="p-3 text-center">
                                <Switch
                                  checked={hasPermission(role.id, permission.id)}
                                  onCheckedChange={() => handlePermissionToggle(role, permission)}
                                  disabled={role.is_system_role || !role.is_editable || !canManageRoles} />
                              </td>
                            )}
                          </tr>
                        )}
                      </React.Fragment>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="templates" className="mt-4">
        {currentAdmin && <RoleTemplateManager currentAdmin={currentAdmin} templates={templates} onTemplatesChange={handleDataChange} />}
      </TabsContent>

      <TabsContent value="audit" className="mt-4">
        {currentAdmin && <AuditLogViewer currentAdmin={currentAdmin} auditLogs={auditLogs} onAuditLogsChange={handleDataChange} />}
      </TabsContent>

      {/* Create/Edit Role Modal */}
      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
            <DialogDescription>
              {editingRole ? 'Modify the role details below.' : 'Create a new role with custom permissions.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Role Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., moderator, support_staff"
                disabled={editingRole?.is_system_role} />
            </div>
            
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the role's purpose and responsibilities..."
                rows={3} />
            </div>
            
            {!editingRole &&
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_system_role}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_system_role: checked }))} />
                <label className="text-sm">System Role (Cannot be deleted or permissions modified)</label>
              </div>
            }
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowRoleModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRole}>
              {editingRole ? 'Update Role' : 'Create Role'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role "{deletingRole?.name}"? 
              This will remove all associated permissions and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRole} className="bg-red-600 hover:bg-red-700">
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>);
}
