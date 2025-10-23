/**
 * Comprehensive Upcoming Events Helper
 * Provides multiple categorizations of upcoming events
 */

export const getUpcomingEventsCategories = (events) => {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Base filter: Only approved/scheduled future events
  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.event_date);
    return (
      eventDate > now &&
      ['approved', 'scheduled'].includes(event.status) &&
      !event.is_cancelled
    );
  });

  return {
    // All upcoming events
    all: upcomingEvents,

    // Happening within 24 hours
    today: upcomingEvents.filter(e => {
      const eventDate = new Date(e.event_date);
      return eventDate <= tomorrow;
    }),

    // Happening this week (next 7 days)
    thisWeek: upcomingEvents.filter(e => {
      const eventDate = new Date(e.event_date);
      return eventDate <= nextWeek;
    }),

    // Happening this month (next 30 days)
    thisMonth: upcomingEvents.filter(e => {
      const eventDate = new Date(e.event_date);
      return eventDate <= nextMonth;
    }),

    // Beyond 30 days
    later: upcomingEvents.filter(e => {
      const eventDate = new Date(e.event_date);
      return eventDate > nextMonth;
    }),

    // Next event (soonest)
    next: upcomingEvents.sort((a, b) => 
      new Date(a.event_date) - new Date(b.event_date)
    )[0] || null,

    // Featured upcoming events
    featured: upcomingEvents.filter(e => e.is_featured),

    // Premium upcoming events
    premium: upcomingEvents.filter(e => e.is_premium),

    // Events with available spots
    available: upcomingEvents.filter(e => {
      if (!e.capacity) return true; // Unlimited capacity
      const attendeesCount = e.attendees_count || 0;
      return attendeesCount < e.capacity;
    }),

    // Almost full events (>80% capacity)
    almostFull: upcomingEvents.filter(e => {
      if (!e.capacity) return false;
      const attendeesCount = e.attendees_count || 0;
      return (attendeesCount / e.capacity) >= 0.8 && attendeesCount < e.capacity;
    })
  };
};

/**
 * Get time until event starts
 */
export const getTimeUntilEvent = (eventDate) => {
  const now = new Date();
  const event = new Date(eventDate);
  const diffMs = event - now;

  if (diffMs < 0) return { label: 'Past Event', color: 'gray' };

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffDays > 30) {
    return { label: `In ${diffDays} days`, color: 'blue' };
  } else if (diffDays > 7) {
    return { label: `In ${diffDays} days`, color: 'green' };
  } else if (diffDays > 1) {
    return { label: `In ${diffDays} days`, color: 'yellow' };
  } else if (diffDays === 1) {
    return { label: 'Tomorrow', color: 'orange' };
  } else if (diffHours > 3) {
    return { label: `In ${diffHours} hours`, color: 'orange' };
  } else if (diffHours > 0) {
    return { label: `In ${diffHours}h ${diffMinutes}m`, color: 'red', urgent: true };
  } else {
    return { label: `In ${diffMinutes} minutes`, color: 'red', urgent: true };
  }
};

/**
 * Check if event is happening soon (within 24 hours)
 */
export const isEventSoon = (eventDate) => {
  const now = new Date();
  const event = new Date(eventDate);
  const diffMs = event - now;
  const diffHours = diffMs / (1000 * 60 * 60);
  
  return diffHours > 0 && diffHours <= 24;
};

/**
 * Get event status badge info
 */
export const getEventStatusBadge = (event) => {
  const now = new Date();
  const eventDate = new Date(event.event_date);

  // Past event
  if (eventDate < now) {
    return {
      label: 'Completed',
      color: 'bg-gray-100 text-gray-700',
      icon: 'CheckCircle'
    };
  }

  // Check capacity
  if (event.capacity && event.attendees_count >= event.capacity) {
    return {
      label: 'Full',
      color: 'bg-red-100 text-red-700',
      icon: 'Lock'
    };
  }

  // Happening soon
  if (isEventSoon(event.event_date)) {
    return {
      label: 'Happening Soon!',
      color: 'bg-orange-100 text-orange-700',
      icon: 'Clock',
      urgent: true
    };
  }

  // Almost full
  if (event.capacity && event.attendees_count / event.capacity >= 0.8) {
    return {
      label: 'Almost Full',
      color: 'bg-yellow-100 text-yellow-700',
      icon: 'AlertTriangle'
    };
  }

  // Regular upcoming
  return {
    label: 'Upcoming',
    color: 'bg-green-100 text-green-700',
    icon: 'Calendar'
  };
};

/**
 * Sort events by urgency
 */
export const sortEventsByUrgency = (events) => {
  return [...events].sort((a, b) => {
    const timeA = getTimeUntilEvent(a.event_date);
    const timeB = getTimeUntilEvent(b.event_date);
    
    // Urgent events first
    if (timeA.urgent && !timeB.urgent) return -1;
    if (!timeA.urgent && timeB.urgent) return 1;
    
    // Then by date (soonest first)
    return new Date(a.event_date) - new Date(b.event_date);
  });
};