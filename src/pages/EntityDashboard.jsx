import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import FinfluencerDashboard from './FinfluencerDashboard';
import AdvisorDashboard from './AdvisorDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function EntityDashboardPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewAsRole, setViewAsRole] = useState(null); // For SuperAdmin to switch views

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        
        // Set default view based on role
        if (currentUser.app_role === 'super_admin' || currentUser.app_role === 'admin') {
          // SuperAdmin can view as any role, default to finfluencer
          setViewAsRole('finfluencer');
        } else {
          setViewAsRole(currentUser.app_role);
        }
      } catch (error) {
        toast.error("You must be logged in to view this page.");
        window.location.href = '/login';
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-1/4 mb-4" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!user) {
    return null; // Should have been redirected
  }

  // Check if user is SuperAdmin or Admin
  const isSuperAdmin = user.app_role === 'super_admin' || user.app_role === 'admin';

  // If not admin and not an entity role, deny access
  if (!isSuperAdmin && !['finfluencer', 'advisor', 'educator'].includes(user.app_role)) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-slate-600">This dashboard is only available for approved content creators.</p>
      </div>
    );
  }

  // Render the appropriate dashboard based on viewAsRole (for admins) or actual role
  const activeRole = isSuperAdmin ? viewAsRole : user.app_role;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      {/* SuperAdmin Role Switcher */}
      {isSuperAdmin && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-yellow-800 font-semibold">🔑 SuperAdmin Mode</span>
              <span className="text-yellow-700 text-sm">You have universal access to all dashboards</span>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-yellow-800">View as:</label>
              <Select value={viewAsRole} onValueChange={setViewAsRole}>
                <SelectTrigger className="w-48 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="finfluencer">Finfluencer Dashboard</SelectItem>
                  <SelectItem value="advisor">Advisor Dashboard</SelectItem>
                  <SelectItem value="educator">Educator Dashboard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Render Dashboard Based on Active Role */}
      {activeRole === 'finfluencer' && <FinfluencerDashboard user={user} />}
      {activeRole === 'advisor' && <AdvisorDashboard user={user} />}
      {activeRole === 'educator' && (
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold">Educator Dashboard</h2>
          <p className="text-slate-600">Coming soon...</p>
        </div>
      )}
    </div>
  );
}