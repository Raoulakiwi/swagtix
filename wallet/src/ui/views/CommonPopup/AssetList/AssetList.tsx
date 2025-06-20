import React from 'react';
import { useTranslation } from 'react-i18next';
import { TokenTable, Props as TokenTableProps } from './components/TokenTable';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { useWallet } from '@/ui/utils';
import { useAsync } from 'react-use';
import { Empty } from './Empty';
import { Spin } from 'antd';
import styled from 'styled-components';
import { sortBy } from 'lodash';
import { getTokenSymbol } from '@/ui/utils/token';
import { AbstractPortfolioToken } from './components/TokenAssets';

// Placeholder type for AbstractPortfolioToken if not already defined/imported
// This might be needed if the original type came from a removed module.
// For now, let's assume AbstractPortfolioToken is available or we'll use TokenItem.
// If AbstractPortfolioToken is distinct and necessary, it should be defined.
// For simplicity, if AbstractPortfolioToken is just a more specific TokenItem,
// we might be able to use TokenItem directly or a union type.

// Let's define a minimal AbstractPortfolioToken for now if it's not imported from elsewhere
// interface AbstractPortfolioToken extends TokenItem {
//   _tokenId: string;
//   // Add other specific fields if known and necessary
// }

type TokenWithAmount = TokenItem & {
  amount: number;
  price: number;
};

const LoadingWrapper = styled.div`
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export type AssetListProps = {
  list?: TokenWithAmount[];
  isLoading?: boolean;
  onSearch?: (val: string) => void;
  searchVal?: string;
  onSort?: (sortType: string) => void;
  sortType?: string;
  EmptyComponent?: React.ReactNode;
  hideSmallBalance?: boolean;
} & TokenTableProps;

export const AssetList: React.FC<AssetListProps> = ({
  list,
  isLoading = false,
  onSearch,
  searchVal,
  onSort,
  sortType,
  EmptyComponent,
  hideSmallBalance,
  ...tableProps
}) => {
  const { t } = useTranslation();
  const wallet = useWallet();

  // Removed useRabbySelector and related state:
  // customizedTokens, blockedTokens, balanceMap

  const { value: customizedTokens, loading: customizedTokensLoading } = useAsync(
    async () => {
      // Placeholder: In a real app, this might fetch customized tokens if needed
      // For now, returning an empty array as the store logic is removed
      return [];
    },
    []
  );

  const { value: blockedTokens, loading: blockedTokensLoading } = useAsync(
    async () => {
      // Placeholder: In a real app, this might fetch blocked tokens if needed
      return [];
    },
    []
  );

  const shownList = React.useMemo(() => {
    let result: (TokenItem | AbstractPortfolioToken)[] = list || []; // Type as union or TokenItem[]

    if (hideSmallBalance) {
      result = result.filter((item) => {
        if (item.price) {
          return new BigNumber(item.amount).times(item.price).gte(0.01);
        }
        return true;
      });
    }

    if (searchVal) {
      result = result.filter(
        (item) =>
          getTokenSymbol(item).toLowerCase().includes(searchVal.toLowerCase()) ||
          item.name.toLowerCase().includes(searchVal.toLowerCase())
      );
    }

    if (sortType) {
      result = sortBy(result, (item) => {
        switch (sortType) {
          case 'amount':
            return item.amount * (item.price || 0);
          case 'price':
            return item.price || 0;
          default:
            return 0;
        }
      }).reverse();
    }
    // The type error TS2322 occurs here if shownList is expected to be AbstractPortfolioToken[]
    // but result can contain TokenItem.
    // Casting to `any[]` is a quick fix, but ideally, the types should be harmonized
    // or TokenTableProps.list should accept (TokenItem | AbstractPortfolioToken)[].
    // For now, let's ensure shownList is typed as (TokenItem | AbstractPortfolioToken)[]
    // or TokenItem[] if AbstractPortfolioToken is not strictly needed for TokenTable.
    return result as (TokenItem | AbstractPortfolioToken)[];
  }, [list, searchVal, sortType, hideSmallBalance]);

  if (isLoading || customizedTokensLoading || blockedTokensLoading) {
    return (
      <LoadingWrapper>
        <Spin spinning={isLoading} />
      </LoadingWrapper>
    );
  }

  return (
    <div className="asset-list">
      <TokenTable
        {...tableProps}
        list={shownList}
        EmptyComponent={EmptyComponent || <Empty />}
      />
    </div>
  );
};
