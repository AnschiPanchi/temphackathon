import mongoose from 'mongoose';

const jobMatchSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: String, required: true }, // ID from the external API
    jobTitle: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String },
    description: { type: String },
    requiredSkills: [{ type: String }],
    missingSkills: [{ type: String }], // Bonus feature
    similarityScore: { type: Number, required: true },
    source: { type: String, default: 'Remotive' },
    applyLink: { type: String, required: true },
}, { timestamps: true });

// Prevent duplicate job matches for the same user
jobMatchSchema.index({ userId: 1, jobId: 1 }, { unique: true });

const JobMatch = mongoose.model('JobMatch', jobMatchSchema);
export default JobMatch;
