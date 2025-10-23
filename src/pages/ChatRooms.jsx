import React, { useState, useEffect, useCallback } from "react";
import { ChatRoom, User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Users,
  Plus,
  Search,
  TrendingUp,
  Building,
  Shield,
  Crown
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

import ChatRoomCard from "../components/chat/ChatRoomCard";
import CreateRoomModal from "../components/chat/CreateRoomModal";
import ChatInterface from "../components/chat/ChatInterface";
import "./../components/chat/ChatRoomCard.css";

// Sample data for fallback
const sampleRooms = [
  {
    id: '1',
    name: 'RELIANCE Traders Hub',
    description: 'Discuss Reliance Industries stock movements, earnings, and trading strategies',
    stock_symbol: 'RELIANCE',
    room_type: 'stock_specific',
    participant_count: 156
  },
  {
    id: '2',
    name: 'IT Sector Discussion',
    description: 'Chat about TCS, Infosys, Wipro and other IT stocks',
    room_type: 'sector',
    participant_count: 89
  },
  {
    id: '3',
    name: 'Banking Stocks United',
    description: 'HDFC Bank, ICICI Bank and other banking sector discussions',
    room_type: 'sector',
    participant_count: 134
  },
  {
    id: '4',
    name: 'General Trading Room',
    description: 'Open discussion for all retail traders',
    room_type: 'general',
    participant_count: 267
  },
  {
    id: '5',
    name: 'TCS Earnings Call',
    description: 'Live discussion during TCS quarterly results',
    stock_symbol: 'TCS',
    room_type: 'stock_specific',
    is_meeting_active: true,
    participant_count: 78
  },
  {
    id: '6',
    name: 'Admin Announcements',
    description: 'Official updates and stock recommendations from admins',
    room_type: 'admin',
    participant_count: 1205,
    admin_only_post: true
  },
  {
    id: '7',
    name: 'Premium Insights',
    description: 'Exclusive trading insights for premium members',
    room_type: 'premium',
    participant_count: 45,
    is_premium: true
  },
  {
    id: '8',
    name: 'Admin & Premium Lounge',
    description: 'High-level discussions for premium users and admins',
    room_type: 'premium_admin',
    participant_count: 22,
    is_premium: true,
    admin_only_post: true
  }
];

export default function ChatRooms() {
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [user, setUser] = useState(null);
  const [roomToDelete, setRoomToDelete] = useState(null);

  const loadData = useCallback(async (isMounted, abortController) => {
    try {
      if (!isMounted || abortController?.signal.aborted) return;

      const [rooms, currentUser] = await Promise.all([
        ChatRoom.list('-participant_count').catch(() => []),
        User.me().catch(() => null)
      ]);

      if (!isMounted || abortController?.signal.aborted) return;
      
      const loadedRooms = rooms.length > 0 ? rooms : sampleRooms;
      setChatRooms(loadedRooms);
      setUser(currentUser);

      // Check for stock_symbol in URL to auto-select a room
      const urlParams = new URLSearchParams(window.location.search);
      const stockSymbolFromUrl = urlParams.get('stock_symbol');
      if (stockSymbolFromUrl) {
        const roomToSelect = loadedRooms.find(r => r.stock_symbol === stockSymbolFromUrl);
        if (roomToSelect) {
          setSelectedRoom(roomToSelect);
        }
      }

    } catch (error) {
      if (!isMounted || abortController?.signal.aborted) {
        if (error.name === 'AbortError' || error.message?.includes('aborted')) {
          console.log("Load data aborted:", error);
          return;
        }
        return;
      }
      console.error("Error loading chat rooms:", error);
      setChatRooms(sampleRooms);
    } finally {
      if (isMounted && !abortController?.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let abortController = new AbortController();

    loadData(isMounted, abortController);

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [loadData]);

  const handleCreateRoom = async (roomData) => {
    try {
      const newRoom = await ChatRoom.create(roomData);
      setChatRooms((prev) => [newRoom, ...prev]);
      toast.success(`Chat room "${newRoom.name}" created successfully.`);
    } catch (error) {
      if (!error.message?.includes('aborted') && error.name !== 'AbortError') {
        console.error("Error creating room:", error);
        toast.error("Failed to create chat room. Please try again.");
        const newRoom = {
          id: Date.now().toString(),
          ...roomData,
          participant_count: 1
        };
        setChatRooms((prev) => [newRoom, ...prev]);
      }
    }
    setShowCreateModal(false);
  };

  const confirmDeleteRoom = async () => {
    if (!roomToDelete) return;
    try {
      await ChatRoom.delete(roomToDelete.id);
      setChatRooms((prev) => prev.filter((room) => room.id !== roomToDelete.id));
      toast.success(`Chat room "${roomToDelete.name}" has been deleted.`);
    } catch (error) {
      if (!error.message?.includes('aborted') && error.name !== 'AbortError') {
        console.error("Error deleting room:", error);
        toast.error("Failed to delete the chat room. Please try again.");
      }
    } finally {
      setRoomToDelete(null);
    }
  };

  const filteredRooms = chatRooms.filter((room) => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    if (filter === "admin") {
      matchesFilter = room.room_type === "admin" || room.room_type === "premium_admin" || room.admin_only_post;
    } else if (filter === "premium") {
      matchesFilter = room.is_premium || room.room_type === "premium" || room.room_type === "premium_admin";
    } else if (filter !== "all") {
      matchesFilter = room.room_type === filter;
    }
    
    return matchesSearch && matchesFilter;
  });

  if (selectedRoom) {
    return (
      <ChatInterface
        room={selectedRoom}
        user={user}
        onBack={() => setSelectedRoom(null)}
        onUpdateRoom={loadData}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-700 bg-clip-text text-transparent">
              Trading Chat Rooms
            </h1>
            <p className="text-slate-600 mt-1">Connect with fellow retail investors</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-green-50 text-green-700">
              <Users className="w-3 h-3 mr-1" />
              {chatRooms.reduce((sum, room) => sum + (room.participant_count || 0), 0)} Active
            </Badge>
            <Button onClick={() => setShowCreateModal(true)} className="bg-violet-600 text-primary-foreground px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Room
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search chat rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 search-bar-input"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "all", label: "All Rooms", icon: MessageSquare },
              { value: "stock_specific", label: "Stocks", icon: TrendingUp },
              { value: "sector", label: "Sectors", icon: Building },
              { value: "general", label: "General", icon: Users },
              { value: "admin", label: "Admin", icon: Shield },
              { value: "premium", label: "Premium", icon: Crown }
            ].map((filterOption) => (
              <Button
                key={filterOption.value}
                onClick={() => setFilter(filterOption.value)}
                className={`justify-center whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 disabled:pointer-events-none disabled:opacity-50 h-9 text-xs sm:text-sm rounded-xl font-semibold shadow-md flex items-center gap-2 px-2 sm:px-3 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg ${
                  filter === filterOption.value ?
                    'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' :
                    ''
                }`}
              >
                <filterOption.icon className="w-4 h-4" />
                {filterOption.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Chat Rooms Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="chatroom-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <ChatRoomCard
                key={room.id}
                room={room}
                user={user}
                onJoin={setSelectedRoom}
                onDelete={setRoomToDelete}
              />
            ))}
          </div>
        )}

        {filteredRooms.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No chat rooms found</h3>
            <p className="text-slate-500 mb-4">Try adjusting your search or create a new room</p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Room
            </Button>
          </div>
        )}

        {/* Create Room Modal */}
        <CreateRoomModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreateRoom={handleCreateRoom}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!roomToDelete} onOpenChange={() => setRoomToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                <span className="font-bold"> {roomToDelete?.name} </span>
                chat room and all of its messages.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteRoom} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}