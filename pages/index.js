import useWallet from "../hooks/useWallet";
import MintTicketForm from "../components/MintTicketForm";
import Link from "next/link";

export default function Home() {
  const { account, connect } = useWallet();

  return (
    <div style={{ padding: 20 }}>
      <h1>Event Ticketing</h1>
      {!account ? (
        <button onClick={connect}>Connect Wallet</button>
      ) : (
        <>
          <MintTicketForm account={account} />
          <Link href="/my-tickets" style={{ display: "block", marginTop: 20 }}>
            View My Tickets
          </Link>
        </>
      )}
    </div>
  );
} 