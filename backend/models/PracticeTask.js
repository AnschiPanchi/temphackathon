import mongoose from 'mongoose';

const practiceTaskSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    skill: { type: String, required: true },
    category: { type: String, required: true },
    problemTitle: { type: String, required: true },
    problemDescription: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
    completed: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('PracticeTask', practiceTaskSchema);
