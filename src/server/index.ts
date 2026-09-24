import express from 'express';
import { join } from 'node:path';
import { createApp } from './app.js';
import { config } from './config.js';
import { AppDb } from './db.js';
import { makeProvider } from './provider.js';

const db = new AppDb(config.dbPath);
const app = createApp(db, makeProvider());
app.use(express.static(join(process.cwd(), 'dist/web')));
app.get('/{*path}', (_request, response) => response.sendFile(join(process.cwd(), 'dist/web/index.html')));
app.listen(config.port, () => console.log(`AI SaaS Integration Lab listening on ${config.port}`));
