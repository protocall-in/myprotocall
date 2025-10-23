import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AlertSetting, NotificationSetting, Stock } from "@/api/entities";
import { 
  BellRing, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Crown, 
  Lock, 
  Mail, 
  Smartphone,
  Settings,
  Search,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AlertModal({ stock: initialStock, user, isPremium, open, onClose, onSave }) {
  const [stock, setStock] = useState(initialStock);
  const [settings, setSettings] = useState({
    price_change_percent: 5,
    profit_target_percent: 10,
    loss_limit_percent: 5,
    notify_on_consensus_change: false,
    notify_on_advisor_update: false,
    daily_portfolio_summary: false,
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    price_alert: { in_app: true, email: false, push: true },
    profit_alert: { in_app: true, email: true, push: true },
    loss_alert: { in_app: true, email: true, push: true },
    consensus_alert: { in_app: true, email: false, push: false },
    advisor_post: { in_app: true, email: false, push: false }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dbSettings, setDbSettings] = useState(null);

  // Stock search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchedStocks, setSearchedStocks] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const resetState = () => {
    setStock(initialStock);
    setSearchTerm("");
    setSearchedStocks([]);
    setSettings({
        price_change_percent: 5,
        profit_target_percent: 10,
        loss_limit_percent: 5,
        notify_on_consensus_change: false,
        notify_on_advisor_update: false,
        daily_portfolio_summary: false,
    });
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  useEffect(() => {
    setStock(initialStock);
  }, [initialStock]);

  useEffect(() => {
    if (!open || !user || !stock) {
      if (!stock) setIsLoading(false);
      return;
    }

    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const alertSettings = await AlertSetting.filter({ 
          user_id: user.id, 
          stock_symbol: stock.symbol 
        }, '', 1);
        
        if (alertSettings.length > 0) {
          setSettings(prev => ({ ...prev, ...alertSettings[0] }));
          setDbSettings(alertSettings[0]);
        } else {
          setSettings({
            price_change_percent: 5,
            profit_target_percent: 10,
            loss_limit_percent: 5,
            notify_on_consensus_change: false,
            notify_on_advisor_update: false,
            daily_portfolio_summary: false,
          });
          setDbSettings(null);
        }

        // It's better to load global notification settings elsewhere
        // But for now, we'll keep it here for simplicity
        const notifSettings = await NotificationSetting.filter({ user_id: user.id });
        const settingsMap = {};
        notifSettings.forEach(setting => {
          settingsMap[setting.category] = {
            in_app: setting.in_app_enabled,
            email: setting.email_enabled,
            push: setting.push_enabled
          };
        });
        setNotificationSettings(prev => {
          const newNotifSettings = { ...prev };
          for (const category in prev) {
            newNotifSettings[category] = { ...prev[category], ...(settingsMap[category] || {}) };
          }
          return newNotifSettings;
        });

      } catch (error) {
        console.error("Error loading settings:", error);
        toast.error("Failed to load alert settings.");
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [open, user, stock]);

  const handleSearch = async (term) => {
    if (term.length < 2) {
      setSearchedStocks([]);
      return;
    }
    setIsSearching(true);
    const results = await Stock.filter({ company_name: { contains: term.toLowerCase() } }, '', 5);
    setSearchedStocks(results);
    setIsSearching(false);
  };

  const handleSelectStock = (selected) => {
    setStock(selected);
    setSearchTerm("");
    setSearchedStocks([]);
  };

  const handleSaveWrapper = async () => {
    if (!stock) {
      toast.error("Please select a stock first.");
      return;
    }
    setIsSaving(true);
    try {
      const alertPayload = {
        ...settings,
        user_id: user.id,
        stock_symbol: stock.symbol
      };
      await onSave(alertPayload);
      handleClose();
    } catch (e) {
      toast.error("An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateNotificationSetting = (category, channel, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: value
      }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-blue-600" />
            {stock ? `Stock Alerts for ${stock.symbol}` : 'Create New Stock Alert'}
          </DialogTitle>
          <DialogDescription>
            {stock 
              ? `Set up personalized alerts for ${stock.company_name} to stay informed.`
              : `Search for a stock to begin setting up personalized alerts.`}
          </DialogDescription>
        </DialogHeader>

        {!stock ? (
          <div className="py-4 space-y-4">
            <Label htmlFor="stock-search">Search for a stock</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="stock-search"
                placeholder="e.g., Reliance, TCS..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="pl-10"
              />
              {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
            </div>
            {searchedStocks.length > 0 && (
              <div className="border rounded-md max-h-40 overflow-y-auto">
                {searchedStocks.map(s => (
                  <div key={s.id} onClick={() => handleSelectStock(s)} className="p-3 hover:bg-slate-50 cursor-pointer">
                    <p className="font-semibold">{s.symbol}</p>
                    <p className="text-sm text-slate-500">{s.company_name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <Tabs defaultValue="triggers" className="space-y-4 alert-modal-tabs">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="triggers">Alert Triggers</TabsTrigger>
                  <TabsTrigger value="channels">Channels</TabsTrigger>
                  <TabsTrigger value="premium">Premium</TabsTrigger>
                </TabsList>

                {/* All TabsContent remains the same */}
                <TabsContent value="triggers" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Price & Investment Alerts</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="price_change">Price Change (%)</Label>
                      <Input
                        id="price_change"
                        type="number"
                        value={settings.price_change_percent || ''}
                        onChange={(e) => updateSetting('price_change_percent', parseFloat(e.target.value))}
                        placeholder="5"
                        min="1"
                        max="50"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Alert when stock moves ±{settings.price_change_percent || 5}%
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="profit_target">Profit Target (%)</Label>
                      <Input
                        id="profit_target"
                        type="number"
                        value={settings.profit_target_percent || ''}
                        onChange={(e) => updateSetting('profit_target_percent', parseFloat(e.target.value))}
                        placeholder="10"
                        min="1"
                        max="100"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Alert when your investment gains +{settings.profit_target_percent || 10}%
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="loss_limit">Loss Limit (%)</Label>
                      <Input
                        id="loss_limit"
                        type="number"
                        value={settings.loss_limit_percent || ''}
                        onChange={(e) => updateSetting('loss_limit_percent', parseFloat(e.target.value))}
                        placeholder="5"
                        min="1"
                        max="50"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Alert when your investment drops -{settings.loss_limit_percent || 5}%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Community & Expert Alerts</h3>
                    
                    <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-amber-600" />
                        <div>
                          <p className="font-medium">Community Consensus Changes</p>
                          <p className="text-sm text-muted-foreground">
                            Alert when community sentiment shifts (Buy → Hold → Sell)
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.notify_on_consensus_change || false}
                        onCheckedChange={(checked) => updateSetting('notify_on_consensus_change', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium">SEBI Advisor Updates</p>
                          <p className="text-sm text-muted-foreground">
                            Alert when verified advisors post new recommendations
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.notify_on_advisor_update || false}
                        onCheckedChange={(checked) => updateSetting('notify_on_advisor_update', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Settings className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium">Daily Portfolio Summary</p>
                          <p className="text-sm text-muted-foreground">
                            Daily summary of all your stock positions
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.daily_portfolio_summary || false}
                        onCheckedChange={(checked) => updateSetting('daily_portfolio_summary', checked)}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="channels" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Notification Channels</h3>
                <p className="text-sm text-muted-foreground">
                  Choose how you want to receive different types of alerts.
                </p>

                <div className="space-y-4">
                  {[
                    { key: 'price_alert', label: 'Price Alerts', icon: TrendingUp, color: 'blue' },
                    { key: 'profit_alert', label: 'Profit Alerts', icon: TrendingUp, color: 'green' },
                    { key: 'loss_alert', label: 'Loss Alerts', icon: TrendingDown, color: 'red' },
                    { key: 'consensus_alert', label: 'Consensus Changes', icon: Users, color: 'amber' },
                    { key: 'advisor_post', label: 'Advisor Updates', icon: Crown, color: 'purple' }
                  ].map(({ key, label, icon: Icon, color }) => (
                    <div key={key} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <Icon className={`w-5 h-5 text-${color}-600`} />
                        <span className="font-medium">{label}</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BellRing className="w-4 h-4" />
                            <span className="text-sm">In-App</span>
                          </div>
                          <Switch
                            checked={notificationSettings[key]?.in_app || false}
                            onCheckedChange={(checked) => updateNotificationSetting(key, 'in_app', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span className="text-sm">Email</span>
                          </div>
                          <Switch
                            checked={notificationSettings[key]?.email || false}
                            onCheckedChange={(checked) => updateNotificationSetting(key, 'email', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4" />
                            <span className="text-sm">Push</span>
                          </div>
                          <Switch
                            checked={notificationSettings[key]?.push || false}
                            onCheckedChange={(checked) => updateNotificationSetting(key, 'push', checked)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="premium" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">Premium Alert Features</h3>
                </div>

                {isPremium ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                      <h4 className="font-semibold text-purple-800 mb-2">✅ Premium Features Active</h4>
                      <ul className="space-y-2 text-sm text-purple-700">
                        <li>• Combined community + advisor recommendations</li>
                        <li>• Advanced consensus tracking with confidence scores</li>
                        <li>• Priority alert delivery</li>
                        <li>• Custom alert templates</li>
                        <li>• Portfolio-wide daily summaries</li>
                      </ul>
                    </div>

                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800">
                        🎯 Your alerts will include premium insights from verified SEBI advisors 
                        and weighted community consensus data.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                      <div className="text-center space-y-3">
                        <Lock className="w-12 h-12 text-gray-400 mx-auto" />
                        <h4 className="font-semibold text-gray-700">Premium Alert Features</h4>
                        <p className="text-sm text-gray-600">
                          Unlock advanced alerts with advisor insights and community consensus
                        </p>
                        <ul className="text-xs text-gray-500 space-y-1">
                          <li>• Combined expert + community recommendations</li>
                          <li>• Advanced risk assessment alerts</li>
                          <li>• Priority notification delivery</li>
                          <li>• Custom alert templates</li>
                        </ul>
                      </div>
                    </div>

                    <Link to={createPageUrl("Subscription")}>
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600">
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade to Premium - ₹999/month
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </TabsContent>
              </Tabs>
            )}
          </>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveWrapper} 
            disabled={isSaving || isLoading || !stock}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            {isSaving ? <Loader2 className="animate-spin mr-2"/> : null}
            {isSaving ? 'Saving...' : 'Save Alert Settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}