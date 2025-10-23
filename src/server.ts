import 'dotenv/config';
import express from 'express';
import path from 'path';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { prisma } from './utils/prisma.js';
import adminRoutes from './routes/admin.js';
import ticketsRoutes from './routes/tickets.js';
import { oidc } from './routes/auth.js';
import * as openid from 'express-openid-connect';
const { requiresAuth } = openid;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 5000);

// security & parsing
app.use(helmet());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// static
app.use(express.static(path.join(__dirname, '..', 'public')));

// OIDC (Auth0)
app.use(oidc);

// Simple /login route
app.get('/login', (req, res) => {
  res.oidc.login({ returnTo: '/' });
});

app.get('/logout', (req,res)=>{
  res.oidc.logout({ returnTo: process.env.BASE_URL || `http://localhost:${PORT}` });
});

// Admin (M2M-protected) endpoints
app.use('/', adminRoutes);


app.use('/', ticketsRoutes);

// Home page
app.get('/', async (req, res) => {
  // current round (latest by createdAt)
  const currentRound = await prisma.round.findFirst({ orderBy: { createdAt: 'desc' }, include: { draw: true, tickets: true } });
  const ticketCount = currentRound ? currentRound.tickets.length : null;
  const drawNumbers = currentRound?.draw ? currentRound.draw.numbers.split(',').map(n=>Number(n)) : null;
  res.render('index', { user: (req as any).oidc?.user || null, currentRound, ticketCount, drawNumbers });
});

app.use((req, res) => res.status(404).render('message', { title: '404', message: 'Stranica nije pronađena.' }));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
