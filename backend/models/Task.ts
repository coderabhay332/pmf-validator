
import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    browserUseId: {
        type: String,
        required: true,
        unique: true,
    },
    prompt: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true, // INIT, RUNNING, DONE, etc.
    },
    result: {
        type: Object, // The DTO
    },
    logs: {
        type: Array,
    }
}, {
    timestamps: true,
});

const Task = mongoose.model('Task', taskSchema);

export default Task;
