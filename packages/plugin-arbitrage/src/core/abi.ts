/**
 * Arbitrage ABI interface and type definitions
 * @module arbitrage/abi
 */

import { PublicKey } from '@solana/web3.js';

/** 
 * Instruction type definitions for arbitrage operations
 */
export enum ArbitrageInstruction {
    Initialize = 'initialize',
    ExecuteArbitrage = 'executeArbitrage',
    ClosePosition = 'closePosition'
}

/**
 * Account configuration for instruction execution
 */
export interface AccountConfig {
    /** Whether account requires write access */
    isMut: boolean;
    /** Whether account must sign transaction */
    isSigner: boolean;
    /** Optional name for the account */
    name?: string;
    /** Optional description */
    description?: string;
}

/**
 * Interface for instruction argument definitions
 */
export interface ArgumentConfig {
    /** Name of the argument */
    name: string;
    /** Data type of the argument */
    type: 'u64' | 'u8' | 'pubkey' | string;
    /** Whether argument is optional */
    isOptional?: boolean;
    /** Default value if any */
    defaultValue?: any;
}

/**
 * Interface for complete instruction definitions
 */
export interface InstructionDefinition {
    /** Name of the instruction */
    name: ArbitrageInstruction;
    /** Required account configurations */
    accounts: AccountConfig[];
    /** Required argument configurations */
    args: ArgumentConfig[];
    /** Optional description */
    description?: string;
}

/**
 * Complete ABI definition for arbitrage operations
 */
export const arbitrageAbi: InstructionDefinition[] = [
    {
        name: ArbitrageInstruction.Initialize,
        description: 'Initialize arbitrage account and settings',
        accounts: [
            {
                name: 'authority',
                description: 'Account that controls arbitrage operations',
                isMut: true,
                isSigner: true
            },
            {
                name: 'pool',
                description: 'Target pool for arbitrage',
                isMut: true,
                isSigner: false
            }
        ],
        args: []
    },
    {
        name: ArbitrageInstruction.ExecuteArbitrage,
        description: 'Execute arbitrage trade across pools',
        accounts: [
            {
                name: 'authority', 
                description: 'Account executing arbitrage',
                isMut: true,
                isSigner: true
            },
            {
                name: 'pool',
                description: 'Source pool for trade',
                isMut: true,
                isSigner: false
            },
            {
                name: 'tokenA',
                description: 'Input token account',
                isMut: true,
                isSigner: false
            },
            {
                name: 'tokenB',
                description: 'Output token account', 
                isMut: true,
                isSigner: false
            }
        ],
        args: [
            {
                name: 'amountIn',
                type: 'u64',
                description: 'Input amount for trade'
            },
            {
                name: 'minAmountOut',
                type: 'u64',
                description: 'Minimum output amount'
            }
        ]
    },
    {
        name: ArbitrageInstruction.ClosePosition,
        description: 'Close arbitrage position and collect profits',
        accounts: [
            {
                name: 'authority',
                description: 'Position owner',
                isMut: true,
                isSigner: true
            },
            {
                name: 'pool',
                description: 'Pool to close position in',
                isMut: true,
                isSigner: false
            }
        ],
        args: [
            {
                name: 'positionId',
                type: 'pubkey',
                description: 'ID of position to close'
            }
        ]
    }
];