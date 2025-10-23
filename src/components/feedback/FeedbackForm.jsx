import React, { useState, useEffect } from 'react';
import { User, Feedback } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Send, Loader2, CheckCircle } from 'lucide-react';

export default function FeedbackForm() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    user_role: 'guest',
    feedback_text: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        setFormData((prev) => ({
          ...prev,
          name: currentUser.display_name || '',
          email: currentUser.email || '',
          user_role: currentUser.app_role || 'trader',
        }));
      } catch (error) {
        // User not logged in, defaults are fine
      }
    };
    fetchUser();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value) => {
    setFormData((prev) => ({ ...prev, user_role: value }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.feedback_text) {
      toast.error('Please fill in all required fields.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await Feedback.create({
        ...formData,
        user_id: user?.id || null,
      });

      setIsSubmitted(true);
      // Reset form after a delay
      setTimeout(() => {
          setIsSubmitted(false);
          setFormData({
            ...formData,
            feedback_text: '',
          });
      }, 5000);

    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
        <Card className="shadow-lg border-0 bg-white text-center p-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Thank you for your feedback!</h2>
            <p className="text-slate-600">We appreciate your input and will use it to make Protocol even better.</p>
        </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-purple-50">
        <CardTitle>Feedback Form</CardTitle>
        <CardDescription>Let us know how we can improve.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Your Name" required disabled={!!user} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="your.email@example.com" required disabled={!!user} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="user_role">Your Role</Label>
            <Select onValueChange={handleRoleChange} value={formData.user_role} required disabled={!!user}>
              <SelectTrigger id="user_role">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="guest">Guest</SelectItem>
                <SelectItem value="trader">Trader</SelectItem>
                <SelectItem value="finfluencer">Finfluencer</SelectItem>
                <SelectItem value="advisor">Stock Advisor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="feedback_text">Feedback</Label>
            <Textarea id="feedback_text" name="feedback_text" value={formData.feedback_text} onChange={handleChange} placeholder="What would you like to see improved?" required rows={6} />
          </div>
          <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Submit Feedback
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}