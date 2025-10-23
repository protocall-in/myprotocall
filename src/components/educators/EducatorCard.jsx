
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Star,
  Award,
  CheckCircle,
  Users,
  Globe,
  BookOpen,
  Calendar,
  Linkedin,
  Youtube
} from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function EducatorCard({ educator, canAccessPremium }) {
  const socialIcons = {
    linkedin: Linkedin,
    youtube: Youtube,
    website: Globe
  };

  return (
    <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 group">
      <CardHeader className="text-center">
        <div className="relative mx-auto">
          <img
            src={educator.profile_image_url}
            alt={educator.display_name}
            className="w-20 h-20 rounded-full object-cover mx-auto mb-3"
          />
          {educator.verified && (
            <CheckCircle className="w-5 h-5 text-green-500 absolute -bottom-1 -right-1 bg-white rounded-full" />
          )}
        </div>
        
        <div className="space-y-2">
          <CardTitle className="text-lg">{educator.display_name}</CardTitle>
          
          {/* Certifications */}
          <div className="flex flex-wrap gap-1 justify-center">
            {educator.certification?.slice(0, 3).map((cert) => (
              <Badge key={cert} className="bg-blue-100 text-blue-800 text-xs">
                <Award className="w-3 h-3 mr-1" />
                {cert}
              </Badge>
            ))}
            {educator.certification?.length > 3 && (
              <Badge className="bg-blue-100 text-blue-800 text-xs">
                +{educator.certification.length - 3}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Specializations */}
        <div className="flex flex-wrap gap-1 justify-center">
          {educator.specialization?.slice(0, 2).map((spec) => (
            <Badge key={spec} variant="outline" className="text-xs">
              {spec}
            </Badge>
          ))}
          {educator.specialization?.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{educator.specialization.length - 2}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-slate-50 p-3 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-4 h-4 text-slate-600" />
              <span className="text-lg font-bold text-slate-800">{educator.student_count}</span>
            </div>
            <p className="text-xs text-slate-600">Students</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Calendar className="w-4 h-4 text-slate-600" />
              <span className="text-lg font-bold text-slate-800">{educator.experience_years}</span>
            </div>
            <p className="text-xs text-slate-600">Years Exp.</p>
          </div>
        </div>

        {/* Rating */}
        {educator.rating && (
          <div className="flex items-center justify-center gap-2 bg-yellow-50 p-2 rounded-lg">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="font-semibold text-yellow-700">{educator.rating}</span>
            <span className="text-sm text-yellow-600">({educator.success_rate}% success rate)</span>
          </div>
        )}

        {/* Social Links */}
        {educator.social_links && (
          <div className="flex justify-center gap-2">
            {Object.entries(educator.social_links).map(([platform, url]) => {
              if (!url) return null;
              const Icon = socialIcons[platform];
              if (!Icon) return null;

              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-800 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Link to={createPageUrl(`EducatorProfile?id=${educator.id}`)}>
            <Button className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white hover:from-indigo-600 hover:to-blue-700">
              <BookOpen className="w-4 h-4 mr-2" />
              View Profile & Courses
            </Button>
          </Link>
          
          {educator.course_price_range && (
            <div className="text-center">
              <p className="text-sm text-slate-600">
                Courses from ₹{educator.course_price_range.min} - ₹{educator.course_price_range.max}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
