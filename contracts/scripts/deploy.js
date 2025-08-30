const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying HydroCred contracts...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy H2Token contract
  const H2Token = await ethers.getContractFactory("H2Token");
  const h2Token = await H2Token.deploy();
  
  await h2Token.waitForDeployment();
  const h2TokenAddress = await h2Token.getAddress();
  
  console.log("H2Token deployed to:", h2TokenAddress);

  // Generate demo wallets for testing
  console.log("\n=== DEMO WALLETS FOR TESTING ===");
  const demoWallets = [];
  
  for (let i = 0; i < 10; i++) {
    const wallet = ethers.Wallet.createRandom();
    demoWallets.push({
      address: wallet.address,
      privateKey: wallet.privateKey,
      role: i === 0 ? "Country Admin" : 
            i === 1 ? "State Admin" : 
            i === 2 ? "City Admin" : 
            i <= 5 ? "Producer" : 
            i <= 8 ? "Buyer" : "Auditor"
    });
  }

  demoWallets.forEach((wallet, index) => {
    console.log(`${index + 1}. ${wallet.role}`);
    console.log(`   Address: ${wallet.address}`);
    console.log(`   Private Key: ${wallet.privateKey}`);
    console.log("");
  });

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    h2TokenAddress: h2TokenAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    demoWallets: demoWallets
  };

  const fs = require("fs");
  fs.writeFileSync(
    "./deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Deployment info saved to deployment.json");
  console.log("\nDeployment completed successfully!");
  
  // Verify contract on testnet (if not localhost)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\nWaiting for block confirmations...");
    await h2Token.deploymentTransaction().wait(6);
    
    console.log("Verifying contract on Polygonscan...");
    try {
      await hre.run("verify:verify", {
        address: h2TokenAddress,
        constructorArguments: [],
      });
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });