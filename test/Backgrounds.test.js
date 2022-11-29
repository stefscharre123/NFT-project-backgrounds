const { assert, expect } = require("chai");
const { ethers } = require("hardhat");
const keccak256 = require("keccak256");
const { MerkleTree } = require("merkletreejs");
const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("Backgrounds", () => {
  let owner, minter, minterNotOnWhitelist;
  let backgrounds;
  let tree;
  let merkleTreeRoot;
  const provider = ethers.getDefaultProvider();
  before(async () => {
    [owner, minter, minterNotOnWhitelist] = await ethers.getSigners();
    const address = minter.address;
    console.log(minterNotOnWhitelist.address);
    const addresses = [
      address,
      "0x1071258E2C706fFc9A32a5369d4094d11D4392Ec",
      "0x25f7fF7917555132eDD3294626D105eA1C797250",
      "0xF6574D878f99D94896Da75B6762fc935F34C1300",
      "0xfDbAb374ee0FC0EA0D7e7A60917ac01365010bFe",
    ];
    const leaves = addresses.map((x) => keccak256(x));
    tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const buf2hex = (x) => "0x" + x.toString("hex");

    merkleTreeRoot = buf2hex(tree.getRoot());
  });
  beforeEach(async () => {
    // Deploy Backgrounds
    BackgroundsFactory = await ethers.getContractFactory("Backgrounds");
    backgrounds = await BackgroundsFactory.deploy(
      "ipfs://QmUUAkS9eBeLQhLLmr5BeDVYeNZdNKJ3oA7qzFH3R8RNQw/",
      merkleTreeRoot
    );
    // const transaction = await backgrounds.connect(minter).safeMint();
    // await transaction.wait();
  });

    it("Returns TOKENURI", async () => {
      await backgrounds.connect(owner).setPublicMintActive();
    await backgrounds.connect(minter).publicMint(2, {
      value: ethers.utils.parseEther("0.1"),
    });
      const TOKENURI = await backgrounds.tokenURI(0);
      assert.equal(
        TOKENURI,
        "ipfs://QmUUAkS9eBeLQhLLmr5BeDVYeNZdNKJ3oA7qzFH3R8RNQw/0.json"
      );
    });

    it("Returns ownerof", async () => {
      await backgrounds.connect(owner).setPublicMintActive();
    await backgrounds.connect(minter).publicMint(2, {
      value: ethers.utils.parseEther("0.1"),
    });
      const ownerOf = await backgrounds.ownerOf(0);
      console.log(ownerOf);
      console.log("Minter:" + minter.address);
      console.log("Owner:" + owner.address);
      assert.equal(ownerOf, minter.address);
    });

  it("Withdraw works", async () => {
    await minter.sendTransaction({
      to: backgrounds.address,
      value: tokens(10),
    });
    const balanceBefore = await backgrounds.provider.getBalance(
      backgrounds.address
    );
    assert.equal(ethers.utils.formatEther(balanceBefore), 10);
    await backgrounds.connect(owner).withdraw();
    const balanceAfter = await backgrounds.provider.getBalance(
      backgrounds.address
    );
    assert.equal(ethers.utils.formatEther(balanceAfter), 0);
    const balanceOwner = await owner.provider.getBalance(owner.address);
    console.log(balanceOwner);
    expect(parseInt(ethers.utils.formatEther(balanceOwner))).to.be.above(1009);
  });

  it("Other user can't withdraw", async () => {
    expect(backgrounds.connect(minter).withdraw()).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });
  it("Whitelist not open yet", async () => {
    await expect(
      backgrounds.connect(minter).whitelistMint(getProof(minter), {
        value: ethers.utils.parseEther("0.05"),
      })
    ).to.be.revertedWith("Whitelist mint is not open");
  });

  it("Total supply reached", async () => {
    await backgrounds.connect(owner).setPublicMintActive(
    );
    for(let i=0; i<500; i++){
    await backgrounds.connect(minter).publicMint(2, {
      value: ethers.utils.parseEther("0.1"),
    });}
   supply = await backgrounds.totalSupply();
    assert.equal(supply,1000);
    
    await expect(backgrounds
      .connect(minter)
      .publicMint(2, {
        value: ethers.utils.parseEther("0.1"),
      })).to.be.revertedWith("Will exceed maximum supply");
      supply = await backgrounds.totalSupply();
    assert.equal(supply,1000);
  });
  describe("Whitelist", async () => {
    beforeEach(async () => {
      await backgrounds.connect(owner).setWhitelistMintActive();
    });

    it("Salestate is whitelist", async () => {
      const Salestate = await backgrounds.connect(minter).getSaleState();
      console.log(Salestate);
      assert.equal(Salestate, 1);
       await backgrounds.connect(owner).closeMint();
      const Salestate2 = await backgrounds.connect(minter).getSaleState();
      assert.equal(Salestate2, 0);
      await expect(
        backgrounds.connect(minter).setWhitelistMintActive()
      ).to.be.revertedWith("Ownable: caller is not the owner");
      await expect(
        backgrounds.connect(minter).whitelistMint(getProof(minter), {
          value: ethers.utils.parseEther("0.05"),
        })
      ).to.be.revertedWith("Whitelist mint is not open");
    });

    it("On whitelist", async () => {
      await backgrounds.connect(minter).whitelistMint(getProof(minter), {
        value: ethers.utils.parseEther("0.05"),
      });
      const supply = await backgrounds.totalSupply();
      console.log(supply);
      assert.equal(supply, 1);
    });

    it("On whitelist, already minted", async () => {
      await backgrounds.connect(minter).whitelistMint(getProof(minter), {
        value: ethers.utils.parseEther("0.05"),
      });
      await expect(backgrounds
        .connect(minter)
        .whitelistMint(getProof(minter), {
          value: ethers.utils.parseEther("0.05"),
        })).to.be.revertedWith("Already minted");
    });

    it("Not on whitelist", async () => {
      await expect(
        backgrounds
          .connect(minterNotOnWhitelist)
          .whitelistMint(getProof(minterNotOnWhitelist), {
            value: ethers.utils.parseEther("0.05"),
          })
      ).to.be.revertedWith("Not a part of Allowlist");
      await expect(
        backgrounds.connect(owner).whitelistMint(getProof(owner), {
          value: ethers.utils.parseEther("0.05"),
        })
      ).to.be.revertedWith("Not a part of Allowlist");
    });

    it("You didn't pay enough", async () => {
      await expect(
        backgrounds
          .connect(minterNotOnWhitelist)
          .whitelistMint(getProof(minterNotOnWhitelist), {
            value: ethers.utils.parseEther("0.04"),
          })
      ).to.be.revertedWith("You didn't pay enough");
    });
  });

  function getProof(personMinting) {
    const buf2hex = (x) => "0x" + x.toString("hex");
    leaf = buf2hex(keccak256(personMinting.address)); // address from wallet using walletconnect/metamask
    proof = tree.getProof(leaf).map((x) => buf2hex(x.data));
    return proof;
  }

  // it('Burns', async () => {
  //     const burn = await backgrounds.connect(owner).burn(0);
  //     await expect(backgrounds.ownerOf(0)).to.be.revertedWith(
  //         "ERC721: invalid token ID"
  //       );
  // })
  // it('Burns not owner of contract', async () => {
  //     await expect(backgrounds.connect(minter).burn(0)).to.be.revertedWith(
  //         "Ownable: caller is not the owner"
  //       );
  // })
});
