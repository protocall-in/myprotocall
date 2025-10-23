import React, { useState, useEffect } from 'react';
import { Pledge } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PledgeExecutionHistory() {
  const [executedPledges, setExecutedPledges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadExecutedPledges();
  }, []);

  const loadExecutedPledges = async () => {
    try {
      const pledges = await Pledge.filter({
        status: 'executed'
      }, '-sell_executed_at', 50);

      setExecutedPledges(pledges);
    } catch (error) {
      console.error('Error loading executed pledges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Execution History
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {executedPledges.map(pledge => {
            const buyPrice = pledge.price_target || 0;
            const sellPrice = pledge.sell_price || 0;
            const qty = pledge.qty || 0;
            const profit = (sellPrice - buyPrice) * qty;
            const profitPercent = ((sellPrice - buyPrice) / buyPrice) * 100;

            return (
              <div key={pledge.id} className="p-4 rounded-lg border bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-lg">{pledge.stock_symbol}</h4>
                    <p className="text-sm text-gray-600">User ID: {pledge.user_id}</p>
                    {pledge.sell_executed_at && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(pledge.sell_executed_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profit >= 0 ? '+' : ''}₹{profit.toFixed(2)}
                    </p>
                    <p className={`text-sm ${profitPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Buy Price</p>
                    <p className="font-semibold">₹{buyPrice}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Sell Price</p>
                    <p className="font-semibold">₹{sellPrice}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Quantity</p>
                    <p className="font-semibold">{qty}</p>
                  </div>
                </div>

                {pledge.admin_notes && (
                  <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
                    <strong>Admin Notes:</strong> {pledge.admin_notes}
                  </div>
                )}
              </div>
            );
          })}

          {executedPledges.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No executed pledges yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}