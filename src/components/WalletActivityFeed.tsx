import React, { useMemo, useState } from 'react';
import { walletManager, WalletTransaction } from '@/services/wallet-manager';
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Star, Gift, Search } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { format, isWithinInterval, parseISO, startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from 'date-fns';

interface WalletActivityFeedProps {
  walletId: string;
  limit?: number;
}

const typeIcon = (type: WalletTransaction['type']) => {
  switch (type) {
    case 'receive': return <ArrowDownLeft className="text-green-500" />;
    case 'send': return <ArrowUpRight className="text-red-500" />;
    case 'swap': return <RefreshCw className="text-blue-500" />;
    case 'claim': return <Gift className="text-yellow-500" />;
    case 'stake': return <Star className="text-purple-500" />;
    case 'unstake': return <Star className="text-gray-500" />;
    default: return <RefreshCw />;
  }
};

const ALL_TYPES = ['all', 'send', 'receive', 'swap', 'stake', 'unstake', 'claim'];
const ALL_STATUS = ['all', 'completed', 'pending', 'failed'];

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1', '#a4de6c', '#d0ed57', '#fa8072', '#b0e0e6', '#f08080'
];

const AGG_OPTIONS = [
  { label: 'Daily', value: 'day' },
  { label: 'Weekly', value: 'week' },
  { label: 'Monthly', value: 'month' },
];

function exportToCSV(transactions: WalletTransaction[]) {
  const headers = ['id', 'type', 'status', 'amount', 'token', 'from', 'to', 'timestamp', 'notes'];
  const rows = transactions.map(tx => [
    tx.id, tx.type, tx.status, tx.amount, tx.token, tx.from, tx.to, new Date(tx.timestamp).toISOString(), tx.notes || ''
  ]);
  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, 'wallet_activity.csv');
}

function exportToJSON(transactions: WalletTransaction[]) {
  const blob = new Blob([JSON.stringify(transactions, null, 2)], { type: 'application/json' });
  saveAs(blob, 'wallet_activity.json');
}

