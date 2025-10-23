import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download } from 'lucide-react';

const PledgeTradeDocumentModal = ({ isOpen, onClose, type, execution, sellExecution, session, pledge }) => {
  if (!execution || !pledge) return null;

  const isReceipt = type === 'receipt';
  const docTitle = isReceipt ? 'Convenience Fee Receipt' : 'Trade Execution Invoice';
  const docId = isReceipt ? pledge.convenience_fee_payment_id : execution.broker_order_id;

  const convenienceFee = pledge.convenience_fee_amount || 0;
  const buyValue = execution.executed_qty * execution.executed_price;
  const sellValue = sellExecution ? sellExecution.executed_qty * sellExecution.executed_price : 0;
  const isCompletedCycle = execution.side === 'buy' && sellExecution;
  const profit = isCompletedCycle ? sellValue - buyValue : 0;

  // Calculate platform commission ONLY on positive profit for completed buy/sell cycles
  const platformCommission = (isCompletedCycle && profit > 0 && session?.commission_rate_override)
    ? profit * (session.commission_rate_override / 100)
    : 0;

  const total = isReceipt ? convenienceFee : (isCompletedCycle ? sellValue : buyValue);
  const netAmount = isReceipt ? convenienceFee : isCompletedCycle ? sellValue - buyValue - platformCommission : buyValue;


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{docTitle}</DialogTitle>
          <DialogDescription>
            {isReceipt ? `Payment ID: ${docId || 'N/A'}` : `Order ID: ${docId || 'N/A'}`}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">Protocol Finance</h3>
              <p className="text-sm text-gray-500">Your Partner in Collective Trading</p>
            </div>
            <Badge variant={isReceipt ? "default" : "secondary"}>{isReceipt ? "PAID" : "EXECUTED"}</Badge>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-500">BILLED TO</p>
              <p className="font-medium">{pledge.user_name || 'Valued User'}</p>
              <p className="text-sm text-gray-600">{pledge.user_email || 'email not available'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-500">Date of Issue</p>
              <p className="font-medium">{new Date(isReceipt ? pledge.created_date : execution.created_date).toLocaleDateString()}</p>
            </div>
          </div>
          
          <div className="border rounded-lg">
            {isReceipt ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left font-semibold p-3">Description</th>
                    <th className="text-right font-semibold p-3">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3">Convenience Fee for {pledge.stock_symbol} Pledge</td>
                    <td className="text-right p-3">₹{convenienceFee.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left font-semibold p-3">Description</th>
                    <th className="text-right font-semibold p-3">Qty</th>
                    <th className="text-right font-semibold p-3">Unit Price</th>
                    <th className="text-right font-semibold p-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                    <tr className="text-green-700">
                      <td className="p-3">Buy Execution: {execution.stock_symbol}</td>
                      <td className="text-right p-3">{execution.executed_qty}</td>
                      <td className="text-right p-3">₹{execution.executed_price.toFixed(2)}</td>
                      <td className="text-right p-3">₹{buyValue.toFixed(2)}</td>
                    </tr>
                    {sellExecution && (
                      <tr className="border-t text-red-700">
                        <td className="p-3">Sell Execution: {sellExecution.stock_symbol}</td>
                        <td className="text-right p-3">{sellExecution.executed_qty}</td>
                        <td className="text-right p-3">₹{sellExecution.executed_price.toFixed(2)}</td>
                        <td className="text-right p-3">₹{sellValue.toFixed(2)}</td>
                      </tr>
                    )}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex justify-end">
            <div className="w-full md:w-1/2 space-y-2">
              {!isReceipt && isCompletedCycle && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Gross Sale</span>
                  <span className="font-medium">₹{sellValue.toFixed(2)}</span>
                </div>
              )}
              
              {!isReceipt && (
                 <div className="flex justify-between">
                    <span className="text-gray-600">Cost Basis (Buy)</span>
                    <span className="font-medium text-red-600">- ₹{buyValue.toFixed(2)}</span>
                  </div>
              )}

              {!isReceipt && isCompletedCycle && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Gross Profit</span>
                  <span className={`font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{profit.toFixed(2)}
                  </span>
                </div>
              )}
              
              {platformCommission > 0 && !isReceipt && (
                 <div className="flex justify-between">
                    <span className="text-gray-600">Platform Commission ({session.commission_rate_override}%)</span>
                    <span className="font-medium text-red-600">- ₹{platformCommission.toFixed(2)}</span>
                  </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>{isReceipt ? 'Total Paid' : isCompletedCycle ? 'Net Realized' : 'Invested Amount'}</span>
                <span>₹{isReceipt ? convenienceFee.toFixed(2) : netAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={() => window.print()}>
            <Download className="w-4 h-4 mr-2" />
            Print / Save PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PledgeTradeDocumentModal;