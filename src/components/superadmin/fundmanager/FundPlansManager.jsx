
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FundPlan } from '@/api/entities';
import { Plus, Users, TrendingUp, Calendar, DollarSign, Clock, Edit, Trash2, Loader2, CheckCircle, XCircle, FileText, Info } from 'lucide-react'; // Added Info icon
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox'; // Added Checkbox import

// FundPlanForm component to encapsulate the create/edit form logic
const FundPlanForm = ({ plan, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    plan_name: '',
    plan_code: '',
    description: '',
    fund_type: 'equity',
    risk_level: 'medium',
    profit_payout_frequency: 'monthly',
    investment_period: '1_year',
    expected_return_percent: 4, // Changed from '' to default number
    notice_period_days: 30,
    minimum_investment: 200000, // Changed from '' to default number
    maximum_investment: null, // Changed from '' to null
    lock_in_period_days: 0,
    management_fee_percent: 2.0,
    entry_load_percent: 0,
    exit_load_percent: 0,
    is_active: true,
    auto_payout_enabled: false, // Add new field to default state
  });

  useEffect(() => {
    if (plan) {
      setFormData({
        plan_name: plan.plan_name || '',
        plan_code: plan.plan_code || '',
        description: plan.description || '',
        fund_type: plan.fund_type,
        risk_level: plan.risk_level,
        profit_payout_frequency: plan.profit_payout_frequency,
        investment_period: plan.investment_period,
        expected_return_percent: plan.expected_return_percent || 0,
        notice_period_days: plan.notice_period_days || 0,
        minimum_investment: plan.minimum_investment || 0,
        maximum_investment: plan.maximum_investment || null,
        lock_in_period_days: plan.lock_in_period_days || 0,
        management_fee_percent: plan.management_fee_percent || 0,
        entry_load_percent: plan.entry_load_percent || 0,
        exit_load_percent: plan.exit_load_percent || 0,
        is_active: plan.is_active !== false,
        auto_payout_enabled: plan.auto_payout_enabled || false, // Add field for editing
      });
    } else {
      // Reset form data if no plan is provided (for create mode)
      setFormData({
        plan_name: '',
        plan_code: '',
        description: '',
        fund_type: 'equity',
        risk_level: 'medium',
        profit_payout_frequency: 'monthly',
        investment_period: '1_year',
        expected_return_percent: 4,
        notice_period_days: 30,
        minimum_investment: 200000,
        maximum_investment: null,
        lock_in_period_days: 0,
        management_fee_percent: 2.0,
        entry_load_percent: 0,
        exit_load_percent: 0,
        is_active: true,
        auto_payout_enabled: false,
      });
    }
  }, [plan]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let processedValue = value;

    if (type === 'number') {
      processedValue = value === '' ? null : parseFloat(value);
    }
    
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name, checked) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Basic Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="plan_name">Plan Name *</Label>
            <Input
              id="plan_name"
              name="plan_name"
              value={formData.plan_name}
              onChange={handleChange}
              placeholder="e.g. Monthly Growth Plan"
              required
            />
          </div>
          <div>
            <Label htmlFor="plan_code">Plan Code *</Label>
            <Input
              id="plan_code"
              name="plan_code"
              value={formData.plan_code}
              onChange={(e) => setFormData({ ...formData, plan_code: e.target.value.toUpperCase() })} // Keep uppercase for code
              placeholder="e.g. #MFP1"
              disabled={!!plan} // Disable if editing existing plan
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            placeholder="Describe the fund plan..."
            rows={3}
          />
        </div>
      </div>

      {/* Fund Characteristics */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Fund Characteristics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="fund_type">Fund Type</Label>
            <Select
              name="fund_type"
              value={formData.fund_type}
              onValueChange={(value) => handleSelectChange('fund_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equity">Equity</SelectItem>
                <SelectItem value="debt">Debt</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="index">Index</SelectItem>
                <SelectItem value="sectoral">Sectoral</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="risk_level">Risk Level</Label>
            <Select
              name="risk_level"
              value={formData.risk_level}
              onValueChange={(value) => handleSelectChange('risk_level', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="very_high">Very High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="expected_return_percent">Expected Monthly Return (%)</Label>
            <Input
              id="expected_return_percent"
              name="expected_return_percent"
              type="number"
              step="0.1"
              value={formData.expected_return_percent || ''}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {/* Investment Terms */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          Investment Terms
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="profit_payout_frequency">Profit Payout Frequency</Label>
            <Select
              name="profit_payout_frequency"
              value={formData.profit_payout_frequency}
              onValueChange={(value) => handleSelectChange('profit_payout_frequency', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="investment_period">Investment Period</Label>
            <Select
              name="investment_period"
              value={formData.investment_period}
              onValueChange={(value) => handleSelectChange('investment_period', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3_months">3 Months</SelectItem>
                <SelectItem value="6_months">6 Months</SelectItem>
                <SelectItem value="1_year">1 Year</SelectItem>
                <SelectItem value="2_years">2 Years</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="minimum_investment">Minimum Investment (₹)</Label>
            <Input
              id="minimum_investment"
              name="minimum_investment"
              type="number"
              value={formData.minimum_investment || ''}
              onChange={handleChange}
            />
          </div>

          <div>
            <Label htmlFor="maximum_investment">Maximum Investment (₹)</Label>
            <Input
              id="maximum_investment"
              name="maximum_investment"
              type="number"
              value={formData.maximum_investment || ''}
              onChange={handleChange}
              placeholder="Leave blank for unlimited"
            />
          </div>

          <div>
            <Label htmlFor="notice_period_days">Notice Period (Days)</Label>
            <Input
              id="notice_period_days"
              name="notice_period_days"
              type="number"
              value={formData.notice_period_days || ''}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="lock_in_period_days">Lock-in Period (Days)</Label>
            <Input
              id="lock_in_period_days"
              name="lock_in_period_days"
              type="number"
              value={formData.lock_in_period_days || ''}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {/* Fees & Charges */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-orange-600" />
          Fees & Charges
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="management_fee_percent">Management Fee (%)</Label>
            <Input
              id="management_fee_percent"
              name="management_fee_percent"
              type="number"
              step="0.1"
              value={formData.management_fee_percent || ''}
              onChange={handleChange}
            />
          </div>

          <div>
            <Label htmlFor="entry_load_percent">Entry Load (%)</Label>
            <Input
              id="entry_load_percent"
              name="entry_load_percent"
              type="number"
              step="0.1"
              value={formData.entry_load_percent || ''}
              onChange={handleChange}
            />
          </div>

          <div>
            <Label htmlFor="exit_load_percent">Exit Load (%)</Label>
            <Input
              id="exit_load_percent"
              name="exit_load_percent"
              type="number"
              step="0.1"
              value={formData.exit_load_percent || ''}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {/* Status & Automation */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Info className="w-5 h-5 text-indigo-600" />
          Status & Automation
        </h3>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="is_active" 
            name="is_active" 
            checked={formData.is_active} 
            onCheckedChange={(checked) => handleCheckboxChange('is_active', checked)} 
          />
          <Label htmlFor="is_active">Plan is active and accepts new investments</Label>
        </div>

        <div className="flex items-center space-x-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Checkbox 
            id="auto_payout_enabled" 
            name="auto_payout_enabled" 
            checked={formData.auto_payout_enabled} 
            onCheckedChange={(checked) => handleCheckboxChange('auto_payout_enabled', checked)} 
          />
          <div className="grid gap-1.5 leading-none">
            <Label htmlFor="auto_payout_enabled" className="text-blue-900 font-semibold">Enable Automatic Monthly Profit Payouts</Label>
            <p className="text-sm text-blue-700">
              If checked, profits for this plan will be calculated and paid out automatically based on the 'Expected Monthly Return'.
            </p>
          </div>
        </div>
      </div>
      
      <DialogFooter className="mt-6">
        <Button variant="outline" onClick={onCancel} type="button">Cancel</Button>
        <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
          {plan ? 'Update Plan' : 'Create Plan'}
        </Button>
      </DialogFooter>
    </form>
  );
};


export default function FundPlansManager({ onUpdate }) {
  const [fundPlans, setFundPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  // formData state is now managed by FundPlanForm component, so remove it from here.

  useEffect(() => {
    loadFundPlans();
  }, []);

  const loadFundPlans = async () => {
    setIsLoading(true);
    try {
      const plans = await FundPlan.list('-created_date');
      setFundPlans(plans);
    } catch (error) {
      console.error('Error loading fund plans:', error);
      toast.error('Failed to load fund plans');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (formData) => { // Accepts formData from FundPlanForm
    if (!formData.plan_name || !formData.plan_code) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      await FundPlan.create({
        ...formData,
        nav: 10, // Default NAV
        nav_date: new Date().toISOString().split('T')[0] // Default NAV date
      });

      toast.success('Fund plan created successfully!');
      setShowCreateModal(false);
      // resetForm() is no longer needed here as FundPlanForm manages its own state
      loadFundPlans();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error creating fund plan:', error);
      toast.error('Failed to create fund plan');
    }
  };

  const handleEdit = async (formData) => { // Accepts formData from FundPlanForm
    if (!selectedPlan) return;

    try {
      await FundPlan.update(selectedPlan.id, formData);
      toast.success('Fund plan updated successfully!');
      setShowEditModal(false);
      setSelectedPlan(null);
      // resetForm() is no longer needed here
      loadFundPlans();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating fund plan:', error);
      toast.error('Failed to update fund plan');
    }
  };

  const handleDelete = async (plan) => {
    if (!confirm(`Delete ${plan.plan_name}? This action cannot be undone.`)) return;

    try {
      await FundPlan.delete(plan.id);
      toast.success('Fund plan deleted successfully');
      loadFundPlans();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting fund plan:', error);
      toast.error('Failed to delete fund plan');
    }
  };

  const handleToggleActive = async (plan) => {
    try {
      await FundPlan.update(plan.id, {
        is_active: !plan.is_active
      });
      toast.success(`Fund plan ${!plan.is_active ? 'activated' : 'deactivated'}`);
      loadFundPlans();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error toggling plan status:', error);
      toast.error('Failed to update plan status');
    }
  };

  const openEditModal = (plan) => {
    setSelectedPlan(plan);
    // formData population is now handled by FundPlanForm's useEffect
    setShowEditModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedPlan(null);
    // resetForm() is no longer needed here
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Fund Plans Management</h2>
          <p className="text-slate-600 mt-1">Create and manage investment fund plans</p>
        </div>
        <Button
          onClick={() => {
            setSelectedPlan(null); // Ensure no plan is selected for creation
            setShowCreateModal(true);
          }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Fund Plan
        </Button>
      </div>

      {/* Fund Plans Grid */}
      {fundPlans.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No fund plans created yet</p>
            <Button
              onClick={() => {
                setSelectedPlan(null);
                setShowCreateModal(true);
              }}
              className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              variant="outline"
            >
              Create Your First Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fundPlans.map((plan) => (
            <Card key={plan.id} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30">
              {/* Gradient Header */}
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-6 text-white">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">{plan.plan_name}</h3>
                    <Badge className={plan.is_active ? 'bg-green-400 text-green-900' : 'bg-gray-300 text-gray-700'}>
                      {plan.is_active ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </Badge>
                    {plan.auto_payout_enabled && (
                      <Badge className="ml-2 bg-indigo-400 text-indigo-900">
                        <DollarSign className="w-3 h-3 mr-1" />
                        Auto-Payout
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-200" />
                    <div>
                      <p className="text-xs text-blue-200">Investors</p>
                      <p className="text-lg font-bold">{plan.total_investors || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-blue-200" />
                    <div>
                      <p className="text-xs text-blue-200">AUM</p>
                      <p className="text-lg font-bold">₹{((plan.total_aum || 0) / 100000).toFixed(2)}L</p>
                    </div>
                  </div>
                </div>
              </div>

              <CardContent className="p-6 space-y-4">
                {plan.description && (
                  <p className="text-sm text-slate-600 line-clamp-2">{plan.description}</p>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                    <div className="flex items-center gap-2 text-slate-700">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">Expected Return</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">{plan.expected_return_percent}% /mo</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2 text-slate-700">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">Min. Investment</span>
                    </div>
                    <span className="text-sm font-bold text-blue-600">₹{(plan.minimum_investment || 0).toLocaleString('en-IN')}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
                      <div className="flex items-center gap-2 text-slate-600 mb-1">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-medium">Period</span>
                      </div>
                      <p className="text-sm font-bold text-purple-700 capitalize">{plan.investment_period?.replace('_', ' ')}</p>
                    </div>

                    <div className="p-3 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border border-orange-100">
                      <div className="flex items-center gap-2 text-slate-600 mb-1">
                        <Calendar className="w-4 h-4 text-orange-600" />
                        <span className="text-xs font-medium">Payout</span>
                      </div>
                      <p className="text-sm font-bold text-orange-700 capitalize">{plan.profit_payout_frequency}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                      <Clock className="w-4 h-4 text-slate-600" />
                      <span className="text-xs font-medium">Notice Period</span>
                    </div>
                    <p className="text-sm font-bold text-slate-700">{plan.notice_period_days} days</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleActive(plan)}
                    className="flex-1 border-2"
                  >
                    {plan.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(plan)}
                    className="border-2 border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(plan)}
                    className="border-2 border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal || showEditModal} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {showEditModal ? 'Edit Fund Plan' : 'Create New Fund Plan'}
            </DialogTitle>
            <DialogDescription>
              {showEditModal ? 'Update fund plan details' : 'Set up a new investment fund plan'}
            </DialogDescription>
          </DialogHeader>

          <FundPlanForm 
            plan={selectedPlan} 
            onSave={showEditModal ? handleEdit : handleCreate} 
            onCancel={handleModalClose} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
