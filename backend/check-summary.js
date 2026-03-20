import mongoose from 'mongoose';
import JobMatch from './models/JobMatch.js';
import User from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI, { dbName: 'algoprep' }).then(async () => {
    const users = await User.find({});
    console.log(`--- Users List ---`);
    for (const u of users) {
        const matchesCount = await JobMatch.countDocuments({ userId: u._id });
        console.log(`User ${u.username} (${u.targetJob}): ${matchesCount} matches`);
    }
    process.exit(0);
}).catch(err => {
    console.error('Check failed:', err);
    process.exit(1);
});
