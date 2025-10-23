import React, { useState, useEffect } from 'react';
import { Role } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Shield,
  Lock
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function ManageRoles({ settings, onChange }) {
  const [roles, setRoles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [deleteRole, setDeleteRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_system_role: false
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setIsLoading(true);
    try {
      const userRoles = await Role.list();
      setRoles(userRoles.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error loading roles:', error);
      toast.error('Failed to load roles');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      description: '',
      is_system_role: false
    });
    setShowModal(true);
  };

  const openEditModal = (role) => {
    setEditingRole(role);
    setFormData({ ...role });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingRole) {
        await Role.update(editingRole.id, formData);
        toast.success('Role updated successfully');
      } else {
        await Role.create(formData);
        toast.success('Role created successfully');
      }
      setShowModal(false);
      loadRoles();
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error('Failed to save role');
    }
  };

  const handleDelete = async () => {
    if (!deleteRole) return;
    
    try {
      await Role.delete(deleteRole.id);
      toast.success('Role deleted successfully');
      setShowDeleteDialog(false);
      setDeleteRole(null);
      loadRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Failed to delete role');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Role Management</h3>
          <p className="text-sm text-slate-600">
            Define user roles and their permissions in the system.
          </p>
        </div>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Role
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center p-8">Loading roles...</div>
      ) : (
        <div className="grid gap-4">
          {roles.map((role) => (
            <Card key={role.id} className="shadow-sm">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-slate-100">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{role.name}</h4>
                      {role.is_system_role && (
                        <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          System
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">{role.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditModal(role)}
                    disabled={role.is_system_role}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setDeleteRole(role);
                      setShowDeleteDialog(true);
                    }}
                    className="text-red-600"
                    disabled={role.is_system_role}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {roles.length === 0 && (
            <div className="text-center p-8 text-slate-600">
              No roles found. Click "Add Role" to create one.
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Edit' : 'Create'} Role
            </DialogTitle>
            <DialogDescription>
              Define the role name and description.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                placeholder="e.g., moderator, content_reviewer"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the role's purpose..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_system_role">System Role</Label>
                <p className="text-xs text-slate-600">System roles cannot be deleted or renamed</p>
              </div>
              <Switch
                id="is_system_role"
                checked={formData.is_system_role}
                onCheckedChange={(checked) => setFormData({...formData, is_system_role: checked})}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingRole ? 'Update' : 'Create'} Role
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role "{deleteRole?.name}"? 
              This action cannot be undone and may affect users assigned to this role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}