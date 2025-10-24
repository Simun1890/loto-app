import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { parseNumbers, validateIdNumber } from '../utils/validate.js';
import { generatePngQr } from '../utils/qr.js';

const router = Router();

/**
 * GET /submit
 * Prikaz forme za uplatu listića (samo ako je aktivno kolo)
 */
router.get('/submit', async (req, res) => {
    const round = await prisma.round.findFirst({
        where: { status: 'OPEN' },
        orderBy: { createdAt: 'desc' }
    });

    if (!round) {
        return res.status(400).render('message', {
            title: 'Uplate nisu aktivne',
            message: 'Trenutno nema aktivnog kola za uplatu.'
        });
    }

    res.render('submit', { user: (req as any).oidc?.user || null });
});

/**
 * POST /submit
 * Uplata novog listića → vraća QR kod (PNG)
 */
router.post('/submit', async (req, res) => {
    try {
        const { idNumber, numbers } = req.body || {};
        validateIdNumber(idNumber);
        const nums = parseNumbers(numbers);

        // Provjera aktivnog kola
        const round = await prisma.round.findFirst({
            where: { status: 'OPEN' },
            orderBy: { createdAt: 'desc' }
        });
        if (!round) {
            return res.status(400).render('message', {
                title: 'Uplate onemogućene',
                message: 'Uplate trenutno nisu aktivne.'
            });
        }

        const user = (req as any).oidc?.user;

        // Spremi listić u bazu s korisnikovim ID-em
        const ticket = await prisma.ticket.create({
            data: {
                roundId: round.id,
                idNumber: idNumber.trim(),
                numbers: nums.join(','),
                userSub: user?.sub || null 
            }
        });

        const base = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
        const link = `${base}/ticket/${ticket.id}`;
        const png = await generatePngQr(link);

        res.setHeader('Content-Type', 'image/png');
        return res.send(png);

    } catch (e: any) {
        return res.status(400).render('message', {
            title: 'Neispravni podaci',
            message: e.message || 'Provjerite unesene podatke.'
        });
    }
});

/**
 * GET /ticket/:id
 * Javni prikaz jednog listića
 */
router.get('/ticket/:id', async (req, res) => {
    const { id } = req.params;

    const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: { round: { include: { draw: true } } }
    });

    if (!ticket) {
        return res.status(404).render('message', {
            title: 'Nije pronađeno',
            message: 'Listić nije pronađen.'
        });
    }

    const numbers = ticket.numbers.split(',').map(n => Number(n));
    const draw = ticket.round.draw
        ? ticket.round.draw.numbers.split(',').map(n => Number(n))
        : null;

    res.render('ticket', {
        ticket,
        numbers,
        draw,
        user: (req as any).oidc?.user || null
    });
});

/**
 * GET /my-tickets
 * Pregled listića prijavljenog korisnika
 */
router.get('/my-tickets', async (req, res) => {
    const user = (req as any).oidc?.user;
    if (!user) {
        return res.redirect('/login');
    }

    const tickets = await prisma.ticket.findMany({
        where: { userSub: user.sub },
        orderBy: { createdAt: 'desc' },
        include: { round: true }
    });

    res.render('myTickets', { user, tickets });
});
/**
 * POST /store-results
 * Spremanje izvučenih brojeva za trenutno zatvoreno kolo
 */
router.post('/store-results', async (req, res) => {
    try {
        const { numbers } = req.body || {};

        if (!Array.isArray(numbers)) {
            return res.status(400).json({ error: 'Neispravan format — očekuje se JSON polje brojeva.' });
        }

        // Nađi trenutno zatvoreno kolo
        const round = await prisma.round.findFirst({
            where: { status: 'CLOSED' },
            orderBy: { createdAt: 'desc' }
        });

        if (!round) {
            return res.status(400).json({ error: 'Nema zatvorenog kola za pohranu rezultata.' });
        }

        // Provjeri postoji li već draw za to kolo
        const existingDraw = await prisma.draw.findFirst({
            where: { roundId: round.id }
        });

        if (existingDraw) {
            return res.status(400).json({ error: 'Rezultati su već pohranjeni za ovo kolo.' });
        }

        // Spremi rezultate u bazu
        await prisma.draw.create({
            data: {
                roundId: round.id,
                numbers: numbers.join(',')
            }
        });

        console.log(`🎯 Pohranjeni brojevi za kolo ${round.id}: ${numbers.join(', ')}`);
        return res.status(204).send();

    } catch (err: any) {
        console.error('❌ Greška kod pohrane rezultata:', err);
        return res.status(500).json({ error: 'Greška na serveru.' });
    }
});

export default router;
