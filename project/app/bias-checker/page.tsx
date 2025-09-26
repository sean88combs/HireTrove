'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Gem, ArrowRight, CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';

interface ComplianceIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestion: string;
  highlighted_text: string;
}

interface ComplianceResult {
  score: number;
  issues: ComplianceIssue[];
  highlighted_text: string;
  overall_assessment: string;
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export default function BiasChecker() {
  const [text, setText] = useState('');
  const [state, setState] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [error, setError] = useState('');
  const [rateLimited, setRateLimited] = useState(false);

  const handleCheck = async () => {
    if (text.trim().length < 10) {
      setError('Please enter at least 10 characters of job description text.');
      return;
    }

    setLoading(true);
    setError('');
    setRateLimited(false);
    setResult(null);

    try {
      const response = await fetch('/api/public/bias-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, state }),
      });

      if (response.status === 429) {
        setRateLimited(true);
        const data = await response.json();
        setError(data.message || 'Rate limit exceeded. Please try again later.');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to check for bias');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('An error occurred while checking for bias. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'high': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'medium': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default: return <CheckCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800';
      case 'high': return 'border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800';
      case 'medium': return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'low': return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800';
      default: return 'border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg shadow-sm">
                <Gem className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  HireTrove Bias Checker
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Free compliance and bias detection for job descriptions
                </p>
              </div>
            </div>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-700 hover:to-emerald-700">
                Sign Up Free
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Check Your Job Descriptions for Bias & Compliance Issues
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Ensure your job postings are inclusive, compliant with EEOC guidelines, and follow state pay transparency laws.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Job Description Text</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste your job description here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[200px] bg-white/50 dark:bg-gray-800/50"
                disabled={loading}
              />
              
              <div className="flex items-center space-x-4">
                <Select value={state} onValueChange={setState} disabled={loading}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select state (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button
                  onClick={handleCheck}
                  disabled={loading || text.trim().length < 10}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-700 hover:to-emerald-700"
                >
                  {loading ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      Check for Bias & Compliance
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>

              {error && (
                <Alert variant={rateLimited ? "destructive" : "default"}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
            <CardHeader>
              <CardTitle>Compliance Results</CardTitle>
            </CardHeader>
            <CardContent>
              {!result && !loading && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  Enter job description text and click "Check" to see results
                </div>
              )}

              {loading && (
                <div className="text-center py-12">
                  <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Analyzing your job description...</p>
                </div>
              )}

              {result && (
                <div className="space-y-6">
                  {/* Score */}
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${getScoreColor(result.score)}`}>
                      {result.score}/100
                    </div>
                    <Progress value={result.score} className="mt-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {result.overall_assessment}
                    </p>
                  </div>

                  {/* Issues */}
                  {result.issues.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        Issues Found ({result.issues.length})
                      </h3>
                      <div className="space-y-2">
                        {result.issues.slice(0, 5).map((issue, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg border ${getSeverityColor(issue.severity)}`}
                          >
                            <div className="flex items-start space-x-2">
                              {getSeverityIcon(issue.severity)}
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <Badge variant={issue.severity === 'critical' ? 'destructive' : 'secondary'}>
                                    {issue.severity.toUpperCase()}
                                  </Badge>
                                  <span className="text-xs text-gray-500">{issue.type.replace('_', ' ')}</span>
                                </div>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                                  {issue.message}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {issue.suggestion}
                                </p>
                                {issue.highlighted_text && (
                                  <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                                    "{issue.highlighted_text}"
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {result.issues.length > 5 && (
                        <p className="text-xs text-gray-500 text-center">
                          And {result.issues.length - 5} more issues...
                        </p>
                      )}
                    </div>
                  )}

                  {/* CTA */}
                  <Card className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 border border-blue-200 dark:border-blue-800">
                    <CardContent className="p-4 text-center">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Want to fix these issues automatically?
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        HireTrove can generate compliant, bias-free job descriptions with AI assistance.
                      </p>
                      <Link href="/signup">
                        <Button className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-700 hover:to-emerald-700">
                          Try HireTrove Free
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
            Why Use HireTrove?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">EEOC Compliant</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Automatically detect and fix bias that could lead to discrimination claims
              </p>
            </div>
            <div className="p-6">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <Gem className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">AI-Powered</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Generate better job descriptions that attract diverse, qualified candidates
              </p>
            </div>
            <div className="p-6">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">State Laws</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Stay compliant with pay transparency requirements in your state
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}