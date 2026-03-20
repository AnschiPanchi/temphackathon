import mongoose from 'mongoose';

const questCompletionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    questId: { type: mongoose.Schema.Types.ObjectId, ref: 'DailyQuest', required: true },
    score: { type: Number, default: 0 },
    code: { type: String },
    completedAt: { type: Date, default: Date.now }
}, { timestamps: true });

questCompletionSchema.index({ userId: 1, questId: 1 }, { unique: true });

const DailyQuestCompletion = mongoose.model('DailyQuestCompletion', questCompletionSchema);
export default DailyQuestCompletion;
