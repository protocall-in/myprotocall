import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Users,
  Clock,
  Calendar,
  Star,
  Shield,
  Play,
  Award,
  TrendingUp,
  IndianRupee
} from 'lucide-react';
import { format } from 'date-fns';
import EnrollmentModal from './EnrollmentModal';

export default function CourseCard({ course, influencer, canAccessPremium }) {
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  const difficultyColors = {
    beginner: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    intermediate: 'bg-amber-100 text-amber-800 border-amber-200',
    advanced: 'bg-rose-100 text-rose-800 border-rose-200'
  };

  const categoryColors = {
    technical_analysis: 'bg-blue-100 text-blue-800 border-blue-200',
    fundamental_analysis: 'bg-purple-100 text-purple-800 border-purple-200',
    options_trading: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    mutual_funds: 'bg-green-100 text-green-800 border-green-200',
    crypto: 'bg-orange-100 text-orange-800 border-orange-200',
    portfolio_management: 'bg-pink-100 text-pink-800 border-pink-200'
  };

  const handleEnroll = () => {
    setShowEnrollModal(true);
  };

  return (
    <>
      <Card className="group shadow-xl border-0 bg-white flex flex-col overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
        {/* Course Type Header with Gradient */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <Badge className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 text-xs font-bold border-white/30 shadow-lg">
                {course.course_type.replace('_', ' ').toUpperCase()}
              </Badge>
              {course.course_type === 'live_session' && (
                <Badge className="bg-lime-500 text-white px-3 py-1 text-xs font-bold animate-pulse shadow-lg">
                  <div className="w-2 h-2 bg-white rounded-full mr-1.5 animate-ping absolute" />
                  <div className="w-2 h-2 bg-white rounded-full mr-1.5" />
                  LIVE
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <Badge variant="outline" className={`${categoryColors[course.category]} border shadow-sm`}>
                  {course.category.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        <CardHeader className="pb-3 pt-5">
          <CardTitle className="text-xl leading-tight font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
            {course.title}
          </CardTitle>

          {/* Influencer Info */}
          {influencer && (
            <div className="flex items-center gap-2.5 mt-3 p-2.5 bg-slate-50 rounded-lg">
              <img
                src={influencer.profile_image_url}
                alt={influencer.display_name}
                className="w-9 h-9 rounded-full ring-2 ring-white shadow-md"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-800 truncate">{influencer.display_name}</p>
                {influencer.sebi_registered && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Shield className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-700 font-medium">SEBI Registered</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4 flex-1 flex flex-col">
          <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{course.description}</p>

          {/* Key Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm bg-blue-50 p-2.5 rounded-lg">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-slate-700 font-medium">{course.duration_hours}h</span>
            </div>
            <div className="flex items-center gap-2 text-sm bg-purple-50 p-2.5 rounded-lg">
              <Users className="w-4 h-4 text-purple-600" />
              <span className="text-slate-700 font-medium">{course.current_enrollments} enrolled</span>
            </div>
          </div>

          {/* Live Session Date */}
          {course.course_type === 'live_session' && course.scheduled_date && (
            <div className="flex items-center gap-2 text-sm bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span className="text-indigo-900 font-semibold">
                {format(new Date(course.scheduled_date), 'MMM d, yyyy • h:mm a')}
              </span>
            </div>
          )}

          {/* Badges Row */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={`${difficultyColors[course.difficulty_level]} font-semibold`}>
              {course.difficulty_level}
            </Badge>
            <Badge variant="outline" className="border-slate-300 text-slate-700">
              <Award className="w-3 h-3 mr-1" />
              Certificate
            </Badge>
          </div>

          {/* Capacity Progress for Live Sessions */}
          {course.course_type === 'live_session' && course.max_participants && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-600 font-medium">Seats Available</span>
                <span className="font-bold text-slate-900">
                  {course.max_participants - course.current_enrollments} / {course.max_participants}
                </span>
              </div>
              <div className="bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full transition-all duration-500 shadow-sm"
                  style={{ 
                    width: `${(course.current_enrollments / course.max_participants) * 100}%` 
                  }}
                />
              </div>
            </div>
          )}

          {/* Price and CTA */}
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
            <div>
              <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                ₹{course.price?.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">One-time payment</p>
            </div>
            <Button 
              onClick={handleEnroll} 
              className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:shadow-xl hover:scale-105 transition-all duration-300 px-6 py-2.5 font-semibold"
            >
              Enroll Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {showEnrollModal && (
        <EnrollmentModal
          open={showEnrollModal}
          onClose={() => setShowEnrollModal(false)}
          course={course}
          influencer={influencer}
        />
      )}
    </>
  );
}