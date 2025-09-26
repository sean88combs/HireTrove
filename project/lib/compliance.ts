import { scrubPII } from './scrubPII';

export interface ComplianceIssue {
  type: 'bias' | 'legal' | 'pay_transparency' | 'accessibility' | 'inclusive_language';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestion: string;
  highlighted_text: string;
  position: number;
}

export interface ComplianceResult {
  score: number; // 0-100
  issues: ComplianceIssue[];
  highlighted_text: string;
  overall_assessment: string;
}

// Bias terms and problematic language patterns
const BIAS_PATTERNS = [
  // Age bias
  { pattern: /young|energetic|recent grad|digital native/gi, type: 'bias', severity: 'high', message: 'May exclude older candidates' },
  { pattern: /mature|experienced professional/gi, type: 'bias', severity: 'medium', message: 'May exclude younger candidates' },
  
  // Gender bias
  { pattern: /guys|manpower|craftsman/gi, type: 'bias', severity: 'high', message: 'Use gender-neutral language' },
  { pattern: /aggressive|dominant|competitive/gi, type: 'bias', severity: 'medium', message: 'May discourage women applicants' },
  { pattern: /nurturing|supportive|collaborative/gi, type: 'bias', severity: 'low', message: 'Ensure balanced language' },
  
  // Cultural bias
  { pattern: /native speaker|perfect english/gi, type: 'bias', severity: 'high', message: 'May discriminate based on origin' },
  
  // Disability bias
  { pattern: /must be able to stand|perfect vision|no medical conditions/gi, type: 'bias', severity: 'critical', message: 'May violate ADA requirements' },
  
  // Socioeconomic bias
  { pattern: /ivy league|prestigious university|top-tier/gi, type: 'bias', severity: 'medium', message: 'May exclude qualified candidates' }
];

const LEGAL_REQUIREMENTS = [
  // EEOC compliance
  { pattern: /no criminal background|clean record/gi, type: 'legal', severity: 'high', message: 'May violate EEOC guidelines on background checks' },
  
  // Family status
  { pattern: /single|married|children|family status/gi, type: 'legal', severity: 'critical', message: 'Cannot inquire about family status' },
  
  // Protected characteristics
  { pattern: /religion|political|race|ethnicity|sexual orientation/gi, type: 'legal', severity: 'critical', message: 'Cannot specify protected characteristics' }
];

const PAY_TRANSPARENCY_KEYWORDS = [
  'salary', 'compensation', 'pay range', 'wage', '$', 'hourly rate', 'benefits'
];

export async function runComplianceCheck(text: string, state?: string): Promise<ComplianceResult> {
  // First scrub PII to protect privacy
  const { scrubbed_text } = scrubPII(text);
  
  const issues: ComplianceIssue[] = [];
  let score = 100;
  let highlightedText = text;

  // Check for bias patterns
  BIAS_PATTERNS.forEach(pattern => {
    const matches = Array.from(scrubbed_text.matchAll(pattern.pattern));
    matches.forEach(match => {
      if (match.index !== undefined) {
        issues.push({
          type: pattern.type as any,
          severity: pattern.severity as any,
          message: pattern.message,
          suggestion: getSuggestionForPattern(match[0]),
          highlighted_text: match[0],
          position: match.index
        });
        score -= getSeverityPenalty(pattern.severity);
      }
    });
  });

  // Check for legal issues
  LEGAL_REQUIREMENTS.forEach(pattern => {
    const matches = Array.from(scrubbed_text.matchAll(pattern.pattern));
    matches.forEach(match => {
      if (match.index !== undefined) {
        issues.push({
          type: pattern.type as any,
          severity: pattern.severity as any,
          message: pattern.message,
          suggestion: 'Remove this requirement and consult legal team',
          highlighted_text: match[0],
          position: match.index
        });
        score -= getSeverityPenalty(pattern.severity);
      }
    });
  });

  // Check pay transparency (state-specific)
  const hasPayInfo = PAY_TRANSPARENCY_KEYWORDS.some(keyword => 
    scrubbed_text.toLowerCase().includes(keyword)
  );

  if (!hasPayInfo && isPayTransparencyRequired(state)) {
    issues.push({
      type: 'pay_transparency',
      severity: 'high',
      message: `${state} requires salary range disclosure`,
      suggestion: 'Add salary range or compensation information',
      highlighted_text: '',
      position: 0
    });
    score -= 20;
  }

  // Check for inclusive language
  const inclusivityScore = checkInclusiveLanguage(scrubbed_text);
  score = Math.min(score, inclusivityScore);

  // Add highlighting
  issues.forEach(issue => {
    if (issue.highlighted_text) {
      const regex = new RegExp(`\\b${escapeRegExp(issue.highlighted_text)}\\b`, 'gi');
      highlightedText = highlightedText.replace(regex, 
        `<mark class="compliance-issue ${issue.severity}">${issue.highlighted_text}</mark>`
      );
    }
  });

  const overallAssessment = getOverallAssessment(score, issues);

  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    highlighted_text: highlightedText,
    overall_assessment: overallAssessment
  };
}

function getSeverityPenalty(severity: string): number {
  switch (severity) {
    case 'critical': return 25;
    case 'high': return 15;
    case 'medium': return 10;
    case 'low': return 5;
    default: return 0;
  }
}

function getSuggestionForPattern(text: string): string {
  const suggestions: { [key: string]: string } = {
    'guys': 'Use "team", "everyone", or "folks"',
    'manpower': 'Use "workforce" or "staff"',
    'craftsman': 'Use "artisan" or "skilled worker"',
    'young': 'Focus on specific skills needed',
    'energetic': 'Specify the actual requirements',
    'aggressive': 'Use "proactive" or "results-driven"',
    'dominant': 'Use "leadership" or "influential"',
    'native speaker': 'Specify communication requirements clearly'
  };
  
  return suggestions[text.toLowerCase()] || 'Consider more inclusive language';
}

function isPayTransparencyRequired(state?: string): boolean {
  const requireStates = ['CA', 'CO', 'CT', 'MD', 'NV', 'NY', 'RI', 'WA'];
  return state ? requireStates.includes(state.toUpperCase()) : false;
}

function checkInclusiveLanguage(text: string): number {
  const inclusiveTerms = ['diverse', 'inclusive', 'all backgrounds', 'equal opportunity'];
  const exclusiveTerms = ['culture fit', 'best and brightest', 'rockstar', 'ninja'];
  
  let score = 80; // Base score
  
  inclusiveTerms.forEach(term => {
    if (text.toLowerCase().includes(term)) score += 5;
  });
  
  exclusiveTerms.forEach(term => {
    if (text.toLowerCase().includes(term)) score -= 10;
  });
  
  return Math.max(0, Math.min(100, score));
}

function getOverallAssessment(score: number, issues: ComplianceIssue[]): string {
  if (score >= 90) {
    return 'Excellent compliance - minimal issues detected';
  } else if (score >= 75) {
    return 'Good compliance - minor improvements recommended';
  } else if (score >= 60) {
    return 'Fair compliance - several issues need attention';
  } else {
    return 'Poor compliance - major revisions required';
  }
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}