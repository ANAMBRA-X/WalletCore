import { RpcProvider, Account, Contract, cairo } from 'starknet';
import dotenv from 'dotenv';
dotenv.config();

const STRK_CONTRACT_ADDRESS =
  '0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D';

const rpcUrl = process.env.RPC_NETWORK;
const funderAddress = process.env.ADMIN_ADDRESS;
const funderPrivateKey = process.env.ADMIN_PRIVATE_KEY;

export async function prefundSTRK(req, res) {
  try {
    const { futureAddress, amount } = req.body;

    if (!futureAddress || !amount) {
      return res.status(400).json({
        error: 'Missing required parameters: futureAddress, amount',
      });
    }

    if (!rpcUrl || !funderAddress || !funderPrivateKey) {
      console.error(
        'Configuration Error: One or more environment variables are missing.'
      );
      return res.status(500).json({
        error:
          'Configuration error: Funder details or RPC URL missing. Check your .env file.',
      });
    }

    const provider = new RpcProvider({
      nodeUrl: rpcUrl,
    });

    let strkAbi;
    try {
      console.log('Fetching STRK contract ABI from network...');
      const { abi } = await provider.getClassAt(STRK_CONTRACT_ADDRESS);
      strkAbi = abi;
      console.log('ABI fetched successfully.');
    } catch (e) {
      console.error('Failed to fetch ABI from network:', e.message);
      return res.status(500).json({
        error: 'Failed to load contract ABI required for interaction.',
      });
    }

    const funder = new Account({
      provider: provider,
      address: funderAddress,
      signer: funderPrivateKey,
    });

    console.log('FUNDER connected:', funder.address);

    const strkContract = new Contract({
      abi: strkAbi,
      address: STRK_CONTRACT_ADDRESS,
      providerOrAccount: funder,
    });

    const amountWei = cairo.uint256(BigInt(amount) * 10n ** 18n);

    console.log(
      `Sending ${amount} STRK from ${funderAddress} → ${futureAddress}...`
    );

    const tx = await strkContract.transfer(futureAddress, amountWei);

    await provider.waitForTransaction(tx.transaction_hash);

    console.log(tx.transaction_hash);

    res.status(200).json({
      message: 'STRK Prefund complete',
      token: 'STRK',
      amount,
      to: futureAddress,
      transactionHash: tx.transaction_hash,
    });
  } catch (error) {
    console.error('STRK Prefund error:', error);
    res
      .status(500)
      .json({ error: 'Prefunding failed', details: error.message });
  }
}
