import { Abi } from '@elizaos/core';

export const arbitrageAbi: Abi = {
  version: '0.1.0',
  name: 'ArbitrageContract',
  instructions: [
    {
      name: 'initialize',
      accounts: [
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'pool',
          isMut: true,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'executeArbitrage',
      accounts: [
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'pool',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'tokenA',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'tokenB',
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'amountIn',
          type: 'u64',
        },
        {
          name: 'minAmountOut',
          type: 'u64',
        },
      ],
    },
  ],
};