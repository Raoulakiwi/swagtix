import React from 'react';

type Props = {
  onClickButton: () => void;
  isTestnet: boolean;
};

export const CustomizedButton: React.FC<Props> = ({
  onClickButton,
  isTestnet,
}) => {
  /**
   * The full Rabby implementation showed a list of user-customised tokens.
   * SwagTix wallet no longer maintains that global token list, so this
   * feature is disabled for now.  Returning `null` avoids build-time
   * dependency errors on the removed Redux store and hooks.
   *
   * If a customised-token feature is required in future, re-implement it
   * here with a lightweight data source.
   */
  return null;
};
