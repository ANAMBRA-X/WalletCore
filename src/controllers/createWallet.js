import {
  Account,
  constants,
  ec,
  json,
  stark,
  RpcProvider,
  hash,
  CallData,
} from 'starknet';

import dotenv from 'dotenv';
import { encryptPrivateKey } from '../libs/encryption.js';
dotenv.config();

const OZaccountClassHash = process.env.OZ_ACCOUNT_CLASS_HASH;

export const createAccount = async (req, res) => {
  try {
    const privateKey = stark.randomAddress();

    console.log('New OZ account:\nprivateKey=', privateKey);

    const publicKey = ec.starkCurve.getStarkKey(privateKey);

    console.log('publicKey=', publicKey);

    const constructorCalldata = CallData.compile({
      publicKey: publicKey,
    });

    const encryptedKey = encryptPrivateKey(privateKey);


    const OZcontractAddress = hash.calculateContractAddressFromHash(
      publicKey,
      OZaccountClassHash,
      constructorCalldata,
      0
    );
    console.log('Precalculated account address=', OZcontractAddress);

    return res.status(200).json({
      message: 'Account generated successfully',
      publicKey,
      OZcontractAddress,
      encryptedKey,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create account' });
  }
};