const WalletActivityFeed: React.FC<WalletActivityFeedProps> = ({ walletId, limit = 10 }) => {
  const [typeFilter, setTypeFilter] = useState<'all' | WalletTransaction['type']>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | WalletTransaction['status']>('all');
  const [search, setSearch] = useState('');
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [agg, setAgg] = useState<'day' | 'week' | 'month'>('day');
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const [showTxModal, setShowTxModal] = useState<WalletTransaction | null>(null);

  const transactions = useMemo(() => walletManager.getTransactionHistory(walletId), [walletId]);

  // --- Date Range Filtering ---
  const filteredByDate = useMemo(() => {
    if (!dateRange) return transactions;
    return transactions.filter(tx => {
      const txDate = new Date(tx.timestamp);
      return isWithinInterval(txDate, {
        start: parseISO(dateRange.start),
        end: parseISO(dateRange.end),
      });
    });
  }, [transactions, dateRange]);

  // --- Token Drilldown ---
  const filteredByToken = useMemo(() => {
    if (!selectedToken) return filteredByDate;
    return filteredByDate.filter(tx => tx.token === selectedToken);
  }, [filteredByDate, selectedToken]);

  // --- Date Drilldown ---
  const filteredByDay = useMemo(() => {
    if (!selectedDate) return filteredByToken;
    return filteredByToken.filter(tx => format(new Date(tx.timestamp), 'yyyy-MM-dd') === selectedDate);
  }, [filteredByToken, selectedDate]);

  // --- Aggregation Logic ---
  const activityOverTime = useMemo(() => {
    const aggMap: Record<string, { label: string, sent: number, received: number, count: number }> = {};
    filteredByToken.forEach(tx => {
      let label;
      const date = new Date(tx.timestamp);
      if (agg === 'day') label = format(date, 'yyyy-MM-dd');
      else if (agg === 'week') label = format(startOfWeek(date), 'yyyy-MM-dd');
      else label = format(startOfMonth(date), 'yyyy-MM');
      if (!aggMap[label]) aggMap[label] = { label, sent: 0, received: 0, count: 0 };
      if (tx.type === 'send') aggMap[label].sent += tx.amount;
      if (tx.type === 'receive') aggMap[label].received += tx.amount;
      aggMap[label].count++;
    });
    return Object.values(aggMap).sort((a, b) => a.label.localeCompare(b.label));
  }, [filteredByToken, agg]);

  // --- Token Breakdown for Pie Chart ---
  const tokenBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredByDate.forEach(tx => {
      map[tx.token] = (map[tx.token] || 0) + tx.amount;
    });
    return Object.entries(map).map(([token, value]) => ({ token, value }));
  }, [filteredByDate]);

  // --- Token Trend Chart ---
  const tokenTrend = useMemo(() => {
    if (!selectedToken) return [];
    const tokenTxs = filteredByDate.filter(tx => tx.token === selectedToken);
    const map: Record<string, { label: string, value: number }> = {};
    tokenTxs.forEach(tx => {
      let label;
      const date = new Date(tx.timestamp);
      if (agg === 'day') label = format(date, 'yyyy-MM-dd');
      else if (agg === 'week') label = format(startOfWeek(date), 'yyyy-MM-dd');
      else label = format(startOfMonth(date), 'yyyy-MM');
      if (!map[label]) map[label] = { label, value: 0 };
      map[label].value += tx.amount;
    });
    return Object.values(map).sort((a, b) => a.label.localeCompare(b.label));
  }, [filteredByDate, selectedToken, agg]);

  // --- Chart Download Helper ---
  async function downloadChartAsImage(id: string, name: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const canvas = await html2canvas(el);
    canvas.toBlob(blob => {
      if (blob) saveAs(blob, `${name}.png`);
    });
  }

  // --- Analytics ---
  const analytics = useMemo(() => {
    const sent = transactions.filter(tx => tx.type === 'send').reduce((sum, tx) => sum + tx.amount, 0);
    const received = transactions.filter(tx => tx.type === 'receive').reduce((sum, tx) => sum + tx.amount, 0);
    const mostUsedToken = transactions.length ? transactions.reduce((a, b) => {
      const aCount = transactions.filter(tx => tx.token === a.token).length;
      const bCount = transactions.filter(tx => tx.token === b.token).length;
      return aCount > bCount ? a : b;
    }).token : '-';
    return { sent, received, mostUsedToken, count: transactions.length };
  }, [transactions]);

  return (
    <div className="rounded-xl border p-4 bg-background shadow-sm">
      <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
      {/* Date Range Picker */}
      <div className="flex flex-wrap gap-2 mb-2 items-center">
        <label className="text-xs">Date Range:</label>
        <input type="date" value={dateRange?.start || ''} onChange={e => setDateRange(r => ({ ...r, start: e.target.value }))} className="border rounded px-2 py-1 text-xs" />
        <span>-</span>
        <input type="date" value={dateRange?.end || ''} onChange={e => setDateRange(r => ({ ...r, end: e.target.value }))} className="border rounded px-2 py-1 text-xs" />
        <button className="text-xs underline text-muted-foreground" onClick={() => setDateRange(null)}>Clear</button>
        <button className="text-xs underline text-muted-foreground" onClick={() => setDateRange({ start: format(startOfDay(new Date(Date.now() - 7*24*60*60*1000)), 'yyyy-MM-dd'), end: format(endOfDay(new Date()), 'yyyy-MM-dd') })}>Last 7d</button>
        <button className="text-xs underline text-muted-foreground" onClick={() => setDateRange({ start: format(startOfDay(new Date(Date.now() - 30*24*60*60*1000)), 'yyyy-MM-dd'), end: format(endOfDay(new Date()), 'yyyy-MM-dd') })}>Last 30d</button>
      </div>
      {/* Aggregation Toggle */}
      <div className="flex flex-wrap gap-2 mb-2 items-center">
        <label className="text-xs">Aggregate by:</label>
        {AGG_OPTIONS.map(opt => (
          <button key={opt.value} className={`text-xs px-2 py-1 rounded border ${agg === opt.value ? 'bg-primary text-white' : 'bg-muted'}`} onClick={() => setAgg(opt.value as any)}>{opt.label}</button>
        ))}
      </div>
      {/* Analytics Summary */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs">
        <div className="bg-muted rounded px-3 py-1">Total Sent: <span className="font-bold text-red-500">{analytics.sent}</span></div>
        <div className="bg-muted rounded px-3 py-1">Total Received: <span className="font-bold text-green-600">{analytics.received}</span></div>
        <div className="bg-muted rounded px-3 py-1">Most Used Token: <span className="font-bold">{analytics.mostUsedToken}</span></div>
        <div className="bg-muted rounded px-3 py-1">Total Transactions: <span className="font-bold">{analytics.count}</span></div>
      </div>
      {/* Advanced Analytics: Charts */}
      <div className="flex flex-wrap gap-6 mb-6">
        <div className="w-full md:w-1/2 h-56">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold mb-2">Activity Over Time</h3>
            <button className="text-xs underline" onClick={() => downloadChartAsImage('activity-chart', 'activity_over_time')}>Download as PNG</button>
          </div>
          <div id="activity-chart" className="bg-white rounded">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={activityOverTime} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sent" stroke="#ef4444" name="Sent" />
                <Line type="monotone" dataKey="received" stroke="#22c55e" name="Received" />
                <Line type="monotone" dataKey="count" stroke="#6366f1" name="Count" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="w-full md:w-1/2 h-56">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold mb-2">Per-Token Breakdown</h3>
            <button className="text-xs underline" onClick={() => downloadChartAsImage('token-chart', 'token_breakdown')}>Download as PNG</button>
          </div>
          <div id="token-chart" className="bg-white rounded">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={tokenBreakdown} dataKey="value" nameKey="token" cx="50%" cy="50%" outerRadius={48} label onClick={(_, idx) => setSelectedToken(tokenBreakdown[idx]?.token)}>
                  {tokenBreakdown.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {/* Token Trend Chart (when token selected) */}
      {selectedToken && (
        <div className="w-full h-56 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold mb-2">{selectedToken} Trend Over Time</h3>
            <button className="text-xs underline" onClick={() => setSelectedToken(null)}>Clear Token</button>
            <button className="text-xs underline" onClick={() => downloadChartAsImage('token-trend-chart', `${selectedToken}_trend`)}>Download as PNG</button>
          </div>
          <div id="token-trend-chart" className="bg-white rounded">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={tokenTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#6366f1" name={selectedToken} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      {/* Export Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          className="border rounded px-3 py-1 text-xs hover:bg-muted"
          onClick={() => exportToCSV(filteredByDay)}
        >Export CSV</button>
        <button
          className="border rounded px-3 py-1 text-xs hover:bg-muted"
          onClick={() => exportToJSON(filteredByDay)}
        >Export JSON</button>
      </div>
      {/* Filters & Search */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="border rounded px-2 py-1 text-xs">
          {ALL_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="border rounded px-2 py-1 text-xs">
          {ALL_STATUS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border rounded px-2 py-1 text-xs pl-7"
            placeholder="Search token, address, notes..."
          />
          <Search className="absolute left-1 top-1.5 w-4 h-4 text-muted-foreground" />
        </div>
      </div>
      {/* Feed List */}
      {filteredByDay.length === 0 ? (
        <div className="text-muted-foreground text-center p-4">No activity found</div>
      ) : (
        <ul className="divide-y divide-border">
          {filteredByDay.map(tx => (
            <li key={tx.id} className="flex items-center gap-3 py-3 cursor-pointer hover:bg-muted/50" onClick={() => setShowTxModal(tx)}>
              <div className="flex-shrink-0">{typeIcon(tx.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</span>
                  <span className="text-xs text-muted-foreground">{new Date(tx.timestamp).toLocaleString()}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {tx.amount} {tx.token} {tx.type === 'send' ? 'to' : 'from'} {tx.type === 'send' ? tx.to : tx.from}
                </div>
                {tx.notes && <div className="text-xs text-muted-foreground italic">{tx.notes}</div>}
              </div>
              <div className="text-xs px-2 py-1 rounded font-medium capitalize"
                style={{ backgroundColor: tx.status === 'completed' ? '#d1fae5' : tx.status === 'pending' ? '#fef9c3' : '#fee2e2', color: tx.status === 'completed' ? '#065f46' : tx.status === 'pending' ? '#92400e' : '#991b1b' }}>
                {tx.status}
              </div>
            </li>
          ))}
        </ul>
      )}
      {/* Transaction Detail Modal */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl p-6 min-w-[300px] max-w-[90vw] relative">
            <button className="absolute top-2 right-2 text-lg" onClick={() => setShowTxModal(null)}>&times;</button>
            <h3 className="font-bold mb-2">Transaction Details</h3>
            <div className="text-xs mb-1"><b>ID:</b> {showTxModal.id}</div>
            <div className="text-xs mb-1"><b>Type:</b> {showTxModal.type}</div>
            <div className="text-xs mb-1"><b>Status:</b> {showTxModal.status}</div>
            <div className="text-xs mb-1"><b>Amount:</b> {showTxModal.amount} {showTxModal.token}</div>
            <div className="text-xs mb-1"><b>From:</b> {showTxModal.from}</div>
            <div className="text-xs mb-1"><b>To:</b> {showTxModal.to}</div>
            <div className="text-xs mb-1"><b>Timestamp:</b> {new Date(showTxModal.timestamp).toLocaleString()}</div>
            {showTxModal.notes && <div className="text-xs mb-1"><b>Notes:</b> {showTxModal.notes}</div>}
            <div className="flex gap-2 mt-3">
              <button className="border rounded px-2 py-1 text-xs hover:bg-muted" onClick={() => {navigator.clipboard.writeText(showTxModal.id)}}>Copy Tx ID</button>
              <a className="border rounded px-2 py-1 text-xs hover:bg-muted" href={`https://etherscan.io/tx/${showTxModal.id}`} target="_blank" rel="noopener noreferrer">View on Explorer</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletActivityFeed;
