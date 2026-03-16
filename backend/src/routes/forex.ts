import { Router } from 'express';
import { getForexRates } from '../controllers/forexController';

const router = Router();

router.get('/', getForexRates);

export default router;
