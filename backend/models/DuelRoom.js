import mongoose from 'mongoose';

const duelRoomSchema = new mongoose.Schema({
    roomId: { type: String, required: true, unique: true, index: true },
    players: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        username: { type: String, required: true }
    }],
    status: {
        type: String,
        enum: ['waiting', 'duel', 'judging', 'finished'],
        default: 'waiting'
    },
    language: { type: String, default: 'javascript' },
    problem: {
        title: String,
        difficulty: String,
        desc: String,
        tags: [String]
    },
    submissions: [{
        username: { type: String, required: true },
        code: { type: String, required: true },
        language: { type: String, default: 'javascript' },
        submittedAt: { type: Date, default: Date.now }
    }],
    result: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

const DuelRoom = mongoose.model('DuelRoom', duelRoomSchema);
export default DuelRoom;
