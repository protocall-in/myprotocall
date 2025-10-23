import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Clock } from 'lucide-react';

export default function AlertsTable({ 
    alerts, 
    onViewDetails, 
    isLoading, 
    severityConfig, 
    statusConfig, 
    alertTypeLabels,
    emptyMessage = "No alerts found.",
    loadingMessage = "Loading alerts..."
}) {
    if (isLoading) {
        return <div className="text-center p-8">{loadingMessage}</div>;
    }

    if (!alerts || alerts.length === 0) {
        return <div className="text-center p-8 text-gray-500">{emptyMessage}</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                    <tr>
                        <th className="px-6 py-3">Alert Details</th>
                        <th className="px-6 py-3">Type &amp; Entity</th>
                        <th className="px-6 py-3">Severity</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Triggered</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {alerts.map(alert => {
                        const severityStyle = severityConfig[alert.severity] || {};
                        const StatusIcon = statusConfig[alert.status]?.icon || Clock;
                        
                        return (
                            <tr key={alert.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <div>
                                        <div className="font-semibold">{alert.title}</div>
                                        <div className="text-xs text-slate-500 mt-1">{alert.stock_symbol}</div>
                                        <div className="text-xs text-slate-600 mt-1 max-w-xs">
                                            {alert.message?.substring(0, 100)}...
                                        </div>
                                    </div>
                                </td>
                                
                                <td className="px-6 py-4">
                                    <Badge variant="outline" className="mr-2">
                                        {alert.entity_type}
                                    </Badge>
                                    <div className="text-xs text-slate-500 mt-1">
                                        {alertTypeLabels[alert.alert_type]}
                                    </div>
                                </td>
                                
                                <td className="px-6 py-4">
                                    <Badge className={severityStyle.color}>
                                        {severityStyle.icon} {alert.severity}
                                    </Badge>
                                </td>
                                
                                <td className="px-6 py-4">
                                    <Badge className={statusConfig[alert.status]?.color || 'bg-gray-100'}>
                                        <StatusIcon className="w-3 h-3 mr-1" />
                                        {alert.status}
                                    </Badge>
                                </td>
                                
                                <td className="px-6 py-4 text-slate-500">
                                    {new Date(alert.created_date).toLocaleDateString()}
                                    <div className="text-xs">
                                        {new Date(alert.created_date).toLocaleTimeString()}
                                    </div>
                                </td>
                                
                                <td className="px-6 py-4 text-right">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onViewDetails(alert)}
                                    >
                                        <Eye className="w-4 h-4 mr-1" />
                                        Review
                                    </Button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}