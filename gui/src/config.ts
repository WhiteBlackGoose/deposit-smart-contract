import { createPublicClient, getContract, http } from "viem";
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
}

export async function readStatus(
  contractAddress: `0x${string}`,
  userAdress: `0x${string}`
): Promise<Status> {
  const contract = getContract({
    address: contractAddress,
    abi: abi,
    client: publicClient,
  });
  const state = await contract.read.checkReturnState([userAdress]);

  const returnState =
    state === 0 ? ReturnedState.Returned : ReturnedState.Received;

  return { returnState };
}
