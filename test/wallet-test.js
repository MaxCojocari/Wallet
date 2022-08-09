const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const shopJSON = require("../artifacts/contracts/ERC20.sol/OMGShop.json");
const tokenJSON = require("../artifacts/contracts/ERC20.sol/OMGToken.json");
const provider = waffle.provider;


describe("Wallet", function () {
  let walletOwner, anotherOwner
  let shopOwner
  let wallet1, wallet2
  let shop
  let anotherAccount
  let erc20

  async function genWallet(signer) {
    const Wallet = await ethers.getContractFactory("Wallet", signer)
    wallet = await Wallet.deploy()
    await wallet.deployed()

    // feed contract with eth
    await signer.sendTransaction({
      value: 1,
      to: wallet.address
    })

    return wallet
  }

  beforeEach(async function() {
    [walletOwner, shopOwner, anotherOwner, anotherAccount] = await ethers.getSigners()


    wallet1 = await genWallet(walletOwner)
    wallet2 = await genWallet(anotherOwner)

    shop = new ethers.Contract(await wallet.shop(), shopJSON.abi, shopOwner)

    erc20 = new ethers.Contract(await shop.token(), tokenJSON.abi, shopOwner)

  })

  // Test nr.1
  it("should have an owner", async function() {
    // check for owner's address corectness
    expect(await wallet1.ownerWallet()).to.eq(walletOwner.address)
  })

  // Test nr.2
  it("should allow to import a token", async function() {
    const token = await shop.token()
    await wallet1.importToken(token)
    expect(await wallet1.getBalance(await erc20.symbol())).to.eq(0)
  })

  // Test nr.3
  it("should allow to receive eth", async function() {
    const ethAmount = 13

    const txData = {
      value: ethAmount,
      to: wallet1.address
    }

    const tx = await anotherAccount.sendTransaction(txData)
    await tx.wait()

    await expect(() => tx)
      .to.changeEtherBalances(
        [wallet1, anotherAccount], [ethAmount, -ethAmount]
      )
    expect(await wallet1.getBalance("ETH")).to.eq(ethAmount + 1)
  })

  // Test nr.4
  it("should allow to send eth", async function() {
    // send eth to anotherAccount
    const tx = await wallet1.send("ETH", anotherAccount.address, 1)
    await tx.wait()
    
    expect(await wallet1.getBalance("ETH")).to.eq(0)
    await expect(() => tx)
      .to.changeEtherBalances(
        [wallet1, anotherAccount], [-1, 1]
      )
  })

  // Test nr.5
  it("should allow to buy OMG tokens", async function() {
    
    // import OMG token
    const token = await shop.token()
    await wallet1.importToken(token)
    
    await wallet1.buy(shop.address, 1)
    
    expect(await wallet1.getBalance("ETH")).to.eq(0)
    expect(await wallet1.getBalance("OMG")).to.eq(1)
    expect(await provider.getBalance(wallet1.address)).to.eq(0)
  })

  // Test nr.6
  it("should allow to sell OMG tokens", async function() {
    // import OMG token
    const token = await shop.token()
    await wallet1.importToken(token)
    
    // buy OMG tokens
    await wallet1.buy(shop.address, 1)
    
    // sell these tokens
    const sellTx = await wallet1.sellTokens(shop.address, 1)
    await sellTx.wait()

    expect(await wallet1.getBalance("OMG")).to.eq(0)
    expect(await wallet1.getBalance("ETH")).to.eq(1)
    await expect(() => sellTx).to.changeEtherBalance(wallet1, 1)
  })
  
  // Test nr.7
  it("should allow owner to withdraw certain amount of eth", async function() {   
    const withdrawalTx = await wallet1.withdraw(1)
    await withdrawalTx.wait()

    expect(await wallet1.getBalance("ETH")).to.eq(0)
    await expect(() => withdrawalTx)
    .to.changeEtherBalances(
      [wallet1, walletOwner], [-1, 1]
    )
  })

  // Test nr.8
  it("should allow to send OMG tokens", async function() {
    // import OMG token
    const token = await shop.token()
    await wallet1.importToken(token)
    await wallet2.importToken(token)
    
    erc20 = new ethers.Contract(await wallet2.token(), tokenJSON.abi, anotherOwner)

    // buy OMG tokens
    await wallet2.buy(shop.address, 1)
    await wallet2.send("OMG", wallet1.address, 1)

    expect(await erc20.balanceOf(wallet1.address)).to.eq(1)
    expect(await wallet2.getBalance("OMG")).to.eq(0)
  })

});
