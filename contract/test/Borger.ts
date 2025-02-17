import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { Borger } from "../typechain-types";
import { Signer } from "ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import { BigNumber } from "@ethersproject/bignumber";



describe("Borger", function () {
    async function deployBorgerFixture() {
      const BorgerFactory = await ethers.getContractFactory("Borger");
      const [owner, borrower] = await ethers.getSigners();
      const borger = await BorgerFactory.deploy();
      const deploymentTransaction = borger.deploymentTransaction();
      if (deploymentTransaction) {
        await deploymentTransaction.wait();
      } else {
        throw new Error("Deployment transaction is null");
      }
      return { borger, owner, borrower };
    }

    it("Should set the correct owner", async function () {
      const { borger, owner } = await loadFixture(deployBorgerFixture);
      expect(await borger.owner()).to.equal(await owner.getAddress());
    });

    it("Should set the correct item details", async function () {
      const { borger } = await loadFixture(deployBorgerFixture);
      const item = await borger.item();
      expect(item.name).to.equal("Vitalik Buterin");
      expect(item.sha256hash).to.equal("0xdd76cf5210b29098297dbb17b8ece744ef72c154f55cc0d1a4db0749932293ef");
      expect(item.deposit).to.equal(ethers.parseEther("21"));
    });

    it("Should allow borrowing with correct deposit", async function () {
      const { borger, borrower } = await loadFixture(deployBorgerFixture);
      await expect(borger.connect(borrower).borrowItem({ value: ethers.parseEther("21") }))
        .to.not.be.reverted;
    });
  

    it("Should not allow borrowing with incorrect deposit", async function () {
      const { borger, borrower } = await loadFixture(deployBorgerFixture);
      await expect(borger.connect(borrower).borrowItem({ value: ethers.parseEther("20") }))
        .to.be.revertedWith("Invalid deposit amount");
    });

    it("Should not allow borrowing twice", async function () {
      const { borger, borrower } = await loadFixture(deployBorgerFixture);  
      await borger.connect(borrower).borrowItem({ value: ethers.parseEther("21") });
      await expect(borger.connect(borrower).borrowItem({ value: ethers.parseEther("21") }))
        .to.be.revertedWith("Item already borrowed");
    });

    it("Should allow returning with correct hash", async function () {
      const { borger, borrower } = await loadFixture(deployBorgerFixture);  
      await borger.connect(borrower).borrowItem({ value: ethers.parseEther("21") });
      await expect(borger.connect(borrower).returnItem("0xdd76cf5210b29098297dbb17b8ece744ef72c154f55cc0d1a4db0749932293ef"))
        .to.not.be.reverted;
    });

    it("Should not allow returning with incorrect hash", async function () {
      const { borger, borrower } = await loadFixture(deployBorgerFixture);  
      await borger.connect(borrower).borrowItem({ value: ethers.parseEther("21") });
      await expect(borger.connect(borrower).returnItem("0x0000000000000000000000000000000000000000000000000000000000000000"))
        .to.be.revertedWith("Hash doesn't match");
    });

    it("Should not allow returning when item is not borrowed", async function () {
      const { borger, borrower } = await loadFixture(deployBorgerFixture);
      await expect(borger.connect(borrower).returnItem("0xdd76cf5210b29098297dbb17b8ece744ef72c154f55cc0d1a4db0749932293ef"))
        .to.be.revertedWith("Item available");
    });
    
    it("Should refund the correct deposit when item is returned", async function () {
      const { borger, borrower } = await loadFixture(deployBorgerFixture);
      
      const initialBalance = await ethers.provider.getBalance(borrower.getAddress());
      
      const borrowTx = await borger.connect(borrower).borrowItem({ value: ethers.parseEther("21") });
      const borrowReceipt = await borrowTx.wait();
      
      const returnTx = await borger.connect(borrower).returnItem("0xdd76cf5210b29098297dbb17b8ece744ef72c154f55cc0d1a4db0749932293ef");
      const returnReceipt = await returnTx.wait();
      
      if (!borrowReceipt || !returnReceipt) {
        throw new Error("Transaction receipt is undefined");
      }
      
      const totalGasUsed = BigInt(borrowReceipt.gasUsed) + BigInt(returnReceipt.gasUsed);
      const gasPrice = (await ethers.provider.getFeeData()).gasPrice;
      const totalGasCost = totalGasUsed * (gasPrice ?? BigInt(0));
    
      const finalBalance = await ethers.provider.getBalance(borrower.getAddress());
      
      const expectedBalance = initialBalance - totalGasCost;
      
      expect(finalBalance).to.be.closeTo(expectedBalance, BigInt(ethers.parseEther("0.01")));
    });
});
