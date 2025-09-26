export interface ScrubResult {
  scrubbed_text: string;
  redactions: Array<{
    type: string;
    original: string;
    placeholder: string;
    position: number;
  }>;
}

// Common PII patterns
const PII_PATTERNS = {
  email: {
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    placeholder: '[EMAIL_REDACTED]'
  },
  phone: {
    regex: /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
    placeholder: '[PHONE_REDACTED]'
  },
  ssn: {
    regex: /\b(?:\d{3}[-.\s]?\d{2}[-.\s]?\d{4}|\d{9})\b/g,
    placeholder: '[SSN_REDACTED]'
  },
  name: {
    // Common name patterns - this is a simplified approach
    regex: /\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)?\b/g,
    placeholder: '[NAME_REDACTED]'
  },
  address: {
    // Street addresses with numbers
    regex: /\b\d+\s+[A-Za-z\s]{3,}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl)\b/gi,
    placeholder: '[ADDRESS_REDACTED]'
  },
  url: {
    // URLs that might contain personal info
    regex: /https?:\/\/[^\s]+/g,
    placeholder: '[URL_REDACTED]'
  },
  dateOfBirth: {
    // Date patterns that might be DOB
    regex: /\b(?:0?[1-9]|1[0-2])[\/\-.](?:0?[1-9]|[12][0-9]|3[01])[\/\-.](?:19|20)\d{2}\b/g,
    placeholder: '[DATE_REDACTED]'
  }
};

export function scrubPII(text: string): ScrubResult {
  let scrubbedText = text;
  const redactions: ScrubResult['redactions'] = [];

  // Apply each PII pattern
  Object.entries(PII_PATTERNS).forEach(([type, pattern]) => {
    let match;
    while ((match = pattern.regex.exec(text)) !== null) {
      redactions.push({
        type,
        original: match[0],
        placeholder: pattern.placeholder,
        position: match.index
      });
    }
    
    // Replace all matches with placeholders
    scrubbedText = scrubbedText.replace(pattern.regex, pattern.placeholder);
    
    // Reset regex lastIndex for global patterns
    pattern.regex.lastIndex = 0;
  });

  return {
    scrubbed_text: scrubbedText,
    redactions
  };
}

// Additional utility to check if text contains PII
export function containsPII(text: string): boolean {
  return Object.values(PII_PATTERNS).some(pattern => {
    pattern.regex.lastIndex = 0;
    return pattern.regex.test(text);
  });
}