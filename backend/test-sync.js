import connectDB from './db.js';
import { fetchAndMatchJobs } from './scripts/jobSync.js';
import dotenv from 'dotenv';
dotenv.config();

connectDB().then(async () => {
    console.log('Running manual sync...');
    await fetchAndMatchJobs();
    console.log('Sync finished.');
    process.exit(0);
}).catch(err => {
    console.error('Manual sync failed:', err);
    process.exit(1);
});
