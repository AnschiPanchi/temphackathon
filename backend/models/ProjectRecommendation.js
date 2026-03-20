import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    targetSkills: [{ type: String }],
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
    category: { type: String }
}, { timestamps: true });

export default mongoose.model('ProjectRecommendation', projectSchema);
