pragma solidity ^0.4.18;

/*
Copyright (c) 2016 Smart Contract Solutions, Inc.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/**
 * @title SafeMath
 * @dev Math operations with safety checks that throw on error
 */
library SafeMath {
  function mul(uint256 a, uint256 b) internal pure returns (uint256) {
    if (a == 0) {
      return 0;
    }
    uint256 c = a * b;
    assert(c / a == b);
    return c;
  }

  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    // assert(b > 0); // Solidity automatically throws when dividing by 0
    uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    return c;
  }

  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    assert(b <= a);
    return a - b;
  }

  function add(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;
    assert(c >= a);
    return c;
  }
}

/**
 * @title ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/20
 */
interface IERC20 {
  function balanceOf(address _owner) public view returns (uint256);
  function allowance(address _owner, address _spender) public view returns (uint256);
  function transfer(address _to, uint256 _value) public returns (bool);
  function transferFrom(address _from, address _to, uint256 _value) public returns (bool);
  function approve(address _spender, uint256 _value) public returns (bool);
  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

/**
 * @title Standard ERC20 token
 *
 * @dev Implementation of the basic standard token.
 * @dev https://github.com/ethereum/EIPs/issues/20
 */
contract EvoToken is IERC20 {
  using SafeMath for uint256;

  // Evo Token parameters
  string public name = 'Evolution';
  string public symbol = 'EVO';
  uint8 public constant decimals = 18;
  uint256 public constant decimalFactor = 10 ** uint256(decimals);
  uint256 public constant totalSupply = 5000000000 * decimalFactor;
  mapping (address => uint256) balances;
  mapping (address => mapping (address => uint256)) internal allowed;

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);

  /**
  * @dev Constructor for Evo creation
  * @dev Assigns the totalSupply to the EvoDistribution contract
  */
  function EvoToken(address _evoDistributionContractAddress) public {
    require(_evoDistributionContractAddress != address(0));
    balances[_evoDistributionContractAddress] = totalSupply;
    Transfer(address(0), _evoDistributionContractAddress, totalSupply);
  }

  /**
  * @dev Gets the balance of the specified address.
  * @param _owner The address to query the the balance of.
  * @return An uint256 representing the amount owned by the passed address.
  */
  function balanceOf(address _owner) public view returns (uint256 balance) {
    return balances[_owner];
  }

  /**
   * @dev Function to check the amount of tokens that an owner allowed to a spender.
   * @param _owner address The address which owns the funds.
   * @param _spender address The address which will spend the funds.
   * @return A uint256 specifying the amount of tokens still available for the spender.
   */
  function allowance(address _owner, address _spender) public view returns (uint256) {
    return allowed[_owner][_spender];
  }

  /**
  * @dev transfer token for a specified address
  * @param _to The address to transfer to.
  * @param _value The amount to be transferred.
  */
  function transfer(address _to, uint256 _value) public returns (bool) {
    require(_to != address(0));
    require(_value <= balances[msg.sender]);

    // SafeMath.sub will throw if there is not enough balance.
    balances[msg.sender] = balances[msg.sender].sub(_value);
    balances[_to] = balances[_to].add(_value);
    Transfer(msg.sender, _to, _value);
    return true;
  }

  /**
   * @dev Transfer tokens from one address to another
   * @param _from address The address which you want to send tokens from
   * @param _to address The address which you want to transfer to
   * @param _value uint256 the amount of tokens to be transferred
   */
  function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
    require(_to != address(0));
    require(_value <= balances[_from]);
    require(_value <= allowed[_from][msg.sender]);
    balances[_from] = balances[_from].sub(_value);
    balances[_to] = balances[_to].add(_value);
    allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
    Transfer(_from, _to, _value);
    return true;
  }

  /**
   * @dev Approve the passed address to spend the specified amount of tokens on behalf of msg.sender.
   *
   * Beware that changing an allowance with this method brings the risk that someone may use both the old
   * and the new allowance by unfortunate transaction ordering. One possible solution to mitigate this
   * race condition is to first reduce the spender's allowance to 0 and set the desired value afterwards:
   * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
   * @param _spender The address which will spend the funds.
   * @param _value The amount of tokens to be spent.
   */
  function approve(address _spender, uint256 _value) public returns (bool) {
    allowed[msg.sender][_spender] = _value;
    Approval(msg.sender, _spender, _value);
    return true;
  }

  /**
   * @dev Increase the amount of tokens that an owner allowed to a spender.
   *
   * approve should be called when allowed[_spender] == 0. To increment
   * allowed value is better to use this function to avoid 2 calls (and wait until
   * the first transaction is mined)
   * From MonolithDAO Token.sol
   * @param _spender The address which will spend the funds.
   * @param _addedValue The amount of tokens to increase the allowance by.
   */
  function increaseApproval(address _spender, uint _addedValue) public returns (bool) {
    allowed[msg.sender][_spender] = allowed[msg.sender][_spender].add(_addedValue);
    Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
    return true;
  }

  /**
   * @dev Decrease the amount of tokens that an owner allowed to a spender.
   *
   * approve should be called when allowed[_spender] == 0. To decrement
   * allowed value is better to use this function to avoid 2 calls (and wait until
   * the first transaction is mined)
   * From MonolithDAO Token.sol
   * @param _spender The address which will spend the funds.
   * @param _subtractedValue The amount of tokens to decrease the allowance by.
   */
  function decreaseApproval(address _spender, uint _subtractedValue) public returns (bool) {
    uint oldValue = allowed[msg.sender][_spender];
    if (_subtractedValue > oldValue) {
      allowed[msg.sender][_spender] = 0;
    } else {
      allowed[msg.sender][_spender] = oldValue.sub(_subtractedValue);
    }
    Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
    return true;
  }

  /**
   * @dev Don't accept eth
   */
  function () public payable {
      revert();
  }
}

/*
Copyright (c) 2016 Smart Contract Solutions, Inc.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Ownable {
  address public owner;

  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

  /**
   * @dev The Ownable constructor sets the original `owner` of the contract to the sender
   * account.
   */
  function Ownable() public {
    owner = msg.sender;
  }

  /**
   * @dev Throws if called by any account other than the owner.
   */
  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }

  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param newOwner The address to transfer ownership to.
   */
  function transferOwnership(address newOwner) public onlyOwner {
    require(newOwner != address(0));
    OwnershipTransferred(owner, newOwner);
    owner = newOwner;
  }

}

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
  function airdropTokens(address[] _recipient, uint256[] _tokenToTransfer) public onlyOwnerOrAdmin {
    require(now >= startTime);
    uint airdropped;
    for(uint256 i = 0; i< _recipient.length; i++)
    {
        if (!airdrops[_recipient[i]]) {
          airdrops[_recipient[i]] = true;
          require(EVO.transfer(_recipient[i], _tokenToTransfer[i] * decimalFactor));
          airdropped = airdropped.add(_tokenToTransfer[i] * decimalFactor);
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
