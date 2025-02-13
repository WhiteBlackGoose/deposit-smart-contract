import { useEffect, useState } from 'react'
import './App.css'
import { createConfig, http } from "wagmi";
import { hardhat } from "viem/chains";
import { metaMask } from "wagmi/connectors";
import { ContractFunctionExecutionError, createWalletClient, WalletClient } from 'viem'
import { abi } from './abi';
import { contractAddress, readStatus, Status } from './config';


export const wagmiClient = createConfig({
  connectors: [metaMask()],
  chains: [hardhat],
  transports: {[hardhat.id]: http()}
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
    account
  });
  return account;
}

async function disconnectWallet(): Promise<void> {
  const connectors = wagmiClient.connectors;
  await connectors[0].disconnect();
}


function App() {
  const [address, setAddress] = useState<`0x${string}` | null>(null)

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

  let state;
  if (address) {
    state = (
      <div className="card">
        <p>Connected account: {address}</p>
        <button onClick={async () => {
          await disconnectWallet();
          setAddress(null);
        }}>
          Disconnect MetaMask
        </button>
        <button onClick={async () => {
          let error = false;
          try {
            await client?.writeContract({
              account: address,
              abi,
              address: contractAddress,
              functionName: "withdraw",
              chain: hardhat
            })
          } catch (e) {
            if (e instanceof ContractFunctionExecutionError) {
              alert(`Failed to withdraw: ${e.message}`);
              error = true;
            }
          }
          if (!error) {
            alert("Withdrawn successfully!");
          }
        }}>
          Withdraw
        </button>
      </div>
    );
  } else {
    state = (
      <div className="card">
        <button onClick={async () => {
          const addr = await connectWallet();
          setAddress(() => addr)
        }}>
          Connect MetaMask
        </button>
      </div>
    )
  }

  return (
    <>
      <h1>Lock</h1>
      {status ? (
        <div className="card">
          <p>
          {status.owner == address ? "You own this lock" : "The owner of this lock is: " + status.owner}
          </p>
          {now > status.unlockTime ? <p>🔓 Unlocked</p> : <p>🔒 Locked: {status.unlockTime - now}s left</p>}
        </div>
      ) : <p>Info about the Lock is unavailable</p>}
      {state}
    </>
  )
}

export default App
