import mongoose from 'mongoose';
import { fetchAndMatchJobs } from './scripts/jobSync.js';
import User from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI, { dbName: 'algoprep' }).then(async () => {
    const user = await User.findOne({ username: 'testuser123' });
    if (!user) {
        console.log('User testuser123 not found');
        process.exit(1);
    }
    console.log(`Running sync for ${user.username}...`);
    await fetchAndMatchJobs(user._id);
    console.log('Sync finished.');
    process.exit(0);
}).catch(err => {
    console.error('Test sync failed:', err);
    process.exit(1);
});
