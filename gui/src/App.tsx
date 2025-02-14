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
      resolve("0x" + hash);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function App() {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [imageHash, setImageHash] = useState<String | null>(null);

  useEffect(() => {
    tryConnectWallet().then(async (receivedAddress) => {
      setAddress(receivedAddress);
      if (receivedAddress != null) {
        setStatus(await readStatus(contractAddress, receivedAddress));
      }
    });
  }, []);

  const [status, setStatus] = useState<Status | null>(null);

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     readStatus(contractAddress).then(setStatus);
  //   }, 1000);

  //   return () => clearInterval(interval);
  // }, []);

  const now = BigInt(Math.floor(new Date().getTime() / 1000));

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const hash = await calculateImageHash(file);
      setImageHash(hash);
    }
  };
  let dragdrop;
  if (status != null && status.returnState == ReturnedState.Received) {
    dragdrop = (
      <>
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
      </>
    );
  }
  let state;
  if (address) {
    state = (
      <div className="card">
        <p>Connected account: {address}</p>
        <button
          onClick={async () => {
            await disconnectWallet();
            setAddress(null);
            setStatus(null);
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
            // if (!error) {
            //   alert("Item borrowed successfully!");
            // }
            setStatus(await readStatus(contractAddress, address));
          }}
          disabled={
            !(status != null && status.returnState == ReturnedState.Returned)
          }
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
              error = true;
              if (e instanceof ContractFunctionExecutionError) {
                alert(`Failed to return item: ${e.message}`);
              } else {
                alert("error else" + e);
              }
            }
            if (!error) {
              setImageHash(null);
            }
            setStatus(await readStatus(contractAddress, address));
          }}
          disabled={
            !(
              imageHash != null &&
              status != null &&
              status.returnState == ReturnedState.Received
            )
          }
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
            setStatus(await readStatus(contractAddress, addr));
          }}
        >
          Connect MetaMask
        </button>
      </div>
    );
  }

  return (
    <>
      <h1>Borrowing System</h1>
      {status ? (
        <div className="card">
          {status.returnState == ReturnedState.Returned ? (
            <p>🔓 Available for Borrowing</p>
          ) : (
            <p>🔒 Borrowed</p>
          )}
        </div>
      ) : (
        <p>Please connect your wallet first</p>
      )}
      {dragdrop}
      {state}
    </>
  );
}

export default App;
