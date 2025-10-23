
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, AuditLog, UserInvite as UserInviteEntity, Role } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, Send, Shield, FileText, Activity, BarChart2, UserX } from 'lucide-react';
import { toast } from "sonner";

import UserTable from './UserTable';
import InactiveUserManagement from './InactiveUserManagement';
import RolesAndPermissions from './RolesAndPermissions';
import RoleTemplateManager from './RoleTemplateManager';
import AuditLogViewer from './AuditLogViewer';
import InviteUserModal from './InviteUserModal';
import CreateUserModal from './CreateUserModal';
import InviteManagement from './InviteManagement';
import RegistrationAnalytics from './RegistrationAnalytics';
import SubscriptionAudit from './SubscriptionAudit';

export default function UserManagement({ user: currentAdmin, refreshEntityConfigs }) {
  const [users, setUsers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  // Permission check
  const permissions = useMemo(() => ({
    isSuperAdmin: currentAdmin?.app_role === 'super_admin',
    isAdmin: ['super_admin', 'admin'].includes(currentAdmin?.app_role),
    canViewUsers: ['super_admin', 'admin', 'user_management_sub_admin'].includes(currentAdmin?.app_role),
    canEditUsers: ['super_admin', 'admin'].includes(currentAdmin?.app_role),
    canManageRoles: currentAdmin?.app_role === 'super_admin',
    canViewAudit: ['super_admin', 'admin'].includes(currentAdmin?.app_role), // Keep this permission for other potential uses if needed
    canInviteUsers: ['super_admin', 'admin'].includes(currentAdmin?.app_role),
    canCreateUsers: currentAdmin?.app_role === 'super_admin', // Only SuperAdmins can create
    canAuditSubscriptions: ['super_admin', 'admin'].includes(currentAdmin?.app_role), // New permission
  }), [currentAdmin]);

  const loadAllData = useCallback(async (adminUser) => {
    if (!adminUser) return;
    setIsLoading(true);
    try {
      const [allUsers, allInvites, allRoles] = await Promise.all([
        User.list('-created_date'),
        UserInviteEntity.list('-created_date'),
        Role.list().catch(() => []) // Fetch roles
      ]);

      const userMap = new Map(allUsers.map(u => [u.id, u]));
      if (!userMap.has(adminUser.id)) {
        userMap.set(adminUser.id, adminUser);
      }
      
      setUsers(Array.from(userMap.values()));
      setInvites(allInvites);
      setRoles(allRoles); // Set the roles state
    } catch (error) {
      console.error('Error loading user management data:', error);
      toast.error('Failed to load user or invite data');
      setUsers([adminUser]);
      setInvites([]);
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (permissions.canViewUsers && currentAdmin) {
      loadAllData(currentAdmin);
    } else if (!permissions.canViewUsers) {
      setIsLoading(false);
    }
  }, [permissions.canViewUsers, currentAdmin, loadAllData]);
  
  const handleInviteSent = async () => {
    // Simplified this to just reload data, as the modal now handles the API call
    // Audit log for invites is now handled inside InviteUserModal
    setInviteModalOpen(false);
    loadAllData(currentAdmin); // Refresh data
  };

  const handleUserCreated = async (newUser) => {
    await AuditLog.create({
      admin_id: currentAdmin.id,
      admin_name: currentAdmin.display_name,
      action: 'USER_CREATED_DIRECTLY',
      entity_type: 'User',
      entity_id: newUser.id,
      details: `Directly created user ${newUser.display_name} (${newUser.email}) with role ${newUser.app_role}.`
    });
    setCreateModalOpen(false);
    loadAllData(currentAdmin); // Refresh data
  };

  if (!permissions.canViewUsers && !isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-white">
        <CardContent className="p-12 text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h3>
          <p className="text-gray-500">You don't have permission to view user management.</p>
        </CardContent>
      </Card>
    );
  }

  const mainTabs = [
    { value: 'all-users', label: 'User List', icon: Users, permission: permissions.canViewUsers },
    { value: 'analytics', label: 'Analytics', icon: BarChart2, permission: permissions.isAdmin },
    { value: 'subscriptions', label: 'Subscription Audit', icon: Shield, permission: permissions.canAuditSubscriptions },
    { value: 'invites', label: 'Invites', icon: Send, permission: permissions.canInviteUsers },
    { value: 'inactive-users', label: 'Inactive Users', icon: UserX, permission: permissions.canViewUsers },
    { value: 'roles', label: 'Roles', icon: Shield, permission: permissions.canManageRoles },
    { value: 'templates', label: 'Templates', icon: FileText, permission: permissions.canManageRoles },
    // Removed the redundant 'audit' tab since audit log is already integrated within roles management
  ];

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                User Administration
              </CardTitle>
              <p className="text-sm text-slate-600 mt-1">
                Manage users, roles, invitations, and platform activity.
              </p>
            </div>
            <div className="flex gap-2">
              {permissions.canInviteUsers && (
                <Button onClick={() => setInviteModalOpen(true)}>
                  <Send className="w-4 h-4 mr-2" />
                  Invite User
                </Button>
              )}
              {permissions.canCreateUsers && (
                <Button variant="outline" onClick={() => setCreateModalOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create User
                </Button>
              )}
            </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="all-users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-7 bg-transparent p-1 rounded-xl gap-2">
          {mainTabs.filter(tab => tab.permission).map(tab => (
            <TabsTrigger 
              key={tab.value}
              value={tab.value}
              className="whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      
        <TabsContent value="all-users">
          <UserTable
            users={users}
            isLoading={isLoading}
            loadUsers={() => loadAllData(currentAdmin)}
            currentAdmin={currentAdmin}
            permissions={permissions}
          />
        </TabsContent>
        
        {permissions.isAdmin &&
          <TabsContent value="analytics">
            <RegistrationAnalytics users={users} invites={invites} isLoading={isLoading} />
          </TabsContent>
        }

        {permissions.canAuditSubscriptions &&
          <TabsContent value="subscriptions">
            <SubscriptionAudit currentAdmin={currentAdmin} permissions={permissions} />
          </TabsContent>
        }

        {permissions.canInviteUsers &&
          <TabsContent value="invites">
            <InviteManagement 
              invites={invites} 
              isLoading={isLoading} 
              roles={roles}
              onRefresh={() => loadAllData(currentAdmin)} 
            />
          </TabsContent>
        }

        <TabsContent value="inactive-users">
          <InactiveUserManagement />
        </TabsContent>

        {permissions.canManageRoles &&
          <TabsContent value="roles">
            <RolesAndPermissions currentAdmin={currentAdmin} />
          </TabsContent>
        }
        {permissions.canManageRoles &&
          <TabsContent value="templates">
            <RoleTemplateManager currentAdmin={currentAdmin} />
          </TabsContent>
        }
        
        {/* Removed the standalone audit TabsContent since audit functionality is integrated within RolesAndPermissions */}
      </Tabs>
      
      {permissions.canInviteUsers && (
        <InviteUserModal
          isOpen={isInviteModalOpen}
          onClose={() => setInviteModalOpen(false)}
          onInviteSent={handleInviteSent}
          currentAdmin={currentAdmin}
          roles={roles}
        />
      )}
      
      {permissions.canCreateUsers && (
        <CreateUserModal
          isOpen={isCreateModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onUserCreated={handleUserCreated}
        />
      )}
    </div>
  );
}
