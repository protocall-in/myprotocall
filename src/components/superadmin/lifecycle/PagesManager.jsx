
import React, { useState, useEffect } from 'react';
import { FeatureConfig } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  FileText, Plus, Search, Eye, EyeOff, Edit, Trash2,
  CheckCircle, AlertCircle, Clock, Ban
} from 'lucide-react';
import { toast } from 'sonner';
import PageModuleModal from './PageModuleModal';
import PagesInitializer from './PagesInitializer'; // NEW IMPORT

export default function PagesManager({ user }) {
  const [pages, setPages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPage, setEditingPage] = useState(null);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      setIsLoading(true);
      const allModules = await FeatureConfig.list();
      const pageModules = allModules.filter(m => m.module_type === 'page');
      setPages(pageModules.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
    } catch (error) {
      console.error('Error loading pages:', error);
      toast.error('Failed to load pages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVisibility = async (page) => {
    try {
      const cleanPayload = {
        feature_key: page.feature_key,
        feature_name: page.feature_name,
        description: page.description,
        module_type: page.module_type,
        route_path: page.route_path,
        icon_name: page.icon_name,
        tier: page.tier,
        status: page.status,
        visibility_rule: page.visibility_rule,
        visible_to_users: !page.visible_to_users,
        sort_order: page.sort_order || 0,
        last_status_change_date: new Date().toISOString(),
        changed_by_admin_id: user.id,
        changed_by_admin_name: user.display_name || user.email,
        reason_for_change: `Visibility toggled by ${user.display_name || user.email}`
      };

      await FeatureConfig.update(page.id, cleanPayload);
      await loadPages();
      toast.success(`Page ${cleanPayload.visible_to_users ? 'shown' : 'hidden'} successfully`);
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast.error('Failed to update page visibility');
    }
  };

  const handleDelete = async (page) => {
    if (!window.confirm(`Are you sure you want to delete the page "${page.feature_name}"?`)) return;

    try {
      await FeatureConfig.delete(page.id);
      await loadPages();
      toast.success('Page deleted successfully');
    } catch (error) {
      console.error('Error deleting page:', error);
      toast.error('Failed to delete page');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'live': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'partial': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'placeholder': return <Clock className="w-4 h-4 text-purple-600" />;
      case 'disabled': return <Ban className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'bg-green-100 text-green-800 border-green-300';
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'placeholder': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'disabled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filteredPages = pages.filter(page => {
    const matchesSearch = page.feature_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (page.route_path && page.route_path.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterStatus === 'all' || page.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: pages.length,
    live: pages.filter(p => p.status === 'live').length,
    placeholder: pages.filter(p => p.status === 'placeholder').length,
    disabled: pages.filter(p => p.status === 'disabled').length
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading pages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* NEW: Add Initializer at the top */}
      <PagesInitializer user={user} />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Pages</p>
                <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <FileText className="w-12 h-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Live Pages</p>
                <p className="text-3xl font-bold text-green-600">{stats.live}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Coming Soon</p>
                <p className="text-3xl font-bold text-purple-600">{stats.placeholder}</p>
              </div>
              <Clock className="w-12 h-12 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Disabled</p>
                <p className="text-3xl font-bold text-red-600">{stats.disabled}</p>
              </div>
              <Ban className="w-12 h-12 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search pages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {['all', 'live', 'partial', 'placeholder', 'disabled'].map((status) => (
            <Button
              key={status}
              onClick={() => setFilterStatus(status)}
              variant={filterStatus === status ? 'default' : 'outline'}
              size="sm"
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        <Button onClick={() => { setEditingPage(null); setShowModal(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add New Page
        </Button>
      </div>

      {/* Pages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Application Pages ({filteredPages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredPages.map((page) => (
              <div
                key={page.id}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900">{page.feature_name}</h3>
                    <Badge className={`${getStatusColor(page.status)} border flex items-center gap-1`}>
                      {getStatusIcon(page.status)}
                      {page.status.charAt(0).toUpperCase() + page.status.slice(1)}
                    </Badge>
                    {page.visible_to_users ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                        <Eye className="w-3 h-3 mr-1" />
                        Visible
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
                        <EyeOff className="w-3 h-3 mr-1" />
                        Hidden
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {page.tier}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">{page.description}</p>
                  {page.route_path && (
                    <p className="text-xs text-slate-500 mt-1">Route: {page.route_path}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleVisibility(page)}
                  >
                    {page.visible_to_users ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setEditingPage(page); setShowModal(true); }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(page)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {filteredPages.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-semibold mb-2">No pages found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Page Module Modal */}
      {showModal && (
        <PageModuleModal
          page={editingPage}
          user={user}
          onClose={() => { setShowModal(false); setEditingPage(null); }}
          onSave={async () => {
            await loadPages();
            setShowModal(false);
            setEditingPage(null);
          }}
        />
      )}
    </div>
  );
}
