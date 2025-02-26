
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  icon, 
  change, 
  trend = 'neutral',
  className 
}: StatCardProps) {
  return (
    <div className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm p-4 transition-all duration-300 hover:shadow-md animate-scale-in",
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          
          {change && (
            <div className="flex items-center mt-1">
              <span className={cn(
                "text-xs font-medium",
                trend === 'up' && "text-green-500",
                trend === 'down' && "text-red-500"
              )}>
                {change}
              </span>
            </div>
          )}
        </div>
        
        <div className="p-2 rounded-full bg-primary/10">
          {icon}
        </div>
      </div>
    </div>
  );
}
