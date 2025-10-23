import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Shield, TrendingDown, DollarSign, FileText, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function RiskDisclosureModal({ isOpen, onClose, onAccept, sessionDetails }) {
  // ✅ FIX: Move useState BEFORE any conditional returns
  const [understood, setUnderstood] = useState(false);

  const handleAcknowledge = () => {
    if (!understood) {
      toast.error('Please confirm that you have read and understood the risks');
      return;
    }
    onAccept();
  };

  // ✅ FIX: Null check AFTER hooks
  if (!sessionDetails) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            Important Risk Disclosures
          </DialogTitle>
          <DialogDescription>
            Please read carefully before participating in pledge sessions
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[55vh] pr-4">
          <div className="space-y-6">
            {/* Market Risks */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                Market Risks
              </h3>
              <ul className="text-sm text-red-800 space-y-2 list-disc list-inside">
                <li>Stock prices are subject to market volatility and can fluctuate significantly</li>
                <li>Past performance does not guarantee future returns</li>
                <li>Market conditions can change rapidly, affecting execution prices</li>
                <li>External factors (economic, political, global events) may impact stock values</li>
              </ul>
            </div>

            {/* Execution Risks */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Execution Risks
              </h3>
              <ul className="text-sm text-orange-800 space-y-2 list-disc list-inside">
                <li>Pledges are executed based on session rules (immediate, session end, or manual)</li>
                <li>Execution price may differ from target price due to market conditions</li>
                <li>Partial executions may occur if full quantity is unavailable</li>
                <li>Network or technical issues may cause delays in execution</li>
                <li>Orders are subject to broker availability and market hours</li>
              </ul>
            </div>

            {/* Financial Risks */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Financial Risks & Recommended Limits
              </h3>
              <ul className="text-sm text-yellow-800 space-y-2 list-disc list-inside">
                <li>You may lose part or all of your invested capital</li>
                <li>Convenience fees are non-refundable once pledge is submitted</li>
                <li>Platform commissions apply on executed trades</li>
                <li>You are responsible for ensuring sufficient funds in your linked account</li>
              </ul>
              
              {/* Recommended Trading Limits */}
              <div className="mt-4 bg-white border border-yellow-300 rounded-lg p-3">
                <h4 className="font-semibold text-yellow-900 text-sm mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Recommended Trading Limits
                </h4>
                <p className="text-xs text-yellow-800 mb-2">
                  Based on risk assessment, we recommend the following per-session limits:
                </p>
                <div className="space-y-1 text-xs text-yellow-800">
                  <div className="flex justify-between items-center py-1 border-b border-yellow-200">
                    <span>Low Risk Profile (Score &lt; 50):</span>
                    <span className="font-semibold">₹50,000</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-yellow-200">
                    <span>Medium Risk Profile (Score 50-70):</span>
                    <span className="font-semibold">₹1,00,000</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>High Risk Profile (Score &gt; 70):</span>
                    <span className="font-semibold">₹2,00,000</span>
                  </div>
                </div>
                <p className="text-xs text-yellow-700 mt-2 italic">
                  * These are recommendations only. You may pledge higher amounts at your own discretion.
                </p>
              </div>
            </div>

            {/* Platform Disclaimers */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Platform Disclaimers
              </h3>
              <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
                <li>This platform facilitates trade execution but does not provide investment advice</li>
                <li>We are not responsible for market losses or execution failures beyond our control</li>
                <li>All investment decisions are your own responsibility</li>
                <li>Always conduct your own research before making investment decisions</li>
                <li>Consult a SEBI-registered advisor for personalized investment advice</li>
              </ul>
            </div>

            {/* SEBI Compliance */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                SEBI Compliance Notice
              </h3>
              <p className="text-sm text-green-800">
                This platform operates in compliance with SEBI regulations. All executions are subject to 
                SEBI guidelines, stock exchange rules, and applicable laws. By participating, you agree to 
                comply with all regulatory requirements and understand that violations may result in account suspension.
              </p>
            </div>
          </div>
        </ScrollArea>

        {/* Acknowledgment Checkbox */}
        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border-t">
          <Checkbox
            id="risk-understood"
            checked={understood}
            onCheckedChange={setUnderstood}
          />
          <Label htmlFor="risk-understood" className="text-sm font-medium cursor-pointer">
            I have read and understood all the risks mentioned above
          </Label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAcknowledge}
            disabled={!understood}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            I Acknowledge & Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}