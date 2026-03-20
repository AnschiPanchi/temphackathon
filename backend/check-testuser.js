import mongoose from 'mongoose';
import JobMatch from './models/JobMatch.js';
import User from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI, { dbName: 'algoprep' }).then(async () => {
    const user = await User.findOne({ username: 'testuser123' });
    if (user) {
        const matchesCount = await JobMatch.countDocuments({ userId: user._id });
        console.log(`User ${user.username} (${user.targetJob}): ${matchesCount} matches`);
    } else {
        console.log('User testuser123 not found');
    }
    process.exit(0);
}).catch(err => {
    console.error('Check failed:', err);
    process.exit(1);
});
