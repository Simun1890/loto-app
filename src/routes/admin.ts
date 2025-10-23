import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { requireM2M } from '../middleware/m2mAuth.js';

const router = Router();

router.post('/new-round', requireM2M, async (req, res) => {
  // If there is an OPEN round, do nothing (204)
  const current = await prisma.round.findFirst({ where: { status: 'OPEN' }, orderBy: { createdAt: 'desc' } });
  if (current) {
    return res.status(204).end();
  }
  // Create a new OPEN round
  await prisma.round.create({ data: { status: 'OPEN' } });
  return res.status(204).end();
});

router.post('/close', requireM2M, async (req, res) => {
  // Find current OPEN round and close it
  const current = await prisma.round.findFirst({ where: { status: 'OPEN' }, orderBy: { createdAt: 'desc' } });
  if (!current) {
    return res.status(204).end();
  }
  await prisma.round.update({
    where: { id: current.id },
    data: { status: 'CLOSED' }
  });
  return res.status(204).end();
});

router.post('/store-results', requireM2M, async (req, res) => {
  // Expect { numbers: number[] }
  const { numbers } = req.body || {};
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return res.status(400).json({ error: "Invalid payload: numbers required" });
  }
  // Find current CLOSED round that doesn't have draw yet
  const round = await prisma.round.findFirst({
    where: { status: 'CLOSED', draw: null },
    orderBy: { createdAt: 'desc' }
  });
  if (!round) {
    return res.status(400).json({ error: "No eligible round (must be CLOSED without existing results)" });
  }
  // Save draw numbers as comma-separated, sorted (no validation of range required per spec)
  const sorted = [...new Set(numbers)].sort((a,b)=>a-b);
  await prisma.draw.create({
    data: {
      roundId: round.id,
      numbers: sorted.join(',')
    }
  });
  return res.status(204).end();
});

export default router;
