const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔧 Assigning State Admin...");
  
  // Read contract address
  const contractAddressPath = path.join(__dirname, "../contract-address.json");
  if (!fs.existsSync(contractAddressPath)) {
    console.error("❌ Contract address file not found. Deploy the contract first.");
    return;
  }
  
  const contractInfo = JSON.parse(fs.readFileSync(contractAddressPath, "utf8"));
  const contractAddress = contractInfo.address;
  
  console.log("📋 Contract address:", contractAddress);
  
  // Get signers
  const [deployer, stateAdmin] = await ethers.getSigners();
  console.log("👑 Main Admin (deployer):", deployer.address);
  console.log("🏛️ State Admin to assign:", stateAdmin.address);
  
  // Get contract instance
  const HydroCredToken = await ethers.getContractFactory("HydroCredToken");
  const contract = HydroCredToken.attach(contractAddress);
  
  // Check if deployer is main admin
  const mainAdmin = await contract.mainAdmin();
  if (mainAdmin !== deployer.address) {
    console.error("❌ Deployer is not the main admin");
    return;
  }
  
  // State to assign (you can modify this)
  const stateName = "Maharashtra"; // Example state
  
  try {
    console.log(`🏛️ Assigning ${stateAdmin.address} as admin for state: ${stateName}`);
    
    const tx = await contract.assignStateAdmin(stateAdmin.address, stateName);
    await tx.wait();
    
    console.log("✅ State Admin assigned successfully!");
    console.log(`🏛️ State: ${stateName}`);
    console.log(`👤 Admin: ${stateAdmin.address}`);
    console.log(`🔗 Transaction: ${tx.hash}`);
    
    // Verify assignment
    const assignedAdmin = await contract.stateAdmin(stateName);
    console.log(`✅ Verification: State admin for ${stateName} is ${assignedAdmin}`);
    
  } catch (error) {
    console.error("❌ Failed to assign state admin:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
