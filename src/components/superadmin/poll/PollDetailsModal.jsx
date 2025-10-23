import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Calendar,
  Target,
  Crown,
  Clock,
  CheckCircle,
  Ban,
  Play,
  Trash2,
  Star,
  Eye
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { format } from 'date-fns';
import { useState } from 'react';

export default function PollDetailsModal({ open, poll, users, votes, onClose, onDelete, onSuspend }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const pollData = useMemo(() => {
    if (!poll) return null;

    const creator = users.find(u => u.email === poll.created_by);
    const totalVotes = poll.total_votes || 0;
    const buyVotes = poll.buy_votes || 0;
    const sellVotes = poll.sell_votes || 0;
    const holdVotes = poll.hold_votes || 0;

    const voteDistribution = [
      { name: 'Buy', value: buyVotes, color: '#10B981', percentage: totalVotes > 0 ? (buyVotes / totalVotes) * 100 : 0 },
      { name: 'Sell', value: sellVotes, color: '#EF4444', percentage: totalVotes > 0 ? (sellVotes / totalVotes) * 100 : 0 },
      { name: 'Hold', value: holdVotes, color: '#6B7280', percentage: totalVotes > 0 ? (holdVotes / totalVotes) * 100 : 0 }
    ];

    const isActive = poll.is_active;
    const isExpired = poll.expires_at && new Date(poll.expires_at) < new Date();

    return {
      ...poll,
      creator,
      totalVotes,
      voteDistribution,
      isActive,
      isExpired,
      status: !isActive ? 'Suspended' : isExpired ? 'Expired' : 'Active'
    };
  }, [poll, users]);

  const voterDetails = useMemo(() => {
    if (!poll || !votes.length) return [];
    
    return votes.map(vote => {
      const voter = users.find(u => u.id === vote.user_id);
      return {
        ...vote,
        user: voter
      };
    });
  }, [poll, votes, users]);

  if (!pollData) return null;

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (onDelete) {
      await onDelete(poll.id);
      setShowDeleteDialog(false);
      onClose();
    }
  };

  const handleSuspendClick = async () => {
    if (onSuspend) {
      await onSuspend(poll.id, pollData.isActive);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-xl mb-2">{pollData.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  <Badge variant="outline">{pollData.stock_symbol}</Badge>
                  <Badge className={pollData.is_premium ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}>
                    {pollData.is_premium ? 'Premium' : 'General'}
                  </Badge>
                  <Badge className={
                    pollData.status === 'Active' ? 'bg-green-100 text-green-800' :
                    pollData.status === 'Suspended' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {pollData.status}
                  </Badge>
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                {onSuspend && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSuspendClick}
                    className={pollData.isActive ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}
                  >
                    {pollData.isActive ? <Ban className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                    {pollData.isActive ? 'Suspend' : 'Reactivate'}
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteClick}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Poll Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Poll Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600">Created by</p>
                    <div className="flex items-center gap-2 mt-1">
                      <img 
                        src={pollData.creator?.profile_image_url || `https://avatar.vercel.sh/${pollData.creator?.email}.png`} 
                        alt={pollData.creator?.display_name} 
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="font-medium">{pollData.creator?.display_name || 'Unknown'}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-600">Created on</p>
                    <p className="font-medium">{format(new Date(pollData.created_date), 'PPP')}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Poll Type</p>
                    <p className="font-medium">{pollData.poll_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Expires</p>
                    <p className="font-medium">
                      {pollData.expires_at ? format(new Date(pollData.expires_at), 'PPP') : 'Never'}
                    </p>
                  </div>
                  {pollData.target_price && (
                    <div>
                      <p className="text-slate-600">Target Price</p>
                      <p className="font-medium">₹{pollData.target_price.toLocaleString()}</p>
                    </div>
                  )}
                  {pollData.confidence_score && (
                    <div>
                      <p className="text-slate-600">Confidence Level</p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < pollData.confidence_score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        ))}
                        <span className="ml-1 text-xs">({pollData.confidence_score}/5)</span>
                      </div>
                    </div>
                  )}
                </div>
                {pollData.description && (
                  <div className="mt-4">
                    <p className="text-slate-600 text-sm">Description</p>
                    <p className="text-sm mt-1">{pollData.description}</p>
                  </div>
                )}
              </div>

              {/* Vote Breakdown */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Vote Breakdown ({pollData.totalVotes} total votes)
                </h3>
                
                <div className="space-y-3">
                  {pollData.voteDistribution.map((item, index) => {
                    const Icon = item.name === 'Buy' ? TrendingUp : item.name === 'Sell' ? TrendingDown : Minus;
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${item.name === 'Buy' ? 'text-green-500' : item.name === 'Sell' ? 'text-red-500' : 'text-gray-500'}`} />
                        <span className="w-12 text-sm font-medium">{item.name}</span>
                        <Progress 
                          value={item.percentage} 
                          className="flex-1 h-2"
                          indicatorClassName={item.name === 'Buy' ? 'bg-green-500' : item.name === 'Sell' ? 'bg-red-500' : 'bg-gray-500'}
                        />
                        <span className="w-16 text-right text-sm">
                          {item.value} ({Math.round(item.percentage)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Voter List */}
              {voterDetails.length > 0 && (
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Recent Voters ({voterDetails.length})
                  </h3>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {voterDetails.slice(0, 20).map((vote, index) => (
                      <div key={index} className="flex items-center justify-between text-sm py-2 px-3 bg-slate-50 rounded">
                        <div className="flex items-center gap-2">
                          <img 
                            src={vote.user?.profile_image_url || `https://avatar.vercel.sh/${vote.user?.email}.png`} 
                            alt={vote.user?.display_name} 
                            className="w-6 h-6 rounded-full"
                          />
                          <span>{vote.user?.display_name || 'Anonymous'}</span>
                        </div>
                        <Badge 
                          variant="outline"
                          className={
                            vote.vote === 'buy' ? 'bg-green-50 text-green-700 border-green-200' :
                            vote.vote === 'sell' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                          }
                        >
                          {vote.vote.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                    {voterDetails.length > 20 && (
                      <p className="text-center text-sm text-slate-500 py-2">
                        +{voterDetails.length - 20} more voters
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Vote Distribution Chart */}
            <div className="space-y-6">
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold mb-4">Vote Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pollData.voteDistribution.filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pollData.voteDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} votes`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Quick Stats */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold mb-4">Quick Stats</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Participants</span>
                    <span className="font-medium">{pollData.totalVotes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Winning Decision</span>
                    <span className="font-medium">
                      {pollData.voteDistribution.reduce((max, item) => max.value > item.value ? max : item, pollData.voteDistribution[0])?.name || 'Tie'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Consensus Strength</span>
                    <span className="font-medium">
                      {Math.round(pollData.voteDistribution.reduce((max, item) => max.value > item.value ? max : item, pollData.voteDistribution[0])?.percentage || 0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Days Active</span>
                    <span className="font-medium">
                      {Math.max(1, Math.ceil((new Date() - new Date(pollData.created_date)) / (1000 * 60 * 60 * 24)))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Poll Permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the poll 
              "<span className="font-semibold">{poll?.title}</span>" and all {pollData.totalVotes} associated votes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete Poll & Votes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}