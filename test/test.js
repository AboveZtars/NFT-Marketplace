// test

// Load dependencies
const { expect } = require("chai");
const { time,BN, constants } = require('@openzeppelin/test-helpers');
const genericErc20Abi = require("./ERC20/ERC20.json");


// Variables for testing the settings of the variable inside the smart contract
const fee = 1;
const recipient = 1;
const DAIETH = "0x773616E4d11A78F511299002da57A0a94577F1f4";
const ETHUSD = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
const LINKUSD = "0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c";
const pair = DAIETH;
const  DAI  = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const  LINK = "0x514910771AF9Ca656af840dff83E8264EcF986CA";
const source1 = "Uniswap_V3";
const source2 = "Uniswap_V3";
// Start test block 1
describe("NFT Marketplace without upgrades", function () {
  let NFTMarketplace;
  let accounts;

  before("deploy NFT Marketplace", async () => {
    accounts = await ethers.getSigners();
    console.log("Deploying NFT smart contract");
    const NFTMarketplaceFactory = await ethers.getContractFactory(
      "NFTMarketplace"
    );
    NFTMarketplace = await NFTMarketplaceFactory.deploy();
    await NFTMarketplace.deployed();
  });

  // Test case for owner initial state
  it("Checking initial state without upgrades", async function () {
    //Initial state is 1% fee and address in position 1 of hardhat accounts
    await NFTMarketplace.initialize(1, accounts[1].address);
    //Responses of variables inside the contract
    let admin = await NFTMarketplace.owner();
    let feeResponse = await NFTMarketplace.fee();
    let recipientResponse = await NFTMarketplace.recipient();
    //Expect block to verify all 3 variables
    expect(admin).to.equal(accounts[0].address); //Verifying the owner
    expect(feeResponse).to.equal(1); //Verifying 1% fee
    expect(recipientResponse).to.equal(accounts[1].address); // Verifying first recipient
  });
  // Test case for setting the fee
  it("Setting the Fee", async function () {
    await NFTMarketplace.setFee(fee);
    let feeResponse = await NFTMarketplace.fee();
    expect(feeResponse).to.equal(fee);
  });

  // Test case for setting the recipient
  it("Setting the recipient", async function () {
    await NFTMarketplace.setRecipient(accounts[recipient].address);
    let recipientResponse = await NFTMarketplace.recipient();
    expect(recipientResponse).to.equal(accounts[recipient].address);
  });

  // Test case for chainlink oracle
  it("Chainlink oracle", async function () {
    let price = await NFTMarketplace.getLatestPrice(pair);
    console.log("Lets see whats in here: " + price / 10 ** 18);
    expect(price).to.exist;
  });

});

// Start test block 2
describe("NFT ERC1155 token", function () {
  let NFT;
  let accounts;

  before("deploy NFT token contract", async () => {
    accounts = await ethers.getSigners();
    console.log("Deploying NFT token smart contract");
    const NFTFactory = await ethers.getContractFactory("NFT");
    NFT = await NFTFactory.deploy();
    await NFT.deployed();
  });

  // Test case for minting tokens
  it("Check minting", async function () {
    //Mint 50 tokens

    await expect(await NFT.createToken(accounts[2].address))
      .to.emit(NFT, "idEvent")
      .withArgs(1);
  });
  // Test case for checking the balance
  it("Cheking balance of tokens for address 1 of hardhat", async function () {
    let amountOfTokens = await NFT.balanceOf(accounts[2].address, 1);
    expect(amountOfTokens).to.equal(50);
  });
});

