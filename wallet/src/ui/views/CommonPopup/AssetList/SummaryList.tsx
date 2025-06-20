import React from 'react';
import clsx from 'clsx';
import { ReactComponent as SkeletonSummarySVG } from '@/ui/assets/dashboard/skeleton-summary.svg';
import { useTranslation } from 'react-i18next';

interface Props {
  chainId: string | null;
}

export const SummaryList: React.FC<Props> = () => {
  const { t } = useTranslation();

  return (
    <div className={clsx('flex flex-col text-center', 'gap-y-20 mt-[80px]')}>
      <SkeletonSummarySVG className="m-auto" />
      <div className="text-15 text-r-neutral-foot font-medium">
        {t('page.dashboard.assets.comingSoon')}
      </div>
    </div>
  );
};
