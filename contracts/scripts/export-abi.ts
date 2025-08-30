import fs from "fs";
import path from "path";

const artifactsDir = path.join(__dirname, "../artifacts/contracts");
const backendAbiDir = path.join(__dirname, "../../backend/src/abi");
const frontendAbiDir = path.join(__dirname, "../../frontend/src/abis");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyAbi(contractName: string) {
  const artifactPath = path.join(artifactsDir, `${contractName}.sol`, `${contractName}.json`);
  const json = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
  const abi = json.abi;
  ensureDir(backendAbiDir);
  ensureDir(frontendAbiDir);
  fs.writeFileSync(path.join(backendAbiDir, `${contractName}.json`), JSON.stringify(abi, null, 2));
  fs.writeFileSync(path.join(frontendAbiDir, `${contractName}.json`), JSON.stringify(abi, null, 2));
  console.log(`Exported ABI for ${contractName}`);
}

function main() {
  copyAbi("HydroCredToken");
  copyAbi("RoleManager");
  copyAbi("Marketplace");
}

main();

