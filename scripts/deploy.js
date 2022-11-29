const { network } = require("hardhat");
const fs = require("fs");
const { verify } = require("../utils/verify");
const frontEndContractsFile = "../backgrounds-next-js/constants/contractAddresses.json"
const frontEndAbiFile = "../backgrounds-next-js/constants/abi.json"
const frontEndTreeFile = "../backgrounds-next-js/constants/tree.json"
const whitelistAddressesFile = "../backgrounds-next-js/constants/whitelistAdresses.json"
const whitelistAddressesFileForTests = "../backgroundsNFTSmartContract/constants/whitelistAdresses.json"
const keccak256 = require("keccak256");
const { MerkleTree } = require("merkletreejs");
const {addresses} = require("../constants/whitelistAddresses");
async function main() {

  // const addresses = [
  //   "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  //   "0x2A0044f69dBdF4BABE41463b18984Eb407c3d431",
  //   "0x25f7fF7917555132eDD3294626D105eA1C797250",
  //   "0xF6574D878f99D94896Da75B6762fc935F34C1300",
  //   "0xfDbAb374ee0FC0EA0D7e7A60917ac01365010bFe",
  // ];
  console.log(addresses);
  const leaves = addresses.map((x) => keccak256(x));
  let tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  console.log(tree);
  const buf2hex = (x) => "0x" + x.toString("hex");

  merkleTreeRoot = buf2hex(tree.getRoot());
    // Grab the contract factory 
    const BackgroundsContract = await ethers.getContractFactory("Backgrounds");

    // Start deployment, returning a promise that resolves to a contract object
    const arguments = [
      "ipfs://QmUUAkS9eBeLQhLLmr5BeDVYeNZdNKJ3oA7qzFH3R8RNQw/",
      merkleTreeRoot
    ]
    console.log(merkleTreeRoot);
    const backgrounds = await BackgroundsContract.deploy("ipfs://QmUUAkS9eBeLQhLLmr5BeDVYeNZdNKJ3oA7qzFH3R8RNQw/",
    merkleTreeRoot); // Instance of the contract 
    
    console.log("Contract deployed to address:", backgrounds.address);
    await console.log("Deployer of contract:", await backgrounds.owner());
    await backgrounds.deployed();
    
    if(process.env.ETHERSCAN_API_KEY && network.name!=="hardhat" && network.name!=="localhost")
    //if etherscan API KEY EXISTS
    {
      //usually good to wait for a few blocks to be mined to run the verification process
        await backgrounds.deployTransaction.wait(7);
        await verify(backgrounds.address, arguments);
    }

    if (process.env.UPDATE_FRONT_END) {
      console.log("Writing to front end...");
      fs.writeFileSync(frontEndAbiFile, BackgroundsContract.interface.format(ethers.utils.FormatTypes.json));
      fs.writeFileSync(frontEndContractsFile, JSON.stringify(backgrounds.address))
      fs.writeFileSync(frontEndTreeFile, JSON.stringify(tree))
      fs.writeFileSync(whitelistAddressesFile, JSON.stringify(addresses))
      //fs.writeFileSync(whitelistAddressesFileForTests, JSON.stringify(addresses))
      console.log("Front end written!");
  }

 }
 
 main()
   .then(() => process.exit(0))
   .catch(error => {
     console.error(error);
     process.exit(1);
   });