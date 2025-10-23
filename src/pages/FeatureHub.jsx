import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Card, CardContent } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function FeatureHub() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await User.me();
        
        // RESTRICT ACCESS: Only SuperAdmin can access Feature Hub
        if (currentUser.app_role !== 'super_admin' && currentUser.app_role !== 'admin') {
          setAccessDenied(true);
          setIsLoading(false);
          return;
        }
        
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
        setAccessDenied(true);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Access Denied Screen for Non-Admins
  if (accessDenied || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-0 shadow-2xl">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Access Restricted</h2>
            <p className="text-slate-600 mb-6">
              The Feature Hub is only accessible to SuperAdmin users. Please access it through the SuperAdmin panel.
            </p>
            <a href={createPageUrl("Dashboard")}>
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700">
                Return to Dashboard
              </button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If admin tries to access directly, redirect to SuperAdmin panel
  if (user && ['admin', 'super_admin'].includes(user.app_role)) {
    window.location.href = createPageUrl("SuperAdmin");
    return null;
  }

  return null;
}