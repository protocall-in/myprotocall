import React, { useEffect, useState } from 'react';
import { CampaignBilling, AdCampaign, Vendor } from '@/api/entities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { format } from 'date-fns';

export default function InvoicePage() {
  const location = useLocation();
  const [billingRecord, setBillingRecord] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadInvoiceData = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const billingId = params.get('billing_id');
        
        if (!billingId) {
          console.error('No billing ID provided');
          return;
        }

        // Load billing record
        const billing = await CampaignBilling.list();
        const foundBilling = billing.find(b => b.id === billingId);
        
        if (!foundBilling) {
          console.error('Billing record not found');
          return;
        }

        setBillingRecord(foundBilling);

        // Load campaign
        const campaignData = await AdCampaign.list();
        const foundCampaign = campaignData.find(c => c.id === foundBilling.campaign_id);
        setCampaign(foundCampaign);

        // Load vendor
        const vendorData = await Vendor.list();
        const foundVendor = vendorData.find(v => v.id === foundBilling.vendor_id);
        setVendor(foundVendor);

      } catch (error) {
        console.error('Error loading invoice data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoiceData();
  }, [location]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Trigger browser's print dialog which allows saving as PDF
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!billingRecord) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Invoice not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Print controls - hidden when printing */}
      <div className="max-w-4xl mx-auto mb-6 print:hidden">
        <div className="flex justify-end gap-2">
          <Button onClick={handlePrint} variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="w-4 h-4 mr-2" />
            Save as PDF
          </Button>
        </div>
      </div>

      {/* Invoice Content */}
      <Card className="max-w-4xl mx-auto bg-white shadow-lg">
        <CardContent className="p-12">
          {/* Header */}
          <div className="border-b border-gray-200 pb-8 mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
                <p className="text-gray-600">Invoice #{billingRecord.invoice_number || billingRecord.id.substring(0, 8)}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600 mb-2">Protocol</div>
                <div className="text-gray-600">
                  <p>Advertising Platform</p>
                  <p>Digital Marketing Services</p>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bill To:</h3>
              <div className="text-gray-700">
                <p className="font-semibold">{vendor?.company_name || 'Vendor Company'}</p>
                <p className="text-sm text-gray-600 mt-2">
                  Campaign: {campaign?.title || 'Unknown Campaign'}
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details:</h3>
              <div className="text-gray-700 space-y-2">
                <div className="flex justify-between">
                  <span>Invoice Date:</span>
                  <span>{format(new Date(billingRecord.created_date), 'MMMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Billing Period:</span>
                  <span>
                    {billingRecord.start_date && billingRecord.end_date ? (
                      `${format(new Date(billingRecord.start_date), 'MMM d')} → ${format(new Date(billingRecord.end_date), 'MMM d, yyyy')}`
                    ) : (
                      'N/A'
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Status:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    billingRecord.payment_status === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {billingRecord.payment_status?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Details:</h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Campaign Title</p>
                  <p className="font-semibold">{campaign?.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Billing Model</p>
                  <p className="font-semibold">{billingRecord.billing_model?.toUpperCase()}</p>
                </div>
                {billingRecord.billing_model === 'cpc' && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">CPC Rate</p>
                      <p className="font-semibold">₹{campaign?.cpc_rate}/click</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Clicks</p>
                      <p className="font-semibold">{Math.round((billingRecord.amount || 0) / (campaign?.cpc_rate || 1))} clicks</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Amount Breakdown */}
          <div className="border-t border-gray-200 pt-8">
            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>₹{(billingRecord.amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Tax (0%):</span>
                  <span>₹0.00</span>
                </div>
                <div className="flex justify-between py-4 border-t border-gray-200">
                  <span className="text-xl font-bold text-gray-900">Total:</span>
                  <span className="text-xl font-bold text-gray-900">₹{(billingRecord.amount || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
            <p>Thank you for your business!</p>
            <p className="mt-2">This is a computer-generated invoice and does not require a signature.</p>
            <p className="mt-4">For any queries regarding this invoice, please contact our support team.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

{/* Print Styles */}
<style jsx>{`
  @media print {
    @page {
      margin: 0.5in;
    }
    
    body {
      background: white !important;
    }
    
    .print\\:hidden {
      display: none !important;
    }
  }
`}</style>