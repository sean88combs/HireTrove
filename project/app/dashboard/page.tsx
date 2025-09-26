'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Briefcase, 
  Users, 
  FileText, 
  TrendingUp, 
  Clock,
  Star,
  ArrowRight
} from 'lucide-react';

interface DashboardStats {
  activeJobs: number;
  totalCandidates: number;
  jobsCreated: number;
  resumesScored: number;
}

interface RecentJob {
  id: string;
  title: string;
  status: string;
  candidateCount: number;
  createdAt: string;
  complianceScore?: number;
}

interface RecentCandidate {
  id: string;
  name: string;
  jobTitle: string;
  score: number;
  status: string;
  createdAt: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    activeJobs: 0,
    totalCandidates: 0,
    jobsCreated: 0,
    resumesScored: 0
  });
  
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [recentCandidates, setRecentCandidates] = useState<RecentCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading dashboard data
    const loadDashboard = async () => {
      try {
        // This would normally be API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data for demonstration
        setStats({
          activeJobs: 12,
          totalCandidates: 47,
          jobsCreated: 8,
          resumesScored: 23
        });

        setRecentJobs([
          {
            id: '1',
            title: 'Senior Frontend Developer',
            status: 'ACTIVE',
            candidateCount: 12,
            createdAt: '2024-01-15',
            complianceScore: 85
          },
          {
            id: '2',
            title: 'Product Manager',
            status: 'DRAFT',
            candidateCount: 5,
            createdAt: '2024-01-14',
            complianceScore: 92
          },
          {
            id: '3',
            title: 'UX Designer',
            status: 'ACTIVE',
            candidateCount: 8,
            createdAt: '2024-01-12'
          }
        ]);

        setRecentCandidates([
          {
            id: '1',
            name: 'Sarah Johnson',
            jobTitle: 'Senior Frontend Developer',
            score: 87,
            status: 'NEW',
            createdAt: '2024-01-15'
          },
          {
            id: '2',
            name: 'Mike Chen',
            jobTitle: 'Product Manager',
            score: 94,
            status: 'SHORTLISTED',
            createdAt: '2024-01-14'
          },
          {
            id: '3',
            name: 'Emily Rodriguez',
            jobTitle: 'UX Designer',
            score: 78,
            status: 'NEW',
            createdAt: '2024-01-13'
          }
        ]);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400';
      case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'shortlisted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'new': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome back! Here's what's happening with your hiring process.
            </p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Active Jobs"
              value={stats.activeJobs}
              target={25}
              icon={Briefcase}
              trend={12}
              subtitle="2 scheduled for this week"
              gradient="from-blue-500 to-blue-600"
            />
            <MetricCard
              title="Total Candidates"
              value={stats.totalCandidates}
              icon={Users}
              trend={8}
              subtitle="5 new this week"
              gradient="from-emerald-500 to-emerald-600"
            />
            <MetricCard
              title="Jobs Created"
              value={stats.jobsCreated}
              target={20}
              icon={FileText}
              subtitle="This billing cycle"
              gradient="from-purple-500 to-purple-600"
            />
            <MetricCard
              title="Resumes Scored"
              value={stats.resumesScored}
              target={100}
              icon={TrendingUp}
              trend={15}
              subtitle="This billing cycle"
              gradient="from-orange-500 to-orange-600"
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <QuickActions />
            </div>

            {/* Recent Jobs */}
            <div className="lg:col-span-1">
              <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Briefcase className="h-5 w-5" />
                    <span>Recent Jobs</span>
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <a href="/jobs">
                      View All
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </a>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentJobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-3 bg-white/40 dark:bg-gray-800/40 rounded-lg border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          {job.title}
                        </h3>
                        <Badge className={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-3">
                          <span>{job.candidateCount} candidates</span>
                          {job.complianceScore && (
                            <span className="flex items-center">
                              <Star className="h-3 w-3 mr-1" />
                              {job.complianceScore}%
                            </span>
                          )}
                        </div>
                        <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Recent Candidates */}
            <div className="lg:col-span-1">
              <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Recent Candidates</span>
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <a href="/candidates">
                      View All
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </a>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentCandidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="p-3 bg-white/40 dark:bg-gray-800/40 rounded-lg border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                            {candidate.name}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {candidate.jobTitle}
                          </p>
                        </div>
                        <Badge className={getStatusColor(candidate.status)}>
                          {candidate.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3" />
                          <span>{candidate.score}% match</span>
                        </div>
                        <span>{new Date(candidate.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}