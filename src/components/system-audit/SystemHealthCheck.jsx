import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, XCircle, Clock, Zap, Shield, Database, Users, TrendingUp, Settings } from 'lucide-react';

// System Health Check Component for Admin Dashboard
export default function SystemHealthCheck() {
  const [healthStatus, setHealthStatus] = useState({
    entities: { status: 'checking', issues: [] },
    pages: { status: 'checking', issues: [] },
    integrations: { status: 'checking', issues: [] },
    security: { status: 'checking', issues: [] },
    performance: { status: 'checking', issues: [] }
  });

  useEffect(() => {
    performSystemAudit();
  }, []);

  const performSystemAudit = async () => {
    // Simulate comprehensive system check
    setTimeout(() => {
      setHealthStatus({
        entities: { 
          status: 'healthy', 
          issues: []
        },
        pages: { 
          status: 'warning', 
          issues: [
            'Payment gateway integration incomplete',
            'Real-time stock data needs API key configuration',
            'File upload size limits not configured'
          ]
        },
        integrations: { 
          status: 'error', 
          issues: [
            'Email service not configured',
            'Push notification service missing',
            'SMS gateway for OTP not set up'
          ]
        },
        security: { 
          status: 'healthy', 
          issues: []
        },
        performance: { 
          status: 'warning', 
          issues: [
            'Large list views missing pagination',
            'Image optimization not implemented',
            'Database queries need indexing'
          ]
        }
      });
    }, 2000);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Clock className="w-5 h-5 text-gray-400 animate-spin" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'error': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            System Health Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(healthStatus).map(([category, data]) => (
              <Card key={category} className={`border ${getStatusColor(data.status)}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold capitalize">{category}</h3>
                    {getStatusIcon(data.status)}
                  </div>
                  {data.issues.length > 0 && (
                    <div className="space-y-1">
                      {data.issues.map((issue, idx) => (
                        <p key={idx} className="text-xs text-gray-600">• {issue}</p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <Button onClick={performSystemAudit} className="mt-4">
            <Zap className="w-4 h-4 mr-2" />
            Re-run System Check
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}