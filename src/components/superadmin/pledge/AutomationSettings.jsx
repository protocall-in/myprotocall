import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Zap, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AutomationSettings({ enabled, onToggle }) {
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-white">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
              <Zap className={`w-5 h-5 ${enabled ? 'text-green-600' : 'text-gray-500'}`} />
            </div>
            <div>
              <CardTitle className="text-lg">Automated Execution Engine</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Automatically execute sessions when they reach end time
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge 
              variant={enabled ? "default" : "secondary"}
              className={enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}
            >
              {enabled ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Paused
                </>
              )}
            </Badge>
            <Switch
              checked={enabled}
              onCheckedChange={onToggle}
              className="data-[state=checked]:bg-green-600"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <RefreshCw className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Check Interval</p>
              <p className="text-xs text-blue-700 mt-1">Every 30 seconds</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
            <Zap className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-purple-900">Auto-Execute</p>
              <p className="text-xs text-purple-700 mt-1">Sessions past end time</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900">Status Updates</p>
              <p className="text-xs text-green-700 mt-1">Real-time notifications</p>
            </div>
          </div>
        </div>

        {enabled && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> Automated execution will process all pledges marked as "ready_for_execution" 
                when the session reaches its end time. Monitor the Executions tab for real-time updates.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}