import React, { useState, useEffect } from 'react';
import { PlatformSetting, AdvisorRecommendation } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Sparkles, Target, RotateCcw, Save, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function TomorrowsPickOverride({ user }) {
  const [isOverrideActive, setIsOverrideActive] = useState(false);
  const [overrideData, setOverrideData] = useState({
    title: '',
    stock_symbol: '',
    reasoning: '',
    target_price: '',
    recommendation_type: 'buy',
    confidence: 'High'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadOverrideSettings();
  }, []);

  const loadOverrideSettings = async () => {
    try {
      const settings = await PlatformSetting.filter({
        setting_key: 'tomorrows_pick_override'
      });

      if (settings.length > 0) {
        const data = JSON.parse(settings[0].setting_value);
        setIsOverrideActive(data.active || false);
        if (data.active) {
          setOverrideData({
            title: data.title || '',
            stock_symbol: data.stock_symbol || '',
            reasoning: data.reasoning || '',
            target_price: data.target_price || '',
            recommendation_type: data.recommendation_type || 'buy',
            confidence: data.confidence || 'High'
          });
        }
      }
    } catch (error) {
      console.error("Error loading override settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (isOverrideActive && (!overrideData.stock_symbol || !overrideData.reasoning)) {
      toast.error("Stock symbol and reasoning are required for override.");
      return;
    }

    setIsSaving(true);
    try {
      const settingValue = {
        active: isOverrideActive,
        ...overrideData,
        updated_by: user.display_name,
        updated_at: new Date().toISOString()
      };

      // Check if setting exists
      const existingSettings = await PlatformSetting.filter({
        setting_key: 'tomorrows_pick_override'
      });

      if (existingSettings.length > 0) {
        await PlatformSetting.update(existingSettings[0].id, {
          setting_value: JSON.stringify(settingValue)
        });
      } else {
        await PlatformSetting.create({
          setting_key: 'tomorrows_pick_override',
          setting_value: JSON.stringify(settingValue),
          description: "Override setting for Tomorrow's Pick feature"
        });
      }

      toast.success(isOverrideActive ? 
        "Tomorrow's Pick override activated!" : 
        "Override disabled, auto-selection restored."
      );
    } catch (error) {
      console.error("Error saving override:", error);
      toast.error("Failed to save override settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToAuto = async () => {
    setIsOverrideActive(false);
    setOverrideData({
      title: '',
      stock_symbol: '',
      reasoning: '',
      target_price: '',
      recommendation_type: 'buy',
      confidence: 'High'
    });
    await handleSave();
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-orange-50">
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <Target className="w-5 h-5 text-amber-600" />
          Tomorrow's Pick Override
          {isOverrideActive && <Badge className="bg-purple-500 text-white">ACTIVE</Badge>}
        </CardTitle>
        <p className="text-sm text-slate-600">Manually control what appears as "Tomorrow's Pick" in chat sidebars</p>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-slate-900">Override Mode</h4>
            <p className="text-sm text-slate-600">Enable to manually select tomorrow's pick</p>
          </div>
          <Switch
            checked={isOverrideActive}
            onCheckedChange={setIsOverrideActive}
          />
        </div>

        {isOverrideActive && (
          <div className="space-y-4 p-4 bg-amber-50 rounded-lg border-2 border-amber-200">
            <div className="flex items-center gap-2 text-amber-700 mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold text-sm">Override Configuration</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Stock Symbol *
                </label>
                <Input
                  placeholder="e.g., RELIANCE"
                  value={overrideData.stock_symbol}
                  onChange={(e) => setOverrideData({...overrideData, stock_symbol: e.target.value.toUpperCase()})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Target Price
                </label>
                <Input
                  type="number"
                  placeholder="e.g., 2500"
                  value={overrideData.target_price}
                  onChange={(e) => setOverrideData({...overrideData, target_price: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Recommendation Type
                </label>
                <Select
                  value={overrideData.recommendation_type}
                  onValueChange={(value) => setOverrideData({...overrideData, recommendation_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                    <SelectItem value="hold">Hold</SelectItem>
                    <SelectItem value="watch">Watch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Confidence Level
                </label>
                <Select
                  value={overrideData.confidence}
                  onValueChange={(value) => setOverrideData({...overrideData, confidence: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High Confidence</SelectItem>
                    <SelectItem value="Medium">Medium Confidence</SelectItem>
                    <SelectItem value="Low">Low Confidence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Analysis & Reasoning *
              </label>
              <Textarea
                placeholder="Explain why this stock is tomorrow's pick..."
                value={overrideData.reasoning}
                onChange={(e) => setOverrideData({...overrideData, reasoning: e.target.value})}
                rows={4}
              />
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleResetToAuto}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Auto
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Override
              </>
            )}
          </Button>
        </div>

        {!isOverrideActive && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-700 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="font-semibold text-sm">Auto Mode Active</span>
            </div>
            <p className="text-xs text-blue-600">
              System automatically selects the most recommended stock by advisors or highest voted by community.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}