
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Search, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns'; // This import is still needed if using format elsewhere or if it was intended to remain for `toLocaleString` equivalent flexibility. However, outline explicitly changes to `toLocaleString()`.

export default function AuditLog({ logs }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch = 
          log.admin_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesActionFilter = actionFilter === 'all' || log.action === actionFilter;

        return matchesSearch && matchesActionFilter;
      })
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [logs, searchTerm, actionFilter]);

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE_EXPENSE':
        return 'bg-green-100 text-green-800';
      case 'UPDATE_EXPENSE':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELETE_EXPENSE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl bg-gradient-to-r from-red-700 to-red-600 bg-clip-text text-transparent">
                Financial Audit Log
              </CardTitle>
              <p className="text-sm text-slate-600 font-normal mt-0.5">
                Complete audit trail of all financial operations
              </p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-0">
            Super Admin Only
          </Badge>
        </div>
        
        <div className="flex items-center gap-4 mt-6 pt-4 border-t">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search audit logs by admin, action, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-slate-200 focus:border-red-400 focus:ring-red-400"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[180px] border-slate-200 focus:border-red-400 focus:ring-red-400">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="CREATE_EXPENSE">Create Expense</SelectItem>
              <SelectItem value="UPDATE_EXPENSE">Update Expense</SelectItem>
              <SelectItem value="DELETE_EXPENSE">Delete Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gradient-to-r from-slate-50 to-slate-100">
                <th className="p-4 text-left font-semibold text-slate-700">Timestamp</th>
                <th className="p-4 text-left font-semibold text-slate-700">Admin</th>
                <th className="p-4 text-left font-semibold text-slate-700">Action</th>
                <th className="p-4 text-left font-semibold text-slate-700">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length > 0 ? filteredLogs.map(log => (
                <tr key={log.id} className="border-b transition-colors hover:bg-gradient-to-r hover:from-slate-50 hover:to-transparent">
                  <td className="p-4 text-slate-600 font-mono text-xs">
                    {new Date(log.created_date).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-900">{log.admin_name}</div>
                    <div className="text-xs text-slate-500">{log.admin_id}</div>
                  </td>
                  <td className="p-4">
                    <Badge className={`${getActionColor(log.action)} border-0`}>
                      {log.action.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="p-4 text-slate-700 max-w-md truncate">
                    {log.details}
                  </td>
                </tr>
              )) : null}
            </tbody>
          </table>
        </div>
        
        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <ShieldCheck className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900">No audit logs found</h3>
            <p className="mt-1 text-sm text-slate-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
