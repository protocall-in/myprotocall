// Message Moderation System
export class MessageModerator {
  static prohibitedPatterns = {
    // Scam and phishing patterns
    scam: [
      /(?:guaranteed|sure|100%)\s+(?:profit|returns|money|income)/i,
      /(?:quick|easy|fast)\s+(?:money|cash|profit|returns)/i,
      /(?:double|triple)\s+(?:your|money|investment)/i,
      /(?:risk-?free|no\s+risk)\s+(?:investment|trading|returns)/i,
      /(?:secret|hidden|insider)\s+(?:tip|strategy|method)/i,
      /(?:join|click|visit)\s+(?:now|today|immediately)/i,
      /bit\.ly|tinyurl|t\.co|goo\.gl/i,
      /(?:whatsapp|telegram|discord)\s+(?:group|channel|link)/i
    ],
    
    // Personal information patterns
    personalInfo: [
      /(?:\+91|0)?\s*[6-9]\d{9}/,  // Indian phone numbers
      /(?:whatsapp|wa|telegram|tg)\s*:?\s*[+0-9\s-]+/i,
      /(?:call|contact|reach)\s+(?:me|us)\s*:?\s*[+0-9\s-]+/i,
      /(?:my|our)\s+(?:number|phone|mobile|whatsapp)/i,
      /dm\s+me|message\s+me\s+privately/i
    ],
    
    // Harassment and abuse patterns
    harassment: [
      /(?:idiot|stupid|dumb|moron|fool)\b/i,
      /(?:shut\s+up|get\s+lost|go\s+away)/i,
      /(?:hate|despise|disgusted)\s+(?:you|people)/i,
      /(?:kill|die|death)\s+(?:yourself|you)/i,
      /(?:ugly|fat|disgusting)\b/i
    ],
    
    // Inappropriate content
    inappropriate: [
      /(?:nude|naked|sex|porn)/i,
      /(?:bitcoin|crypto)\s+(?:giveaway|airdrop)/i,
      /(?:earn|make)\s+\$?\d+k?\s+(?:daily|weekly|monthly)/i
    ]
  };

  static moderateMessage(content) {
    const violations = [];
    
    // Check for scam content
    for (const pattern of this.prohibitedPatterns.scam) {
      if (pattern.test(content)) {
        violations.push({
          type: 'scam',
          severity: 'high',
          reason: 'Potential scam or fraudulent content detected'
        });
        break;
      }
    }
    
    // Check for personal information
    for (const pattern of this.prohibitedPatterns.personalInfo) {
      if (pattern.test(content)) {
        violations.push({
          type: 'personal_info',
          severity: 'high',
          reason: 'Personal contact information sharing is prohibited'
        });
        break;
      }
    }
    
    // Check for harassment
    for (const pattern of this.prohibitedPatterns.harassment) {
      if (pattern.test(content)) {
        violations.push({
          type: 'harassment',
          severity: 'high',
          reason: 'Harassment or abusive language detected'
        });
        break;
      }
    }
    
    // Check for inappropriate content
    for (const pattern of this.prohibitedPatterns.inappropriate) {
      if (pattern.test(content)) {
        violations.push({
          type: 'inappropriate',
          severity: 'medium',
          reason: 'Inappropriate content detected'
        });
        break;
      }
    }
    
    return {
      isViolation: violations.length > 0,
      violations,
      action: violations.length > 0 ? 'block' : 'allow'
    };
  }

  static getViolationMessage(violations) {
    if (violations.length === 0) return null;
    
    const violation = violations[0]; // Show first violation
    
    const messages = {
      scam: "⚠️ Your message was blocked: Potential scam or fraudulent content detected. Please keep discussions focused on legitimate trading strategies.",
      personal_info: "⚠️ Your message was blocked: Sharing personal contact information is prohibited for your safety. Please use the platform's messaging features.",
      harassment: "⚠️ Your message was blocked: Harassment and abusive language violate our community guidelines. Please keep discussions respectful.",
      inappropriate: "⚠️ Your message was blocked: Inappropriate content detected. Please keep conversations professional and trading-focused."
    };
    
    return messages[violation.type] || "⚠️ Your message was blocked due to policy violations.";
  }
}