// Simple global selected wallet state (can be replaced with Zustand, Redux, etc.)

import { WalletConnection } from './wallet-manager';

let selectedWallet: WalletConnection | null = null;
let listeners: ((wallet: WalletConnection | null) => void)[] = [];

export function setSelectedWallet(wallet: WalletConnection | null) {
  selectedWallet = wallet;
  listeners.forEach((cb) => cb(wallet));
}

export function getSelectedWallet(): WalletConnection | null {
  return selectedWallet;
}

export function subscribeSelectedWallet(cb: (wallet: WalletConnection | null) => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((fn) => fn !== cb);
  };
}
