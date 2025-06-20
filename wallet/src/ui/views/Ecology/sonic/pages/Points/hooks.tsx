/**
 * In the trimmed-down SwagTix wallet the Rabby store has been removed and
 * Sonic-Points integration is out-of-scope.  We therefore replace the original
 * hook with a lightweight stub that returns safe default values and a no-op
 * `refetch` so that callers do not break at runtime.
 */
import { useCallback } from 'react';
import { getAddress } from 'viem';

async function fetchReferralData(address: string) {
  const url = `https://airdrop.soniclabs.com/api/user/${address}`;

  try {
    const response = await fetch(url);
    const { referralCode, referralPoint } = await response.json();

    return {
      referralCode,
      referralPoints: referralPoint,
    };
  } catch (error) {
    console.error('Error fetching referral code:', error);
    return null;
  }
}

async function fetchPoints(address: string) {
  const url = `https://arcade.gateway.soniclabs.com/game/points?wallet=${address}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      return null;
    }

    const { player, totalPoints, rank, username } = data.data[0];

    return {
      player,
      totalPoints,
      rank,
      username,
    };
  } catch (error) {
    console.error('Error fetching points:', error);
    return null;
  }
}

export const useSonicData = () => {
  // SwagTix: Sonic integration removed – return defaults
  const pointsData = undefined as Awaited<ReturnType<typeof fetchPoints>>;
  const referralData = undefined as Awaited<
    ReturnType<typeof fetchReferralData>
  >;
  const loading = false;
  const error: string | null = null;

  const totalPoints = 0;

  const referralCode = undefined;

  const address = null;

  const refetch = useCallback(() => {
    /* no-op – Sonic endpoints disabled */
  }, []);

  return {
    points: pointsData,
    referralCode,
    totalPoints,
    loading,
    error,
    refetch,
    address,
  };
};
