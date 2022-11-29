// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

error Withdraw__TransferFailed();

contract Backgrounds is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    string private constant baseExtension = ".json";
    Counters.Counter public _tokenIdCounter;
    string public baseURI;

    using Strings for uint256;
    bytes32 private root;

    mapping(address => bool) private _alreadyMinted;
    enum SaleState {
        Closed,
        Whitelist,
        Public
    }
    SaleState public saleState = SaleState.Closed;
    uint256 maxSupply = 1000;

    uint256 price = 0.05 ether;

    constructor(
        string memory _initialBaseURI,
        bytes32 _root
    ) ERC721("Backgrounds", "BCK") {
        baseURI = _initialBaseURI;
        root = _root;
    }

    function setBaseURI(string memory uri) public onlyOwner {
        baseURI = uri;
    }

    function setRoot(bytes32 _root) public onlyOwner {
        root = _root;
    }

    function getRoot() public view onlyOwner returns (bytes32) {
        return root;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function totalSupply() public view returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        return tokenId;
    }

    function setWhitelistMintActive() public onlyOwner {
        saleState = SaleState.Whitelist;
    }

    function setPublicMintActive() public onlyOwner {
        saleState = SaleState.Public;
    }

    function closeMint() public onlyOwner {
        saleState = SaleState.Closed;
    }

    function getSaleState() public view returns (uint8) {
        return uint8(saleState);
    }

    function getAlreadyMinted() public view returns (bool) {
        return _alreadyMinted[msg.sender];
    }

    function whitelistMint(bytes32[] calldata proof) public payable {
        require(saleState == SaleState.Whitelist, "Whitelist mint is not open");
        require(msg.value >= price, "You didn't pay enough");
        require(
            isValid(proof, keccak256(abi.encodePacked(msg.sender))),
            "Not a part of Allowlist"
        );
        require(!_alreadyMinted[msg.sender], "Already minted");
        _alreadyMinted[msg.sender] = true;
        safeMint();
    }

    function publicMint(uint256 amount) public payable {
        require(saleState == SaleState.Public, "Public mint is not open");
        require(msg.value == price * amount, "You didn't pay enough");
        require(amount <= 2);
        for (uint i = 1; i <= amount; ) {
            safeMint();
            unchecked {
                i++;
            }
        }
    }

    function isValid(
        bytes32[] calldata proof,
        bytes32 leaf
    ) public view returns (bool) {
        return MerkleProof.verifyCalldata(proof, root, leaf);
    }

    function safeMint() private {
        uint256 tokenId = _tokenIdCounter.current();
        require(tokenId + 1 <= maxSupply, "Will exceed maximum supply");
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);
    }

    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert Withdraw__TransferFailed();
        }
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(
        uint256 tokenId
    ) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        _requireMinted(tokenId);
        return
            bytes(baseURI).length > 0
                ? string(
                    abi.encodePacked(baseURI, tokenId.toString(), baseExtension)
                )
                : "";
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    receive() external payable {}
}
