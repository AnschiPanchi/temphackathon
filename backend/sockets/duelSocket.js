import { judgeDuel } from '../utils/judgeAgent.js';
import User from '../models/User.js';
import { checkAchievements } from '../utils/achievementEngine.js';

// In-memory room storage
const rooms = new Map();
// Map socket.id -> { roomId, username }
const socketMeta = new Map();

export default (io) => {
    io.on('connection', (socket) => {
        console.log('[DUEL] Connected:', socket.id);

        socket.on('join_room', ({ roomId, username }) => {
            if (!roomId || !username) return;

            // Initialise room if new
            if (!rooms.has(roomId)) {
                rooms.set(roomId, {
                    players: [],
                    status: 'waiting',
                    submissions: {},
                    language: 'javascript',
                    problem: {
                        title: 'Two Sum',
                        difficulty: 'Easy',
                        desc: 'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nExample: nums = [2,7,11,15], target = 9 → Output: [0,1]',
                        tags: ['Array', 'Hash Table'],
                    },
                });
            }

            const room = rooms.get(roomId);

            // Remove any stale entry for this username (reconnect case)
            room.players = room.players.filter(p => p.username !== username);

            // Only allow up to 2 players
            if (room.players.length < 2) {
                room.players.push({ id: socket.id, username });
                socket.join(roomId);
                socketMeta.set(socket.id, { roomId, username });
                console.log(`[DUEL] ${username} joined room ${roomId} (${room.players.length}/2)`);
            } else {
                // Room full — reject
                socket.emit('room_full');
                return;
            }

            // Transition to duel when both players ready
            if (room.players.length === 2) {
                room.status = 'duel';
            }

            // Broadcast updated room to ALL sockets in room (including sender)
            io.to(roomId).emit('room_update', {
                players: room.players,
                status: room.status,
                language: room.language,
                problem: room.problem,
            });
        });

        socket.on('submit_code', async ({ roomId, username, code, language }) => {
            const room = rooms.get(roomId);
            if (!room || room.status === 'finished') return;

            room.submissions[username] = code;
            if (language) room.language = language;

            // Notify everyone that this player submitted
            io.to(roomId).emit('player_submitted', { username });

            const [p1, p2] = room.players;
            if (!p1 || !p2) return;

            // Both submitted → judge
            if (room.submissions[p1.username] && room.submissions[p2.username]) {
                room.status = 'judging';
                io.to(roomId).emit('room_update', { ...room });

                try {
                    const result = await judgeDuel(
                        room.problem,
                        room.submissions[p1.username],
                        room.submissions[p2.username],
                        p1.username,
                        p2.username,
                        room.language || 'javascript'
                    );

                    room.status = 'finished';
                    room.result = result;

                    // Update winner duel stats
                    let winnerAchievements = [];
                    if (result.winner && result.winner !== 'Draw') {
                        try {
                            const winner = await User.findOne({ username: result.winner });
                            if (winner) {
                                winner.duelWins = (winner.duelWins || 0) + 1;
                                winnerAchievements = await checkAchievements(winner);
                                await winner.save();
                            }
                        } catch (e) {
                            console.error('[DUEL] Winner stat update failed:', e.message);
                        }
                    }

                    io.to(roomId).emit('duel_finished', { ...result, earnedAchievements: winnerAchievements });

                    // Clean up room after 5 minutes
                    setTimeout(() => rooms.delete(roomId), 5 * 60 * 1000);
                } catch (err) {
                    console.error('[DUEL] Judging error:', err);
                    io.to(roomId).emit('duel_error', { message: 'Judging failed. Please try again.' });
                }
            }
        });

        socket.on('change_language', ({ roomId, language }) => {
            const room = rooms.get(roomId);
            if (!room) return;
            room.language = language;
            io.to(roomId).emit('room_update', { ...room });
        });

        socket.on('disconnect', () => {
            const meta = socketMeta.get(socket.id);
            if (!meta) return;

            const { roomId, username } = meta;
            socketMeta.delete(socket.id);

            const room = rooms.get(roomId);
            if (!room || room.status === 'finished') return;

            // Remove from players list
            room.players = room.players.filter(p => p.id !== socket.id);
            room.status = 'waiting';

            console.log(`[DUEL] ${username} disconnected from room ${roomId} (${room.players.length}/2)`);

            io.to(roomId).emit('player_disconnected', { username });
            io.to(roomId).emit('room_update', {
                players: room.players,
                status: room.status,
                language: room.language,
                problem: room.problem,
            });
        });
    });
};
