import React from 'react';

interface NetworkIconProps {
  chain: string;
  size?: number;
}

const icons: Record<string, string> = {
  ethereum: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  solana: 'https://cryptologos.cc/logos/solana-sol-logo.png',
  sui: 'https://raw.githubusercontent.com/MystenLabs/sui/main/doc/static/logo.png',
};

const NetworkIcon: React.FC<NetworkIconProps> = ({ chain, size = 20 }) => {
  const src = icons[chain.toLowerCase()] || '';
  if (!src) return null;
  return (
    <img src={src} alt={`${chain} logo`} width={size} height={size} className="inline-block rounded-full mr-2" />
  );
};

export default NetworkIcon;
