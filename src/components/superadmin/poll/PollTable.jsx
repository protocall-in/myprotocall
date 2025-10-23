import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MoreVertical,
  Shield,
  Crown,
  Trash2,
  Eye,
  ToggleLeft,
  ToggleRight,
  MessageSquare,
  ClipboardList
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

export default function PollTable({
  polls,
  onViewDetails,
  onDeletePoll,
  onSuspendPoll,
  onTogglePremium,
  canModerate,
  canDelete
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[30%]">Poll Details</TableHead>
          <TableHead>Stock & Room</TableHead>
          <TableHead>Votes & Results</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {polls.map((poll) => (
          <TableRow key={poll.id} className="hover:bg-slate-50">
            <TableCell>
              <div className="font-medium text-slate-800">{poll.title}</div>
              <div className="text-xs text-slate-500">{poll.description}</div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{poll.stock_symbol}</Badge>
                {poll.chatroom?.name && <Badge variant="secondary">{poll.chatroom.name}</Badge>}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2 text-sm">
                <span>{poll.total_votes || 0} votes</span>
              </div>
              <div className="w-full mt-1">
                {poll.poll_type === 'sentiment' ? (
                  <Progress value={poll.bullish_percentage} className="h-2 [&>div]:bg-green-500" />
                ) : (
                  <Progress value={poll.buy_percentage} className="h-2 [&>div]:bg-green-500" />
                )}
              </div>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    {poll.creation_source === 'chatroom' ? 
                        <MessageSquare className="w-4 h-4 text-blue-500" title="Created in Chatroom" /> :
                        <ClipboardList className="w-4 h-4 text-gray-500" title="Created from Admin Panel" />
                    }
                    <div className="flex flex-col">
                        {poll.is_premium && <Badge className="bg-purple-100 text-purple-800 text-xs mb-1">Premium</Badge>}
                        {poll.created_by_admin && <Badge className="bg-green-100 text-green-800 text-xs">Admin</Badge>}
                    </div>
                </div>
            </TableCell>
            <TableCell>
              <Badge
                variant={poll.is_currently_active ? 'default' : 'destructive'}
                className={poll.is_currently_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {poll.is_currently_active ? 'Active' : 'Expired'}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="text-sm text-slate-600">
                {formatDistanceToNow(new Date(poll.created_date), { addSuffix: true })}
              </div>
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onViewDetails(poll)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  {canModerate && (
                    <>
                      <DropdownMenuItem onClick={() => onTogglePremium(poll.id, !poll.is_premium)}>
                        {poll.is_premium ? <Crown className="w-4 h-4 mr-2 text-yellow-500" /> : <Crown className="w-4 h-4 mr-2" />}
                        {poll.is_premium ? 'Make General' : 'Make Premium'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onSuspendPoll(poll.id, poll.is_active)}>
                        {poll.is_active ? <ToggleRight className="w-4 h-4 mr-2 text-red-500" /> : <ToggleLeft className="w-4 h-4 mr-2" />}
                        {poll.is_active ? 'Suspend' : 'Reactivate'}
                      </DropdownMenuItem>
                    </>
                  )}
                  {canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onDeletePoll(poll.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Poll
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}