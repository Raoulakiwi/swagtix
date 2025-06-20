import { splitNumberByStep } from '@/ui/utils';
import React from 'react';

interface Props {
  // isCache: boolean;
  balance: number;
}
export const BalanceLabel: React.FC<Props> = ({ balance }) => {
  const splitBalance = splitNumberByStep((balance || 0).toFixed(2));

  return (
    <div className="cursor-pointer truncate" title={splitBalance}>
      <span>${splitBalance}</span>
    </div>
  );
};
