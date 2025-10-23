import React, { useState, useEffect, useRef } from 'react';
import { FeatureConfig } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plug, Plus, Search, Eye, EyeOff, Edit, Trash2,
  CheckCircle, AlertCircle, Clock, Ban, Link2 
} from 'lucide-react';
import { toast } from 'sonner';
import IntegrationModuleModal from './IntegrationModuleModal';

// List of common integrations to initialize
const COMMON_INTEGRATIONS = [
  { key: 'razorpay_payment', name: 'Razorpay Payments', description: 'Payment gateway integration', icon: 'CreditCard', tier: 'basic' },
  { key: 'email_notifications', name: 'Email Notifications', description: 'Automated email system', icon: 'Mail', tier: 'basic' },
  { key: 'sms_alerts', name: 'SMS Alerts', description: 'SMS notification service', icon: 'MessageSquare', tier: 'premium' },
  { key: 'stock_data_api', name: 'Live Stock Data', description: 'Real-time stock market data', icon: 'TrendingUp', tier: 'basic' },
  { key: 'whatsapp_business', name: 'WhatsApp Business', description: 'WhatsApp integration for support', icon: 'MessageCircle', tier: 'premium' },
  { key: 'google_analytics', name: 'Google Analytics', description: 'Website analytics tracking', icon: 'BarChart', tier: 'basic' },
];

