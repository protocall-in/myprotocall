
import React, { useState, useEffect, useCallback } from 'react';
import { EntityConfig } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Edit, Trash2, Database, AlertTriangle } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const AVAILABLE_ICONS = [
  'BookUser', 'Star', 'GraduationCap', 'Award', 'Shield', 'Users', 'Briefcase', 'ShieldCheck'
];

const AVAILABLE_COLORS = [
  'text-blue-600', 'text-green-600', 'text-purple-600', 'text-red-600', 
  'text-yellow-600', 'text-indigo-600', 'text-pink-600', 'text-cyan-600'
];

export default function ManageEntityConfig({ settings, onChange, refreshEntityConfigs }) {
  const [entities, setEntities] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntity, setEditingEntity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    entity_name: '',
    display_name: '',
    description: '',
    icon_name: 'Shield',
    color: 'text-blue-600',
    enabled: true,
    user_visible: false,
    admin_visible: true,
    management_enabled: true,
    status_field: 'status',
    sort_order: 0
  });

  const loadEntities = useCallback(async () => {
    setIsLoading(true);
    try {
      const entityConfigs = await EntityConfig.list();
      setEntities(entityConfigs.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
    } catch (error) {
      console.error('Error loading entity configs:', error);
      toast.error('Failed to load entity configurations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntities();
  }, [loadEntities]);

  const resetForm = () => {
    setFormData({
      entity_name: '',
      display_name: '',
      description: '',
      icon_name: 'Shield',
      color: 'text-blue-600',
      enabled: true,
      user_visible: false,
      admin_visible: true,
      management_enabled: true,
      status_field: 'status',
      sort_order: 0
    });
  };

  const handleOpenModal = (entity = null) => {
    if (entity) {
      setEditingEntity(entity);
      setFormData({ ...entity });
    } else {
      setEditingEntity(null);
      resetForm();
    }
    setShowAddModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingEntity) {
        await EntityConfig.update(editingEntity.id, formData);
        toast.success('Entity configuration updated successfully');
      } else {
        await EntityConfig.create(formData);
        toast.success('Entity configuration created successfully');
      }
      
      setShowAddModal(false);
      setEditingEntity(null);
      
      // Refresh local and parent component data AFTER mutation
      await loadEntities();
      if (refreshEntityConfigs) {
        refreshEntityConfigs();
      }

    } catch (error) {
      console.error('Error saving entity config:', error);
      toast.error(`Failed to save configuration: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (entityId) => {
    try {
      await EntityConfig.delete(entityId);
      toast.success('Entity configuration deleted successfully');
      
      // Refresh local and parent component data AFTER mutation
      await loadEntities();
      if (refreshEntityConfigs) {
        refreshEntityConfigs();
      }
    } catch (error) {
      console.error('Error deleting entity config:', error);
      toast.error('Failed to delete configuration');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-600" />
                Dynamic Entity Configuration
              </CardTitle>
              <p className="text-sm text-slate-600 mt-2">
                Configure which entities appear in user and admin sidebars. Control visibility, management access, and display settings.
              </p>
            </div>
            <Button onClick={() => handleOpenModal()} className="bg-purple-600 hover:bg-purple-700">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Entity
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading configurations...</div>
          ) : (
            <div className="space-y-4">
              {entities.map(entity => (
                <div key={entity.id} className="bg-slate-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-800">{entity.display_name}</h3>
                        <div className="flex gap-2">
                          <Badge className={entity.enabled ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}>
                            {entity.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                          {entity.user_visible && (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                              User Visible
                            </Badge>
                          )}
                          {entity.admin_visible && (
                            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                              Admin Visible
                            </Badge>
                          )}
                          {entity.management_enabled && (
                            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                              Management Enabled
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-slate-600">Entity:</span>
                          <span className="ml-2 font-medium text-slate-800">{entity.entity_name}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Icon:</span>
                          <span className="ml-2 font-medium text-slate-800">{entity.icon_name}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Sort Order:</span>
                          <span className="ml-2 font-medium text-slate-800">{entity.sort_order || 0}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-600 mt-2">{entity.description}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenModal(entity)}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(entity.id)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {entities.length === 0 && (
                <div className="text-center py-12">
                  <Database className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No Entity Configurations</h3>
                  <p className="text-slate-500 mb-4">Create your first entity configuration to get started.</p>
                  <Button onClick={() => handleOpenModal()} className="bg-purple-600 hover:bg-purple-700">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add First Entity
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEntity ? 'Edit Entity Configuration' : 'Add New Entity Configuration'}
            </DialogTitle>
            <DialogDescription>
              Configure how this entity appears and behaves in the application sidebars.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 max-h-[70vh] overflow-y-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Entity Name</label>
                <Input name="entity_name" value={formData.entity_name} onChange={handleInputChange} placeholder="e.g., Educator" required />
                <p className="text-xs text-slate-500 mt-1">Must match the entity schema name exactly.</p>
              </div>
              <div>
                <label className="text-sm font-medium">Display Name</label>
                <Input name="display_name" value={formData.display_name} onChange={handleInputChange} placeholder="e.g., Educators" required />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Short description for sidebar..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Icon Name</label>
                <Select name="icon_name" value={formData.icon_name} onValueChange={(v) => handleSelectChange('icon_name', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ICONS.map(icon => <SelectItem key={icon} value={icon}>{icon}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Icon Color</label>
                <Select name="color" value={formData.color} onValueChange={(v) => handleSelectChange('color', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_COLORS.map(color => <SelectItem key={color} value={color}>{color}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center bg-slate-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                    <Switch id="enabled" name="enabled" checked={formData.enabled} onCheckedChange={(c) => handleSwitchChange('enabled', c)} />
                    <label htmlFor="enabled" className="text-sm font-medium">Enabled</label>
                </div>
                <div className="flex items-center gap-2">
                    <Switch id="user_visible" name="user_visible" checked={formData.user_visible} onCheckedChange={(c) => handleSwitchChange('user_visible', c)} />
                    <label htmlFor="user_visible" className="text-sm font-medium">User Visible</label>
                </div>
                <div className="flex items-center gap-2">
                    <Switch id="admin_visible" name="admin_visible" checked={formData.admin_visible} onCheckedChange={(c) => handleSwitchChange('admin_visible', c)} />
                    <label htmlFor="admin_visible" className="text-sm font-medium">Admin Visible</label>
                </div>
                <div className="flex items-center gap-2">
                    <Switch id="management_enabled" name="management_enabled" checked={formData.management_enabled} onCheckedChange={(c) => handleSwitchChange('management_enabled', c)} />
                    <label htmlFor="management_enabled" className="text-sm font-medium">Has Mgmt UI</label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="text-sm font-medium">Status Field Name</label>
                  <Input name="status_field" value={formData.status_field} onChange={handleInputChange} placeholder="e.g., status" />
              </div>
              <div>
                  <label className="text-sm font-medium">Sort Order</label>
                  <Input type="number" name="sort_order" value={formData.sort_order} onChange={handleInputChange} />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button type="submit">Save Configuration</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
