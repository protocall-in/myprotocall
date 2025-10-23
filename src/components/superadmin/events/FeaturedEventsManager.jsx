import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Star,
  Crown,
  TrendingUp,
  Eye,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Sparkles,
  Calendar,
  Users,
  AlertCircle
} from 'lucide-react';
import { Event } from '@/api/entities';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function FeaturedEventsManager({ events, onUpdate, onViewDetails }) {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [nonFeaturedEvents, setNonFeaturedEvents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [featuredPriority, setFeaturedPriority] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    organizeEvents();
  }, [events]);

  const organizeEvents = () => {
    // Only approved or scheduled events can be featured
    const eligibleEvents = events.filter(e => 
      ['approved', 'scheduled'].includes(e.status)
    );

    const featured = eligibleEvents
      .filter(e => e.is_featured)
      .sort((a, b) => (a.featured_priority || 999) - (b.featured_priority || 999));
    
    const nonFeatured = eligibleEvents.filter(e => !e.is_featured);

    setFeaturedEvents(featured);
    setNonFeaturedEvents(nonFeatured);
  };

  const handleAddFeatured = async () => {
    if (!selectedEvent) {
      toast.error('Please select an event');
      return;
    }

    setIsProcessing(true);
    try {
      await Event.update(selectedEvent.id, {
        is_featured: true,
        featured_priority: featuredPriority
      });

      toast.success(`"${selectedEvent.title}" marked as featured!`);
      setShowAddModal(false);
      setSelectedEvent(null);
      setFeaturedPriority(1);
      await onUpdate();
    } catch (error) {
      console.error('Error adding featured event:', error);
      toast.error('Failed to mark event as featured');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveFeatured = async (event) => {
    setIsProcessing(true);
    try {
      await Event.update(event.id, {
        is_featured: false,
        featured_priority: null
      });

      toast.success(`"${event.title}" removed from featured events`);
      await onUpdate();
    } catch (error) {
      console.error('Error removing featured event:', error);
      toast.error('Failed to remove featured event');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(featuredEvents);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setFeaturedEvents(items);

    // Update priorities in database
    setIsProcessing(true);
    try {
      await Promise.all(
        items.map((event, index) =>
          Event.update(event.id, {
            featured_priority: index + 1
          })
        )
      );
      toast.success('Featured events order updated');
      await onUpdate();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
      organizeEvents(); // Revert to original order
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMovePriority = async (event, direction) => {
    const currentIndex = featuredEvents.findIndex(e => e.id === event.id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === featuredEvents.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const items = Array.from(featuredEvents);
    const [movedItem] = items.splice(currentIndex, 1);
    items.splice(newIndex, 0, movedItem);

    setFeaturedEvents(items);

    setIsProcessing(true);
    try {
      await Promise.all(
        items.map((e, index) =>
          Event.update(e.id, { featured_priority: index + 1 })
        )
      );
      toast.success('Priority updated');
      await onUpdate();
    } catch (error) {
      console.error('Error updating priority:', error);
      toast.error('Failed to update priority');
      organizeEvents();
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredNonFeatured = nonFeaturedEvents.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.organizer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEventStats = (event) => {
    // You can calculate actual stats from attendees/tickets if available
    return {
      attendees: Math.floor(Math.random() * 100) + 20, // Placeholder
      revenue: event.is_premium ? Math.floor(Math.random() * 50000) + 10000 : 0
    };
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Featured Events</p>
                <p className="text-2xl font-bold text-gray-900">{featuredEvents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Available to Feature</p>
                <p className="text-2xl font-bold text-gray-900">{nonFeaturedEvents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Max Featured Slots</p>
                <p className="text-2xl font-bold text-gray-900">10</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Featured Events List with Drag & Drop */}
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6 text-yellow-600" />
              <CardTitle>Featured Events (Drag to Reorder)</CardTitle>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              disabled={featuredEvents.length >= 10 || isProcessing}
              className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Star className="w-4 h-4 mr-2" />
              Add Featured Event
            </Button>
          </div>
          {featuredEvents.length >= 10 && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Maximum featured events reached</p>
                <p className="text-xs text-yellow-700 mt-1">Remove an event to add a new one</p>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {featuredEvents.length === 0 ? (
            <div className="text-center py-12">
              <Star className="mx-auto h-16 w-16 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No Featured Events Yet</h3>
              <p className="mt-2 text-sm text-gray-500">
                Start featuring events to highlight them on the platform
              </p>
              <Button
                onClick={() => setShowAddModal(true)}
                className="mt-4 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700"
              >
                <Star className="w-4 h-4 mr-2" />
                Add First Featured Event
              </Button>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="featured-events">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`space-y-3 ${snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg p-2' : ''}`}
                  >
                    {featuredEvents.map((event, index) => {
                      const stats = getEventStats(event);
                      return (
                        <Draggable key={event.id} draggableId={event.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-200 transition-all duration-300 ${
                                snapshot.isDragging ? 'shadow-2xl scale-105' : 'shadow-md hover:shadow-lg'
                              }`}
                            >
                              <div className="flex items-start gap-4">
                                {/* Drag Handle */}
                                <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing pt-1">
                                  <GripVertical className="w-5 h-5 text-gray-400" />
                                </div>

                                {/* Priority Badge */}
                                <div className="flex-shrink-0">
                                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white text-lg font-bold w-10 h-10 rounded-full flex items-center justify-center">
                                    {index + 1}
                                  </Badge>
                                </div>

                                {/* Event Info */}
                                <div className="flex-1">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-gray-900 text-lg">{event.title}</h4>
                                        <Crown className="w-5 h-5 text-yellow-600" />
                                      </div>
                                      <p className="text-sm text-gray-600 mt-1">
                                        by {event.organizer_name || 'Unknown'}
                                      </p>
                                      <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center gap-1 text-sm text-gray-500">
                                          <Calendar className="w-4 h-4" />
                                          {new Date(event.event_date).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1 text-sm text-gray-500">
                                          <Users className="w-4 h-4" />
                                          {stats.attendees} attendees
                                        </div>
                                        {event.is_premium && (
                                          <Badge className="bg-purple-100 text-purple-800 text-xs">
                                            Premium
                                          </Badge>
                                        )}
                                      </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleMovePriority(event, 'up')}
                                        disabled={index === 0 || isProcessing}
                                        className="hover:bg-white/50"
                                      >
                                        <ArrowUp className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleMovePriority(event, 'down')}
                                        disabled={index === featuredEvents.length - 1 || isProcessing}
                                        className="hover:bg-white/50"
                                      >
                                        <ArrowDown className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onViewDetails(event)}
                                        className="hover:bg-white/50"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveFeatured(event)}
                                        disabled={isProcessing}
                                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                      >
                                        <Star className="w-4 h-4 fill-current" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>

      {/* Add Featured Event Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Star className="w-6 h-6 text-yellow-600" />
              Add Featured Event
            </DialogTitle>
            <DialogDescription>
              Select an event to feature on the platform and set its display priority
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Priority Selector */}
            <div>
              <Label htmlFor="priority" className="text-sm font-semibold">
                Featured Priority (1 = Highest)
              </Label>
              <Input
                id="priority"
                type="number"
                min="1"
                max="10"
                value={featuredPriority}
                onChange={(e) => setFeaturedPriority(parseInt(e.target.value) || 1)}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Lower numbers appear first. Events will be automatically reordered.
              </p>
            </div>

            {/* Search */}
            <div>
              <Label className="text-sm font-semibold">Select Event</Label>
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-2"
              />
            </div>

            {/* Event List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredNonFeatured.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2">No events available to feature</p>
                </div>
              ) : (
                filteredNonFeatured.map(event => (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                      selectedEvent?.id === event.id
                        ? 'border-yellow-500 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-md'
                        : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{event.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">by {event.organizer_name}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {new Date(event.event_date).toLocaleDateString()}
                          </div>
                          {event.is_premium && (
                            <Badge className="bg-purple-100 text-purple-800 text-xs">
                              Premium
                            </Badge>
                          )}
                          <Badge className={`text-xs ${
                            event.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {event.status}
                          </Badge>
                        </div>
                      </div>
                      {selectedEvent?.id === event.id && (
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
                            <Star className="w-4 h-4 text-white fill-current" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setSelectedEvent(null);
                setSearchTerm('');
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddFeatured}
              disabled={!selectedEvent || isProcessing}
              className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700"
            >
              {isProcessing ? (
                <>Processing...</>
              ) : (
                <>
                  <Star className="w-4 h-4 mr-2" />
                  Add as Featured
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}