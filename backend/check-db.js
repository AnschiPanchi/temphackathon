import mongoose from 'mongoose';
import JobMatch from './models/JobMatch.js';
import User from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI, { dbName: 'algoprep' }).then(async () => {
    const jobs = await JobMatch.find({});
    console.log(`Found ${jobs.length} total job matches in DB.`);
    
    const users = await User.find({});
    console.log(`Found ${users.length} users in DB.`);
    for (const u of users) {
        const matches = await JobMatch.countDocuments({ userId: u._id });
        console.log(`User ${u.username} (${u.targetJob}) has ${matches} matches.`);
    }
    process.exit(0);
}).catch(err => {
    console.error('Connection failed:', err);
    process.exit(1);
});
