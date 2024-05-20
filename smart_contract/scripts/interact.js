// scripts/interact.js
const { ethers } = require("hardhat");

async function main() {
  console.log("Getting the fun token contract...");
  const contractAddress = "0x0E801D84Fa97b50751Dbf25036d067dCf18858bF";
  const funToken = await ethers.getContractAt("FunToken", contractAddress);
  console.log("Querying token name...");
  const name = await funToken.name();
  console.log(`Token Name: ${name}\n`);
}

async function interactErc20() {
  const [owner, account2, account3] = await ethers.getSigners();
  console.log("Getting the awesome token contract");
  const contractAddress = "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d";
  const awt = await ethers.getContractAt("AwesomeToken", contractAddress);
  const name = await awt.name();
  console.log(`Token Name: ${name}\n`);
  const tx = await awt.connect(owner).mintFifty(account2);
  console.log("Tx : ", tx);
}

async function interactSendEther() {
  const ethAmount = ethers.parseEther("7");
  const [owner, account2, account3] = await ethers.getSigners();
  console.log("Getting the EtherSender contract");
  const contractAddress = "0x68B1D87F95878fE05B998F19b66F4baba5De1aed";
  const ethSend = await ethers.getContractAt("EtherSender", contractAddress);
  console.log(ethSend);
  const tx = await ethSend
    .connect(owner)
    .sendViaCall(account2, { value: ethAmount });
  console.log("Tx : ", tx);
}

interactErc20()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
