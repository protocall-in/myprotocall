import React, { useState, useEffect, useCallback } from 'react';
import { AuditLog, User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const auditLogs = await AuditLog.list('-created_date');
      setLogs(auditLogs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast.error('Failed to load audit logs.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const exportToCSV = () => {
    if (logs.length === 0) {
      toast.info("No logs to export.");
      return;
    }
    const headers = ["Timestamp", "Admin Name", "Action", "Details"];
    const rows = logs.map(log => [
      new Date(log.created_date).toLocaleString(),
      log.admin_name,
      log.action,
      log.details.replace(/"/g, '""') // Escape double quotes
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => `"${e.join('","')}"`).join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "audit_log.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Audit log exported successfully.");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Audit & Logs</CardTitle>
        <Button variant="outline" size="sm" onClick={exportToCSV}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading logs...</div>
        ) : (
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0">
                <tr>
                  <th scope="col" className="px-6 py-3">Timestamp</th>
                  <th scope="col" className="px-6 py-3">Admin</th>
                  <th scope="col" className="px-6 py-3">Action</th>
                  <th scope="col" className="px-6 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {logs.map(log => (
                  <tr key={log.id} className="border-b hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                      {new Date(log.created_date).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-medium">{log.admin_name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && <div className="text-center py-8">No audit logs found.</div>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}