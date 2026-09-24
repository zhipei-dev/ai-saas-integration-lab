import { config } from './config.js';
import { AppDb } from './db.js';

const db = new AppDb(config.dbPath);
if (db.listCases().length === 0) {
  db.createCase({
    subject: 'Demo: account access question',
    customerEmail: 'demo@example.test',
    description: 'Synthetic demo case asking how to regain account access.',
  });
}
console.log('Demo seed ready');
db.close();
