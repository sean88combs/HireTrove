'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  target?: number;
  icon: LucideIcon;
  trend?: number;
  subtitle?: string;
  gradient?: string;
}

export function MetricCard({ 
  title, 
  value, 
  target, 
  icon: Icon, 
  trend, 
  subtitle,
  gradient = 'from-blue-500 to-emerald-500'
}: MetricCardProps) {
  const progress = target ? (value / target) * 100 : 0;
  
  return (
    <Card className="relative overflow-hidden bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-200">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`} />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </CardTitle>
        <div className={`p-2 bg-gradient-to-br ${gradient} rounded-lg shadow-sm`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-baseline space-x-2">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {value.toLocaleString()}
            </div>
            {trend !== undefined && (
              <div className={`text-sm font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {trend >= 0 ? '+' : ''}{trend}%
              </div>
            )}
          </div>
          
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
          
          {target && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}