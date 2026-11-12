import express from 'express';
import notificationRouter from "./routes/notification.routes.js";
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dns from 'dns';

import authRouter from './routes/auth.routes.js';
import internRouter from './routes/intern.routes.js';
import adminRouter from './routes/admin.routes.js';
import teamleaderRouter from './routes/teamleader.routes.js';
import { verifyCertificatePublic } from './controllers/admin.controller.js';
import analyticsRouter from "./routes/adminAnalytics.routes.js";

// Use public DNS providers (Cloudflare and Google) to avoid local DNS issues.
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();

// Render sits behind a proxy; needed for secure cookies
app.set('trust proxy', 1);

// Allowed frontends (strip trailing slash from env value just in case)
const allowedOrigins = [
	'http://localhost:5173',
	process.env.FRONTEND_URL?.replace(/\/$/, ''),
].filter(Boolean);

const corsOptions = {
	origin: (origin, callback) => {
		// allow Postman/curl (no origin) and listed frontends
		if (!origin || allowedOrigins.includes(origin)) {
			return callback(null, true);
		}
		return callback(new Error(`CORS blocked: ${origin}`));
	},
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

// Health check (useful for Render + quick browser test)
app.get('/', (req, res) => res.send('Intern Portal API is running'));

app.use('/api/auth', authRouter);
app.use('/api/intern', internRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/admin/analytics', analyticsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/teamleader', teamleaderRouter);

app.get('/api/public/certificates/verify', verifyCertificatePublic);

export default app;