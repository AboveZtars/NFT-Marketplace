// test

// Load dependencies
const { expect } = require("chai");
const { upgrades } = require("hardhat");

// Start test block 1
describe("NFT Marketplace without upgrades", function () {
  let NFTMarketplace;
  let accounts;

  before('deploy NFT Marketplace', async () => {
    console.log("Deploying NFT smart contract")
    const NFTMarketplaceFactory = await ethers.getContractFactory("NFTMarketplace");
    NFTMarketplace = await NFTMarketplaceFactory.deploy();
    accounts = await ethers.getSigners();

    await NFTMarketplace.deployed();
  })
  
  // Test case for setting the right owner 
  it("Checking owner without upgrades", async function () {
    await NFTMarketplace.initialize();
    var admin = await NFTMarketplace.owner(); 
    console.log("Admin or owner of the contract: "+ admin);
    expect(admin).to.equal(accounts[0].address);
  });
});


// Start test block 2
describe("NFT Marketplace with upgrades", function () {
  let NFTMarketplace;
  let accounts;

  before('deploy NFT Marketplace with upgrades', async () => {
    console.log("Deploying NFT smart contract")
    const NFTMarketplaceFactory = await ethers.getContractFactory("NFTMarketplace");
    NFTMarketplace = await upgrades.deployProxy(NFTMarketplaceFactory,[],{initializer: 'initialize'}); 
    accounts = await ethers.getSigners();
  
    await NFTMarketplace.deployed();
  })
  it("Checking owner with upgrades", async function () {
    var admin = await NFTMarketplace.owner(); 
    console.log("Admin or owner of the contract: "+ admin);
    expect(admin).to.equal(accounts[0].address);
  });
});

