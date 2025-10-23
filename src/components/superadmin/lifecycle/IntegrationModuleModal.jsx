import React, { useState, useEffect } from 'react';
import { FeatureConfig } from '@/api/entities';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function IntegrationModuleModal({ integration, user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    feature_key: '',
    feature_name: '',
    description: '',
    icon_name: 'Plug',
    tier: 'basic',
    status: 'placeholder',
    visibility_rule: 'authenticated',
    visible_to_users: false,
    documentation_url: '',
    developer_notes: '',
    sort_order: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (integration) {
      setFormData({
        feature_key: integration.feature_key || '',
        feature_name: integration.feature_name || '',
        description: integration.description || '',
        icon_name: integration.icon_name || 'Plug',
        tier: integration.tier || 'basic',
        status: integration.status || 'placeholder',
        visibility_rule: integration.visibility_rule || 'authenticated',
        visible_to_users: integration.visible_to_users || false,
        documentation_url: integration.documentation_url || '',
        developer_notes: integration.developer_notes || '',
        sort_order: integration.sort_order || 0
      });
    }
  }, [integration]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.feature_key || !formData.feature_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        module_type: 'integration',
        last_status_change_date: new Date().toISOString(),
        changed_by_admin_id: user.id,
        changed_by_admin_name: user.display_name || user.email,
        reason_for_change: integration 
          ? `Updated integration: ${formData.feature_name}` 
          : `Created new integration: ${formData.feature_name}`
      };

      if (integration) {
        await FeatureConfig.update(integration.id, payload);
        toast.success('Integration updated successfully');
      } else {
        await FeatureConfig.create(payload);
        toast.success('Integration created successfully');
      }

      onSave();
    } catch (error) {
      console.error('Error saving integration:', error);
      toast.error('Failed to save integration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {integration ? 'Edit Integration' : 'Add New Integration'}
          </DialogTitle>
          <DialogDescription>
            Configure an external integration or service for your application
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="feature_key">Integration Key <span className="text-red-500">*</span></Label>
              <Input
                id="feature_key"
                value={formData.feature_key}
                onChange={(e) => setFormData({...formData, feature_key: e.target.value})}
                placeholder="e.g., razorpay_payment"
                disabled={!!integration}
                required
              />
            </div>

            <div>
              <Label htmlFor="feature_name">Integration Name <span className="text-red-500">*</span></Label>
              <Input
                id="feature_name"
                value={formData.feature_name}
                onChange={(e) => setFormData({...formData, feature_name: e.target.value})}
                placeholder="e.g., Razorpay Payments"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe what this integration does..."
              className="h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tier">Subscription Tier</Label>
              <Select
                value={formData.tier}
                onValueChange={(value) => setFormData({...formData, tier: value})}
              >
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
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({...formData, status: value})}
              >
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="visibility_rule">Visibility Rule</Label>
              <Select
                value={formData.visibility_rule}
                onValueChange={(value) => setFormData({...formData, visibility_rule: value})}
              >
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

            <div>
              <Label htmlFor="icon_name">Icon Name</Label>
              <Input
                id="icon_name"
                value={formData.icon_name}
                onChange={(e) => setFormData({...formData, icon_name: e.target.value})}
                placeholder="e.g., CreditCard, Mail"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="documentation_url">Documentation URL</Label>
            <Input
              id="documentation_url"
              type="url"
              value={formData.documentation_url}
              onChange={(e) => setFormData({...formData, documentation_url: e.target.value})}
              placeholder="https://..."
            />
          </div>

          <div>
            <Label htmlFor="developer_notes">Developer Notes</Label>
            <Textarea
              id="developer_notes"
              value={formData.developer_notes}
              onChange={(e) => setFormData({...formData, developer_notes: e.target.value})}
              placeholder="Internal notes for developers..."
              className="h-20"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="visible_to_users"
              checked={formData.visible_to_users}
              onChange={(e) => setFormData({...formData, visible_to_users: e.target.checked})}
              className="rounded"
            />
            <Label htmlFor="visible_to_users" className="cursor-pointer">
              Enable this integration for users
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? 'Saving...' : integration ? 'Update Integration' : 'Create Integration'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}