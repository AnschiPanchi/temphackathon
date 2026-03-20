import axios from 'axios';
import User from '../models/User.js';
import JobMatch from '../models/JobMatch.js';
import Notification from '../models/Notification.js';
import { generateEmbedding, computeCosineSimilarity, getMissingSkills } from '../utils/aiMatcher.js';

export const fetchAndMatchJobs = async (specificUserId = null) => {
    console.log(`Started Job Sync Process... ${specificUserId ? `(Targeting user: ${specificUserId})` : '(Global Scan)'}`);
    
    try {
        // 1. Fetch Users who have skills and a target job
        const query = { targetJob: { $exists: true }, skills: { $not: { $size: 0 } } };
        if (specificUserId) query._id = specificUserId;

        const users = await User.find(query);
        if(users.length === 0) return console.log('No eligible users found.');

        // Pre-compute user embeddings to save time
        const userProfiles = await Promise.all(users.map(async (user) => {
            const profileText = `Target Role: ${user.targetJob}. Skills: ${user.skills.join(', ')}.`;
            const embedding = await generateEmbedding(profileText);
            return { user, embedding };
        }));

        // 2. Fetch Jobs from Remotive API
        // We'll collect jobs for all these target roles
        let jobPool = [];
        
        const cleanRoleForSearch = (role) => {
            if (!role) return '';
            // Remove "at Company" or "at Startup" from targetJob names
            return role.split(/ at /i)[0].trim();
        };

        // If we have a specific user or a small set of users, we search by their role
        if (specificUserId || uniqueTargetJobs.length < 5) {
            for (const rawRole of uniqueTargetJobs) {
                const searchRole = cleanRoleForSearch(rawRole);
                console.log(`Searching Remotive for: "${searchRole}" (from "${rawRole}")`);
                
                try {
                    const searchRes = await axios.get(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(searchRole)}&limit=40`);
                    if (searchRes.data.jobs) jobPool.push(...searchRes.data.jobs);
                } catch (e) {
                    console.error(`Remotive search failed for "${searchRole}":`, e.message);
                }
            }
        } 
        
        // Always include a base set of software and tech categories as a safety pool
        const categories = ['software-dev', 'data', 'devops', 'product'];
        for (const cat of categories) {
            try {
                const baseRes = await axios.get(`https://remotive.com/api/remote-jobs?category=${cat}&limit=30`);
                if (baseRes.data.jobs) jobPool.push(...baseRes.data.jobs);
            } catch (e) {
                console.error(`Remotive category fetch failed for "${cat}":`, e.message);
            }
        }

        // Deduplicate jobPool based on job.id
        const uniqueJobs = Array.from(new Map(jobPool.map(j => [j.id, j])).values());
        console.log(`Matching against pool of ${uniqueJobs.length} unique jobs...`);


        // 3. Match Jobs against Users
        for (const job of uniqueJobs) {
            // Strip HTML from descriptions
            const cleanDescription = job.description.replace(/<[^>]+>/g, '').substring(0, 1500); 
            const jobText = `Job Title: ${job.title}. Category: ${job.category}. Description: ${cleanDescription}`;
            
            const jobEmbedding = await generateEmbedding(jobText);

            for (const profile of userProfiles) {
                const similarity = computeCosineSimilarity(profile.embedding, jobEmbedding);

                // Threshold check (slightly lowered to improve results on specific searches)
                if (similarity > 0.52) {
                    const exists = await JobMatch.findOne({ userId: profile.user._id, jobId: job.id.toString() });
                    if (!exists) {
                        const missingSkills = getMissingSkills(profile.user.skills, cleanDescription);

                        const newJobMatch = await JobMatch.create({
                            userId: profile.user._id,
                            jobId: job.id.toString(),
                            jobTitle: job.title,
                            company: job.company_name,
                            location: job.candidate_required_location || 'Remote',
                            description: cleanDescription.substring(0, 500) + '...',
                            requiredSkills: [], 
                            missingSkills: missingSkills,
                            similarityScore: similarity,
                            source: 'Remotive',
                            applyLink: job.url
                        });

                        await Notification.create({
                            userId: profile.user._id,
                            jobId: newJobMatch._id,
                            message: `AI Match found: ${job.title} at ${job.company_name}. Suitability: ${(similarity * 100).toFixed(0)}%`
                        });
                    }
                }
            }
        }
        console.log('Job Sync Completed Successfully.');
    } catch (error) {
        console.error('Job Sync Failed:', error);
    }
};

