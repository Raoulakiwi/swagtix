import { createModel } from '@rematch/core';
import { RootModel } from '.';

export interface UIState {
  isShowSideBar: boolean;
  isShowAccountList: boolean;
  currentTab: string;
  isPinSetup: boolean;
}

export const ui = createModel<RootModel>()({
  name: 'ui',
  state: {
    isShowSideBar: false,
    isShowAccountList: false,
    currentTab: 'nft-tickets',
    isPinSetup: false,
  } as UIState,
  reducers: {
    toggleSideBar(state) {
      return {
        ...state,
        isShowSideBar: !state.isShowSideBar,
      };
    },
    toggleAccountList(state) {
      return {
        ...state,
        isShowAccountList: !state.isShowAccountList,
      };
    },
    setCurrentTab(state, tab: string) {
      return {
        ...state,
        currentTab: tab,
      };
    },
    setIsPinSetup(state, isPinSetup: boolean) {
      return {
        ...state,
        isPinSetup,
      };
    },
  },
});
