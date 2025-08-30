import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Deploying HydroCred suite...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Deploy RoleManager
  const RoleManager = await ethers.getContractFactory("RoleManager");
  const roleManager = await RoleManager.deploy(deployer.address);
  await roleManager.waitForDeployment();
  const roleManagerAddress = await roleManager.getAddress();
  console.log("✅ RoleManager deployed:", roleManagerAddress);

  // Deploy the token
  const HydroCredToken = await ethers.getContractFactory("HydroCredToken");
  const hydroCredToken = await HydroCredToken.deploy(deployer.address);
  
  await hydroCredToken.waitForDeployment();
  const contractAddress = await hydroCredToken.getAddress();
  
  console.log("✅ HydroCredToken deployed to:", contractAddress);
  console.log("🔑 Default admin and certifier:", deployer.address);

  // Deploy CertificationRegistry
  const CertificationRegistry = await ethers.getContractFactory("CertificationRegistry");
  const registry = await CertificationRegistry.deploy(deployer.address, contractAddress, roleManagerAddress);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("✅ CertificationRegistry deployed:", registryAddress);

  // Grant registry minter role on token
  const grantTx = await hydroCredToken.grantMinter(registryAddress);
  await grantTx.wait();
  console.log("🔐 Registry granted minter role on token");

  // Deploy Marketplace
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(deployer.address, contractAddress, roleManagerAddress);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("✅ Marketplace deployed:", marketplaceAddress);
  
  // Save contract address to file
  const network = await ethers.provider.getNetwork();
  const contractInfo = {
    token: contractAddress,
    registry: registryAddress,
    roleManager: roleManagerAddress,
    marketplace: marketplaceAddress,
    network: network.name,
    chainId: network.chainId,
    deployer: deployer.address,
    deployedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(
    path.join(__dirname, "../contract-address.json"),
    JSON.stringify(contractInfo, null, 2)
  );
  
  console.log("📄 Contract addresses saved to contract-address.json");
  
  // Verify contract deployment
  try {
    const name = await hydroCredToken.name();
    const symbol = await hydroCredToken.symbol();
    console.log(`📋 Token verified: ${name} (${symbol})`);
  } catch (error) {
    console.error("❌ Contract verification failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });