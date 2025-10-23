import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function FaqSection() {
  const faqs = [
    {
      question: 'How to reset my password?',
      answer: 'You can reset your password from the General Settings tab in your Profile page. You will need access to your old password to set a new one.',
      link: createPageUrl('Profile'),
    },
    {
      question: 'How to update my profile details?',
      answer: 'Navigate to the Profile page from the sidebar. Under the General Settings tab, you can update your display name and profile picture.',
      link: createPageUrl('Profile'),
    },
    {
      question: 'How do subscriptions work?',
      answer: 'Our subscription plans give you access to premium features. You can view, manage, or upgrade your plan from the Subscription page.',
      link: createPageUrl('Subscription'),
    },
    {
      question: 'How can I use referral and earn badges?',
      answer: 'Go to the Invite Traders page to get your unique referral link. You earn badges and rewards as your referred friends join and become active.',
      link: createPageUrl('ReferralDashboard'),
    },
    {
      question: 'How to delete my account?',
      answer: 'To deactivate your account, go to the General Settings tab on your Profile page. Please note this action is irreversible.',
      link: createPageUrl('Profile'),
    },
  ];

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-slate-700" />
          Frequently Asked Questions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-600 mb-6">
          Before contacting us, you may find your answer here:
        </p>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem value={`item-${index}`} key={index}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <p>{faq.answer}</p>
                <Link to={faq.link} className="text-blue-600 hover:underline text-sm font-semibold">
                  Go to page →
                </Link>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}