import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { CSVLink } from 'react-csv';
import { AuthService } from '@/services/authService';
import { Button } from '@/components/ui/button';

interface WalletAnalyticsProps {
  wallet: any;
  allTokens: string[];
  activity: any[];
}

export const WalletAnalytics: React.FC<WalletAnalyticsProps> = ({ wallet, allTokens, activity }) => {
  const [filterToken, setFilterToken] = useState('');
  const [filterType, setFilterType] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [exportData, setExportData] = useState<any[]>([]);
  const [cloudActivity, setCloudActivity] = useState<any[]>([]);

  // Filter activity for this wallet
  const filtered = activity.filter(row => {
    if (row.wallet !== wallet.address) return false;
    if (filterToken && row.token !== filterToken) return false;
    if (filterType && row.type !== filterType) return false;
    if (dateRange.from && new Date(row.date) < new Date(dateRange.from)) return false;
    if (dateRange.to && new Date(row.date) > new Date(dateRange.to)) return false;
    return true;
  });

  useEffect(() => {
    setExportData(filtered);
  }, [filtered]);

  useEffect(() => {
    (async () => {
      const user = await AuthService.getCurrentUser?.();
      if (user && user.id && AuthService.getProfile) {
        try {
          const { profile } = await AuthService.getProfile(user.id);
          if (Array.isArray(profile?.wallet_activity)) setCloudActivity(profile.wallet_activity);
        } catch {}
      }
    })();
  }, [wallet]);

  const tokenOptions = Array.from(new Set(activity.filter(a => a.wallet === wallet.address).map(a => a.token))).filter(Boolean);
  const typeOptions = ['Send', 'Receive', 'Contract', 'Transfer', 'Unknown'];
  const minDate = filtered.length ? filtered[0].date : '';
  const maxDate = filtered.length ? filtered[filtered.length - 1].date : '';

  const handleExport = () => {
    const data = JSON.stringify(activity, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-activity-${wallet.address}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const imported = JSON.parse(text);
      if (!Array.isArray(imported)) throw new Error('Invalid format');
      // Optionally sync to cloud if logged in
      const user = await AuthService.getCurrentUser?.();
      if (user && user.id && AuthService.updateProfile) {
        const { profile } = await AuthService.getProfile(user.id);
        const merged = [...imported, ...(profile?.wallet_activity || [])].slice(0, 1000);
        await AuthService.updateProfile(user.id, { wallet_activity: merged });
        setCloudActivity(merged);
      }
    } catch {}
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Wallet Analytics: {wallet.name || wallet.address}</CardTitle>
        <CardDescription>Detailed analytics for this wallet</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 mb-4 items-center">
          <div>
            <label className="mr-2">Token:</label>
            <select value={filterToken} onChange={e => setFilterToken(e.target.value)}>
              <option value="">All</option>
              {tokenOptions.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mr-2">Type:</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">All</option>
              {typeOptions.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mr-2">Date Range:</label>
            <input type="date" value={dateRange.from} min={minDate} max={maxDate} onChange={e => setDateRange(d => ({ ...d, from: e.target.value }))} />
            <span className="mx-1">-</span>
            <input type="date" value={dateRange.to} min={minDate} max={maxDate} onChange={e => setDateRange(d => ({ ...d, to: e.target.value }))} />
          </div>
          <div>
            <CSVLink data={exportData} filename={`wallet-analytics-${wallet.address}.csv`} className="px-3 py-1 rounded bg-green-500 text-white">Export CSV</CSVLink>
          </div>
          <Button onClick={handleExport} size="sm" className="bg-blue-600 text-white">Export Activity</Button>
          <label className="cursor-pointer bg-gray-200 px-3 py-1 rounded text-xs">
            Import Activity
            <input type="file" accept="application/json" onChange={handleImport} className="hidden" />
          </label>
        </div>
        <div className="h-[300px] w-full mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filtered}>
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* More granular analytics can be added here, e.g., per-token breakdown, type breakdown, etc. */}
      </CardContent>
    </Card>
  );
};
