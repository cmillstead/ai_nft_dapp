const hre = require("hardhat");

async function main() {
  const NAME = "AI Generated NFT"
  const SYMBOL = "AINFT"
  const COST = hre.ethers.utils.parseUnits("0.25", "ether") // .25 ETH

  const NFT = await hre.ethers.getContractFactory("NFT")
  const nft = await NFT.deploy(NAME, SYMBOL, COST)
  await nft.deployed()

  console.log(`Deployed NFT Contract at: ${nft.address}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
