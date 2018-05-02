pragma solidity ^0.4.18;

import './interfaces/IERC20.sol';
import './EvoToken.sol';
import './SafeMath.sol';
import './Ownable.sol';

/**
 * @title EVO token initial distribution
 *
 * @dev Distribute purchasers, airdrop, reserve, and founder tokens
 */
contract EvoDistribution is Ownable {
  using SafeMath for uint256;

  EvoToken public EVO;

  uint256 private constant decimalFactor = 10**uint256(18);
  enum AllocationType { AIRDROP }
  uint256 public constant INITIAL_SUPPLY   = 2500000000 * decimalFactor;
  uint256 public AVAILABLE_TOTAL_SUPPLY    = 2500000000 * decimalFactor;
  uint256 public AVAILABLE_AIRDROP_SUPPLY  = 2500000000 * decimalFactor; // 100% Released at TD

  uint256 public grandTotalClaimed = 0;
  uint256 public startTime;

  // Allocation with vesting information
  struct Allocation {
    uint8 AllocationSupply; // Type of allocation
    uint256 totalAllocated; // Total tokens allocated
    uint256 amountClaimed;  // Total tokens claimed
  }
  mapping (address => Allocation) public allocations;

  // List of admins
  mapping (address => bool) public airdropAdmins;

  // Keeps track of whether or not a 1000 EVO airdrop has been made to a particular address
  mapping (address => bool) public airdrops;

  modifier onlyOwnerOrAdmin() {
    require(msg.sender == owner || airdropAdmins[msg.sender]);
    _;
  }

  event LogNewAllocation(address indexed _recipient, AllocationType indexed _fromSupply, uint256 _totalAllocated, uint256 _grandTotalAllocated);
  event LogEvoClaimed(address indexed _recipient, uint8 indexed _fromSupply, uint256 _amountClaimed, uint256 _totalAllocated, uint256 _grandTotalClaimed);

  /**
    * @dev Constructor function - Set the evo token address
    * @param _startTime The time when EvoDistribution goes live
    */
  function EvoDistribution(uint256 _startTime) public {
    require(_startTime >= now);
    require(AVAILABLE_TOTAL_SUPPLY == AVAILABLE_AIRDROP_SUPPLY);
    startTime = _startTime;
    EVO = new EvoToken(this);
  }

  /**
    * @dev Allow the owner of the contract to assign a new allocation
    * @param _recipient The recipient of the allocation
    * @param _totalAllocated The total amount of EVO available to the receipient (after vesting)
    * @param _supply The EVO supply the allocation will be taken from
    */
  function setAllocation (address _recipient, uint256 _totalAllocated, AllocationType _supply) onlyOwner public {
    require(allocations[_recipient].totalAllocated == 0 && _totalAllocated > 0);
    require(_recipient != address(0));
    AVAILABLE_TOTAL_SUPPLY = AVAILABLE_TOTAL_SUPPLY.sub(_totalAllocated);
    LogNewAllocation(_recipient, _supply, _totalAllocated, grandTotalAllocated());
  }

  /**
    * @dev Add an airdrop admin
    */
  function setAirdropAdmin(address _admin, bool _isAdmin) public onlyOwner {
    airdropAdmins[_admin] = _isAdmin;
  }

  /**
    * @dev perform a transfer of allocations
    * @param _recipient is a list of recipients
    */
  function airdropTokens(address[] _recipient) public onlyOwnerOrAdmin {
    require(now >= startTime);
    uint airdropped;
    for(uint256 i = 0; i< _recipient.length; i++)
    {
        if (!airdrops[_recipient[i]]) {
          airdrops[_recipient[i][0]] = true;
          require(EVO.transfer(_recipient[i][0], _recipient[i][1]));
          airdropped = airdropped.add(1000 * decimalFactor);
        }
    }
    AVAILABLE_AIRDROP_SUPPLY = AVAILABLE_AIRDROP_SUPPLY.sub(airdropped);
    AVAILABLE_TOTAL_SUPPLY = AVAILABLE_TOTAL_SUPPLY.sub(airdropped);
    grandTotalClaimed = grandTotalClaimed.add(airdropped);
  }

  /**
    * @dev Transfer a recipients available allocation to their address
    * @param _recipient The address to withdraw tokens for
    */
  function transferTokens (address _recipient) public {
    require(allocations[_recipient].amountClaimed < allocations[_recipient].totalAllocated);
    require(now >= startTime);
    uint256 newAmountClaimed;
    uint256 tokensToTransfer = newAmountClaimed.sub(allocations[_recipient].amountClaimed);
    allocations[_recipient].amountClaimed = newAmountClaimed;
    require(EVO.transfer(_recipient, tokensToTransfer));
    grandTotalClaimed = grandTotalClaimed.add(tokensToTransfer);
    LogEvoClaimed(_recipient, allocations[_recipient].AllocationSupply, tokensToTransfer, newAmountClaimed, grandTotalClaimed);
  }

  // Returns the amount of EVO allocated
  function grandTotalAllocated() public view returns (uint256) {
    return INITIAL_SUPPLY - AVAILABLE_TOTAL_SUPPLY;
  }

  // Allow transfer of accidentally sent ERC20 tokens
  function refundTokens(address _recipient, address _token) public onlyOwner {
    require(_token != address(EVO));
    IERC20 token = IERC20(_token);
    uint256 balance = token.balanceOf(this);
    require(token.transfer(_recipient, balance));
  }
}
