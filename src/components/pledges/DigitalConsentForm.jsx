import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, FileSignature, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DigitalConsentForm({ isOpen, onClose, onSign, pledgeDetails }) {
  // ✅ FIX: Move ALL hooks BEFORE any conditional returns
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToRisks, setAgreedToRisks] = useState(false);
  const [agreedToExecution, setAgreedToExecution] = useState(false);
  const [signature, setSignature] = useState(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas) {
        setSignature(canvas.toDataURL());
      }
    }
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignature(null);
    }
  };

  const handleSubmitConsent = () => {
    if (!agreedToTerms || !agreedToRisks || !agreedToExecution) {
      toast.error('Please acknowledge all consent statements');
      return;
    }

    if (!signature) {
      toast.error('Please provide your digital signature');
      return;
    }

    const consentData = {
      timestamp: new Date().toISOString(),
      sessionId: pledgeDetails?.id,
      stockSymbol: pledgeDetails?.stock_symbol,
      pledgeAmount: (pledgeDetails?.qty || 0) * (pledgeDetails?.price || 0),
      agreedToTerms,
      agreedToRisks,
      agreedToExecution,
      signature,
      ipAddress: 'logged',
      userAgent: navigator.userAgent,
    };

    const consentHash = btoa(JSON.stringify(consentData));
    onSign(consentHash, consentData);
  };

  const canSubmit = agreedToTerms && agreedToRisks && agreedToExecution && signature;

  // ✅ FIX: Null check AFTER all hooks
  if (!pledgeDetails) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="w-6 h-6 text-blue-600" />
            Digital Consent & Authorization
          </DialogTitle>
          <DialogDescription>
            Legal consent required for pledge execution
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {/* Session Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <FileSignature className="w-5 h-5" />
                Pledge Session Details
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Stock:</span>
                  <span className="font-semibold ml-2">{pledgeDetails.stock_symbol}</span>
                </div>
                <div>
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-semibold ml-2">{pledgeDetails.qty} shares</span>
                </div>
                <div>
                  <span className="text-gray-600">Target Price:</span>
                  <span className="font-semibold ml-2">₹{pledgeDetails.price}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Value:</span>
                  <span className="font-semibold ml-2">₹{((pledgeDetails.qty || 0) * (pledgeDetails.price || 0)).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <Checkbox
                  checked={agreedToTerms}
                  onCheckedChange={setAgreedToTerms}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-2">Terms & Conditions</p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    I acknowledge that I have read, understood, and agree to be bound by the Platform Terms of Service, 
                    Pledge Execution Agreement, and all applicable policies. I understand that once submitted, 
                    this pledge is binding and subject to the session execution rules.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                <Checkbox
                  checked={agreedToRisks}
                  onCheckedChange={setAgreedToRisks}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-2 text-red-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    Risk Disclosure
                  </p>
                  <p className="text-xs text-red-800 leading-relaxed mb-2">
                    I understand and accept all market, execution, and financial risks associated with this pledge. 
                    I acknowledge that I may lose part or all of my invested capital and that past performance 
                    does not guarantee future results.
                  </p>
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-xs text-yellow-900 font-semibold mb-1">Recommended Trading Limits:</p>
                    <p className="text-xs text-yellow-800">
                      Based on risk assessment, recommended limits are ₹50,000 (Low Risk), ₹1,00,000 (Medium Risk), 
                      or ₹2,00,000 (High Risk) per session. These are advisory only.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <Checkbox
                  checked={agreedToExecution}
                  onCheckedChange={setAgreedToExecution}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-2 text-blue-900">Execution Authorization</p>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    I hereby authorize the platform to execute this pledge on my behalf through my linked 
                    demat account. I understand the execution will occur based on the session rules and that 
                    execution price may vary from my target price.
                  </p>
                </div>
              </div>
            </div>

            {/* Digital Signature */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-blue-600" />
                Digital Signature
              </h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white">
                <div className="bg-gray-50 rounded border border-gray-200 mb-3">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={150}
                    className="w-full cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">Sign above using your mouse or touchscreen</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearSignature}
                  >
                    Clear Signature
                  </Button>
                </div>
              </div>
              {signature && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  Signature captured successfully
                </div>
              )}
            </div>

            {/* Legal Notice */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-600 leading-relaxed">
                <strong>Legal Notice:</strong> This digital consent form constitutes a legally binding agreement. 
                By signing and submitting this form, you are creating an electronic record with legal validity 
                equivalent to a handwritten signature. Your consent data is encrypted, timestamped, and stored 
                securely for audit and compliance purposes. This transaction is logged and may be subject to 
                regulatory review. Date/Time: {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t flex-shrink-0 bg-white">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitConsent}
            disabled={!canSubmit}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Submit Consent & Proceed to Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}