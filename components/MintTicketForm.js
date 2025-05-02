import { useState } from "react";
import QRCode from "qrcode.react";
import { Web3Storage } from "web3.storage";
import { ethers } from "ethers";
import EventTicket1155ABI from "../abi/EventTicket1155.json";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const WEB3STORAGE_TOKEN = process.env.NEXT_PUBLIC_WEB3STORAGE_TOKEN;

export default function MintTicketForm({ account }) {
  const [eventTime, setEventTime] = useState("");
  const [holderInfo, setHolderInfo] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [qrValue, setQrValue] = useState("");
  const [minting, setMinting] = useState(false);

  // Generate a unique QR code value
  const generateQrValue = () => {
    const value = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(holderInfo + eventTime));
    setQrValue(value);
    return value;
  };

  // Upload file to IPFS
  const uploadToIPFS = async (file) => {
    const client = new Web3Storage({ token: WEB3STORAGE_TOKEN });
    const cid = await client.put([file]);
    return `https://${cid}.ipfs.dweb.link/${file.name}`;
  };

  // Save QR code as image and upload to IPFS
  const uploadQrToIPFS = async (qrValue) => {
    const canvas = document.getElementById("qr-canvas");
    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        const file = new File([blob], `${qrValue}.png`, { type: "image/png" });
        const url = await uploadToIPFS(file);
        resolve(url);
      });
    });
  };

  // Mint ticket
  const handleMint = async (e) => {
    e.preventDefault();
    setMinting(true);
    try {
      const qrValue = generateQrValue();
      const qrUri = await uploadQrToIPFS(qrValue);
      const mediaUri = await uploadToIPFS(mediaFile);

      // Connect to contract
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, EventTicket1155ABI, signer);

      // Call mintTicket
      const tx = await contract.mintTicket(
        account,
        1,
        Math.floor(new Date(eventTime).getTime() / 1000),
        qrUri,
        mediaUri
      );
      await tx.wait();
      alert("Ticket minted!");
    } catch (err) {
      alert("Error: " + err.message);
    }
    setMinting(false);
  };

  return (
    <form onSubmit={handleMint} style={{ maxWidth: 400, margin: "auto" }}>
      <label>Event Date/Time:</label>
      <input
        type="datetime-local"
        value={eventTime}
        onChange={e => setEventTime(e.target.value)}
        required
      />
      <label>Ticket Holder Info (e.g., email):</label>
      <input
        type="text"
        placeholder="Ticket Holder Info"
        value={holderInfo}
        onChange={e => setHolderInfo(e.target.value)}
        required
      />
      <label>Media (photo or video):</label>
      <input
        type="file"
        accept="image/*,video/*"
        onChange={e => setMediaFile(e.target.files[0])}
        required
      />
      <button type="button" onClick={generateQrValue} style={{ marginTop: 10 }}>
        Preview QR
      </button>
      {qrValue && (
        <div>
          <QRCode id="qr-canvas" value={qrValue} size={256} />
        </div>
      )}
      <button type="submit" disabled={minting} style={{ marginTop: 10 }}>
        {minting ? "Minting..." : "Mint Ticket"}
      </button>
    </form>
  );
} 