import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import useWallet from "../hooks/useWallet";
import MintTicketForm from "../components/MintTicketForm";
import BuyTicketButton from "../components/BuyTicketButton";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const { account, connect } = useWallet();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Event Ticketing</h1>
        
        {!account ? (
          <div className="text-center">
            <button 
              onClick={connect}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Buy Ticket</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 mb-2">Event Ticket</p>
                  <p className="text-2xl font-bold">A$20.00</p>
                </div>
                <BuyTicketButton />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Mint NFT Ticket</h2>
              <MintTicketForm account={account} />
            </div>

            <div className="text-center">
              <Link 
                href="/my-tickets" 
                className="text-blue-600 hover:text-blue-500 underline"
              >
                View My Tickets
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}