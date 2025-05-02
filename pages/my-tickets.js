import useWallet from "../hooks/useWallet";
import MyTickets from "../components/MyTickets";
import Link from "next/link";

export default function MyTicketsPage() {
  const { account, connect } = useWallet();

  return (
    <div style={{ padding: 20 }}>
      <h1>My Tickets</h1>
      {!account ? (
        <button onClick={connect}>Connect Wallet</button>
      ) : (
        <MyTickets account={account} />
      )}
      <Link href="/" style={{ display: "block", marginTop: 20 }}>
        Back to Mint
      </Link>
    </div>
  );
} 