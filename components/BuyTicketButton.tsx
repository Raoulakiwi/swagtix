import { useState } from 'react';
import { redirectToCheckout } from '../src/lib/stripe';

export default function BuyTicketButton() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      await redirectToCheckout('ticket');
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.message);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
    >
      {loading ? 'Processing...' : 'Buy Ticket'}
    </button>
  );
}