import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { parseNumbers, validateIdNumber } from '../utils/validate.js';
import { generatePngQr } from '../utils/qr.js';

const router = Router();

// Submit ticket form (GET)
router.get('/submit', async (req, res) => {
  // Check if there is an open round
  const round = await prisma.round.findFirst({ where: { status: 'OPEN' }, orderBy: { createdAt: 'desc' } });
  if (!round) {
    return res.status(400).render('message', { title: 'Uplate nisu aktivne', message: 'Trenutno nema aktivnog kola za uplatu.' });
  }
  res.render('submit', { user: (req as any).oidc?.user || null });
});

// Submit ticket (POST) -> returns QR image
router.post('/submit', async (req, res) => {
  try {
    const { idNumber, numbers } = req.body || {};
    validateIdNumber(idNumber);
    const nums = parseNumbers(numbers);
    // Ensure active round
    const round = await prisma.round.findFirst({ where: { status: 'OPEN' }, orderBy: { createdAt: 'desc' } });
    if (!round) {
      return res.status(400).render('message', { title: 'Uplate onemogućene', message: 'Uplate nisu aktivne.' });
    }
    // Save ticket
    const ticket = await prisma.ticket.create({
      data: {
        roundId: round.id,
        idNumber: idNumber.trim(),
        numbers: nums.join(',')
      }
    });
    const base = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const link = `${base}/ticket/${ticket.id}`;
    const png = await generatePngQr(link);
    res.setHeader('Content-Type', 'image/png');
    return res.send(png);
  } catch (e: any) {
    return res.status(400).render('message', { title: 'Neispravni podaci', message: e.message || 'Provjerite unesene podatke.' });
  }
});

// Public ticket display
router.get('/ticket/:id', async (req, res) => {
  const { id } = req.params;
  const ticket = await prisma.ticket.findUnique({ where: { id } , include: { round: { include: { draw: true } } } });
  if (!ticket) return res.status(404).render('message', { title: 'Nije pronađeno', message: 'Listić nije pronađen.' });
  const numbers = ticket.numbers.split(',').map(n=>Number(n));
  const draw = ticket.round.draw ? ticket.round.draw.numbers.split(',').map(n=>Number(n)) : null;
  res.render('ticket', {
    ticket,
    numbers,
    draw,
    user: (req as any).oidc?.user || null
  });
});

export default router;
