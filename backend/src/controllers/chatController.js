const Chat = require('../models/Chat');
const { getOpenAIClient, OPENAI_MODEL, MAX_CONTEXT_MESSAGES } = require('../config/openai');
const logger = require('../utils/logger');

const SYSTEM_PROMPT = `You are a helpful, harmless, and honest AI assistant. 
You provide clear, accurate, and concise responses. 
You support markdown formatting including code blocks with syntax highlighting.
When writing code, always specify the programming language in code blocks.`;

/**
 * @route   GET /api/chats
 * @desc    Get all chats for user (paginated)
 */
const getChats = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [chats, total] = await Promise.all([
      Chat.find({ userId: req.user._id, isArchived: false })
        .select('title createdAt lastMessageAt messageCount model isPinned')
        .sort({ isPinned: -1, lastMessageAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Chat.countDocuments({ userId: req.user._id, isArchived: false }),
    ]);

    res.json({
      success: true,
      chats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + chats.length < total,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/chats/:chatId
 * @desc    Get a single chat with messages
 */
const getChat = async (req, res, next) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      userId: req.user._id,
    });

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found.' });
    }

    res.json({ success: true, chat });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/chats
 * @desc    Create a new chat
 */
const createChat = async (req, res, next) => {
  try {
    const chat = await Chat.create({
      userId: req.user._id,
      title: 'New Chat',
      messages: [],
    });

    res.status(201).json({ success: true, chat });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/chats/:chatId/messages
 * @desc    Send message & stream OpenAI response
 */
const sendMessage = async (req, res, next) => {
  const { message, stream = true } = req.body;

  try {
    let chat = await Chat.findOne({ _id: req.params.chatId, userId: req.user._id });
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found.' });
    }

    // Add user message
    chat.messages.push({ role: 'user', content: message });

    // Build context (system + last N messages)
    const contextMessages = chat.messages
      .slice(-MAX_CONTEXT_MESSAGES)
      .map(({ role, content }) => ({ role, content }));

    const messagesForAPI = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...contextMessages,
    ];

    const openai = getOpenAIClient();

    if (stream) {
      // ── Streaming response ────────────────────────────────────────────────
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      let fullContent = '';
      let totalTokens = 0;

      try {
        const streamResponse = await openai.chat.completions.create({
          model: chat.model || OPENAI_MODEL,
          messages: messagesForAPI,
          stream: true,
          max_tokens: 4096,
          temperature: 0.7,
        });

        for await (const chunk of streamResponse) {
          const delta = chunk.choices[0]?.delta?.content || '';
          if (delta) {
            fullContent += delta;
            res.write(`data: ${JSON.stringify({ type: 'delta', content: delta })}\n\n`);
          }

          if (chunk.usage) {
            totalTokens = chunk.usage.total_tokens;
          }

          if (chunk.choices[0]?.finish_reason === 'stop') {
            break;
          }
        }

        // Save assistant message to DB
        chat.messages.push({ role: 'assistant', content: fullContent, tokens: totalTokens });
        chat.totalTokens += totalTokens;
        chat.lastMessageAt = new Date();

        // Auto-generate title on first exchange
        if (chat.messages.length === 2 && chat.title === 'New Chat') {
          chat.generateTitle();
        }

        await chat.save();

        // Send completion event with updated chat metadata
        res.write(`data: ${JSON.stringify({
          type: 'done',
          chatId: chat._id,
          title: chat.title,
          messageId: chat.messages[chat.messages.length - 1]._id,
        })}\n\n`);

        res.end();
      } catch (openaiError) {
        logger.error('OpenAI streaming error:', openaiError);
        res.write(`data: ${JSON.stringify({ type: 'error', message: openaiError.message })}\n\n`);
        res.end();
      }
    } else {
      // ── Non-streaming response ────────────────────────────────────────────
      const response = await openai.chat.completions.create({
        model: chat.model || OPENAI_MODEL,
        messages: messagesForAPI,
        max_tokens: 4096,
        temperature: 0.7,
      });

      const assistantMessage = response.choices[0].message.content;
      const tokensUsed = response.usage?.total_tokens || 0;

      chat.messages.push({ role: 'assistant', content: assistantMessage, tokens: tokensUsed });
      chat.totalTokens += tokensUsed;
      chat.lastMessageAt = new Date();

      if (chat.messages.length === 2 && chat.title === 'New Chat') {
        chat.generateTitle();
      }

      await chat.save();

      res.json({
        success: true,
        message: assistantMessage,
        chatId: chat._id,
        title: chat.title,
        tokensUsed,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/chats/:chatId/title
 * @desc    Rename a chat
 */
const renameChat = async (req, res, next) => {
  try {
    const chat = await Chat.findOneAndUpdate(
      { _id: req.params.chatId, userId: req.user._id },
      { title: req.body.title },
      { new: true, runValidators: true, select: '_id title updatedAt' }
    );

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found.' });
    }

    res.json({ success: true, chat });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/chats/:chatId/pin
 * @desc    Toggle pin on a chat
 */
const togglePin = async (req, res, next) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.chatId, userId: req.user._id });
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found.' });
    }
    chat.isPinned = !chat.isPinned;
    await chat.save();
    res.json({ success: true, isPinned: chat.isPinned });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/chats/:chatId
 * @desc    Delete a chat
 */
const deleteChat = async (req, res, next) => {
  try {
    const chat = await Chat.findOneAndDelete({
      _id: req.params.chatId,
      userId: req.user._id,
    });

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found.' });
    }

    res.json({ success: true, message: 'Chat deleted.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/chats
 * @desc    Delete all chats for user
 */
const deleteAllChats = async (req, res, next) => {
  try {
    const result = await Chat.deleteMany({ userId: req.user._id });
    res.json({ success: true, message: `Deleted ${result.deletedCount} chats.` });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getChats,
  getChat,
  createChat,
  sendMessage,
  renameChat,
  togglePin,
  deleteChat,
  deleteAllChats,
};
