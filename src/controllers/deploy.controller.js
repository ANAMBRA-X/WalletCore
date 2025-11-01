import { Account, RpcProvider, ec, stark, hash, CallData } from 'starknet';
import dotenv from 'dotenv';
dotenv.config();

// OpenZeppelin account v0.17.0 class hash (Cairo 1)
const OZaccountClassHash = process.env.OZ_ACCOUNT_CLASS_HASH;

const rpcUrl = process.env.RPC_NETWORK;

export const deployAccount = async (req, res) => {
  try {
    const { privateKey } = req.body;

    if (!privateKey) {
      return res.status(400).json({
        error: 'Missing required parameter: privateKey',
      });
    }

    const provider = new RpcProvider({
      nodeUrl: rpcUrl,
    });

    if (!rpcUrl) {
      console.error(
        'Configuration Error: One or more environment variables are missing.'
      );
      return res.status(500).json({
        error: 'Configuration error: RPC URL missing. Check your .env file.',
      });
    }

    // Derive the public key from the provided private key
    const publicKey = ec.starkCurve.getStarkKey(privateKey);

    // Compile the constructor calldata using the public key
    const OZaccountConstructorCallData = CallData.compile({
      publicKey: publicKey,
    });

    // Calculate the future address of the account (using public key as salt)
    const OZcontractAddress = hash.calculateContractAddressFromHash(
      publicKey,
      OZaccountClassHash,
      OZaccountConstructorCallData,
      0
    );

    console.log('Precalculated account address:', OZcontractAddress);

    //  Account Initialization (Using object syntax)
    const OZaccount = new Account({
      provider: provider,
      address: OZcontractAddress,
      signer: privateKey,
    });

    // Deployment
    const deployPayload = {
      classHash: OZaccountClassHash,
      constructorCalldata: OZaccountConstructorCallData,
      addressSalt: publicKey,
    };

    const { transaction_hash, contract_address } =
      await OZaccount.deployAccount(deployPayload);

    await provider.waitForTransaction(transaction_hash);
    console.log(' Account deployed.\n   address =', contract_address);

    res.status(200).json({
      message: 'Account deployed successfully',
      contractAddress: contract_address,
      transactionHash: transaction_hash,
    });
  } catch (error) {
    console.error('Account deploy error:', error);
    res
      .status(500)
      .json({ error: 'Deploy Account failed', details: error.message });
  }
};
