// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
// THE SELECTION OF A TOKEN AND THE PERCENTAGE MUST BE DONE IN THE FRONTEND OR TESTING SCRIPT

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "hardhat/console.sol";
//IERC20 for testing Purposes, know the balances of the tokens
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ToolV2 {
    /* IUniswapV2Router02 public constant uniswapRouterV2 = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D); */
    ISwapRouter public constant uniswapRouterV3 =
        ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);

    //WETH TOKEN ADDRESS
    address internal constant WETH9 =
        0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    //Function to see the balance of the other tokens for the msg.sender and the balance of the fee recipient
    function balanceToken(address[] memory tokenAddress)
        public
        view
        returns (uint256)
    {
        IERC20 tokenizedAddress1 = IERC20(tokenAddress[0]);
        IERC20 tokenizedAddress2 = IERC20(tokenAddress[1]);
        console.log(
            "Balance of Token 1 of the msg.sender: ",
            tokenizedAddress1.balanceOf(msg.sender)
        );
        console.log(
            "Balance of Token 2 of the msg,sender: ",
            tokenizedAddress2.balanceOf(msg.sender)
        );
        return (address(0x70997970C51812dc3A010C7d01b50e0d17dc79C8).balance);
    }

    //ToolV1 function
    /* function swapForPercentage(uint[] memory percentage,address[] memory tokenAddress) public payable {
        require(msg.value > 0, "Must pass non 0 ETH amount");
        require(percentage[0] >= 0 && percentage[0] <= 100, "Must be 0 or greater"); //overflow - underflow guard
        uint deadline = block.timestamp + 30; 
        uint time;
        require(block.timestamp > time + 5, "Simple Reentrancy Guard"); // Simple reentrancy guard
        time = block.timestamp;
        uint balance = msg.value;
        uint fee = (msg.value)/1000;
        balance = balance - fee;
        swapUNIV2((balance*percentage[0])/100, getPath(tokenAddress[0]), deadline); // change UNI for testing
        swapUNIV2(((balance*(100 - percentage[0]))/100), getPath(tokenAddress[1]), deadline); // change LINK for testing
        sendFee(fee);
    } */
    //swap of uniswap v2
    /* function swapUNIV2(uint valueForTx, address[] memory path, uint deadline ) private {
        uniswapRouterV2.swapExactETHForTokens{ value: valueForTx }(0, path, address(msg.sender), deadline);
    } */
    //calculate the path for uniswap v2
    /* function getPath(address _tokenAddress) private pure returns (address[] memory) {
        address[] memory path = new address[](2);
        path[0] = uniswapRouterV2.WETH();
        path[1] = _tokenAddress;
        
        return path;
    } */
    //ToolV2 function
    function swapForPercentageV2(
        uint256[] memory percentage,
        address[] memory tokenAddress,
        string[] memory protocol
    ) external payable {
        string memory UNISWAP_V3 = "Uniswap_V3";
        require(msg.value > 0, "Must pass non 0 ETH amount");
        require(
            percentage[0] >= 0 && percentage[0] <= 100,
            "Must be 0 or greater"
        ); // overflow - underflow guard

        uint256 balance = msg.value;
        uint256 dexFee = (msg.value) / 1000;
        balance = balance - dexFee;

        ISwapRouter.ExactInputSingleParams memory params1 = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: WETH9,
                tokenOut: tokenAddress[0], // change this one for testing
                fee: 3000,
                recipient: msg.sender,
                deadline: block.timestamp + 15,
                amountIn: (balance * percentage[0]) / 100,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

        ISwapRouter.ExactInputSingleParams memory params2 = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: WETH9,
                tokenOut: tokenAddress[1], // change this one for testing
                fee: 3000,
                recipient: msg.sender,
                deadline: block.timestamp + 15,
                amountIn: (balance * (100 - percentage[0])) / 100,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });
        //UNISWAP V3 protocols
        if (
            keccak256(abi.encodePacked((protocol[0]))) ==
            keccak256(abi.encodePacked((UNISWAP_V3)))
        ) {
            swapUNIV3((balance * percentage[0]) / 100, params1);
        }
        if (
            keccak256(abi.encodePacked((protocol[1]))) ==
            keccak256(abi.encodePacked((UNISWAP_V3)))
        ) {
            swapUNIV3((balance * (100 - percentage[0])) / 100, params2);
            //sendFee(dexFee);
        }
    }

    function swapUNIV3(
        uint256 valueForTx,
        ISwapRouter.ExactInputSingleParams memory params
    ) private {
        uniswapRouterV3.exactInputSingle{value: valueForTx}(params);
    }

    /* function sendFee(uint _fee) public payable {
        // Call returns a boolean value indicating success or failure.
        // This is the current recommended method to use.
        // 2nd address of Hardhat node
        (bool sent,) = address(0x70997970C51812dc3A010C7d01b50e0d17dc79C8).call{value: _fee}("");
        
    } */
}
