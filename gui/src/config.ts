import { Address, createPublicClient, getContract, http } from 'viem'
import { hardhat } from 'viem/chains'
import { abi } from './abi';
 
export const contractAddress = "0x8f86403A4DE0BB5791fa46B8e795C547942fE4Cf";

export const publicClient = createPublicClient({
  chain: hardhat,
  transport: http()
})

export interface Status {
  unlockTime: bigint;
  owner: Address;
}

export async function readStatus(contractAddress: `0x${string}`): Promise<Status> {
  const contract = getContract({
    address: contractAddress,
    abi: abi,
    client: publicClient,
  });
  const unlockTime = await contract.read.unlockTime();
  const owner = await contract.read.owner();
  return { unlockTime, owner };
}
