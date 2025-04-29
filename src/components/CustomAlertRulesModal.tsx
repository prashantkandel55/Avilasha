import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bell } from 'lucide-react';

export interface AlertRule {
  id: string;
  type: 'send' | 'receive' | 'swap' | 'failed' | 'any' | 'price' | 'security';
  minAmount?: number;
  maxAmount?: number;
  token?: string;
  enabled: boolean;
  // For price alerts
  priceAbove?: number;
  priceBelow?: number;
  // For security alerts
  securityType?: 'large_withdrawal' | 'rapid_transfers' | 'failed_login';
}

interface CustomAlertRulesModalProps {
  open: boolean;
  onClose: () => void;
  rules: AlertRule[];
  setRules: (rules: AlertRule[]) => void;
}

const defaultRule = (): AlertRule => ({
  id: 'rule_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
  type: 'any',
  enabled: true,
});

const CustomAlertRulesModal: React.FC<CustomAlertRulesModalProps> = ({ open, onClose, rules, setRules }) => {
  const [editing, setEditing] = useState<AlertRule | null>(null);

  function saveRule(rule: AlertRule) {
    setRules(rules => {
      const idx = rules.findIndex(r => r.id === rule.id);
      if (idx !== -1) {
        const updated = [...rules];
        updated[idx] = rule;
        return updated;
      } else {
        return [rule, ...rules];
      }
    });
    setEditing(null);
  }

  function removeRule(id: string) {
    setRules(rules => rules.filter(r => r.id !== id));
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-2xl shadow-2xl bg-gradient-to-br from-white via-blue-50 to-purple-50 border border-primary/10 p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary drop-shadow-glow mb-2 flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" /> Custom Alert Rules
          </DialogTitle>
        </DialogHeader>
        <div className="mb-4">
          <p className="text-sm text-muted-foreground text-center">Define your own alert rules for wallet activity, price, or analytics.</p>
        </div>
        <div className="flex flex-col gap-4 mb-4 max-h-64 overflow-y-auto">
          {rules.length === 0 ? (
            <div className="text-xs text-center text-muted-foreground">No custom rules yet.</div>
          ) : rules.map(rule => (
            <div key={rule.id} className="bg-white/80 border border-gray-200 rounded-lg p-3 flex flex-col gap-1 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-primary text-xs">{rule.type}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(rule)} className="hover:bg-primary/10">Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => removeRule(rule.id)} className="hover:bg-red-100 text-red-600">Delete</Button>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {rule.enabled ? '✅' : '❌'}
                {' '}<b>{rule.type}</b>
                {rule.token && `, Token: ${rule.token}`}
                {rule.minAmount && `, Min: ${rule.minAmount}`}
                {rule.maxAmount && `, Max: ${rule.maxAmount}`}
                {rule.priceAbove && `, Price Above: ${rule.priceAbove}`}
                {rule.priceBelow && `, Price Below: ${rule.priceBelow}`}
                {rule.securityType && `, Security Event: ${rule.securityType}`}
              </span>
            </div>
          ))}
        </div>
        <div className="mb-4">
          <Button onClick={() => setEditing(defaultRule())} className="w-full bg-primary text-white rounded hover:bg-primary/90 transition">+ Add New Rule</Button>
        </div>
        {editing && (
          <div className="bg-white/90 border border-primary/20 rounded-lg p-4 shadow-lg mb-4 animate-fade-in-slow">
            <div className="grid grid-cols-1 gap-2 mb-2">
              <Label className="text-xs font-semibold">Type
                <select
                  value={editing.type}
                  onChange={e => setEditing(r => r ? { ...r, type: e.target.value as any } : r)}
                  className="mt-1 focus:ring-2 focus:ring-primary/30"
                >
                  <option value="any">Any</option>
                  <option value="send">Send</option>
                  <option value="receive">Receive</option>
                  <option value="swap">Swap</option>
                  <option value="failed">Failed</option>
                  <option value="price">Price Alert</option>
                  <option value="security">Security Alert</option>
                </select>
              </Label>
              {(editing.type === 'send' || editing.type === 'receive' || editing.type === 'swap' || editing.type === 'failed') && (
                <>
                  <Label className="text-xs font-semibold">Token
                    <Input value={editing.token || ''} onChange={e => setEditing(r => r ? { ...r, token: e.target.value } : r)} className="mt-1 focus:ring-2 focus:ring-primary/30" />
                  </Label>
                  <Label className="text-xs font-semibold">Min Amount
                    <Input type="number" value={editing.minAmount ?? ''} onChange={e => setEditing(r => r ? { ...r, minAmount: e.target.value ? Number(e.target.value) : undefined } : r)} className="mt-1 focus:ring-2 focus:ring-primary/30" placeholder="(optional)" min="0" />
                  </Label>
                  <Label className="text-xs font-semibold">Max Amount
                    <Input type="number" value={editing.maxAmount ?? ''} onChange={e => setEditing(r => r ? { ...r, maxAmount: e.target.value ? Number(e.target.value) : undefined } : r)} className="mt-1 focus:ring-2 focus:ring-primary/30" placeholder="(optional)" min="0" />
                  </Label>
                </>
              )}
              {editing.type === 'price' && (
                <>
                  <Label className="text-xs font-semibold">Token
                    <Input value={editing.token || ''} onChange={e => setEditing(r => r ? { ...r, token: e.target.value } : r)} className="mt-1 focus:ring-2 focus:ring-primary/30" />
                  </Label>
                  <Label className="text-xs font-semibold">Price Above ($)
                    <Input type="number" value={editing.priceAbove ?? ''} onChange={e => setEditing(r => r ? { ...r, priceAbove: e.target.value ? Number(e.target.value) : undefined } : r)} className="mt-1 focus:ring-2 focus:ring-primary/30" placeholder="(optional)" min="0" />
                  </Label>
                  <Label className="text-xs font-semibold">Price Below ($)
                    <Input type="number" value={editing.priceBelow ?? ''} onChange={e => setEditing(r => r ? { ...r, priceBelow: e.target.value ? Number(e.target.value) : undefined } : r)} className="mt-1 focus:ring-2 focus:ring-primary/30" placeholder="(optional)" min="0" />
                  </Label>
                </>
              )}
              {editing.type === 'security' && (
                <Label className="text-xs font-semibold">Security Event
                  <select
                    value={editing.securityType || 'large_withdrawal'}
                    onChange={e => setEditing(r => r ? { ...r, securityType: e.target.value as any } : r)}
                    className="mt-1 focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="large_withdrawal">Large Withdrawal</option>
                    <option value="rapid_transfers">Rapid Transfers</option>
                    <option value="failed_login">Failed Login</option>
                  </select>
                </Label>
              )}
              <Label className="text-xs font-semibold">Enabled
                <Input type="checkbox" checked={editing.enabled} onChange={e => setEditing(r => r ? { ...r, enabled: e.target.checked } : r)} />
              </Label>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <Button size="sm" variant="ghost" onClick={() => setEditing(null)} className="hover:bg-primary/10">Cancel</Button>
              <Button size="sm" className="bg-primary text-white rounded hover:bg-primary/90" onClick={() => saveRule(editing)}>Save</Button>
            </div>
          </div>
        )}
        <DialogFooter className="flex justify-end mt-2">
          <Button variant="ghost" onClick={onClose} className="transition hover:bg-primary/10">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomAlertRulesModal;