export default function IntegrationsManager({ user }) {
  const [integrations, setIntegrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    loadIntegrations();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadIntegrations = async () => {
    try {
      if (isMounted.current) {
        setIsLoading(true);
      }
      
      const allModules = await FeatureConfig.list();
      const integrationModules = allModules.filter(m => m.module_type === 'integration');
      
      if (isMounted.current) {
        setIntegrations(integrationModules.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
      }
    } catch (error) {
      if (isMounted.current && error.name !== 'AbortError') {
        console.error('Error loading integrations:', error);
        toast.error('Failed to load integrations');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  const handleToggleVisibility = async (integration) => {
    try {
      const cleanPayload = {
        feature_key: integration.feature_key,
        feature_name: integration.feature_name,
        description: integration.description,
        module_type: integration.module_type,
        icon_name: integration.icon_name,
        tier: integration.tier,
        status: integration.status,
        visibility_rule: integration.visibility_rule,
        visible_to_users: !integration.visible_to_users,
        sort_order: integration.sort_order || 0,
        last_status_change_date: new Date().toISOString(),
        changed_by_admin_id: user.id,
        changed_by_admin_name: user.display_name || user.email,
        reason_for_change: `Visibility toggled by ${user.display_name || user.email}`
      };

      await FeatureConfig.update(integration.id, cleanPayload);
      await loadIntegrations();
      toast.success(`Integration ${cleanPayload.visible_to_users ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error toggling visibility:', error);
        toast.error('Failed to update integration visibility');
      }
    }
  };

  const handleDelete = async (integration) => {
    if (!window.confirm(`Are you sure you want to delete the integration "${integration.feature_name}"?`)) return;

    try {
      await FeatureConfig.delete(integration.id);
      await loadIntegrations();
      toast.success('Integration deleted successfully');
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error deleting integration:', error);
        toast.error('Failed to delete integration');
      }
    }
  };

  const handleInitializeCommonIntegrations = async () => {
    try {
      const existingKeys = new Set(integrations.map(i => i.feature_key));
      let created = 0;

      for (const integration of COMMON_INTEGRATIONS) {
        if (existingKeys.has(integration.key)) continue;

        await FeatureConfig.create({
          feature_key: integration.key,
          feature_name: integration.name,
          description: integration.description,
          module_type: 'integration',
          icon_name: integration.icon,
          tier: integration.tier,
          status: 'placeholder',
          visibility_rule: 'authenticated',
          visible_to_users: false,
          sort_order: 0,
          last_status_change_date: new Date().toISOString(),
          changed_by_admin_id: user.id,
          changed_by_admin_name: user.display_name || user.email,
          reason_for_change: 'Auto-initialized common integration'
        });

        created++;
      }

      if (created > 0) {
        await loadIntegrations();
        toast.success(`Initialized ${created} common integrations`);
      } else {
        toast.info('All common integrations already exist');
      }
    } catch (error) {
      console.error('Error initializing integrations:', error);
      toast.error('Failed to initialize integrations');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'live': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'partial': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'placeholder': return <Clock className="w-4 h-4 text-purple-600" />;
      case 'disabled': return <Ban className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'bg-green-100 text-green-800 border-green-300';
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'placeholder': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'disabled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.feature_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || integration.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: integrations.length,
    live: integrations.filter(i => i.status === 'live').length,
    placeholder: integrations.filter(i => i.status === 'placeholder').length,
    disabled: integrations.filter(i => i.status === 'disabled').length
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Initialization Helper */}
      {integrations.length === 0 && (
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-purple-900 mb-2">Initialize Common Integrations</h3>
                <p className="text-sm text-purple-700 mb-4">
                  Quickly add common integrations like Payment Gateway, Email, SMS, Stock Data API, etc.
                </p>
              </div>
              <Button onClick={handleInitializeCommonIntegrations} className="bg-purple-600 hover:bg-purple-700">
                <Plug className="w-4 h-4 mr-2" />
                Initialize
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Integrations</p>
                <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <Plug className="w-12 h-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Live</p>
                <p className="text-3xl font-bold text-green-600">{stats.live}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Planned</p>
                <p className="text-3xl font-bold text-purple-600">{stats.placeholder}</p>
              </div>
              <Clock className="w-12 h-12 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Disabled</p>
                <p className="text-3xl font-bold text-red-600">{stats.disabled}</p>
              </div>
              <Ban className="w-12 h-12 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search integrations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {['all', 'live', 'partial', 'placeholder', 'disabled'].map((status) => (
            <Button
              key={status}
              onClick={() => setFilterStatus(status)}
              variant={filterStatus === status ? 'default' : 'outline'}
              size="sm"
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        <Button onClick={() => { setEditingIntegration(null); setShowModal(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Integration
        </Button>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIntegrations.map((integration) => (
          <Card key={integration.id} className="hover:shadow-lg transition-all">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Link2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{integration.feature_name}</h3>
                    <p className="text-xs text-slate-500">{integration.feature_key}</p>
                  </div>
                </div>
                <Badge className={`${getStatusColor(integration.status)} border flex items-center gap-1`}>
                  {getStatusIcon(integration.status)}
                  {integration.status}
                </Badge>
              </div>

              <p className="text-sm text-slate-600 mb-3">{integration.description}</p>

              <div className="flex items-center gap-2 mb-3">
                {integration.visible_to_users ? (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-xs">
                    <Eye className="w-3 h-3 mr-1" />
                    Enabled
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300 text-xs">
                    <EyeOff className="w-3 h-3 mr-1" />
                    Disabled
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {integration.tier}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleVisibility(integration)}
                  className="flex-1"
                >
                  {integration.visible_to_users ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                  {integration.visible_to_users ? 'Disable' : 'Enable'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setEditingIntegration(integration); setShowModal(true); }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(integration)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredIntegrations.length === 0 && (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12 text-center">
                <Plug className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-semibold text-slate-700 mb-2">No integrations found</p>
                <p className="text-sm text-slate-500">Try adjusting your search or filters</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Integration Module Modal */}
      {showModal && (
        <IntegrationModuleModal
          integration={editingIntegration}
          user={user}
          onClose={() => { setShowModal(false); setEditingIntegration(null); }}
          onSave={async () => {
            await loadIntegrations();
            setShowModal(false);
            setEditingIntegration(null);
          }}
        />
      )}
    </div>
  );
}