// Start test block 3
describe("NFT Marketplace", function () {
  let ToolV2
  let NFTMarketplace;
  let NFT;
  let accounts;
  let erc20Contract;

  before("deploy NFT Marketplace and NFT token contract", async () => {
    accounts = await ethers.getSigners();
    
    erc20ContractDAI = new ethers.Contract(DAI, genericErc20Abi, await ethers.provider);
    erc20ContractLINK = new ethers.Contract(LINK, genericErc20Abi, await ethers.provider);
    console.log("Deploying NFT Marketplace smart contract");
    const NFTMarketplaceFactory = await ethers.getContractFactory(
      "NFTMarketplace"
    );
    NFTMarketplace = await NFTMarketplaceFactory.deploy();
    await NFTMarketplace.deployed();
    
    console.log("Deploying NFT token smart contract");
    const NFTFactory = await ethers.getContractFactory(
      "NFT"
    );
    NFT = await NFTFactory.deploy();
    console.log("NFT Token smart contract address: " + NFT.address)
    await NFT.deployed();
    
    
    console.log("Deploying Swapper smart contract");
    const ToolV2Factory = await ethers.getContractFactory(
      "ToolV2"
    );
    ToolV2 = await ToolV2Factory.deploy();
    await ToolV2.deployed();

    const Tx = await ToolV2.connect(accounts[3]).swapForPercentageV2([50],[DAI,LINK],[source1,source2],{value:ethers.utils.parseEther("100")});
    await Tx.wait();

    const balanceDAI = (await erc20ContractDAI.balanceOf(accounts[3].address)).toString();
    const balanceLINK = (await erc20ContractLINK.balanceOf(accounts[3].address)).toString();

    await erc20ContractDAI.connect(accounts[3]).approve(NFTMarketplace.address, constants.MAX_UINT256.toString());
    await NFT.connect(accounts[2]).setApprovalForAll(NFTMarketplace.address,true);
    console.log("Balances of DAI: " + balanceDAI);
    console.log("Balances of LINK: " + balanceLINK);


  });

  /* //Swapping ETH for DAI and LINK
  it("Check for balances and swaps with uniswap ", async function () {

  }); */


  // Test case for initial state
  it("Checking initial state of Marketplace", async function () {
    //Initial state is 1% fee and address in position 1 of hardhat accounts
    await NFTMarketplace.initialize(1, accounts[1].address);
    //Responses of variables inside the contract
    let admin = await NFTMarketplace.owner();
    let feeResponse = await NFTMarketplace.fee();
    let recipientResponse = await NFTMarketplace.recipient();
    //Expect block to verify all 3 variables
    expect(admin).to.equal(accounts[0].address); //Verifying the owner
    expect(feeResponse).to.equal(1); //Verifying 1% fee
    expect(recipientResponse).to.equal(accounts[1].address); // Verifying first recipient
  });
  
  // Test case for minting tokens
  it("Check minting", async function () {
    //Mint 50 tokens
    await expect(await NFT.createToken(accounts[2].address))
      .to.emit(NFT, "idEvent")
      .withArgs(1);
  });
  // Test case for checking the balance
  it("Cheking balance of tokens for address 3 of hardhat", async function () {
    let amountOfTokens = await NFT.balanceOf(accounts[2].address, 1);
    expect(amountOfTokens).to.equal(50);
  });


  //Test case creation of an offer
  it("Cheking creation of offer", async function () {
    let blockNum = await ethers.provider.getBlockNumber();
    let block = await ethers.provider.getBlock(blockNum);
    let timestamp = new BN(block.timestamp);
    let jsdeadlinetime = 1 + Number(timestamp) + Number(time.duration.years(1)); //1 second off set 

    await expect(await NFTMarketplace.connect(accounts[2]).createMarketOffer(NFT.address, 1, 25, time.duration.years(1).toString(), 1000)) 
      .to.emit(NFTMarketplace, "ItemOfferCreated") 
      .withArgs(1, NFT.address, 1, 25, timestamp, jsdeadlinetime, accounts[2].address, 1000); 
  });

  //Test case cancel of an offer
  /* it("Cheking cancelation of an offer", async function () {

    await expect(await NFTMarketplace.connect(accounts[2]).cancelOffer(1)) 
      .to.emit(NFTMarketplace, "OfferCanceled") 
      .withArgs(false); 
  }); */


  //Test case getting the offer
  /* it("Cheking offer", async function () {
    let res = await NFTMarketplace.getOffer(1);
    console.log(res);
  }); */
  



  /* // Test case creation of 
  it("Cheking creation of offer 2", async function () {
    await expect(await NFTMarketplace.connect(accounts[2]).createMarketOffer(NFT.address, 1, 25, 1, 100))
      .to.emit(NFTMarketplace, "ItemOfferCreated")
      .withArgs(2, NFT.address, 1, 25, 1, accounts[2].address, 100, true);
  });
  it("Cheking creation of offer 3", async function () {
    await expect(await NFTMarketplace.connect(accounts[2]).createMarketOffer(NFT.address, 1, 1, 1, 100))
      .to.emit(NFTMarketplace, "ItemOfferCreated")
      .withArgs(3, NFT.address, 1, 1, 1, accounts[2].address, 100, true);
  });
  it("Cheking creation of offer 4", async function () {
    await expect(await NFTMarketplace.connect(accounts[2]).createMarketOffer(NFT.address, 1, 1, 1, 100))
      .to.emit(NFTMarketplace, "ItemOfferCreated")
      .withArgs(4, NFT.address, 1, 1, 1, accounts[2].address, 100, true);
  }); */

  // Test case for accepting offer
  it("Cheking accept Offer with DAI", async function () {
    await NFTMarketplace.connect(accounts[3]).acceptOffer(1,pair);
    
    //expect(amountOfTokens).to.equal(50);
  });

  it("Cheking NFT Balances of Buyer and Seller ", async function () {
    let amountOfTokensBuyer = await NFT.balanceOf(accounts[3].address, 1);
    let amountOfTokensSeller = await NFT.balanceOf(accounts[2].address, 1);
    expect(amountOfTokensBuyer).to.equal(25);
    expect(amountOfTokensSeller).to.equal(25);
  });

});