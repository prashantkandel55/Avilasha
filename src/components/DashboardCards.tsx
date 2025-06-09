import React from 'react';
import { ArrowUp, ArrowDown, RefreshCw, Star, Gem, Award, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number | React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const StatCard = ({ title, value, subtitle, icon, className }: StatCardProps) => (
  <div className={cn(
    "stat-card rounded-xl bg-gradient-to-br from-card via-card/90 to-card/80 shadow-lg hover:shadow-xl transition-shadow border border-primary/10 p-5 flex flex-col gap-2 group",
    className
  )}>
    <div className="flex justify-between items-start mb-2">
      <h3 className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">{title}</h3>
      {icon}
    </div>
    <div className="text-2xl font-semibold mb-1 group-hover:text-primary transition-colors animate-fade-in gold-gradient-text">
      {value}
    </div>
    {subtitle && <div className="text-sm text-muted-foreground group-hover:text-primary/80 transition-colors">{subtitle}</div>}
  </div>
);

export const PortfolioStatsRow = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Total Balance"
        value="$12,345.67"
        subtitle={
          <div className="flex items-center text-green-500">
            <ArrowUp size={14} className="mr-1" />
            <span>+2.4% today</span>
          </div>
        }
        icon={<RefreshCw size={16} className="text-primary cursor-pointer hover:text-primary transition-colors" />}
      />
      <StatCard
        title="Portfolio Performance"
        value="+15.8%"
        subtitle={
          <div className="flex items-center text-green-500">
            <span>this month</span>
          </div>
        }
        icon={<TrendingUp size={16} className="text-primary" />}
      />
      <StatCard
        title="Active Coins"
        value="8"
        subtitle={
          <div className="flex items-center text-green-500">
            <ArrowUp size={14} className="mr-1" />
            <span>+2 added this week</span>
          </div>
        }
        icon={<Gem size={16} className="text-primary" />}
      />
      <StatCard
        title="Starred Assets"
        value={<span className="flex items-center gap-1"><Star className="w-4 h-4 text-primary animate-bounce" /> 3</span>}
        subtitle={<span>Favorites</span>}
        icon={<Award size={16} className="text-primary" />}
      />
    </div>
  );
};

export default PortfolioStatsRow;