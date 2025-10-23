
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Download, Users, Activity, MapPin, Clock, BarChart2, Calendar, Filter, Users2, UserCheck, UserX } from 'lucide-react';
import { format, subDays, isAfter, parseISO } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// Fix for default Leaflet icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper Components
const StatCard = ({ title, value, icon: Icon, color, description }) => (
  <Card className="shadow-sm">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 ${color}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardContent>
  </Card>
);

const UserActivityMap = ({ locations }) => (
  <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}>
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    />
    {locations.map((loc, index) => (
      <CircleMarker
        key={index}
        center={[loc.lat, loc.lng]}
        radius={Math.min(10 + Math.sqrt(loc.userCount) * 2, 30)}
        pathOptions={{
          color: '#4f46e5',
          fillColor: '#6366f1',
          fillOpacity: 0.6,
          weight: 1,
        }}
      >
        <Popup>
          <b>{loc.city}, {loc.country}</b><br />
          {loc.userCount} users
        </Popup>
      </CircleMarker>
    ))}
  </MapContainer>
);

export default function ActivityTracker({ currentAdmin }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // '7', '30', '90', 'all'
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      try {
        const allUsers = await User.list();
        if (isMounted) {
          // Simulate location and activity data
          const usersWithMockData = allUsers.map(u => {
            const daysSinceCreation = (new Date() - parseISO(u.created_date)) / (1000 * 60 * 60 * 24);
            const mockLocations = [
              { city: 'Mumbai', country: 'India', lat: 19.0760, lng: 72.8777 },
              { city: 'Delhi', country: 'India', lat: 28.7041, lng: 77.1025 },
              { city: 'Bangalore', country: 'India', lat: 12.9716, lng: 77.5946 },
              { city: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708 },
              { city: 'New York', country: 'USA', lat: 40.7128, lng: -74.0060 },
            ];
            const randomLoc = mockLocations[Math.floor(Math.random() * mockLocations.length)];
            
            return {
              ...u,
              last_activity_date: subDays(new Date(), Math.random() * 100).toISOString(),
              city: randomLoc.city,
              country: randomLoc.country,
              lat: randomLoc.lat,
              lng: randomLoc.lng,
            };
          });
          setUsers(usersWithMockData);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error("Could not load user data.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchUsers();
    return () => { isMounted = false };
  }, []);

  const filteredUsers = useMemo(() => {
    let dateFiltered = users;
    if (timeRange !== 'all') {
      const cutOffDate = subDays(new Date(), parseInt(timeRange));
      dateFiltered = users.filter(u => isAfter(parseISO(u.created_date), cutOffDate));
    }
    
    if (roleFilter !== 'all') {
      return dateFiltered.filter(u => u.app_role === roleFilter);
    }
    return dateFiltered;
  }, [users, timeRange, roleFilter]);

  const activityStats = useMemo(() => {
    const now = new Date();
    const activeCutoff = subDays(now, 30);
    const newTodayCutoff = subDays(now, 1);

    const stats = {
      total: filteredUsers.length,
      active: 0,
      inactive: 0,
      newToday: 0,
      byRole: {},
      locations: {},
    };

    filteredUsers.forEach(user => {
      const isActive = isAfter(parseISO(user.last_activity_date), activeCutoff);
      if (isActive) stats.active++; else stats.inactive++;

      if (isAfter(parseISO(user.created_date), newTodayCutoff)) stats.newToday++;
      
      // Role stats
      if (!stats.byRole[user.app_role]) {
        stats.byRole[user.app_role] = { total: 0, active: 0 };
      }
      stats.byRole[user.app_role].total++;
      if (isActive) stats.byRole[user.app_role].active++;
      
      // Location stats
      if(user.city && user.country && user.lat && user.lng) {
        const key = `${user.city},${user.country}`;
        if (!stats.locations[key]) {
          stats.locations[key] = { city: user.city, country: user.country, lat: user.lat, lng: user.lng, userCount: 0 };
        }
        stats.locations[key].userCount++;
      }
    });

    return {
      ...stats,
      locations: Object.values(stats.locations)
    };
  }, [filteredUsers]);

  const exportToCSV = useCallback(() => {
    if (currentAdmin?.app_role !== 'super_admin') {
      toast.error("You don't have permission to export data.");
      return;
    }
    const headers = ['User ID', 'Display Name', 'Email', 'Role', 'Status', 'City', 'Country', 'Last Activity'];
    const rows = filteredUsers.map(u => [
      u.id,
      u.display_name,
      u.email,
      u.app_role,
      isAfter(parseISO(u.last_activity_date), subDays(new Date(), 30)) ? 'Active' : 'Inactive',
      u.city,
      u.country,
      format(parseISO(u.last_activity_date), 'yyyy-MM-dd HH:mm'),
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `user_activity_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("User data exported successfully.");
  }, [filteredUsers, currentAdmin]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];
  const activityData = [{ name: 'Active', value: activityStats.active }, { name: 'Inactive', value: activityStats.inactive }];
  const roleData = Object.entries(activityStats.byRole).map(([role, data]) => ({ role, ...data }));
  
  const canExport = currentAdmin?.app_role === 'super_admin';

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Activity className="w-7 h-7 text-indigo-600" />
                User Activity & Location Tracker
              </CardTitle>
              <CardDescription className="mt-1">
                Monitor user engagement, activity status, and geographic distribution.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[180px]"><Filter className="w-4 h-4 mr-2" />Time Range</SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]"><Users2 className="w-4 h-4 mr-2"/>User Role</SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="trader">Trader</SelectItem>
                  <SelectItem value="finfluencer">Finfluencer</SelectItem>
                  <SelectItem value="advisor">Advisor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportToCSV} disabled={!canExport} variant="outline">
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={activityStats.total} icon={Users} color="text-blue-500" description={`${activityStats.newToday} new today`} />
        <StatCard title="Active Users" value={activityStats.active} icon={UserCheck} color="text-green-500" description={`${activityStats.total > 0 ? ((activityStats.active / activityStats.total) * 100).toFixed(1) : 0}% of total`} />
        <StatCard title="Inactive Users" value={activityStats.inactive} icon={UserX} color="text-red-500" description={`${activityStats.total > 0 ? ((activityStats.inactive / activityStats.total) * 100).toFixed(1) : 0}% of total`} />
        <StatCard title="Locations Tracked" value={activityStats.locations.length} icon={MapPin} color="text-purple-500" description="Cities with active users" />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 shadow-lg border-0 bg-white">
          <CardHeader>
            <CardTitle>Location Distribution</CardTitle>
            <CardDescription>User concentration across cities.</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <UserActivityMap locations={activityStats.locations} />
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader>
            <CardTitle>Active vs. Inactive</CardTitle>
             <CardDescription>Based on activity in last 30 days.</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={activityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  <Cell fill="#82ca9d" />
                  <Cell fill="#f87171" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <CardTitle>Activity by Role</CardTitle>
          <CardDescription>Breakdown of total vs. active users for each application role.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={roleData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <XAxis dataKey="role" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" stackId="a" fill="#a5b4fc" name="Total Users" />
              <Bar dataKey="active" stackId="a" fill="#4f46e5" name="Active Users" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <CardTitle>User Drill-Down</CardTitle>
          <CardDescription>Detailed list of all users matching the current filters.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[500px]">
            <Table>
              <TableHeader className="sticky top-0 bg-slate-50">
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.slice(0, 100).map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.display_name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{user.app_role}</Badge></TableCell>
                    <TableCell>
                      {isAfter(parseISO(user.last_activity_date), subDays(new Date(), 30))
                        ? <Badge className="bg-green-100 text-green-800">Active</Badge>
                        : <Badge className="bg-red-100 text-red-800">Inactive</Badge>
                      }
                    </TableCell>
                    <TableCell>{user.city}, {user.country}</TableCell>
                    <TableCell>{format(parseISO(user.last_activity_date), 'MMM d, yyyy')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
           {filteredUsers.length > 100 && <p className="text-center text-sm text-muted-foreground mt-4">Showing first 100 of {filteredUsers.length} users.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
