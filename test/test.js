// test/ToolV1Test.js

//API 0x NEED A VPN IF YOU ARE IN VENEZUELA

// Load dependencies
const { expect } = require("chai");
const axios = require("axios");
// Hardcoded Token Address for testing in API
const WETH9 = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const UNI = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";
const LINK = "0x514910771AF9Ca656af840dff83E8264EcF986CA";
const BUSD = "0x4Fabb145d64652a948d72533023f6E7A623C7C53";
const SUSHI = "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2";
const BAT = "0x0D8775F648430679A709E98d2b0Cb6250d2887EF";
const RSR = "0x8762db106B2c2A0bccB3A80d1Ed41273552616E8";
const STRONG = "0x990f341946A3fdB507aE7e52d17851B87168017c";
const BNT = "0x1F573D6Fb3F13d689FF844B4cE37794d79a7FF1C";
const RSV = "0x196f4727526eA7FB1e17b2071B3d8eAA38486988";

//Url for get the best Routes to make a swap
//Hardcode the address for testing, notice you have to change this ones for ToolV1 or ToolV2 as well

//API call
async function getSource(Token) {
  try {
    const response = await axios.get(Token);
    return response;
  } catch (error) {
    console.error(error);
  }
}

//PARAMETERS TO TEST TOOL
//IT WILL SEARCH FOR THE BEST PROTOCOL FOR UNISWAP V2 AND UNISWAP V3 AND MAKE THE SWAPS
const token1 = RSR;
const token2 = DAI;
const valueInEthers = "2"; //msg.value of the Tx

// Start test block
describe("ToolV2 (proxy)", function () {
  // Test case
  it("Checking transaction", async function () {
    //Upgradeable contract Testing for ToolV1 --> ToolV2
    const ToolV1Factory = await ethers.getContractFactory("ToolV1");
    const ToolV2Factory = await ethers.getContractFactory("ToolV2");
    const ToolV1 = await upgrades.deployProxy(ToolV1Factory, [], {
      initializer: false,
    });
    const ToolV2 = await upgrades.upgradeProxy(ToolV1.address, ToolV2Factory);
    const urlFirstToken =
      "https://api.0x.org/swap/v1/quote?buyToken=" +
      token1 +
      "&sellToken=" +
      WETH9 +
      "&sellAmount=1000000000000000000&includedSources=Uniswap_V3,Uniswap_V2";
    const urlSecondToken =
      "https://api.0x.org/swap/v1/quote?buyToken=" +
      token2 +
      "&sellToken=" +
      WETH9 +
      "&sellAmount=1000000000000000000&includedSources=Uniswap_V2,Uniswap_V3";
    const source1 = await getSource(urlFirstToken).then(
      (res) => res.data.orders[0].source
    );
    const source2 = await getSource(urlSecondToken).then(
      (res) => res.data.orders[0].source
    );
    console.log("Source for First Token: " + source1);
    console.log("Source for Second Token: " + source2);
    // Swap Transaction    ARRAY PASS THE DESIRE PERCENTAGE OF THE FIRST TOKEN, THE PERCENTAGE OF THE SECOND TOKEN IS CALCULATED BY THE SMART CONTRACT
    //source1 its for the first token -> urlFirstToken. source2 its for the second token -> urlSecondToken
    const Tx = await ToolV2.swapForPercentageV2(
      [70],
      [token1, token2],
      [source1, source2],
      { value: ethers.utils.parseEther(valueInEthers) }
    );
    await Tx.wait();
    // Showing account balance
    console.log(
      "Recipient after sending the fee: " +
        (await ToolV2.balanceToken([token1, token2])).toString() /
          (1 * 10 ** 18)
    );
  }).timeout(50000);
});
