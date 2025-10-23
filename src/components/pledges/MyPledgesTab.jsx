import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  pending_payment: { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Paid', color: 'bg-blue-100 text-blue-800' },
  ready_for_execution: { label: 'Ready for Execution', color: 'bg-blue-100 text-blue-800' },
  executing: { label: 'Executing', color: 'bg-purple-100 text-purple-800 animate-pulse' },
  executed: { label: 'Executed', color: 'bg-green-100 text-green-800' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
};

export default function MyPledgesTab({ pledges, sessions }) {
  if (!pledges || pledges.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pledges Yet</h3>
          <p className="text-gray-600">You haven't made any pledges. Active sessions will appear in the "Active Sessions" tab.</p>
        </CardContent>
      </Card>
    );
  }

  const sessionsMap = new Map(sessions.map(s => [s.id, s]));

  return (
    <div className="space-y-4">
      {pledges.map(pledge => {
        const session = sessionsMap.get(pledge.session_id);
        const pledgeStatus = statusConfig[pledge.status] || { label: pledge.status, color: 'bg-gray-100' };

        return (
          <Card key={pledge.id} className="bg-white shadow-md border-0 rounded-xl">
            <CardHeader className="flex flex-row items-start justify-between pb-3">
              <div>
                <CardTitle className="text-xl font-bold">{pledge.stock_symbol}</CardTitle>
                <p className="text-sm text-gray-500">
                  {session ? `Session ends: ${new Date(session.session_end).toLocaleDateString()}` : 'Session details unavailable'}
                </p>
              </div>
              <Badge className={`${pledgeStatus.color} text-xs font-semibold px-3 py-1`}>{pledgeStatus.label}</Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 font-semibold">SIDE</p>
                  <p className={`font-bold text-lg ${pledge.side === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                    {pledge.side.toUpperCase()}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 font-semibold">QUANTITY</p>
                  <p className="font-bold text-lg">{pledge.qty}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 font-semibold">TARGET PRICE</p>
                  <p className="font-bold text-lg">₹{pledge.price_target.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 font-semibold">TOTAL VALUE</p>
                  <p className="font-bold text-lg">₹{(pledge.qty * pledge.price_target).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}