import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileType,
  Calendar as CalendarIcon,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ExportManager({ 
  events, 
  attendees, 
  tickets, 
  commissionTracking,
  open, 
  onClose 
}) {
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportType, setExportType] = useState('events');
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [includeFields, setIncludeFields] = useState({
    basicInfo: true,
    attendees: true,
    financial: true,
    status: true,
    dates: true
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      let filteredData = [];
      
      // Filter by date range
      const filterByDate = (items, dateField) => {
        if (!dateFrom && !dateTo) return items;
        return items.filter(item => {
          const itemDate = new Date(item[dateField]);
          if (dateFrom && itemDate < dateFrom) return false;
          if (dateTo && itemDate > dateTo) return false;
          return true;
        });
      };

      switch (exportType) {
        case 'events':
          filteredData = filterByDate(events, 'event_date');
          break;
        case 'attendees':
          filteredData = filterByDate(attendees, 'created_date');
          break;
        case 'tickets':
          filteredData = filterByDate(tickets, 'purchased_date');
          break;
        case 'financial':
          filteredData = filterByDate(commissionTracking, 'created_date');
          break;
        default:
          filteredData = events;
      }

      if (filteredData.length === 0) {
        toast.error('No data to export for the selected criteria');
        setIsExporting(false);
        return;
      }

      switch (exportFormat) {
        case 'csv':
          exportToCSV(filteredData);
          break;
        case 'excel':
          exportToExcel(filteredData);
          break;
        case 'pdf':
          exportToPDF(filteredData);
          break;
        default:
          exportToCSV(filteredData);
      }

      toast.success(`Successfully exported ${filteredData.length} records as ${exportFormat.toUpperCase()}`);
      onClose();
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = (data) => {
    let csvContent = '';
    let headers = [];
    let rows = [];

    switch (exportType) {
      case 'events':
        headers = buildEventHeaders();
        rows = data.map(event => buildEventRow(event));
        break;
      case 'attendees':
        headers = ['Event Title', 'Attendee Name', 'Email', 'RSVP Status', 'Confirmed', 'Registration Date'];
        rows = data.map(attendee => [
          attendee.event_title || 'N/A',
          attendee.user_name || 'N/A',
          attendee.user_id || 'N/A',
          attendee.rsvp_status || 'N/A',
          attendee.confirmed ? 'Yes' : 'No',
          new Date(attendee.created_date).toLocaleDateString()
        ]);
        break;
      case 'tickets':
        headers = ['Event Title', 'User Name', 'Ticket Price', 'Payment Method', 'Status', 'Purchase Date'];
        rows = data.map(ticket => [
          ticket.event_title || 'N/A',
          ticket.user_name || 'N/A',
          `₹${ticket.ticket_price || 0}`,
          ticket.payment_method || 'N/A',
          ticket.status || 'N/A',
          new Date(ticket.purchased_date).toLocaleDateString()
        ]);
        break;
      case 'financial':
        headers = ['Event Title', 'Organizer', 'Gross Revenue', 'Commission Rate', 'Platform Commission', 'Organizer Payout', 'Status'];
        rows = data.map(comm => [
          comm.event_title || 'N/A',
          comm.organizer_name || 'N/A',
          `₹${comm.gross_revenue || 0}`,
          `${comm.platform_commission_rate || 0}%`,
          `₹${comm.platform_commission || 0}`,
          `₹${comm.organizer_payout || 0}`,
          comm.payout_status || 'N/A'
        ]);
        break;
    }

    csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    downloadFile(csvContent, `${exportType}_export_${Date.now()}.csv`, 'text/csv');
  };

  const buildEventHeaders = () => {
    const headers = [];
    if (includeFields.basicInfo) {
      headers.push('Title', 'Description', 'Location', 'Organizer');
    }
    if (includeFields.dates) {
      headers.push('Event Date', 'Created Date');
    }
    if (includeFields.status) {
      headers.push('Status', 'Is Premium', 'Is Featured');
    }
    if (includeFields.attendees) {
      headers.push('Capacity', 'Total Attendees', 'Confirmed Attendees');
    }
    if (includeFields.financial) {
      headers.push('Ticket Price', 'Total Revenue');
    }
    return headers;
  };

  const buildEventRow = (event) => {
    const row = [];
    if (includeFields.basicInfo) {
      row.push(
        event.title || 'N/A',
        event.description || 'N/A',
        event.location || 'N/A',
        event.organizer_name || 'N/A'
      );
    }
    if (includeFields.dates) {
      row.push(
        new Date(event.event_date).toLocaleDateString(),
        new Date(event.created_date).toLocaleDateString()
      );
    }
    if (includeFields.status) {
      row.push(
        event.status || 'N/A',
        event.is_premium ? 'Yes' : 'No',
        event.is_featured ? 'Yes' : 'No'
      );
    }
    if (includeFields.attendees) {
      const eventAttendees = attendees.filter(a => a.event_id === event.id);
      const confirmedCount = eventAttendees.filter(a => a.confirmed).length;
      row.push(
        event.capacity || 'Unlimited',
        eventAttendees.length,
        confirmedCount
      );
    }
    if (includeFields.financial) {
      const eventCommission = commissionTracking.find(c => c.event_id === event.id);
      row.push(
        event.ticket_price ? `₹${event.ticket_price}` : 'Free',
        eventCommission ? `₹${eventCommission.gross_revenue}` : '₹0'
      );
    }
    return row;
  };

  const exportToExcel = (data) => {
    // For Excel, we'll use CSV format with .xlsx extension
    // In a real implementation, you'd use a library like xlsx or exceljs
    let csvContent = '';
    let headers = [];
    let rows = [];

    switch (exportType) {
      case 'events':
        headers = buildEventHeaders();
        rows = data.map(event => buildEventRow(event));
        break;
      case 'attendees':
        headers = ['Event', 'Name', 'Email', 'RSVP', 'Confirmed', 'Date'];
        rows = data.map(a => [
          a.event_title || 'N/A',
          a.user_name || 'N/A',
          a.user_id || 'N/A',
          a.rsvp_status,
          a.confirmed ? 'Yes' : 'No',
          new Date(a.created_date).toLocaleDateString()
        ]);
        break;
      case 'tickets':
        headers = ['Event', 'User', 'Price', 'Method', 'Status', 'Date'];
        rows = data.map(t => [
          t.event_title || 'N/A',
          t.user_name || 'N/A',
          t.ticket_price || 0,
          t.payment_method || 'N/A',
          t.status,
          new Date(t.purchased_date).toLocaleDateString()
        ]);
        break;
      case 'financial':
        headers = ['Event', 'Organizer', 'Revenue', 'Commission', 'Platform Fee', 'Payout', 'Status'];
        rows = data.map(c => [
          c.event_title || 'N/A',
          c.organizer_name || 'N/A',
          c.gross_revenue || 0,
          `${c.platform_commission_rate}%`,
          c.platform_commission || 0,
          c.organizer_payout || 0,
          c.payout_status
        ]);
        break;
    }

    csvContent = [
      headers.join('\t'),
      ...rows.map(row => row.join('\t'))
    ].join('\n');

    downloadFile(csvContent, `${exportType}_export_${Date.now()}.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = (data) => {
    // Generate HTML content for PDF
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${exportType.charAt(0).toUpperCase() + exportType.slice(1)} Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
          .meta { color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #2563eb; color: white; padding: 12px; text-align: left; font-weight: 600; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background: #f9fafb; }
          tr:hover { background: #f3f4f6; }
          .footer { margin-top: 30px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>${exportType.charAt(0).toUpperCase() + exportType.slice(1)} Report</h1>
        <div class="meta">
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Total Records:</strong> ${data.length}</p>
          ${dateFrom ? `<p><strong>From:</strong> ${dateFrom.toLocaleDateString()}</p>` : ''}
          ${dateTo ? `<p><strong>To:</strong> ${dateTo.toLocaleDateString()}</p>` : ''}
        </div>
        <table>
    `;

    switch (exportType) {
      case 'events':
        htmlContent += '<thead><tr>';
        const eventHeaders = buildEventHeaders();
        eventHeaders.forEach(header => {
          htmlContent += `<th>${header}</th>`;
        });
        htmlContent += '</tr></thead><tbody>';
        
        data.forEach(event => {
          const row = buildEventRow(event);
          htmlContent += '<tr>';
          row.forEach(cell => {
            htmlContent += `<td>${cell}</td>`;
          });
          htmlContent += '</tr>';
        });
        break;

      case 'attendees':
        htmlContent += `
          <thead>
            <tr>
              <th>Event</th>
              <th>Attendee Name</th>
              <th>RSVP Status</th>
              <th>Confirmed</th>
              <th>Registration Date</th>
            </tr>
          </thead>
          <tbody>
        `;
        data.forEach(attendee => {
          htmlContent += `
            <tr>
              <td>${attendee.event_title || 'N/A'}</td>
              <td>${attendee.user_name || 'N/A'}</td>
              <td><span style="text-transform: uppercase;">${attendee.rsvp_status}</span></td>
              <td>${attendee.confirmed ? '✓ Yes' : '✗ No'}</td>
              <td>${new Date(attendee.created_date).toLocaleDateString()}</td>
            </tr>
          `;
        });
        break;

      case 'tickets':
        htmlContent += `
          <thead>
            <tr>
              <th>Event</th>
              <th>User</th>
              <th>Ticket Price</th>
              <th>Payment Method</th>
              <th>Status</th>
              <th>Purchase Date</th>
            </tr>
          </thead>
          <tbody>
        `;
        data.forEach(ticket => {
          htmlContent += `
            <tr>
              <td>${ticket.event_title || 'N/A'}</td>
              <td>${ticket.user_name || 'N/A'}</td>
              <td>₹${ticket.ticket_price || 0}</td>
              <td>${ticket.payment_method || 'N/A'}</td>
              <td>${ticket.status}</td>
              <td>${new Date(ticket.purchased_date).toLocaleDateString()}</td>
            </tr>
          `;
        });
        break;

      case 'financial':
        htmlContent += `
          <thead>
            <tr>
              <th>Event</th>
              <th>Organizer</th>
              <th>Gross Revenue</th>
              <th>Commission Rate</th>
              <th>Platform Fee</th>
              <th>Organizer Payout</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
        `;
        data.forEach(comm => {
          htmlContent += `
            <tr>
              <td>${comm.event_title || 'N/A'}</td>
              <td>${comm.organizer_name || 'N/A'}</td>
              <td style="font-weight: 600;">₹${comm.gross_revenue || 0}</td>
              <td>${comm.platform_commission_rate || 0}%</td>
              <td>₹${comm.platform_commission || 0}</td>
              <td style="color: #059669; font-weight: 600;">₹${comm.organizer_payout || 0}</td>
              <td>${comm.payout_status}</td>
            </tr>
          `;
        });
        break;
    }

    htmlContent += `
          </tbody>
        </table>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Events Management System - Confidential Report</p>
        </div>
      </body>
      </html>
    `;

    downloadFile(htmlContent, `${exportType}_report_${Date.now()}.html`, 'text/html');
    toast.info('PDF preview opened in new tab. Use browser print to save as PDF.');
    
    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Download className="w-6 h-6 text-blue-600" />
            Export Data
          </DialogTitle>
          <DialogDescription>
            Export your events data in various formats with custom filters
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Export Format Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Export Format</Label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={exportFormat === 'csv' ? 'default' : 'outline'}
                onClick={() => setExportFormat('csv')}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <FileSpreadsheet className="w-6 h-6" />
                <span className="text-xs">CSV</span>
              </Button>
              <Button
                variant={exportFormat === 'excel' ? 'default' : 'outline'}
                onClick={() => setExportFormat('excel')}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <FileType className="w-6 h-6" />
                <span className="text-xs">Excel</span>
              </Button>
              <Button
                variant={exportFormat === 'pdf' ? 'default' : 'outline'}
                onClick={() => setExportFormat('pdf')}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <FileText className="w-6 h-6" />
                <span className="text-xs">PDF</span>
              </Button>
            </div>
          </div>

          {/* Data Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="exportType" className="text-sm font-semibold">Data Type</Label>
            <Select value={exportType} onValueChange={setExportType}>
              <SelectTrigger id="exportType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="events">
                  Events List ({events.length} records)
                </SelectItem>
                <SelectItem value="attendees">
                  Attendees List ({attendees.length} records)
                </SelectItem>
                <SelectItem value="tickets">
                  Tickets List ({tickets.length} records)
                </SelectItem>
                <SelectItem value="financial">
                  Financial Reports ({commissionTracking.length} records)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Date Range (Optional)</Label>
            <div className="flex gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {dateFrom ? format(dateFrom, 'PPP') : 'From Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {dateTo ? format(dateTo, 'PPP') : 'To Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                  />
                </PopoverContent>
              </Popover>
            </div>
            {(dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDateFrom(null);
                  setDateTo(null);
                }}
                className="text-xs"
              >
                Clear dates
              </Button>
            )}
          </div>

          {/* Field Selection (Only for Events Export) */}
          {exportType === 'events' && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Include Fields</Label>
              <div className="space-y-2 bg-slate-50 p-4 rounded-lg">
                {Object.entries({
                  basicInfo: 'Basic Information',
                  dates: 'Dates',
                  status: 'Status & Flags',
                  attendees: 'Attendee Counts',
                  financial: 'Financial Data'
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={includeFields[key]}
                      onCheckedChange={(checked) =>
                        setIncludeFields(prev => ({ ...prev, [key]: checked }))
                      }
                    />
                    <label
                      htmlFor={key}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Export Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900 mb-1">Export Summary</p>
                <ul className="text-blue-700 space-y-1">
                  <li>• Format: <span className="font-medium">{exportFormat.toUpperCase()}</span></li>
                  <li>• Data Type: <span className="font-medium">{exportType}</span></li>
                  <li>• Date Range: <span className="font-medium">
                    {dateFrom && dateTo
                      ? `${format(dateFrom, 'MMM d, yyyy')} - ${format(dateTo, 'MMM d, yyyy')}`
                      : 'All Time'
                    }
                  </span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}