import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import EventsManagementComponent from '../components/superadmin/EventsManagement';
import { Skeleton } from '@/components/ui/skeleton';

export default function EventsManagementPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Failed to fetch user", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return <EventsManagementComponent user={user} />;
}