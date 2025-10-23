import React, { useState, useEffect } from 'react';
import { FeatureConfig } from '@/api/entities';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function PageModuleModal({ page, user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    feature_key: '',
    feature_name: '',
    description: '',
    module_type: 'page',
    route_path: '',
    icon_name: 'FileText',
    tier: 'basic',
    status: 'placeholder',
    visibility_rule: 'authenticated',
    visible_to_users: false,
    sort_order: 0,
    reason_for_change: ''
  });

  useEffect(() => {
    if (page) {
      setFormData({
        feature_key: page.feature_key || '',
        feature_name: page.feature_name || '',
        description: page.description || '',
        module_type: page.module_type || 'page',
        route_path: page.route_path || '',
        icon_name: page.icon_name || 'FileText',
        tier: page.tier || 'basic',
        status: page.status || 'placeholder',
        visibility_rule: page.visibility_rule || 'authenticated',
        visible_to_users: page.visible_to_users || false,
        sort_order: page.sort_order || 0,
        reason_for_change: ''
      });
    }
  }, [page]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.feature_key || !formData.feature_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const cleanPayload = {
        feature_key: formData.feature_key,
        feature_name: formData.feature_name,
        description: formData.description || null,
        module_type: formData.module_type,
        route_path: formData.route_path || null,
        icon_name: formData.icon_name,
        tier: formData.tier,
        status: formData.status,
        visibility_rule: formData.visibility_rule,
        visible_to_users: formData.visible_to_users,
        sort_order: formData.sort_order || 0,
        last_status_change_date: new Date().toISOString(),
        changed_by_admin_id: user.id,
        changed_by_admin_name: user.display_name || user.email,
        reason_for_change: formData.reason_for_change || `${page ? 'Updated' : 'Created'} by ${user.display_name || user.email}`
      };

      if (page) {
        await FeatureConfig.update(page.id, cleanPayload);
        toast.success('Page updated successfully');
      } else {
        await FeatureConfig.create(cleanPayload);
        toast.success('Page created successfully');
      }

      onSave();
    } catch (error) {
      console.error('Error saving page:', error);
      toast.error('Failed to save page');
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{page ? 'Edit Page Module' : 'Create New Page Module'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Feature Key *</Label>
              <Input
                value={formData.feature_key}
                onChange={(e) => setFormData({ ...formData, feature_key: e.target.value })}
                placeholder="pledge_pool_page"
                required
                disabled={!!page}
              />
              <p className="text-xs text-slate-500 mt-1">Unique identifier (lowercase, underscores)</p>
            </div>

            <div>
              <Label>Display Name *</Label>
              <Input
                value={formData.feature_name}
                onChange={(e) => setFormData({ ...formData, feature_name: e.target.value })}
                placeholder="Pledge Pool"
                required
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the page purpose and functionality..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Route Path</Label>
              <Input
                value={formData.route_path}
                onChange={(e) => setFormData({ ...formData, route_path: e.target.value })}
                placeholder="/PledgePool"
              />
              <p className="text-xs text-slate-500 mt-1">URL path for the page</p>
            </div>

            <div>
              <Label>Icon Name</Label>
              <Input
                value={formData.icon_name}
                onChange={(e) => setFormData({ ...formData, icon_name: e.target.value })}
                placeholder="FileText"
              />
              <p className="text-xs text-slate-500 mt-1">Lucide icon name</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Tier *</Label>
              <Select value={formData.tier} onValueChange={(value) => setFormData({ ...formData, tier: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status *</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="placeholder">Placeholder</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Visibility Rule *</Label>
              <Select value={formData.visibility_rule} onValueChange={(value) => setFormData({ ...formData, visibility_rule: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="authenticated">Authenticated</SelectItem>
                  <SelectItem value="subscribed_user">Subscribed User</SelectItem>
                  <SelectItem value="admin_only">Admin Only</SelectItem>
                  <SelectItem value="super_admin_only">Super Admin Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.visible_to_users}
                  onChange={(e) => setFormData({ ...formData, visible_to_users: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Visible to Users</span>
              </label>
            </div>
          </div>

          <div>
            <Label>Reason for Change *</Label>
            <Textarea
              value={formData.reason_for_change}
              onChange={(e) => setFormData({ ...formData, reason_for_change: e.target.value })}
              placeholder="Explain why you're making this change..."
              rows={2}
              required
            />
            <p className="text-xs text-slate-500 mt-1">This will be logged in the audit trail</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {page ? 'Update Page' : 'Create Page'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}