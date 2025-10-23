
import React, { useState, useEffect, useCallback } from 'react';
import { User, Role } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield } from 'lucide-react';
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserTable from './users/UserTable';
import RolesAndPermissions from './users/RolesAndPermissions';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState(null);

  const loadAllData = useCallback(async () => {
    try {
      const [allUsers, allRoles, admin] = await Promise.all([
      User.list('-created_date').catch((error) => {
        console.error('Error loading users:', error);
        toast.error('Failed to load users');
        return [];
      }),
      Role.list().catch((error) => {
        console.error('Error loading roles:', error);
        // Only show toast if the request wasn't aborted
        if (error.message !== 'Request aborted') {
          toast.error('Failed to load roles');
        }
        return [];
      }),
      User.me().catch((error) => {
        console.error('Error loading current admin:', error);
        return null;
      })]
      );
      // Return the fetched data instead of setting state directly
      return { allUsers, allRoles, admin };
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load required data.');
      return null; // Return null if there's a catastrophic failure
    }
  }, []);

  useEffect(() => {
    let isMounted = true; // Flag to track if the component is mounted
    setIsLoading(true); // Start loading state

    const fetchData = async () => {
      const data = await loadAllData(); // Call the async data loading function

      if (isMounted) { // Only update state if the component is still mounted
        if (data) { // If data was successfully retrieved
            setUsers(data.allUsers);
            setRoles(data.allRoles);
            setCurrentAdmin(data.admin);
        }
        // Always set loading to false once the async operation has completed,
        // regardless of whether data was successfully retrieved or not.
        setIsLoading(false);
      }
    };

    fetchData();

    // Cleanup function to set isMounted to false when the component unmounts
    return () => {
      isMounted = false;
    };
  }, [loadAllData]); // Depend on loadAllData

  if (isLoading || !currentAdmin) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Loading User Management...</p>
      </div>);

  }

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          User and Role Management
        </CardTitle>
        <p className="text-sm text-slate-500">Manage platform users, assign roles, and configure permissions.</p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="users">
          <TabsList className="grid w-full grid-cols-2 bg-transparent p-1 rounded-xl gap-2">
            <TabsTrigger value="users" className="whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="roles" className="whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md">
              <Shield className="w-4 h-4 mr-2" />
              Roles & Permissions
            </TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-4">
            <UserTable
              users={users}
              roles={roles}
              currentAdmin={currentAdmin}
              onUsersUpdate={loadAllData} />
          </TabsContent>
          <TabsContent value="roles" className="mt-4">
            <RolesAndPermissions currentAdmin={currentAdmin} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
