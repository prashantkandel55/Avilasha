
import React from 'react';
import { ArrowUp, ArrowDown, RefreshCw, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const StatCard = ({ title, value, subtitle, icon, className }: StatCardProps) => (
  <div className={cn("stat-card", className)}>
    <div className="flex justify-between items-start mb-2">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      {icon}
    </div>
    <div className="text-2xl font-semibold mb-1">{value}</div>
    {subtitle && <div className="text-sm">{subtitle}</div>}
  </div>
);

export const PortfolioStatsRow = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Total Balance"
        value="$12,345.67"
        subtitle={
          <div className="flex items-center text-success-500">
            <ArrowUp size={14} className="mr-1" />
            <span>+2.4% today</span>
          </div>
        }
        icon={<RefreshCw size={16} className="text-muted-foreground cursor-pointer hover:text-primary transition-colors" />}
      />
      
      <StatCard
        title="Portfolio Performance"
        value="+15.8%"
        subtitle={
          <div className="flex items-center text-success-500">
            <span>this month</span>
          </div>
        }
      />
      
      <StatCard
        title="Active Coins"
        value="8"
        subtitle={
          <div className="flex items-center text-success-500">
            <ArrowUp size={14} className="mr-1" />
            <span>+2 added this week</span>
          </div>
        }
      />
      
      <StatCard
        title="Reward Points"
        value="150"
        subtitle={
          <div className="flex items-center text-yellow-500">
            <Star size={14} className="mr-1 fill-yellow-500" />
            <span>Level 2</span>
          </div>
        }
      />
    </div>
  );
};

export default PortfolioStatsRow;
