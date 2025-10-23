import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, UserPlus, Mail, Activity, BarChart2 } from 'lucide-react';
import { format, subDays } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function RegistrationAnalytics({ users, invites, isLoading }) {
  const registrationByMethodData = React.useMemo(() => {
    const counts = { public: 0, invite: 0, direct_admin_creation: 0, system: 0 };
    if(users) {
      users.forEach(user => {
        if (counts[user.registration_method] !== undefined) {
          counts[user.registration_method]++;
        }
      });
    }
    return [
      { name: 'Public Signup', value: counts.public, color: '#0088FE' },
      { name: 'Admin Invite', value: counts.invite, color: '#00C49F' },
      { name: 'Direct Creation', value: counts.direct_admin_creation, color: '#FFBB28' },
      { name: 'System', value: counts.system, color: '#FF8042' },
    ].filter(d => d.value > 0);
  }, [users]);

  const registrationsOverTimeData = React.useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd')).reverse();
    const counts = last30Days.reduce((acc, day) => {
      acc[day] = 0;
      return acc;
    }, {});
    
    if(users) {
      users.forEach(user => {
        const day = format(new Date(user.created_date), 'yyyy-MM-dd');
        if (counts[day] !== undefined) {
          counts[day]++;
        }
      });
    }
    
    return Object.entries(counts).map(([day, count]) => ({
      date: format(new Date(day), 'MMM d'),
      registrations: count,
    }));
  }, [users]);

  const registrationsByRoleData = React.useMemo(() => {
    const counts = {};
    if(users) {
      users.forEach(user => {
        const role = user.app_role || 'N/A';
        counts[role] = (counts[role] || 0) + 1;
      });
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [users]);
  
  if (isLoading) {
    return <div>Loading analytics...</div>;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last7Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

  const totalUsers = users.length;
  const newUsersToday = users.filter(u => new Date(u.created_date) >= today).length;
  const activeUsersLast7Days = users.filter(u => u.last_activity_date && new Date(u.last_activity_date) >= last7Days).length;
  const pendingInvites = invites.filter(i => i.status === 'pending').length;

  const kpis = [
    { title: 'Total Users', value: totalUsers, icon: Users },
    { title: 'New Users Today', value: newUsersToday, icon: UserPlus },
    { title: 'Active Users (7d)', value: activeUsersLast7Days, icon: Activity },
    { title: 'Pending Invites', value: pendingInvites, icon: Mail },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart2 className="w-5 h-5 text-blue-600" /> Registrations by Method</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={registrationByMethodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {registrationByMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart2 className="w-5 h-5 text-green-600" /> Registrations by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={registrationsByRoleData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" name="User Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart2 className="w-5 h-5 text-purple-600" /> Daily Registrations (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={registrationsOverTimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="registrations" stroke="#82ca9d" name="New Users" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}