
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { usePlatformSettings } from '../hooks/usePlatformSettings';

export default function CreateCourseModal({ open, onClose, onCreate }) {
  const { settings, usingDefaults } = usePlatformSettings();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    duration_hours: '',
    course_type: '',
    category: '',
    difficulty_level: '',
    curriculum: '',
    prerequisites: '',
    thumbnail_url: '',
    course_content_url: '',
    max_participants: '',
    scheduled_date: '',
    meeting_link: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert curriculum string to array
    const curriculumArray = formData.curriculum 
      ? formData.curriculum.split('\n').filter(item => item.trim()) 
      : [];

    const courseData = {
      ...formData,
      price: parseFloat(formData.price) || 0,
      duration_hours: parseFloat(formData.duration_hours) || 0,
      max_participants: parseInt(formData.max_participants) || null,
      curriculum: curriculumArray,
      scheduled_date: formData.scheduled_date || null,
    };

    onCreate(courseData);
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      price: '',
      duration_hours: '',
      course_type: '',
      category: '',
      difficulty_level: '',
      curriculum: '',
      prerequisites: '',
      thumbnail_url: '',
      course_content_url: '',
      max_participants: '',
      scheduled_date: '',
      meeting_link: ''
    });
  };

  // Calculate revenue breakdown
  const coursePrice = parseFloat(formData.price) || 0;
  const platformCommission = (coursePrice * settings.commissionRate) / 100;
  const influencerPayout = coursePrice - platformCommission;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Course</DialogTitle>
          <DialogDescription>
            Create an educational course for your followers and start earning revenue.
          </DialogDescription>
          
          {/* Revenue Breakdown */}
          {coursePrice > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg mt-4">
              <h4 className="font-medium text-blue-900 mb-2">Revenue Breakdown (per enrollment)</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Course Price:</span>
                  <span className="font-medium">₹{coursePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Platform Commission ({settings.commissionRate}%):</span>
                  <span>-₹{platformCommission.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-green-600 border-t pt-1">
                  <span>Your Payout:</span>
                  <span>₹{influencerPayout.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Default Settings Warning */}
          {usingDefaults && (
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
              <AlertCircle className="w-3 h-3" />
              <span>Default settings applied until admin configures values.</span>
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Course Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="course_type">Course Type</Label>
              <Select name="course_type" value={formData.course_type} onValueChange={(value) => setFormData(prev => ({...prev, course_type: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="live_session">Live Session</SelectItem>
                  <SelectItem value="recorded_course">Recorded Course</SelectItem>
                  <SelectItem value="webinar">Webinar</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select name="category" value={formData.category} onValueChange={(value) => setFormData(prev => ({...prev, category: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical_analysis">Technical Analysis</SelectItem>
                  <SelectItem value="fundamental_analysis">Fundamental Analysis</SelectItem>
                  <SelectItem value="options_trading">Options Trading</SelectItem>
                  <SelectItem value="mutual_funds">Mutual Funds</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="portfolio_management">Portfolio Management</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="difficulty_level">Difficulty Level</Label>
              <Select name="difficulty_level" value={formData.difficulty_level} onValueChange={(value) => setFormData(prev => ({...prev, difficulty_level: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="duration_hours">Duration (Hours)</Label>
              <Input
                id="duration_hours"
                name="duration_hours"
                type="number"
                step="0.5"
                value={formData.duration_hours}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="curriculum">Curriculum (one topic per line)</Label>
            <Textarea
              id="curriculum"
              name="curriculum"
              value={formData.curriculum}
              onChange={handleInputChange}
              placeholder="Introduction to Technical Analysis&#10;Support and Resistance Levels&#10;Chart Patterns&#10;Indicators and Oscillators"
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="prerequisites">Prerequisites</Label>
            <Input
              id="prerequisites"
              name="prerequisites"
              value={formData.prerequisites}
              onChange={handleInputChange}
              placeholder="Basic knowledge of stock markets"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
              <Input
                id="thumbnail_url"
                name="thumbnail_url"
                value={formData.thumbnail_url}
                onChange={handleInputChange}
                placeholder="https://example.com/thumbnail.jpg"
              />
            </div>
            <div>
              <Label htmlFor="course_content_url">Course Content URL</Label>
              <Input
                id="course_content_url"
                name="course_content_url"
                value={formData.course_content_url}
                onChange={handleInputChange}
                placeholder="YouTube link or course platform URL"
              />
            </div>
          </div>

          {(formData.course_type === 'live_session' || formData.course_type === 'webinar') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scheduled_date">Scheduled Date & Time</Label>
                <Input
                  id="scheduled_date"
                  name="scheduled_date"
                  type="datetime-local"
                  value={formData.scheduled_date}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="max_participants">Max Participants</Label>
                <Input
                  id="max_participants"
                  name="max_participants"
                  type="number"
                  value={formData.max_participants}
                  onChange={handleInputChange}
                  placeholder="50"
                />
              </div>
            </div>
          )}

          {(formData.course_type === 'live_session' || formData.course_type === 'webinar') && (
            <div>
              <Label htmlFor="meeting_link">Meeting Link (Zoom/Google Meet)</Label>
              <Input
                id="meeting_link"
                name="meeting_link"
                value={formData.meeting_link}
                onChange={handleInputChange}
                placeholder="https://zoom.us/j/..."
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              Create Course
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
