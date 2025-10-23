import React, { useState } from 'react';
import { SubscriptionPlan } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Crown, Star, Users, Edit, Trash2, Plus, Check, X, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function PlanManager({ plans, setPlans, permissions }) {
  const [editingPlan, setEditingPlan] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newFeature, setNewFeature] = useState('');

  // Available feature options for selection
  const availableFeatures = [
    { key: 'premium_chat_rooms', label: 'Premium Chat Rooms' },
    { key: 'premium_polls', label: 'Premium Polls' },
    { key: 'premium_events', label: 'Premium Events' },
    { key: 'admin_recommendations', label: 'Admin Recommendations' },
    { key: 'advisor_subscriptions', label: 'Advisor Subscriptions' },
    { key: 'exclusive_finfluencer_content', label: 'Exclusive Finfluencer Content' },
    { key: 'pledge_participation', label: 'Pledge Participation' },
    { key: 'advanced_analytics', label: 'Advanced Analytics' },
    { key: 'priority_support', label: 'Priority Support' },
    { key: 'one_on_one_consultation', label: 'One-on-One Consultation' },
    { key: 'whatsapp_support', label: 'WhatsApp Support' },
    { key: 'custom_alerts', label: 'Custom Alerts' },
    { key: 'research_reports', label: 'Research Reports' },
    { key: 'webinar_access', label: 'Webinar Access' },
    { key: 'portfolio_tools', label: 'Portfolio Tools' }
  ];

  const handleEdit = (plan) => {
    setEditingPlan({ ...plan });
    setShowEditDialog(true);
  };

  const handleSave = async () => {
    if (!editingPlan) return;

    try {
      await SubscriptionPlan.update(editingPlan.id, editingPlan);
      setPlans(plans.map(p => p.id === editingPlan.id ? editingPlan : p));
      setShowEditDialog(false);
      setEditingPlan(null);
      toast.success('Plan updated successfully!');
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error('Failed to update plan');
    }
  };

  const handleDelete = async (planId) => {
    const plan = plans.find(p => p.id === planId);
    
    if (plan.is_system_plan && permissions.isSuperAdmin) {
      toast.error('Cannot delete system plans');
      return;
    }

    if (!permissions.isSuperAdmin) {
      toast.error('Only Super Admins can delete plans');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to delete the ${plan.name} plan? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await SubscriptionPlan.delete(planId);
      setPlans(plans.filter(p => p.id !== planId));
      toast.success('Plan deleted successfully!');
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Failed to delete plan');
    }
  };

  const addFeature = () => {
    if (!newFeature.trim() || !editingPlan) return;
    
    const updatedFeatures = [...(editingPlan.features || []), newFeature.trim()];
    setEditingPlan({ ...editingPlan, features: updatedFeatures });
    setNewFeature('');
  };

  const removeFeature = (featureToRemove) => {
    if (!editingPlan) return;
    
    const updatedFeatures = editingPlan.features.filter(f => f !== featureToRemove);
    setEditingPlan({ ...editingPlan, features: updatedFeatures });
  };

  const toggleFeature = (featureKey) => {
    if (!editingPlan) return;
    
    const currentFeatures = editingPlan.features || [];
    const updatedFeatures = currentFeatures.includes(featureKey)
      ? currentFeatures.filter(f => f !== featureKey)
      : [...currentFeatures, featureKey];
    
    setEditingPlan({ ...editingPlan, features: updatedFeatures });
  };

  const setInheritance = (parentPlanId) => {
    if (!editingPlan) return;
    setEditingPlan({ ...editingPlan, inherits_from_plan_id: parentPlanId || null });
  };

  const getPlanIcon = (planName) => {
    if (planName.toLowerCase().includes('vip') || planName.toLowerCase().includes('elite')) {
      return <Crown className="w-5 h-5 text-yellow-600" />;
    }
    if (planName.toLowerCase().includes('premium')) {
      return <Star className="w-5 h-5 text-purple-600" />;
    }
    return <Users className="w-5 h-5 text-blue-600" />;
  };

  const getCardGradient = (planName) => {
    if (planName.toLowerCase().includes('vip') || planName.toLowerCase().includes('elite')) {
      return 'from-yellow-50 to-orange-50';
    }
    if (planName.toLowerCase().includes('premium')) {
      return 'from-purple-50 to-pink-50';
    }
    return 'from-blue-50 to-cyan-50';
  };

  // Get parent plan name for display
  const getParentPlanName = (inheritsFromId) => {
    if (!inheritsFromId) return null;
    const parentPlan = plans.find(p => p.id === inheritsFromId);
    return parentPlan ? parentPlan.name : null;
  };

  // Get feature label from key
  const getFeatureLabel = (key) => {
    const feature = availableFeatures.find(f => f.key === key);
    return feature ? feature.label : key.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const parentPlanName = getParentPlanName(plan.inherits_from_plan_id);
          
          return (
            <Card key={plan.id} className={`bg-gradient-to-br ${getCardGradient(plan.name)} border-0 shadow-lg hover:shadow-xl transition-all duration-300`}>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getPlanIcon(plan.name)}
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {plan.is_system_plan && (
                      <Badge variant="outline" className="text-xs bg-white">System</Badge>
                    )}
                    <Badge variant={plan.is_active ? 'default' : 'secondary'} className="text-xs">
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                
                <div className="text-3xl font-bold text-slate-900">
                  ₹{(plan.price_monthly || 0).toLocaleString()}
                  <span className="text-sm text-slate-500 font-normal">/month</span>
                </div>
                
                {plan.price_annually > 0 && (
                  <div className="text-sm text-slate-600">
                    or ₹{plan.price_annually.toLocaleString()}/year
                    <Badge variant="outline" className="ml-2 text-xs bg-green-100 text-green-700">
                      Save {Math.round((1 - plan.price_annually / (plan.price_monthly * 12)) * 100)}%
                    </Badge>
                  </div>
                )}
                
                <p className="text-sm text-slate-600 mt-2">{plan.description}</p>
              </CardHeader>

              <CardContent>
                {/* Show Inheritance Summary */}
                {parentPlanName && (
                  <div className="mb-4 p-3 bg-white/50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span>Includes All {parentPlanName} Features</span>
                    </div>
                  </div>
                )}

                {/* Show Only Unique Features for This Plan */}
                <div className="space-y-2 mb-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">
                    {parentPlanName ? `Additional ${plan.name} Features:` : 'Features:'}
                  </h4>
                  {plan.features && plan.features.length > 0 ? (
                    plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{getFeatureLabel(feature)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 italic">No unique features defined</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEdit(plan)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={!permissions.canEdit}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  
                  {!plan.is_system_plan && permissions.isSuperAdmin && (
                    <Button
                      onClick={() => handleDelete(plan.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Plan Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {editingPlan?.name} Plan</DialogTitle>
            <DialogDescription>
              Update plan details, pricing, and features. Changes will reflect for all users.
            </DialogDescription>
          </DialogHeader>

          {editingPlan && (
            <div className="space-y-4">
              {/* Plan Name */}
              <div>
                <Label>Plan Name</Label>
                <Input
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  disabled={editingPlan.is_system_plan}
                />
                {editingPlan.is_system_plan && (
                  <p className="text-xs text-slate-500 mt-1">System plans cannot be renamed</p>
                )}
              </div>

              {/* Description */}
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editingPlan.description || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  rows={2}
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Monthly Price (₹)</Label>
                  <Input
                    type="number"
                    value={editingPlan.price_monthly || 0}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price_monthly: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Annual Price (₹)</Label>
                  <Input
                    type="number"
                    value={editingPlan.price_annually || 0}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price_annually: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Inheritance */}
              <div>
                <Label>Inherits Features From</Label>
                <select
                  className="w-full mt-1 p-2 border rounded-md"
                  value={editingPlan.inherits_from_plan_id || ''}
                  onChange={(e) => setInheritance(e.target.value)}
                >
                  <option value="">None (No Inheritance)</option>
                  {plans
                    .filter(p => p.id !== editingPlan.id)
                    .map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))
                  }
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  If set, this plan will include all features from the selected plan
                </p>
              </div>

              {/* Features */}
              <div>
                <Label className="mb-2 block">
                  {editingPlan.inherits_from_plan_id ? 'Additional Features (Unique to this plan)' : 'Plan Features'}
                </Label>
                
                <div className="border rounded-lg p-4 bg-slate-50 mb-3">
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {availableFeatures.map((feature) => (
                      <div key={feature.key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={feature.key}
                          checked={editingPlan.features?.includes(feature.key) || false}
                          onChange={() => toggleFeature(feature.key)}
                          className="rounded"
                        />
                        <label htmlFor={feature.key} className="text-sm cursor-pointer">
                          {feature.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Feature Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom feature..."
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                  />
                  <Button onClick={addFeature} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Current Features List */}
                {editingPlan.features && editingPlan.features.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {editingPlan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border">
                        <span className="text-sm">{getFeatureLabel(feature)}</span>
                        <Button
                          onClick={() => removeFeature(feature)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Plan Active</Label>
                  <p className="text-xs text-slate-500">Available for new subscriptions</p>
                </div>
                <Switch
                  checked={editingPlan.is_active}
                  onCheckedChange={(checked) => setEditingPlan({ ...editingPlan, is_active: checked })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}