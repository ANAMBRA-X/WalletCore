import express from 'express';
import { createAccount } from '../controllers/createWallet.js';
import { prefundSTRK } from '../controllers/funder.controller.js';
import { deployAccount } from '../controllers/deploy.controller.js';

const router = express.Router();

router.post('/createAccount', createAccount);
router.post('/prefund', prefundSTRK);
router.post('/deployAccount', deployAccount);

export default router;
