// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// Locks one stake per trade. It does not hold a user's whole balance.
contract TweetsEscrow {
    IERC20 public immutable usdc;
    address public keeper;

    struct Bet {
        address user;
        uint256 stake;
        uint256 payout;
        bool open;
    }

    mapping(bytes32 => Bet) public bets;

    constructor(address usdc_, address keeper_) {
        usdc = IERC20(usdc_);
        keeper = keeper_;
    }

    function lock(bytes32 id, uint256 stake, uint256 payout) external {
        require(bets[id].user == address(0), "exists");
        require(stake > 0 && payout >= stake, "amount");
        require(usdc.transferFrom(msg.sender, address(this), stake), "transfer");
        bets[id] = Bet(msg.sender, stake, payout, true);
    }

    function settleWin(bytes32 id) external {
        Bet memory bet = _close(id);
        require(usdc.transfer(bet.user, bet.payout), "payout");
    }

    function settleLoss(bytes32 id) external {
        _close(id);
    }

    function settleVoid(bytes32 id) external {
        Bet memory bet = _close(id);
        require(usdc.transfer(bet.user, bet.stake), "refund");
    }

    function _close(bytes32 id) internal returns (Bet memory bet) {
        require(msg.sender == keeper, "keeper");
        bet = bets[id];
        require(bet.open, "closed");
        bets[id].open = false;
    }
}
