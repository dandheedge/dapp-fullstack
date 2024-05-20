//SPDX-License-Identifier: MIT
pragma solidity 0.8.13;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TheodoresToken is ERC20("KumoNOIto", "TT"), Ownable {
    function mintFifty() public onlyOwner {
        _mint(msg.sender, 50 * 10 ** 18);
    }
}
