import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying HydroCred Token Contract...");

  // Get the contract factory
  const HydroCredToken = await ethers.getContractFactory("HydroCredToken");
  
  // Deploy the contract
  const hydroCredToken = await HydroCredToken.deploy();
  
  await hydroCredToken.waitForDeployment();
  
  const contractAddress = await hydroCredToken.getAddress();
  
  console.log("✅ HydroCred Token deployed to:", contractAddress);
  console.log("🔑 Deployer address:", (await ethers.getSigners())[0].address);
  
  // Get role constants
  const COUNTRY_ADMIN_ROLE = await hydroCredToken.COUNTRY_ADMIN_ROLE();
  const STATE_ADMIN_ROLE = await hydroCredToken.STATE_ADMIN_ROLE();
  const CITY_ADMIN_ROLE = await hydroCredToken.CITY_ADMIN_ROLE();
  const PRODUCER_ROLE = await hydroCredToken.PRODUCER_ROLE();
  const BUYER_ROLE = await hydroCredToken.BUYER_ROLE();
  const AUDITOR_ROLE = await hydroCredToken.AUDITOR_ROLE();
  
  console.log("\n📋 Role Constants:");
  console.log("COUNTRY_ADMIN_ROLE:", COUNTRY_ADMIN_ROLE);
  console.log("STATE_ADMIN_ROLE:", STATE_ADMIN_ROLE);
  console.log("CITY_ADMIN_ROLE:", CITY_ADMIN_ROLE);
  console.log("PRODUCER_ROLE:", PRODUCER_ROLE);
  console.log("BUYER_ROLE:", BUYER_ROLE);
  console.log("AUDITOR_ROLE:", AUDITOR_ROLE);
  
  // Verify roles are set correctly
  const deployer = (await ethers.getSigners())[0];
  const hasCountryAdminRole = await hydroCredToken.hasRole(COUNTRY_ADMIN_ROLE, deployer.address);
  const hasDefaultAdminRole = await hydroCredToken.hasRole(await hydroCredToken.DEFAULT_ADMIN_ROLE(), deployer.address);
  
  console.log("\n🔐 Role Verification:");
  console.log("Deployer has COUNTRY_ADMIN_ROLE:", hasCountryAdminRole);
  console.log("Deployer has DEFAULT_ADMIN_ROLE:", hasDefaultAdminRole);
  
  if (hasCountryAdminRole && hasDefaultAdminRole) {
    console.log("✅ Contract deployed successfully with proper role setup!");
    console.log("\n📝 Next steps:");
    console.log("1. Update your .env file with CONTRACT_ADDRESS=" + contractAddress);
    console.log("2. Run 'npm run update-contract-address' to update backend config");
    console.log("3. Start the application with 'npm run dev'");
  } else {
    console.log("❌ Role setup failed!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });