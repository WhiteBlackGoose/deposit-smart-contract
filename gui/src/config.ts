import { createPublicClient, getContract, http } from "viem";
import { hardhat } from "viem/chains";
import { abi } from "./abi";

export const publicClient = createPublicClient({
  chain: hardhat,
  transport: http(),
});
export enum ReturnedState {
  Returned = 0,
  Received = 1,
}
export interface Status {
  returnState: ReturnedState | null;
}

export async function readStatus(
  contractAddress: `0x${string}`,
  userAddress: `0x${string}`
): Promise<Status | null> {
  const contract = getContract({
    address: contractAddress,
    abi: abi,
    client: publicClient,
  });
  
  let state;
  try {
    state = await contract.read.checkReturnState([userAddress]);
  } catch (e) {
    console.error(e);
    return null;
  }

  const returnState =
    state === 0 ? ReturnedState.Returned : ReturnedState.Received;

  return { returnState };
}
