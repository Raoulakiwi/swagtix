import React from 'react';
// import { useHistory } from 'react-router-dom';
// import clsx from 'clsx';
// import { useTranslation } from 'react-i18next';
// import { useWallet } from 'ui/utils';
// import { matomoRequestEvent } from '@/utils/matomo-request';
// import { RecentConnectionsItem } from './RecentConnectionsItem';
// import { useCommonPopupView } from '@/ui/utils/popup';
// import { useRbiSource } from '@/ui/utils/ga-event';

/**
 * RecentConnections Component
 *
 * Original Purpose: Display a list of recently connected dApps. This feature
 * relied on data from the Rabby Redux store (`recentConnectedSites` and
 * `currentAccount` fetched via `useRabbyDispatch` and `useRabbySelector`).
 *
 * Current Status in SwagTix Wallet:
 * As part of the simplification process for the NFT ticket wallet, the complex
 * Redux store has been removed. Consequently, the data source for this
 * component is no longer available.
 *
 * Displaying recent dApp connections is considered a non-critical feature for
 * the initial version of a focused ticket wallet. Therefore, this component
 * currently returns `null` to effectively remove it from the UI and resolve
 * build errors caused by missing store dependencies.
 *
 * Future Considerations:
 * If this feature is desired in the future, it could be re-implemented by:
 * 1. Storing recent connection information in browser local storage.
 * 2. Using a simplified backend service to track connections (if user accounts are managed centrally).
 * 3. Displaying a static list of "recommended" or "partner" dApps if dynamic recent connections are not needed.
 */
const RecentConnections = () => {
  // const wallet = useWallet();
  // const { t } = useTranslation();
  // const history = useHistory();
  // const { activePopup } = useCommonPopupView();
  // const rbisource = useRbiSource();

  // Removed useRabbyDispatch and useRabbySelector as they are no longer available
  // const { recentConnectedSites, currentAccount } = useRabbySelector(
  //   (s: RootState) => ({
  //     recentConnectedSites: s.preference.recentConnectedSites,
  //     currentAccount: s.account.currentAccount,
  //   })
  // );
  // const dispatch = useRabbyDispatch();

  // All logic dependent on recentConnectedSites and currentAccount from the store
  // has been removed.

  // Returning null to effectively hide this component until/unless it's reimplemented.
  return null;

  // --- Original component structure (for reference) ---
  // if (loading) {
  //   return (
  //     <div className="recent-connections is-loading">
  //       <p>{t('page.dashboard.home.recentConnections')}</p>
  //       <div className="list">
  //         {[1, 2, 3].map((idx) => (
  //           <RecentConnectionsItem loading key={idx} />
  //         ))}
  //       </div>
  //     </div>
  //   );
  // }

  // if (sites.length <= 0) {
  //   return <></>;
  // }

  // return (
  //   <div className="recent-connections">
  //     <p>{t('page.dashboard.home.recentConnections')}</p>
  //     <div className={clsx('list', sites.length > 3 && 'scrollable')}>
  //       {sites.map((site) => (
  //         <RecentConnectionsItem
  //           site={site}
  //           key={site.origin}
  //           onClick={() => handleClick(site)}
  //           onRemove={() => handleRemove(site)}
  //         />
  //       ))}
  //     </div>
  //   </div>
  // );
};

export default RecentConnections;
