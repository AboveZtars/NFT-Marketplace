// test

// Load dependencies
const { expect } = require("chai");
const { time, BN, constants } = require("@openzeppelin/test-helpers");
const genericErc20Abi = require("./ERC20/ERC20.json");

// Variables for testing the settings of the variable inside the smart contract
const fee = 1; //Only the owner can set the fee
const recipient = 1; //Only the owner can set the recipient
//To test the oracle
const DAIETH = "0x773616E4d11A78F511299002da57A0a94577F1f4";
const LINKETH = "0xDC530D9457755926550b59e8ECcdaE7624181557";
//For the swapper tool
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const LINK = "0x514910771AF9Ca656af840dff83E8264EcF986CA";
const source1 = "Uniswap_V3";
const source2 = "Uniswap_V3";

// Start test block 1, to test the behavior of the NFT Marketplace and the NFT Token Contract
describe("Testing behavior of NFTMarketplace and NFT contract", function () {
  let NFTMarketplace;
  let NFT;
  let accounts;

  before("deploy NFT Marketplace and NFT Contract", async () => {
    accounts = await ethers.getSigners();
    console.log("Deploying NFT smart contract");
    const NFTMarketplaceFactory = await ethers.getContractFactory(
      "NFTMarketplace"
    );
    NFTMarketplace = await NFTMarketplaceFactory.deploy();
    await NFTMarketplace.deployed();

    console.log("Deploying NFT token smart contract");
    const NFTFactory = await ethers.getContractFactory("NFT");
    NFT = await NFTFactory.deploy();
    await NFT.deployed();
  });

  // Test case for owner initial state
  it("Checking initial state", async function () {
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

  // Test cases for chainlink oracle
  it("Chainlink oracle DAIETH", async function () {
    let price = await NFTMarketplace.getLatestPrice(DAIETH);
    expect(price).to.exist;
  });
  it("Chainlink oracle LINKETH", async function () {
    let price = await NFTMarketplace.getLatestPrice(LINKETH);
    expect(price).to.exist;
  });

  // Test case for minting tokens
  it("Check minting", async function () {
    //Mint 100 tokens
    await expect(await NFT.createToken(accounts[2].address))
      .to.emit(NFT, "idEvent")
      .withArgs(1);
  });
  // Test case for checking the balance
  it("Cheking balance of tokens for address 3 of hardhat", async function () {
    let amountOfTokens = await NFT.balanceOf(accounts[2].address, 1);
    expect(amountOfTokens).to.equal(100);
  });
});

// Start test block 2, Some functions of the NFT Token Contract and the Marketplace tested on the test block 1
// are called on the before block to ensure the right behavior of the testing (minting tokens and initial state)
describe("NFT Marketplace", function () {
  let ToolV2;
  let NFTMarketplace;
  let NFT;
  let accounts;

  before("deploy NFT Marketplace and NFT token contract", async () => {
    accounts = await ethers.getSigners();

    erc20ContractDAI = new ethers.Contract(
      DAI,
      genericErc20Abi,
      await ethers.provider
    );
    erc20ContractLINK = new ethers.Contract(
      LINK,
      genericErc20Abi,
      await ethers.provider
    );

    //NFT Marketplace
    const NFTMarketplaceFactory = await ethers.getContractFactory(
      "NFTMarketplace"
    );
    NFTMarketplace = await NFTMarketplaceFactory.deploy();
    await NFTMarketplace.deployed();

    //NFT Token contract to mint NFTs
    const NFTFactory = await ethers.getContractFactory("NFT");
    NFT = await NFTFactory.deploy();
    await NFT.deployed();

    //Swapper tool to get Tokens
    const ToolV2Factory = await ethers.getContractFactory("ToolV2");
    ToolV2 = await ToolV2Factory.deploy();
    await ToolV2.deployed();

    //Obtaining DAI and LINK tokens to test transfers
    const Tx = await ToolV2.connect(accounts[3]).swapForPercentageV2(
      [50],
      [DAI, LINK],
      [source1, source2],
      { value: ethers.utils.parseEther("100") }
    );
    await Tx.wait();
    await erc20ContractDAI
      .connect(accounts[3])
      .approve(NFTMarketplace.address, constants.MAX_UINT256.toString());
    await erc20ContractLINK
      .connect(accounts[3])
      .approve(NFTMarketplace.address, constants.MAX_UINT256.toString());
    await NFT.connect(accounts[2]).setApprovalForAll(
      NFTMarketplace.address,
      true
    );

    //Initial state is 1% fee and address in position 1 of hardhat accounts
    await NFTMarketplace.initialize(1, accounts[1].address);
    // Minting 100 tokens
    await NFT.createToken(accounts[2].address);
  });

  //Test case creation of offer 1
  it("Cheking creation of offer 1", async function () {
    let blockNum = await ethers.provider.getBlockNumber();
    let block = await ethers.provider.getBlock(blockNum);
    let timestamp = new BN(block.timestamp);
    let jsdeadlinetime = 1 + Number(timestamp) + Number(time.duration.years(1)); //1 second off set

    await expect(
      await NFTMarketplace.connect(accounts[2]).createMarketOffer(
        NFT.address,
        1,
        25,
        time.duration.years(1).toString(),
        1000
      )
    )
      .to.emit(NFTMarketplace, "ItemOfferCreated")
      .withArgs(
        1,
        NFT.address,
        1,
        25,
        timestamp,
        jsdeadlinetime,
        accounts[2].address,
        1000
      );
  });

  // Test case creation of offer 2
  it("Cheking creation of offer 2", async function () {
    let blockNum = await ethers.provider.getBlockNumber();
    let block = await ethers.provider.getBlock(blockNum);
    let timestamp = new BN(block.timestamp);
    let jsdeadlinetime = 1 + Number(timestamp) + Number(time.duration.years(1)); //1 second off set

    await expect(
      await NFTMarketplace.connect(accounts[2]).createMarketOffer(
        NFT.address,
        1,
        25,
        time.duration.years(1).toString(),
        1000
      )
    )
      .to.emit(NFTMarketplace, "ItemOfferCreated")
      .withArgs(
        2,
        NFT.address,
        1,
        25,
        timestamp,
        jsdeadlinetime,
        accounts[2].address,
        1000
      );
  });
  // Test case creation of offer 3
  it("Cheking creation of offer 3", async function () {
    let blockNum = await ethers.provider.getBlockNumber();
    let block = await ethers.provider.getBlock(blockNum);
    let timestamp = new BN(block.timestamp);
    let jsdeadlinetime = 1 + Number(timestamp) + Number(time.duration.years(1)); //1 second off set

    await expect(
      await NFTMarketplace.connect(accounts[2]).createMarketOffer(
        NFT.address,
        1,
        25,
        time.duration.years(1).toString(),
        1000
      )
    )
      .to.emit(NFTMarketplace, "ItemOfferCreated")
      .withArgs(
        3,
        NFT.address,
        1,
        25,
        timestamp,
        jsdeadlinetime,
        accounts[2].address,
        1000
      );
  });
  // Test case creation of offer 4
  it("Cheking creation of offer 4", async function () {
    let blockNum = await ethers.provider.getBlockNumber();
    let block = await ethers.provider.getBlock(blockNum);
    let timestamp = new BN(block.timestamp);
    let jsdeadlinetime = 1 + Number(timestamp) + Number(time.duration.years(1)); //1 second off set

    await expect(
      await NFTMarketplace.connect(accounts[2]).createMarketOffer(
        NFT.address,
        1,
        25,
        time.duration.years(1).toString(),
        1000
      )
    )
      .to.emit(NFTMarketplace, "ItemOfferCreated")
      .withArgs(
        4,
        NFT.address,
        1,
        25,
        timestamp,
        jsdeadlinetime,
        accounts[2].address,
        1000
      );
  });

  //Test case cancel of an offer
  it("Cheking cancelation of offer 4", async function () {
    await expect(await NFTMarketplace.connect(accounts[2]).cancelOffer(4))
      .to.emit(NFTMarketplace, "OfferCanceled")
      .withArgs(false);
  });

  // Test case for accepting offer ETH
  it("Cheking accept Offer with ETH", async function () {
    await expect(
      await NFTMarketplace.connect(accounts[3]).acceptOffer(1, "ETH", {
        value: ethers.utils.parseEther("1"),
      })
    )
      .to.emit(NFTMarketplace, "OfferAccepted")
      .withArgs(false, true);
  });

  // Test case for accepting offer DAI
  it("Cheking accept Offer with DAI", async function () {
    await expect(
      await NFTMarketplace.connect(accounts[3]).acceptOffer(2, "DAI")
    )
      .to.emit(NFTMarketplace, "OfferAccepted")
      .withArgs(false, true);
  });

  // Test case for accepting offer LINK
  it("Cheking accept Offer with LINK", async function () {
    await expect(
      await NFTMarketplace.connect(accounts[3]).acceptOffer(3, "LINK")
    )
      .to.emit(NFTMarketplace, "OfferAccepted")
      .withArgs(false, true);
  });

  //Balances checkings
  it("Cheking NFT Balance of Buyer to be 75 NFT Tokens ", async function () {
    let amountOfTokensBuyer = await NFT.balanceOf(accounts[3].address, 1);
    expect(amountOfTokensBuyer).to.equal(75);
  });
  it("Cheking NFT Balance of Seller to be 25 NFT Tokens ", async function () {
    let amountOfTokensSeller = await NFT.balanceOf(accounts[2].address, 1);
    expect(amountOfTokensSeller).to.equal(25);
  });
  it("Cheking ETH Balances of the Recipient to be above 1000 eth", async function () {
    let balance = await accounts[1].getBalance();
    expect(balance / (1 * 10 ** 18)).to.be.above(1000);
  });
  it("Cheking DAI Balances of the Recipient to be above 0 DAI", async function () {
    let balance = await erc20ContractDAI.balanceOf(accounts[1].address);
    expect(balance / (1 * 10 ** 18)).to.be.above(0);
  });
  it("Cheking LINK Balances of the Recipient to be above 0 LINK", async function () {
    let balance = await erc20ContractLINK.balanceOf(accounts[1].address);
    expect(balance / (1 * 10 ** 18)).to.be.above(0);
  });
});