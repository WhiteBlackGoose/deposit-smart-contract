import { Address, createPublicClient, getContract, http } from 'viem'
import { hardhat } from 'viem/chains'
import { abi } from './abi';
 
export const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const publicClient = createPublicClient({
  chain: hardhat,
  transport: http()
})

export interface Status {
  itemHash: `0x${string}`;
  owner: Address;
  deposit: bigint;
}

export async function readStatus(contractAddress: `0x${string}`): Promise<Status> {
  const contract = getContract({
    address: contractAddress,
    abi: abi,
    client: publicClient,
  });
  const itemHash = await contract.read.itemHash();
  const owner = await contract.read.owner();
  const deposit = await contract.read.deposit();
  return { itemHash, owner, deposit };
}
