import { createWalletClient, http, parseAbi } from "viem";
import { hardhat } from "viem/chains";

// Replace with your deployed contract address
const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

const client = createWalletClient({
  chain: hardhat,
  transport: http("http://127.0.0.1:8545"),
  // account: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Use a funded Hardhat test account
  account: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Use a funded Hardhat test account
});

const contractAbi = parseAbi([
  "function withdraw() public",
]);

async function executeMethod() {
  // Sending a transaction (writing to blockchain)
  const txHash = await client.writeContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: "withdraw",
    args: [],
  });

  console.log("Transaction Hash:", txHash);
}

executeMethod();
