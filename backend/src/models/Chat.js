const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: [32000, 'Message too long'],
    },
    tokens: {
      type: Number,
      default: 0,
    },
  },
  { _id: true, timestamps: true }
);

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New Chat',
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
    model: {
      type: String,
      default: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    },
    totalTokens: {
      type: Number,
      default: 0,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Indexes for performance
chatSchema.index({ userId: 1, lastMessageAt: -1 });
chatSchema.index({ userId: 1, createdAt: -1 });
chatSchema.index({ userId: 1, isPinned: -1, lastMessageAt: -1 });

// Virtual: message count
chatSchema.virtual('messageCount').get(function () {
  return this.messages.length;
});

// Auto-generate title from first user message
chatSchema.methods.generateTitle = function () {
  const firstUserMsg = this.messages.find((m) => m.role === 'user');
  if (firstUserMsg) {
    const words = firstUserMsg.content.trim().split(/\s+/).slice(0, 8).join(' ');
    this.title = words.length > 40 ? words.substring(0, 40) + '...' : words;
  }
};

module.exports = mongoose.model('Chat', chatSchema);
