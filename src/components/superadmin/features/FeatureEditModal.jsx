import React, { useState, useEffect } from 'react';
import { FeatureConfig } from '@/api/entities';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

export default function FeatureEditModal({ feature, onClose, onSave }) {
  const [formData, setFormData] = useState({
    feature_key: '',
    feature_name: '',
    description: '',
    icon_name: 'Star',
    tier: 'basic',
    status: 'placeholder',
    release_date: '',
    release_quarter: '',
    visible_to_users: false,
    page_url: '',
    documentation_url: '',
    priority: 0,
    developer_notes: '',
    sort_order: 0,
    parent_module_key: '',
    ...feature
  });
  const [isSaving, setIsSaving] = useState(false);
  const [allFeatures, setAllFeatures] = useState([]);
  const [isLoadingFeatures, setIsLoadingFeatures] = useState(true);

  // Load all features for parent module dropdown
  useEffect(() => {
    loadAllFeatures();
  }, []);

  const loadAllFeatures = async () => {
    try {
      setIsLoadingFeatures(true);
      const features = await FeatureConfig.list();
      
      // Filter out the current feature if editing (can't be its own parent)
      const filteredFeatures = feature?.id 
        ? features.filter(f => f.id !== feature.id)
        : features;
      
      setAllFeatures(filteredFeatures);
    } catch (error) {
      console.error('Error loading features:', error);
    } finally {
      setIsLoadingFeatures(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{feature?.id ? 'Edit Feature' : 'Add New Feature'}</DialogTitle>
          <DialogDescription>
            Configure feature details, status, and visibility settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="feature_key">Feature Key *</Label>
              <Input
                id="feature_key"
                value={formData.feature_key}
                onChange={(e) => setFormData({ ...formData, feature_key: e.target.value })}
                placeholder="e.g., premium_chat_rooms"
                required
                disabled={!!feature?.id}
              />
            </div>

            <div>
              <Label htmlFor="feature_name">Feature Name *</Label>
              <Input
                id="feature_name"
                value={formData.feature_name}
                onChange={(e) => setFormData({ ...formData, feature_name: e.target.value })}
                placeholder="e.g., Premium Chat Rooms"
                required
              />
            </div>
          </div>

          {/* Parent Module Key - NEW FIELD */}
          <div>
            <Label htmlFor="parent_module_key">Parent Module Key (optional)</Label>
            <Select
              value={formData.parent_module_key || 'none'}
              onValueChange={(value) => setFormData({ 
                ...formData, 
                parent_module_key: value === 'none' ? '' : value 
              })}
              disabled={isLoadingFeatures}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingFeatures ? "Loading..." : "Select parent module"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (standalone module)</SelectItem>
                {allFeatures.map((f) => (
                  <SelectItem key={f.id} value={f.feature_key}>
                    {f.feature_name} ({f.feature_key})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 mt-1">
              If this feature is part of another module/page, select its parent
            </p>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of the feature"
              rows={3}
            />
          </div>

          {/* Tier & Status */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="tier">Subscription Tier *</Label>
              <Select
                value={formData.tier}
                onValueChange={(value) => setFormData({ ...formData, tier: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="vip">VIP Elite</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="placeholder">Coming Soon</SelectItem>
                  <SelectItem value="deprecated">Deprecated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>

          {/* Release Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="release_quarter">Release Quarter</Label>
              <Input
                id="release_quarter"
                value={formData.release_quarter}
                onChange={(e) => setFormData({ ...formData, release_quarter: e.target.value })}
                placeholder="e.g., Q2 2025"
              />
            </div>

            <div>
              <Label htmlFor="release_date">Release Date</Label>
              <Input
                id="release_date"
                type="date"
                value={formData.release_date}
                onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
              />
            </div>
          </div>

          {/* URLs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="page_url">Page URL</Label>
              <Input
                id="page_url"
                value={formData.page_url}
                onChange={(e) => setFormData({ ...formData, page_url: e.target.value })}
                placeholder="/ChatRooms"
              />
            </div>

            <div>
              <Label htmlFor="documentation_url">Documentation URL</Label>
              <Input
                id="documentation_url"
                value={formData.documentation_url}
                onChange={(e) => setFormData({ ...formData, documentation_url: e.target.value })}
                placeholder="https://docs.protocol.com/..."
              />
            </div>
          </div>

          {/* Developer Notes */}
          <div>
            <Label htmlFor="developer_notes">Developer Notes</Label>
            <Textarea
              id="developer_notes"
              value={formData.developer_notes}
              onChange={(e) => setFormData({ ...formData, developer_notes: e.target.value })}
              placeholder="Internal notes for development team"
              rows={2}
            />
          </div>

          {/* Visibility */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <Label htmlFor="visible_to_users" className="text-sm font-semibold">
                Visible to Users
              </Label>
              <p className="text-xs text-slate-600">
                Show this feature in user-facing Feature Hub
              </p>
            </div>
            <Switch
              id="visible_to_users"
              checked={formData.visible_to_users}
              onCheckedChange={(checked) => setFormData({ ...formData, visible_to_users: checked })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {feature?.id ? 'Update Feature' : 'Create Feature'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}