import React, { useState, useEffect, useCallback } from 'react';
import { RoleTemplate, RoleTemplatePermission, Permission, User, AuditLog } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  PlusCircle,
  Edit,
  Trash2,
  Copy,
  Users,
  FileDown,
  Shield,
  Settings
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";

export default function RoleTemplateManager({ currentAdmin }) {
  const [templates, setTemplates] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [templatePermissions, setTemplatePermissions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deletingTemplate, setDeletingTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selectedPermissions: []
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [templatesData, permissionsData, templatePermsData] = await Promise.all([
        RoleTemplate.list('-created_date'),
        Permission.list(),
        RoleTemplatePermission.list()
      ]);

      // Update user counts for each template
      const templatesWithCounts = await Promise.all(
        templatesData.map(async (template) => {
          const userCount = await User.filter({ role_template_id: template.id }).then(users => users.length).catch(() => 0);
          return { ...template, user_count: userCount };
        })
      );

      setTemplates(templatesWithCounts);
      setPermissions(permissionsData);
      setTemplatePermissions(templatePermsData);
    } catch (error) {
      console.error('Error loading template data:', error);
      toast.error('Failed to load template data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const permissionsByCategory = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {});

  const getTemplatePermissions = (templateId) => {
    return templatePermissions
      .filter(tp => tp.template_id === templateId)
      .map(tp => tp.permission_id);
  };

  const openModal = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        description: template.description,
        selectedPermissions: getTemplatePermissions(template.id)
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        description: '',
        selectedPermissions: []
      });
    }
    setShowModal(true);
  };

  const handleDuplicate = (template) => {
    setEditingTemplate(null);
    setFormData({
      name: `${template.name} (Copy)`,
      description: template.description,
      selectedPermissions: getTemplatePermissions(template.id)
    });
    setShowModal(true);
  };

  const handlePermissionToggle = (permissionId) => {
    setFormData(prev => ({
      ...prev,
      selectedPermissions: prev.selectedPermissions.includes(permissionId)
        ? prev.selectedPermissions.filter(id => id !== permissionId)
        : [...prev.selectedPermissions, permissionId]
    }));
  };

  const handleSave = async () => {
    try {
      const templateData = {
        name: formData.name,
        description: formData.description,
        created_by: currentAdmin.id,
        created_by_name: currentAdmin.display_name,
        is_active: true
      };

      let savedTemplate;
      if (editingTemplate) {
        savedTemplate = await RoleTemplate.update(editingTemplate.id, templateData);
        
        // Delete existing permissions
        const existingPerms = templatePermissions.filter(tp => tp.template_id === editingTemplate.id);
        await Promise.all(existingPerms.map(perm => RoleTemplatePermission.delete(perm.id)));
        
        // Update users assigned to this template
        const assignedUsers = await User.filter({ role_template_id: editingTemplate.id });
        await Promise.all(assignedUsers.map(user => 
          User.update(user.id, { role_template_name: formData.name })
        ));
      } else {
        savedTemplate = await RoleTemplate.create(templateData);
      }

      // Add new permissions
      await Promise.all(formData.selectedPermissions.map(permId =>
        RoleTemplatePermission.create({
          template_id: savedTemplate.id,
          permission_id: permId
        })
      ));

      // Log the action
      await AuditLog.create({
        admin_id: currentAdmin.id,
        admin_name: currentAdmin.display_name,
        action: editingTemplate ? 'TEMPLATE_UPDATED' : 'TEMPLATE_CREATED',
        entity_type: 'RoleTemplate',
        entity_id: savedTemplate.id,
        details: `${editingTemplate ? 'Updated' : 'Created'} role template "${formData.name}" with ${formData.selectedPermissions.length} permissions`
      });

      toast.success(`Template ${editingTemplate ? 'updated' : 'created'} successfully`);
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const handleDelete = async () => {
    try {
      // Check if any users are assigned to this template
      const assignedUsers = await User.filter({ role_template_id: deletingTemplate.id });
      if (assignedUsers.length > 0) {
        toast.error(`Cannot delete template. ${assignedUsers.length} users are still assigned to it.`);
        return;
      }

      // Delete template permissions
      const templatePerms = templatePermissions.filter(tp => tp.template_id === deletingTemplate.id);
      await Promise.all(templatePerms.map(perm => RoleTemplatePermission.delete(perm.id)));

      // Delete the template
      await RoleTemplate.delete(deletingTemplate.id);

      // Log the action
      await AuditLog.create({
        admin_id: currentAdmin.id,
        admin_name: currentAdmin.display_name,
        action: 'TEMPLATE_DELETED',
        entity_type: 'RoleTemplate',
        entity_id: deletingTemplate.id,
        details: `Deleted role template "${deletingTemplate.name}"`
      });

      toast.success('Template deleted successfully');
      setShowDeleteDialog(false);
      setDeletingTemplate(null);
      loadData();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const exportReport = async () => {
    try {
      const reportData = templates.map(template => {
        const templatePermIds = getTemplatePermissions(template.id);
        const templatePermNames = permissions
          .filter(p => templatePermIds.includes(p.id))
          .map(p => p.description)
          .join(', ');
        
        return {
          'Template Name': template.name,
          'Description': template.description,
          'Users Assigned': template.user_count,
          'Permissions': templatePermNames,
          'Created By': template.created_by_name,
          'Created Date': new Date(template.created_date).toLocaleDateString()
        };
      });

      // Convert to CSV
      const csvContent = [
        Object.keys(reportData[0]).join(','),
        ...reportData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `role-templates-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  const canManageTemplates = currentAdmin.app_role === 'super_admin';

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600" />
                Role Template Management
              </CardTitle>
              <p className="text-sm text-slate-600 mt-1">
                Create and manage role templates with predefined permissions for easy user assignment.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportReport}>
                <FileDown className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              {canManageTemplates && (
                <Button onClick={() => openModal()} className="bg-purple-600 hover:bg-purple-700">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-center py-16">Loading templates...</div>
          ) : (
            <div className="grid gap-4">
              {templates.map(template => {
                const templatePermIds = getTemplatePermissions(template.id);
                const templatePerms = permissions.filter(p => templatePermIds.includes(p.id));
                
                return (
                  <div key={template.id} className="bg-slate-50 p-4 rounded-lg border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-800">{template.name}</h3>
                          <Badge className={template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {template.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            <Users className="w-3 h-3 mr-1" />
                            {template.user_count} users
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-slate-600 mb-3">{template.description}</p>
                        
                        <div className="flex flex-wrap gap-1 mb-2">
                          {templatePerms.slice(0, 5).map(perm => (
                            <Badge key={perm.id} variant="outline" className="text-xs">
                              {perm.description}
                            </Badge>
                          ))}
                          {templatePerms.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{templatePerms.length - 5} more
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-xs text-slate-500">
                          Created by {template.created_by_name} on {new Date(template.created_date).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {canManageTemplates && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => handleDuplicate(template)}>
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openModal(template)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDeletingTemplate(template);
                                setShowDeleteDialog(true);
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {templates.length === 0 && (
                <div className="text-center py-12">
                  <Settings className="mx-auto h-12 w-12 text-slate-400" />
                  <h3 className="mt-2 text-sm font-medium text-slate-900">No templates found</h3>
                  <p className="mt-1 text-sm text-slate-500">Create your first role template to get started.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Template Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate ? 'Update the template details and permissions.' : 'Define a new role template with permissions.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Template Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Finance Analyst"
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the purpose and scope of this role template..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Permissions</h4>
              <div className="space-y-4">
                {Object.entries(permissionsByCategory).map(([category, categoryPerms]) => (
                  <div key={category} className="bg-slate-50 p-4 rounded-lg">
                    <h5 className="font-medium mb-3 text-slate-800">{category}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {categoryPerms.map(permission => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Switch
                            checked={formData.selectedPermissions.includes(permission.id)}
                            onCheckedChange={() => handlePermissionToggle(permission.id)}
                          />
                          <label className="text-sm text-slate-700">{permission.description}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the template "{deletingTemplate?.name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}