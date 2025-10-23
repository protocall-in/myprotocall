
import React, { useState, useEffect } from 'react';
import { PlatformSetting } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Save,
  Key,
  Shield,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

export default function ManagePaymentGateway() {
  const [settings, setSettings] = useState({
    // Default Gateway
    payment_gateway_default: 'razorpay',
    
    // Razorpay Settings
    razorpay_enabled: 'true',
    razorpay_key_id: '',
    razorpay_key_secret: '',
    razorpay_webhook_secret: '',
    
    // Stripe Settings
    stripe_enabled: 'false',
    stripe_publishable_key: '',
    stripe_secret_key: '',
    stripe_webhook_secret: '',

    // Refund Settings
    refund_processing_days: '7',
    auto_refund_on_cancellation: 'false',
    refund_policy_text: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState({
    razorpay_key_secret: false,
    razorpay_webhook_secret: false,
    stripe_secret_key: false,
    stripe_webhook_secret: false
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const fetchedSettings = await PlatformSetting.list();
      const settingsMap = fetchedSettings.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {});

      setSettings(prev => ({ ...prev, ...settingsMap }));
    } catch (error) {
      console.error('Error loading payment settings:', error);
      toast.error('Failed to load payment settings');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save each setting
      const settingsToSave = Object.entries(settings);
      
      for (const [key, value] of settingsToSave) {
        const existing = await PlatformSetting.filter({ setting_key: key });
        
        if (existing.length > 0) {
          await PlatformSetting.update(existing[0].id, {
            setting_value: value,
            description: getSettingDescription(key)
          });
        } else {
          await PlatformSetting.create({
            setting_key: key,
            setting_value: value,
            description: getSettingDescription(key)
          });
        }
      }

      toast.success('Payment gateway settings saved successfully!');
      
      // Reload to verify
      await loadSettings();
    } catch (error) {
      console.error('Error saving payment settings:', error);
      toast.error('Failed to save payment settings');
    } finally {
      setIsSaving(false);
    }
  };

  const getSettingDescription = (key) => {
    const descriptions = {
      payment_gateway_default: 'Default payment gateway for new payments',
      razorpay_enabled: 'Enable Razorpay payment gateway',
      razorpay_key_id: 'Razorpay Key ID (starts with rzp_test_ or rzp_live_)',
      razorpay_key_secret: 'Razorpay Key Secret',
      razorpay_webhook_secret: 'Razorpay Webhook Secret for verifying webhooks',
      stripe_enabled: 'Enable Stripe payment gateway',
      stripe_publishable_key: 'Stripe Publishable Key (starts with pk_test_ or pk_live_)',
      stripe_secret_key: 'Stripe Secret Key (starts with sk_test_ or sk_live_)',
      stripe_webhook_secret: 'Stripe Webhook Secret for verifying webhooks',
      refund_processing_days: 'Number of business days for refund processing',
      auto_refund_on_cancellation: 'Automatically process refunds when events are cancelled',
      refund_policy_text: 'Custom text for your refund policy displayed to users',
    };
    return descriptions[key] || '';
  };

  const testConnection = async (gateway) => {
    try {
      if (gateway === 'razorpay') {
        if (!settings.razorpay_key_id) {
          toast.error('Please enter Razorpay Key ID first');
          return;
        }
        
        // Check if it's test or live key
        const isTestKey = settings.razorpay_key_id.startsWith('rzp_test_');
        const isLiveKey = settings.razorpay_key_id.startsWith('rzp_live_');
        
        if (!isTestKey && !isLiveKey) {
          toast.error('Invalid Razorpay Key ID format');
          return;
        }
        
        toast.success(
          `Razorpay ${isTestKey ? 'Test' : 'Live'} Mode Detected!\n` +
          `Key format is valid. In production, this would verify the connection with Razorpay API.`,
          { duration: 4000 }
        );
      } else if (gateway === 'stripe') {
        if (!settings.stripe_publishable_key) {
          toast.error('Please enter Stripe Publishable Key first');
          return;
        }
        
        const isTestKey = settings.stripe_publishable_key.startsWith('pk_test_');
        const isLiveKey = settings.stripe_publishable_key.startsWith('pk_live_');
        
        if (!isTestKey && !isLiveKey) {
          toast.error('Invalid Stripe Publishable Key format');
          return;
        }
        
        toast.success(
          `Stripe ${isTestKey ? 'Test' : 'Live'} Mode Detected!\n` +
          `Key format is valid. In production, this would verify the connection with Stripe API.`,
          { duration: 4000 }
        );
      }
    } catch (error) {
      toast.error('Connection test failed');
    }
  };

  const toggleSecretVisibility = (key) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Payment Gateway Settings</h2>
          <p className="text-slate-600 mt-1">
            Configure Razorpay and Stripe API credentials for payment processing
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
          {isSaving ? 'Saving...' : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      {/* Test Mode Warning */}
      {(settings.razorpay_key_id.includes('test') || settings.razorpay_key_id.includes('demo') ||
        settings.stripe_publishable_key.includes('test')) && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Test Mode Active:</strong> You're using test/demo API keys. Payments will be simulated.
            Replace with live keys to process real payments.
          </AlertDescription>
        </Alert>
      )}

      {/* Default Gateway Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Default Payment Gateway
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              variant={settings.payment_gateway_default === 'razorpay' ? 'default' : 'outline'}
              onClick={() => setSettings({ ...settings, payment_gateway_default: 'razorpay' })}
              className="flex-1"
            >
              💳 Razorpay (Recommended for India)
            </Button>
            <Button
              variant={settings.payment_gateway_default === 'stripe' ? 'default' : 'outline'}
              onClick={() => setSettings({ ...settings, payment_gateway_default: 'stripe' })}
              className="flex-1"
            >
              💵 Stripe (International)
            </Button>
          </div>
          <p className="text-sm text-slate-500 mt-3">
            This gateway will be used by default for all payments. Users can still choose at checkout if both are enabled.
          </p>
        </CardContent>
      </Card>

      {/* Gateway Configuration Tabs */}
      <Tabs defaultValue="razorpay" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="razorpay">
            💳 Razorpay Configuration
          </TabsTrigger>
          <TabsTrigger value="stripe">
            💵 Stripe Configuration
          </TabsTrigger>
        </TabsList>

        {/* Razorpay Tab */}
        <TabsContent value="razorpay" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Razorpay Settings</CardTitle>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.razorpay_enabled === 'true'}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, razorpay_enabled: checked ? 'true' : 'false' })
                    }
                  />
                  <Label>Enabled</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Get your Razorpay API keys:</strong>
                  <br />
                  1. Sign up at <a href="https://razorpay.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">razorpay.com</a>
                  <br />
                  2. Go to Settings → API Keys
                  <br />
                  3. Generate API keys (test keys for testing, live keys for production)
                  <br />
                  4. Copy and paste them below
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="razorpay_key_id">Razorpay Key ID *</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="razorpay_key_id"
                      value={settings.razorpay_key_id}
                      onChange={(e) => setSettings({ ...settings, razorpay_key_id: e.target.value })}
                      placeholder="rzp_test_xxxxxxxxxxxxx or rzp_live_xxxxxxxxxxxxx"
                      className="font-mono text-sm"
                    />
                  </div>
                  {settings.razorpay_key_id && (
                    <Badge className="mt-2" variant={settings.razorpay_key_id.startsWith('rzp_test_') ? 'warning' : 'success'}>
                      {settings.razorpay_key_id.startsWith('rzp_test_') ? '⚠️ Test Mode' : '✅ Live Mode'}
                    </Badge>
                  )}
                </div>

                <div>
                  <Label htmlFor="razorpay_key_secret">Razorpay Key Secret *</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="razorpay_key_secret"
                      type={showSecrets.razorpay_key_secret ? 'text' : 'password'}
                      value={settings.razorpay_key_secret}
                      onChange={(e) => setSettings({ ...settings, razorpay_key_secret: e.target.value })}
                      placeholder="Enter your Razorpay Key Secret"
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleSecretVisibility('razorpay_key_secret')}
                    >
                      {showSecrets.razorpay_key_secret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="razorpay_webhook_secret">Webhook Secret (Optional)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="razorpay_webhook_secret"
                      type={showSecrets.razorpay_webhook_secret ? 'text' : 'password'}
                      value={settings.razorpay_webhook_secret}
                      onChange={(e) => setSettings({ ...settings, razorpay_webhook_secret: e.target.value })}
                      placeholder="For webhook verification"
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleSecretVisibility('razorpay_webhook_secret')}
                    >
                      {showSecrets.razorpay_webhook_secret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Used to verify webhook signatures from Razorpay
                  </p>
                </div>

                <Button onClick={() => testConnection('razorpay')} variant="outline">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Test Razorpay Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stripe Tab */}
        <TabsContent value="stripe" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Stripe Settings</CardTitle>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.stripe_enabled === 'true'}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, stripe_enabled: checked ? 'true' : 'false' })
                    }
                  />
                  <Label>Enabled</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Get your Stripe API keys:</strong>
                  <br />
                  1. Sign up at <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">stripe.com</a>
                  <br />
                  2. Go to Developers → API keys
                  <br />
                  3. Copy your Publishable key and Secret key
                  <br />
                  4. Use test keys for testing, live keys for production
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="stripe_publishable_key">Stripe Publishable Key *</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="stripe_publishable_key"
                      value={settings.stripe_publishable_key}
                      onChange={(e) => setSettings({ ...settings, stripe_publishable_key: e.target.value })}
                      placeholder="pk_test_xxxxxxxxxxxxx or pk_live_xxxxxxxxxxxxx"
                      className="font-mono text-sm"
                    />
                  </div>
                  {settings.stripe_publishable_key && (
                    <Badge className="mt-2" variant={settings.stripe_publishable_key.startsWith('pk_test_') ? 'warning' : 'success'}>
                      {settings.stripe_publishable_key.startsWith('pk_test_') ? '⚠️ Test Mode' : '✅ Live Mode'}
                    </Badge>
                  )}
                </div>

                <div>
                  <Label htmlFor="stripe_secret_key">Stripe Secret Key *</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="stripe_secret_key"
                      type={showSecrets.stripe_secret_key ? 'text' : 'password'}
                      value={settings.stripe_secret_key}
                      onChange={(e) => setSettings({ ...settings, stripe_secret_key: e.target.value })}
                      placeholder="sk_test_xxxxxxxxxxxxx or sk_live_xxxxxxxxxxxxx"
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleSecretVisibility('stripe_secret_key')}
                    >
                      {showSecrets.stripe_secret_key ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="stripe_webhook_secret">Webhook Signing Secret (Optional)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="stripe_webhook_secret"
                      type={showSecrets.stripe_webhook_secret ? 'text' : 'password'}
                      value={settings.stripe_webhook_secret}
                      onChange={(e) => setSettings({ ...settings, stripe_webhook_secret: e.target.value })}
                      placeholder="whsec_xxxxxxxxxxxxx"
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleSecretVisibility('stripe_webhook_secret')}
                    >
                      {showSecrets.stripe_webhook_secret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Used to verify webhook events from Stripe
                  </p>
                </div>

                <Button onClick={() => testConnection('stripe')} variant="outline">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Test Stripe Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Refund Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Refund Policy Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="refund_processing_days">Refund Processing Time (Days)</Label>
            <Input
              id="refund_processing_days"
              type="number"
              value={settings.refund_processing_days || '7'}
              onChange={(e) => handleSettingChange('refund_processing_days', e.target.value)}
              placeholder="e.g., 7"
            />
            <p className="text-sm text-slate-500 mt-1">
              Number of business days for refund processing
            </p>
          </div>

          <div>
            <Label htmlFor="auto_refund_on_cancellation">Auto-Refund on Event Cancellation</Label>
            <select
              id="auto_refund_on_cancellation"
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              value={settings.auto_refund_on_cancellation || 'false'}
              onChange={(e) => handleSettingChange('auto_refund_on_cancellation', e.target.value)}
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled (Manual Approval Required)</option>
            </select>
            <p className="text-sm text-slate-500 mt-1">
              Automatically process refunds when events are cancelled
            </p>
          </div>

          <div>
            <Label htmlFor="refund_policy_text">Refund Policy Text</Label>
            <textarea
              id="refund_policy_text"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 h-24"
              value={settings.refund_policy_text || ''}
              onChange={(e) => handleSettingChange('refund_policy_text', e.target.value)}
              placeholder="Enter your refund policy..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-purple-600" />
            Quick Setup Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>For Testing (Demo Mode):</strong>
              <br />
              • Use test API keys (starting with rzp_test_ or pk_test_)
              <br />
              • Payments will be simulated - no real money charged
              <br />
              • Perfect for development and testing
              <br />
              <br />
              <strong>For Production (Live Payments):</strong>
              <br />
              • Replace with live API keys (starting with rzp_live_ or pk_live_)
              <br />
              • Complete KYC verification with the payment gateway
              <br />
              • Real money will be processed
              <br />
              • Ensure PCI compliance
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Razorpay Benefits</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ Best for Indian customers</li>
                  <li>✓ UPI, Cards, Net Banking, Wallets</li>
                  <li>✓ Lower transaction fees (~2%)</li>
                  <li>✓ Fast INR settlements</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-purple-900 mb-2">Stripe Benefits</h4>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>✓ Best for international customers</li>
                  <li>✓ 135+ currencies supported</li>
                  <li>✓ Apple Pay, Google Pay</li>
                  <li>✓ Strong fraud protection</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
