import React from 'react';
import { createMemoryHistory } from 'history';
import { NFTTickets, Account, TransferTicket, ScanQR, Settings } from '@/ui/views';

export enum WALLET_TABS_ENUM {
  NFT_TICKETS = 'nft-tickets',
  ACCOUNT = 'account',
  SCAN = 'scan',
  SETTINGS = 'settings',
}

export const WALLET_TABS_INFO = {
  [WALLET_TABS_ENUM.NFT_TICKETS]: {
    name: 'My Tickets',
    path: '/',
    icon: 'tickets',
    component: NFTTickets,
    isTab: true,
  },
  [WALLET_TABS_ENUM.SCAN]: {
    name: 'Scan',
    path: '/scan',
    icon: 'scan',
    component: ScanQR,
    isTab: true,
  },
  [WALLET_TABS_ENUM.ACCOUNT]: {
    name: 'Account',
    path: '/account',
    icon: 'account',
    component: Account,
    isTab: true,
  },
  [WALLET_TABS_ENUM.SETTINGS]: {
    name: 'Settings',
    path: '/settings',
    icon: 'settings',
    component: Settings,
    isTab: true,
  },
};

export const WALLET_TABS = Object.values(WALLET_TABS_INFO);

export const history = createMemoryHistory();
