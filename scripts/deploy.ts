import hre from "hardhat";

export async function deployAll() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("----------------------------------------------------------------------");
  console.log("                     DEPLOYING DEFIB CONTRACTS                        ");
  console.log("----------------------------------------------------------------------");
  console.log(`[+] Deploying from address: ${deployer.address}`);

  // 1. Deploy MockToken
  const MockToken = await hre.ethers.getContractFactory("MockToken");
  const mockToken = await MockToken.deploy();
  await mockToken.waitForDeployment();
  const tokenAddress = await mockToken.getAddress();
  console.log(` ✔ MockToken deployed at:   ${tokenAddress}`);

  // 2. Deploy MockDAO
  const MockDAO = await hre.ethers.getContractFactory("MockDAO");
  const mockDAO = await MockDAO.deploy();
  await mockDAO.waitForDeployment();
  const daoAddress = await mockDAO.getAddress();
  console.log(` ✔ MockDAO deployed at:     ${daoAddress}`);

  // 3. Deploy BountyVault
  const BountyVault = await hre.ethers.getContractFactory("BountyVault");
  const bountyVault = await BountyVault.deploy(tokenAddress);
  await bountyVault.waitForDeployment();
  const vaultAddress = await bountyVault.getAddress();
  console.log(` ✔ BountyVault deployed at: ${vaultAddress}`);

  // 4. Deploy DefibCore
  const DefibCore = await hre.ethers.getContractFactory("DefibCore");
  const defibCore = await DefibCore.deploy(tokenAddress, daoAddress, vaultAddress);
  await defibCore.waitForDeployment();
  const coreAddress = await defibCore.getAddress();
  console.log(` ✔ DefibCore deployed at:    ${coreAddress}`);

  // 5. Connect Contracts (Permissions Setup)
  console.log("[+] Configuring system permissions...");
  await mockDAO.setDefibCore(coreAddress);
  await bountyVault.setDefibCore(coreAddress);
  console.log(" ✔ DefibCore registered as controller in MockDAO & BountyVault");

  // 6. Pre-fund DefibCore with 10,000 DFIB tokens
  console.log("[+] Funding DefibCore rescue reserves...");
  const fundAmount = hre.ethers.parseUnits("10000", 18);
  await mockToken.transfer(coreAddress, fundAmount);
  console.log(` ✔ Funded DefibCore with 10,000 DFIB tokens.`);
  console.log("----------------------------------------------------------------------\n");

  return {
    mockToken,
    mockDAO,
    bountyVault,
    defibCore,
  };
}

async function main() {
  await deployAll();
}

// Execute deployment if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
