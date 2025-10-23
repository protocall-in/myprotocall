import React from "react";
import { Shield, ShieldCheck, ShieldAlert, Star, AlertTriangle, Badge as BadgeIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TrustScoreBadge({ score, showScore = true, size = "sm" }) {
  const trustScore = score === undefined ? 50 : score;
  
  const getTrustTier = (score) => {
    if (score >= 80) return "trusted";
    if (score >= 40) return "neutral";
    return "low";
  };
  
  const getTrustConfig = (tier) => {
    switch (tier) {
      case "trusted":
        return {
          icon: ShieldCheck,
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          borderColor: "border-green-200",
          iconColor: "text-green-600",
          label: "Trusted",
          showStar: true
        };
      case "neutral":
        return {
          icon: BadgeIcon,
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-800",
          borderColor: "border-yellow-200",
          iconColor: "text-yellow-600",
          label: "Neutral",
          showStar: false
        };
      case "low":
        return {
          icon: ShieldAlert,
          bgColor: "bg-red-100",
          textColor: "text-red-800",
          borderColor: "border-red-200",
          iconColor: "text-red-600",
          label: "Low Trust",
          showStar: false
        };
      default:
        return {
          icon: BadgeIcon,
          bgColor: "bg-slate-100",
          textColor: "text-slate-800",
          borderColor: "border-slate-200",
          iconColor: "text-slate-600",
          label: "Unrated",
          showStar: false
        };
    }
  };
  
  const getSizeConfig = (size) => {
    switch (size) {
      case "xs":
        return {
          iconSize: "w-3 h-3",
          starSize: "w-2 h-2",
          textSize: "text-xs",
          padding: "px-1.5 py-0.5",
          gap: "gap-1"
        };
      case "sm":
        return {
          iconSize: "w-3.5 h-3.5",
          starSize: "w-2.5 h-2.5",
          textSize: "text-xs",
          padding: "px-2 py-1",
          gap: "gap-1"
        };
      case "md":
        return {
          iconSize: "w-4 h-4",
          starSize: "w-3 h-3",
          textSize: "text-sm",
          padding: "px-2.5 py-1.5",
          gap: "gap-1.5"
        };
      default:
        return getSizeConfig("sm");
    }
  };
  
  const tier = getTrustTier(trustScore);
  const config = getTrustConfig(tier);
  const sizeConfig = getSizeConfig(size);
  const IconComponent = config.icon;
  
  return (
    <Badge 
      variant="outline" 
      className={`
        ${config.bgColor} 
        ${config.textColor} 
        ${config.borderColor}
        ${sizeConfig.padding}
        ${sizeConfig.gap}
        ${sizeConfig.textSize}
        font-semibold
        flex items-center
        border
        transition-all duration-200
        hover:shadow-sm
      `}
      title={`Trust Score: ${Math.round(trustScore)} - ${config.label}`}
    >
      <div className="relative flex items-center">
        <IconComponent className={`${sizeConfig.iconSize} ${config.iconColor}`} />
        {config.showStar && (
          <Star 
            className={`${sizeConfig.starSize} text-yellow-500 absolute -top-0.5 -right-0.5 fill-current`} 
          />
        )}
      </div>
      {showScore && (
        <span className="ml-1 font-bold">
          {Math.round(trustScore)}
        </span>
      )}
    </Badge>
  );
}