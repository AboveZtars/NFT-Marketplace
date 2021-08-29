// test

// Load dependencies
const { expect } = require("chai");
const { time,BN } = require('@openzeppelin/test-helpers');

// Variables for testing the settings of the variable inside the smart contract
const fee = 1;
const recipient = 1;
const DAIUSD = "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9";
const ETHUSD = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
const LINKUSD = "0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c";
const pair = ETHUSD;

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
    console.log("Lets see whats in here: " + price / 10 ** 8);
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
  let NFTMarketplace;
  let NFT;
  let accounts;

  before("deploy NFT Marketplace and NFT token contract", async () => {
    accounts = await ethers.getSigners();
    
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
  });

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


  //Deadline make to worked
  it("Cheking creation of offer", async function () {
    const blockNum = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNum);
    const timestamp = new BN(block.timestamp);
    const jsdeadlinetime =1 + Number(timestamp) + Number(time.duration.years(1));
    console.log("jstimestamp: "+timestamp);
    console.log("jsdeadlinetime: "+jsdeadlinetime);
    await expect(await NFTMarketplace.connect(accounts[2]).createMarketOffer(NFT.address, 1, 25, time.duration.years(1).toString(), 100)) 
      .to.emit(NFTMarketplace, "ItemOfferCreated") //
      .withArgs(1, NFT.address, 1, 25, timestamp, jsdeadlinetime, accounts[2].address, 100); //
  });



  /* // Test case creation of first offer
  it("Cheking creation of offer", async function () {
    const now = Date.now();
    await ethers.provider.send('evm_setNextBlockTimestamp', [now]);
    await ethers.provider.send("evm_mine");
    const blockNum = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNum);
    const timestamp = new BN(block.timestamp);
    
    //expect(timestamp).to.equal(now);
    await expect(await NFTMarketplace.connect(accounts[2]).createMarketOffer(NFT.address, 1, 25, time.duration.years(1).toString(), 100))
      .to.emit(NFTMarketplace, "Time") //ItemOfferCreated
      .withArgs(timestamp); //1, NFT.address, 1, 25, await time.latest(),time.duration.years('1'), accounts[2].address, 100, true
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
  /* it("Cheking oracle", async function () {
    let price = await NFTMarketplace.getPriceInWei(pair);
    console.log(price);
    //expect(amountOfTokens).to.equal(50);
  }); */

});