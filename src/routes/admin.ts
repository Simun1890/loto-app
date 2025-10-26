import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { verifyM2M } from '../utils/verifyM2M.js';

const router = Router();

router.post('/new-round', verifyM2M, async (req, res) => {
    await prisma.round.create({ data: { status: 'OPEN' } });
    return res.status(204).send();
});

router.post('/close', verifyM2M, async (req, res) => {
    const current = await prisma.round.findFirst({ where: { status: 'OPEN' }, orderBy: { createdAt: 'desc' } });
    if (!current) return res.status(400).json({ error: 'Nema aktivnog kola' });
    await prisma.round.update({ where: { id: current.id }, data: { status: 'CLOSED' } });
    return res.status(204).send();
});

router.post('/store-results', verifyM2M, async (req, res) => {
    const { numbers } = req.body;
    if (!Array.isArray(numbers)) return res.status(400).json({ error: 'Očekuje se polje brojeva' });

    const round = await prisma.round.findFirst({ where: { status: 'CLOSED' }, orderBy: { createdAt: 'desc' } });
    if (!round) return res.status(400).json({ error: 'Nema zatvorenog kola' });

    await prisma.draw.create({ data: { roundId: round.id, numbers: numbers.join(',') } });
    return res.status(204).send();
});

export default router;
