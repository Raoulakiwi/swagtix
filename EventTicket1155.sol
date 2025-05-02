// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EventTicket1155 is ERC1155, Ownable {
    struct TicketInfo {
        uint256 eventTimestamp;
        string qrCodeUri;
        string mediaUri; // photo or video URI
    }

    // tokenId => TicketInfo
    mapping(uint256 => TicketInfo) public ticketInfo;

    // Optional: Track next tokenId
    uint256 public nextTokenId = 1;

    constructor() ERC1155("") {}

    /// @notice Mint new tickets for an event
    /// @param to Recipient address
    /// @param amount Number of tickets
    /// @param eventTimestamp Event time (unix timestamp)
    /// @param qrCodeUri URI to QR code image
    /// @param mediaUri URI to photo or video (shown after event)
    function mintTicket(
        address to,
        uint256 amount,
        uint256 eventTimestamp,
        string memory qrCodeUri,
        string memory mediaUri
    ) external onlyOwner {
        uint256 tokenId = nextTokenId++;
        ticketInfo[tokenId] = TicketInfo({
            eventTimestamp: eventTimestamp,
            qrCodeUri: qrCodeUri,
            mediaUri: mediaUri
        });
        _mint(to, tokenId, amount, "");
    }

    /// @notice Returns dynamic metadata URI based on event time
    function uri(uint256 tokenId) public view override returns (string memory) {
        TicketInfo memory info = ticketInfo[tokenId];
        require(info.eventTimestamp != 0, "Invalid tokenId");

        string memory imageUri = block.timestamp < info.eventTimestamp
            ? info.qrCodeUri
            : info.mediaUri;

        // Return a data:application/json URI with dynamic metadata
        return string(
            abi.encodePacked(
                "data:application/json;utf8,",
                '{"name":"Event Ticket #',
                _uint2str(tokenId),
                '","description":"Event ticket for event at timestamp ',
                _uint2str(info.eventTimestamp),
                '","image":"',
                imageUri,
                '"}'
            )
        );
    }

    // Helper: uint to string
    function _uint2str(uint256 _i) internal pure returns (string memory str) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        j = _i;
        while (j != 0) {
            bstr[--k] = bytes1(uint8(48 + j % 10));
            j /= 10;
        }
        str = string(bstr);
    }
} 