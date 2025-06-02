export const packOpeningABI = [
  {
    type: 'constructor',
    inputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'PACK_COST',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'MAX_PACK_SIZE',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'currentRound',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'openPack',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'payable'
  },
  {
    type: 'function',
    name: 'getAvailableNFTs',
    inputs: [],
    outputs: [{ name: '', type: 'uint256[]', internalType: 'uint256[]' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getAvailableNFTCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getAllPackOpenings',
    inputs: [],
    outputs: [{
      name: '',
      type: 'tuple[]',
      internalType: 'struct PackOpening.PackOpeningRecord[]',
      components: [
        { name: 'round', type: 'uint256', internalType: 'uint256' },
        { name: 'player', type: 'address', internalType: 'address' },
        { name: 'tokenId', type: 'uint256', internalType: 'uint256' },
        { name: 'timestamp', type: 'uint256', internalType: 'uint256' }
      ]
    }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getPlayerPackOpenings',
    inputs: [{ name: 'player', type: 'address', internalType: 'address' }],
    outputs: [{
      name: '',
      type: 'tuple[]',
      internalType: 'struct PackOpening.PackOpeningRecord[]',
      components: [
        { name: 'round', type: 'uint256', internalType: 'uint256' },
        { name: 'player', type: 'address', internalType: 'address' },
        { name: 'tokenId', type: 'uint256', internalType: 'uint256' },
        { name: 'timestamp', type: 'uint256', internalType: 'uint256' }
      ]
    }],
    stateMutability: 'view'
  },
  {
    type: 'event',
    name: 'PackOpened',
    inputs: [
      { name: 'round', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'player', type: 'address', indexed: true, internalType: 'address' },
      { name: 'tokenId', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'NFTsAdded',
    inputs: [
      { name: 'tokenIds', type: 'uint256[]', indexed: false, internalType: 'uint256[]' }
    ],
    anonymous: false
  }
] as const; 