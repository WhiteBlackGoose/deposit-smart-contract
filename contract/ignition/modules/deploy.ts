import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("DeployBorger", (m) => {
  const borger = m.contract("Borger");
  return { borger };
});
