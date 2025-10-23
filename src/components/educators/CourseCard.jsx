import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Users,
  Clock,
  Star,
  CheckCircle,
  Play,
  Award,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

export default function CourseCard({ course, educator, canAccessPremium }) {
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800 border-green-200',
    intermediate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    advanced: 'bg-red-100 text-red-800 border-red-200'
  };

  const handleEnroll = () => {
    if (canAccessPremium) {
      alert(`Enrolling in ${course.title} by ${educator?.display_name}`);
    } else {
      alert("Please subscribe to Premium to enroll in courses.");
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-white flex flex-col">
      {/* Course Header */}
      <div className="relative bg-gradient-to-r from-indigo-500 to-blue-500 p-4 text-white">
        <div className="flex items-center justify-between">
          <Badge className="bg-white/20 text-white border-white/30">
            {course.course_type.replace('_', ' ').toUpperCase()}
          </Badge>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-300" />
            <span className="font-medium">{course.rating}</span>
          </div>
        </div>
        
        {course.thumbnail_url && (
          <div className="mt-3 rounded-lg overflow-hidden">
            <img 
              src={course.thumbnail_url} 
              alt={course.title}
              className="w-full h-32 object-cover"
            />
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <div className="space-y-2">
          <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
            {course.category.replace('_', ' ')}
          </Badge>
          <CardTitle className="text-lg leading-tight">{course.title}</CardTitle>
        </div>

        {/* Educator */}
        {educator && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <img
              src={educator.profile_image_url}
              alt={educator.display_name}
              className="w-6 h-6 rounded-full"
            />
            <span className="font-medium">{educator.display_name}</span>
            {educator.verified && (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4 flex-1">
        <p className="text-sm text-slate-600 line-clamp-2">{course.description}</p>

        {/* Key Info */}
        <div className="flex justify-between items-center text-sm text-slate-700">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>{course.rating} ({course.current_enrollments} reviews)</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-blue-500" />
            <span>{course.current_enrollments} students</span>
          </div>
        </div>

        {/* Live Course Date */}
        {course.course_type === 'live_workshop' && course.scheduled_date && (
          <div className="flex items-center gap-2 text-sm bg-blue-50 p-2 rounded-lg">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-blue-800 font-medium">
              {format(new Date(course.scheduled_date), 'MMM d, yyyy • h:mm a')}
            </span>
          </div>
        )}

        {/* Course Details */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={difficultyColors[course.difficulty_level]}>
            {course.difficulty_level}
          </Badge>
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            {course.duration_hours} hours
          </Badge>
        </div>

        {/* Capacity Check for Live Courses */}
        {course.course_type === 'live_workshop' && course.max_participants && (
          <div className="bg-slate-50 p-3 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Capacity:</span>
              <span className="font-semibold">
                {course.current_enrollments} / {course.max_participants}
              </span>
            </div>
            <div className="mt-2 bg-slate-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(course.current_enrollments / course.max_participants) * 100}%` 
                }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-4">
          <p className="text-2xl font-bold text-slate-900">₹{course.price}</p>
          <Button 
            onClick={handleEnroll} 
            className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white"
            disabled={!canAccessPremium}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Enroll Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}