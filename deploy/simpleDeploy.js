async function main() {
    // We get the contract to deploy
    const ToolV1Factory = await ethers.getContractFactory("ToolV1");
    const ToolV1 = await ToolV1Factory.deploy();
  
    console.log("ToolV1 deployed to:", ToolV1.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });