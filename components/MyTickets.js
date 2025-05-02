import { useEffect, useState } from "react";
import { ethers } from "ethers";
import EventTicket1155ABI from "../abi/EventTicket1155.json";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

export default function MyTickets({ account }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account) return;
    const fetchTickets = async () => {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, EventTicket1155ABI, provider);

      // For demo, check first 20 tokenIds
      const owned = [];
      for (let tokenId = 1; tokenId <= 20; tokenId++) {
        const balance = await contract.balanceOf(account, tokenId);
        if (balance > 0) {
          const uri = await contract.uri(tokenId);
          // If uri is a data:application/json, parse it
          let meta = {};
          if (uri.startsWith("data:application/json")) {
            const json = decodeURIComponent(uri.split(",")[1]);
            meta = JSON.parse(json);
          } else {
            // Otherwise, fetch from URL
            const res = await fetch(uri);
            meta = await res.json();
          }
          owned.push({ tokenId, ...meta });
        }
      }
      setTickets(owned);
      setLoading(false);
    };
    fetchTickets();
  }, [account]);

  if (!account) return <p>Connect your wallet to view tickets.</p>;
  if (loading) return <p>Loading tickets...</p>;
  if (tickets.length === 0) return <p>No tickets found.</p>;

  return (
    <div>
      <h2>My Tickets</h2>
      {tickets.map(ticket => (
        <div key={ticket.tokenId} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
          <p><b>Token ID:</b> {ticket.tokenId}</p>
          <p><b>Event Time:</b> {ticket.description?.match(/\d+/)?.[0]}</p>
          <img src={ticket.image} alt="Ticket Visual" style={{ maxWidth: 300 }} />
        </div>
      ))}
    </div>
  );
} 