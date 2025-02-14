import { useEffect, useState } from "react";
import CryptoJS from "crypto-js";
import "./App.css";
import { createConfig, http } from "wagmi";
import { hardhat } from "viem/chains";
import { metaMask } from "wagmi/connectors";
import {
  ContractFunctionExecutionError,
  createWalletClient,
  parseEther,
  WalletClient,
} from "viem";
import { abi } from "./abi";
import { contractAddress, readStatus, Status, ReturnedState } from "./config";

export const wagmiClient = createConfig({
  connectors: [metaMask()],
  chains: [hardhat],
  transports: { [hardhat.id]: http() },
});

async function tryConnectWallet(): Promise<`0x${string}` | null> {
  const connectors = wagmiClient.connectors;
  if (await connectors[0].isAuthorized()) {
    return await connectWallet();
  } else {
    return null;
  }
}

let client: WalletClient | null = null;

async function connectWallet(): Promise<`0x${string}`> {
  const connectors = wagmiClient.connectors;
  const { accounts } = await connectors[0].connect();
  const account = accounts[0];
  client = createWalletClient({
    chain: hardhat,
    transport: http(),
    account,
  });
  return account;
}

async function disconnectWallet(): Promise<void> {
  const connectors = wagmiClient.connectors;
  await connectors[0].disconnect();
}

// Function to calculate the hash of an image file
async function calculateImageHash(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const wordArray = CryptoJS.lib.WordArray.create(
        reader.result as ArrayBuffer
      );
      const hash = CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
      resolve(hash);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function App() {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [imageHash, setImageHash] = useState<string | null>(null);

  useEffect(() => {
    tryConnectWallet().then(setAddress);
  });

  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      readStatus(contractAddress).then(setStatus);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const now = BigInt(Math.floor(new Date().getTime() / 1000));

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const hash = await calculateImageHash(file);
      setImageHash(hash);
    }
  };

  let state;
  if (address) {
    state = (
      <div className="card">
        <p>Connected account: {address}</p>
        <button
          onClick={async () => {
            await disconnectWallet();
            setAddress(null);
          }}
        >
          Disconnect MetaMask
        </button>
        <button
          onClick={async () => {
            let error = false;
            try {
              await client?.writeContract({
                account: address,
                abi,
                address: contractAddress,
                functionName: "borrowItem",
                chain: hardhat,
                value: parseEther("21"),
              });
            } catch (e) {
              if (e instanceof ContractFunctionExecutionError) {
                alert(`Failed to borrow item: ${e.message}`);
                error = true;
              }
            }
            if (!error) {
              alert("Item borrowed successfully!");
            }
          }}
        >
          Borrow Item
        </button>
        <button
          onClick={async () => {
            console.log("Image Hash:", imageHash);
            let error = false;
            try {
              await client?.writeContract({
                account: address,
                abi,
                address: contractAddress,
                functionName: "returnItem",
                chain: hardhat,
                args: [imageHash],
              });
            } catch (e) {
              if (e instanceof ContractFunctionExecutionError) {
                alert(`Failed to return item: ${e.message}`);
                error = true;
              }
            }
            if (!error) {
              alert("Item returned successfully!");
            }
          }}
          disabled={!imageHash}
        >
          Return Item
        </button>
      </div>
    );
  } else {
    state = (
      <div className="card">
        <button
          onClick={async () => {
            const addr = await connectWallet();
            setAddress(() => addr);
          }}
        >
          Connect MetaMask
        </button>
      </div>
    );
  }

  return (
    <>
      <h1>Pfandsystem</h1>
      {status ? (
        <div className="card">
          <p>
            Owner: {status.owner == address ? "(you)" : "(NOT you)"}{" "}
            {status.owner}
          </p>
          {status.returnState == ReturnedState.Returned ? (
            <p>🔓 available</p>
          ) : (
            <p>🔒 unavailable</p>
          )}
        </div>
      ) : (
        <p>Info about the Item is unavailable</p>
      )}
      <div
        className="dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        style={{
          border: "2px dashed #ccc",
          padding: "20px",
          textAlign: "center",
        }}
      >
        Drag and drop an image here
      </div>
      {imageHash && <p>Image Hash: {imageHash}</p>}
      {state}
    </>
  );
}

export default App;
