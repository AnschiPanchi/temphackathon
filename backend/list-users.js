import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI, { dbName: 'algoprep' }).then(async () => {
    const users = await User.find({});
    console.log(`--- Total Users in DB: ${users.length} ---`);
    users.forEach(u => {
        console.log(`User: ${u.username}`);
        console.log(`- Target Job: ${u.targetJob}`);
        console.log(`- Skills: ${u.skills?.join(', ')}`);
        console.log(`- Forge Complete: ${u.forgeComplete}`);
        console.log('---');
    });
    process.exit(0);
}).catch(err => {
    console.error('Failed to list users:', err);
    process.exit(1);
});
