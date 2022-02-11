# NFT Marketplace

Simple Marketplace of 1155 Tokens

## Dependencies

Install dependencies with `npm install` or `yarn`

## Compiling

```
npm run compile
yarn compile
```

## Testing

```
npm run test
yarn test
```
Remember to add your `.env` file for testing in the root and add in the file:
```
ALCHEMY_KEY=< create one @ https://www.alchemy.com/> 
```
## Deploying

```
npm run deploy
yarn deploy
```

## Accounts 
This are the accounts that Hardhat provided us in order.
Using them for testing.
```
account[0] => Creator and owner 
account[1] => Recipient
account[2] => Owner of NFT and Seller
account[3] => Buyer, have DAI and LINK tokens
```
