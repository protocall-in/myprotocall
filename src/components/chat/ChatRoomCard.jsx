import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, BarChart, Circle, MoreVertical, Trash2, Crown, Shield, MessageSquare } from "lucide-react";
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export default function ChatRoomCard({ room, onJoin, onDelete, user }) {
  const onlineNow = room.onlineNow ?? Math.floor(room.participant_count / 4) + Math.floor(Math.random() * 5);
  const avgActiveMembers = room.avgActiveMembers ?? Math.floor(room.participant_count * 0.75);

  const canDelete = user && (['admin', 'super_admin'].includes(user.app_role) || room.created_by === user.email);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(room);
    }
  };

  const getRoomTypeSubheading = () => {
    switch (room.room_type) {
      case "stock_specific":
        return "Stock Specific";
      case "general":
        return "General Discussion";
      case "sector":
        return "Sector Discussion";
      case "admin":
        return "Admin Announcements";
      case "premium":
        return "Premium Room";
      case "premium_admin":
        return "Premium Admin";
      default:
        return null;
    }
  };

  const subheading = getRoomTypeSubheading();
  const isPremium = room.is_premium || room.room_type === 'premium' || room.room_type === 'premium_admin';
  const isAdmin = room.room_type === 'admin' || room.room_type === 'premium_admin' || room.admin_only_post;
  const isStockSpecific = room.room_type === 'stock_specific';

  // Check if stock symbol badge is redundant (if room name contains the stock symbol)
  const isStockSymbolRedundant = room.stock_symbol && 
    room.name.toUpperCase().includes(room.stock_symbol.toUpperCase());

  // Simple light gradient backgrounds - DIFFERENT for Admin vs Premium
  const getCardStyles = () => {
    if (isPremium && isAdmin) {
      // Premium Admin - Purple gradient
      return "bg-gradient-to-br from-white to-purple-50 border-0 shadow-lg";
    } else if (isAdmin) {
      // Admin Only - Blue gradient (DIFFERENT from premium)
      return "bg-gradient-to-br from-white to-blue-50 border-0 shadow-lg";
    } else if (isPremium) {
      // Premium - Purple gradient
      return "bg-gradient-to-br from-white to-purple-50 border-0 shadow-lg";
    }
    return "bg-white border-0 shadow-md";
  };

  // Different decorative corner colors for Admin vs Premium
  const getCornerGradient = () => {
    if (isPremium && !isAdmin) {
      return "from-purple-400 to-pink-500"; // Premium: Purple-Pink
    } else if (isAdmin && !isPremium) {
      return "from-blue-400 to-cyan-500"; // Admin: Blue-Cyan
    } else if (isPremium && isAdmin) {
      return "from-purple-400 to-indigo-500"; // Both: Purple-Indigo
    }
    return "from-purple-400 to-indigo-500";
  };

  return (
    <Card
      className={`${getCardStyles()} rounded-2xl hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden relative transform hover:-translate-y-1`}
      onClick={() => onJoin(room)}
    >
      {/* Decorative corner gradient for premium/admin */}
      {(isPremium || isAdmin) && (
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${getCornerGradient()} opacity-10 rounded-full transform translate-x-16 -translate-y-16`}></div>
      )}

      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-wrap gap-2">
            {/* Premium Badge */}
            {isPremium && (
              <Badge className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0 shadow-md">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
            
            {/* Admin Badge - Different color than Premium */}
            {isAdmin && (
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0 shadow-md">
                <Shield className="w-3 h-3 mr-1" />
                Admin Only
              </Badge>
            )}
            
            {/* Live Badge */}
            {onlineNow > 0 && (
              <Badge className="bg-green-500 text-white border-0 animate-pulse">
                <Circle className="w-2 h-2 mr-1 fill-current" />
                {onlineNow} Live
              </Badge>
            )}
            
            {/* Stock Symbol Badge - Only show if NOT redundant */}
            {room.stock_symbol && !isStockSymbolRedundant && (
              <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                {room.stock_symbol}
              </Badge>
            )}
          </div>
          
          {/* Delete Button */}
          {canDelete && onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4 text-slate-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={handleDeleteClick} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                  <Trash2 className="w-4 h-4 mr-2" />
                  <span>Delete Room</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Room Name - Highlighted for Stock-Specific */}
        {isStockSpecific ? (
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent line-clamp-2">
              {room.name}
            </h3>
          </div>
        ) : (
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{room.name}</h3>
        )}
        
        {subheading && (
          <p className="text-sm text-gray-500 mt-1">{subheading}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Description */}
        {room.description && (
          <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
            {room.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>{room.participant_count || 0} members</span>
          </div>
          
          {avgActiveMembers > 0 && (
            <div className="flex items-center gap-1.5">
              <BarChart className="w-4 h-4" />
              <span>{avgActiveMembers} active</span>
            </div>
          )}
        </div>

        {room.created_date && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>Created {format(new Date(room.created_date), 'MMM d, yyyy')}</span>
          </div>
        )}

        {/* Action Button - Global style with gradient on hover */}
        <Button 
          className="w-full bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:from-blue-500 hover:to-purple-600 hover:text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 border border-blue-200 hover:border-transparent"
        >
          <MessageSquare className="w-4 h-4" />
          Join Conversation
        </Button>
      </CardContent>
    </Card>
  );
}