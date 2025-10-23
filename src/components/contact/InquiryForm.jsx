import React, { useState, useEffect } from 'react';
import { User, ContactInquiry } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Send, Loader2 } from 'lucide-react';

export default function InquiryForm() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile_number: '',
    subject: '',
    message: '',
  });
  const [isBotChecked, setIsBotChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        setFormData((prev) => ({
          ...prev,
          full_name: currentUser.display_name || '',
          email: currentUser.email || '',
          mobile_number: currentUser.mobile_number || '',
        }));
      } catch (error) {
        // User not logged in, do nothing
      }
    };
    fetchUser();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value) => {
    setFormData((prev) => ({ ...prev, subject: value }));
  };

  const validateForm = () => {
    if (!formData.full_name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all required fields.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address.');
      return false;
    }
    if (!isBotChecked) {
      toast.error('Please confirm you are not a robot.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await ContactInquiry.create({
        ...formData,
        user_id: user?.id || null,
      });

      toast.success('Your inquiry has been submitted. Our team will get back to you shortly.');
      // Reset form
      setFormData({
        full_name: user?.display_name || '',
        email: user?.email || '',
        mobile_number: user?.mobile_number || '',
        subject: '',
        message: '',
      });
      setIsBotChecked(false);
    } catch (error) {
      console.error('Failed to submit inquiry:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50">
        <CardTitle>Send an Inquiry</CardTitle>
        <CardDescription>Our team typically responds within 24 hours.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="John Doe" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="john.doe@example.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mobile_number">Mobile Number (Optional)</Label>
            <Input id="mobile_number" name="mobile_number" type="tel" value={formData.mobile_number} onChange={handleChange} placeholder="9876543210" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Select onValueChange={handleSelectChange} value={formData.subject} required>
              <SelectTrigger id="subject">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general_inquiry">General Inquiry</SelectItem>
                <SelectItem value="technical_support">Technical Support</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" name="message" value={formData.message} onChange={handleChange} placeholder="How can we help you?" required rows={5} />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="bot-check" checked={isBotChecked} onCheckedChange={setIsBotChecked} />
            <Label htmlFor="bot-check" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              I am not a robot
            </Label>
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Send Inquiry
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}