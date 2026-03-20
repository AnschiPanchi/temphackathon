import mongoose from 'mongoose';

// Stores AI-generated quests globally (same for ALL users)
const dailyQuestSchema = new mongoose.Schema({
    type: { type: String, enum: ['daily', 'weekly'], required: true },
    
    // The actual problem content (AI-generated)
    title: { type: String, required: true },
    description: { type: String, required: true },
    topic: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    examples: [{ input: String, output: String, explanation: String }],
    constraints: [String],
    starterCode: {
        javascript: String,
        python: String,
        java: String,
        cpp: String,
    },
    
    xpReward: { type: Number, required: true },
    
    // Reset schedule: "2024-03-21" for daily, "2024-W12" for weekly
    periodKey: { type: String, required: true, unique: false },
    
    // Valid window
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
}, { timestamps: true });

dailyQuestSchema.index({ type: 1, periodKey: 1 }, { unique: true });

const DailyQuest = mongoose.model('DailyQuest', dailyQuestSchema);
export default DailyQuest;
