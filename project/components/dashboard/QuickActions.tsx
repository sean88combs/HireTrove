'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Upload, MessageSquare, FileCheck } from 'lucide-react';

const quickActions = [
  {
    title: 'Create Job',
    description: 'Write a new job description with AI assistance',
    icon: Plus,
    href: '/jobs/new',
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    title: 'Upload Resume',
    description: 'Upload and score candidate resumes',
    icon: Upload,
    href: '/candidates/upload',
    gradient: 'from-emerald-500 to-emerald-600'
  },
  {
    title: 'Interview Guide',
    description: 'Generate structured interview questions',
    icon: MessageSquare,
    href: '/interviews/new',
    gradient: 'from-purple-500 to-purple-600'
  },
  {
    title: 'Bias Checker',
    description: 'Check job descriptions for bias and compliance',
    icon: FileCheck,
    href: '/bias-checker',
    gradient: 'from-orange-500 to-orange-600'
  }
];

export function QuickActions() {
  return (
    <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Quick Actions</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-200"
                asChild
              >
                <a href={action.href}>
                  <div className={`p-3 bg-gradient-to-br ${action.gradient} rounded-lg shadow-sm`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-sm">{action.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {action.description}
                    </div>
                  </div>
                </a>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}