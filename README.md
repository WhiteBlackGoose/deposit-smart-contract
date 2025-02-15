# Borrowing System

![Deployment](https://img.shields.io/github/actions/workflow/status/WhiteBlackGoose/deposit-smart-contract/deploy.yml?label=deploy)
![Tests](https://img.shields.io/github/actions/workflow/status/WhiteBlackGoose/deposit-smart-contract/tests.yml?label=tests)

That's a smart contract PoC on hardhat.

## Run node locally
```
cd contract
npx hardhat node
```

## Add account to MetaMask

1. Open MetaMask
1. Click on the network dropdown
    1. URL: `http://localhost:8545`
    1. Chain ID: `31337`
    1. Currency Symbol: `ETH`
1. Click on the account icon
1. Click on `Import Account`
1. Paste the private key from the terminal where you started the node

## Deploy contract locally
```
cd contract
npx hardhat ignition deploy --reset ./ignition/modules/deploy.ts --network localhost
```

## Interact with the app

Either start the frontend locally:
```
cd gui
npm run dev
```
or go [Live App](https://borger.wbg.gg).

Connect your wallet and paste the ID of your smart contract in the field at the bottom.
