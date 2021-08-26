// test

// Load dependencies
const { expect } = require("chai");
const { upgrades } = require("hardhat");
// Variables for testing the settings of the variable inside the smart contract
const fee = 2; 
const recipient = 1; 

// Start test block 1
describe("NFT Marketplace without upgrades", function () {
  let NFTMarketplace;
  let accounts;

  before('deploy NFT Marketplace', async () => {
    accounts = await ethers.getSigners();
    console.log("Deploying NFT smart contract")
    const NFTMarketplaceFactory = await ethers.getContractFactory("NFTMarketplace");
    NFTMarketplace = await NFTMarketplaceFactory.deploy();
    await NFTMarketplace.deployed();
  })

  // Test case for owner initial state
  it("Checking initial state without upgrades", async function () {
    //Initial state is 1% fee and address in position 1 of hardhat accounts
    await NFTMarketplace.initialize(1,accounts[1].address); 
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
    console.log("New fee: "+ feeResponse);
    expect(feeResponse).to.equal(fee);
  });

  // Test case for setting the recipient
  it("Setting the recipient", async function () {
    await NFTMarketplace.setRecipient(accounts[recipient].address);
    let recipientResponse = await NFTMarketplace.recipient();
    console.log("New recipient: "+ recipientResponse);
    expect(recipientResponse).to.equal(accounts[recipient].address);
  });

 /*  it("Checking Sum", async function () {
    
    var number = await NFTMarketplace.sum(); 
    console.log("Number : "+ number);
    expect(number).to.equal(4);
  }); */

});


/* // Start test block 2
describe("NFT Marketplace with upgrades", function () {
  let NFTMarketplace;
  let accounts;

  before('deploy NFT Marketplace with upgrades', async () => {
    console.log("Deploying NFT smart contract")
    accounts = await ethers.getSigners();
    const NFTMarketplaceFactory = await ethers.getContractFactory("NFTMarketplace");
    NFTMarketplace = await upgrades.deployProxy(NFTMarketplaceFactory,[1,accounts[recipient].address],{initializer: 'initialize'}); 
    await NFTMarketplace.deployed();
  })
  // Test case for setting the right owner 
  it("Checking owner with upgrades", async function () {
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
    console.log("New fee: "+ feeResponse);
    expect(feeResponse).to.equal(fee);
  });

  // Test case for setting the recipient
  it("Setting the recipient", async function () {
    await NFTMarketplace.setRecipient(accounts[recipient].address);
    let recipientResponse = await NFTMarketplace.recipient();
    console.log("New recipient: "+ recipientResponse);
    expect(recipientResponse).to.equal(accounts[recipient].address);
  });
});
 */
