// scripts/getFunctionHashes.js
const { ethers } = require("hardhat");

async function main() {
  const Contract = await ethers.getContractFactory("BacotersToken");

  const abi = Contract.interface.fragments;

  abi.forEach((fragment) => {
    if (fragment.type === "function") {
      const signature = `${fragment.name}(${fragment.inputs
        .map((input) => input.type)
        .join(",")})`;
      console.log(`Function: ${signature}`);
    }
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
