import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const RoleManager = await ethers.getContractFactory("RoleManager");
  const roleManager = await RoleManager.deploy(deployer.address);
  await roleManager.deployed();
  console.log("RoleManager:", roleManager.address);

  const HydroCredToken = await ethers.getContractFactory("HydroCredToken");
  const token = await HydroCredToken.deploy(roleManager.address);
  await token.deployed();
  console.log("HydroCredToken:", token.address);

  const Marketplace = await ethers.getContractFactory("Marketplace");
  const market = await Marketplace.deploy(token.address, roleManager.address);
  await market.deployed();
  console.log("Marketplace:", market.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

