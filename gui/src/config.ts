import { Address, createPublicClient, getContract, http } from "viem";
import { hardhat } from "viem/chains";
import { abi } from "./abi";

export const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

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
  owner: Address;
}

export async function readStatus(
  contractAddress: `0x${string}`
): Promise<Status> {
  const contract = getContract({
    address: contractAddress,
    abi: abi,
    client: publicClient,
  });
  const owner = (await contract.read.owner()) as Address;
  const state = await contract.read.checkReturnState([owner]);
  const returnState = state
    ? state === 0
      ? ReturnedState.Returned
      : ReturnedState.Received
    : null;
  console.log(state);
  return { owner, returnState };
}
