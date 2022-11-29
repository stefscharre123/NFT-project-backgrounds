/** @type import('hardhat/config').HardhatUserConfig */
require('dotenv').config();
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require('solidity-coverage');
require('hardhat-gas-reporter');
const { API_URL, PRIVATE_KEY,ETHERSCAN_API_KEY,COINMARKETCAP_API_KEY } = process.env;
module.exports = {
   solidity: "0.8.9",
   defaultNetwork: "hardhat",
   networks: {
      hardhat: {},
      goerli: {
         url: API_URL,
         accounts: [`0x${PRIVATE_KEY}`]
      },
         hardhat: {
             // // If you want to do some forking, uncomment this
             // forking: {
             //   url: MAINNET_RPC_URL
             // }
             chainId: 31337,
         },
         localhost: {
             chainId: 31337,
         },
 
    
   },
   etherscan:{
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter:{
   enabled: true, //just set to false when you don't want gas reporter
   outputFile: "gas-report.txt",
   noColors: true,
   gasPrice: 70,
   currency:"USD",
   coinmarketcap: COINMARKETCAP_API_KEY, //to get the usd value of gas
   //token: "MATIC",
 }
}
