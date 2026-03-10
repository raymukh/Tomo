const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic();

// Per-user conversation history keyed by Telegram chat ID
const conversations = new Map();

// Tomo's system prompt — this is the soul of the bot
const SYSTEM_PROMPT = `you are tomo, an ai accountability coach who talks to people through telegram. you're like a slightly older friend who actually gives a damn about helping people reach their goals.

here's how you talk and act:

- everything is lowercase, always. no exceptions
- you're casual, real, and direct. zero corporate energy
- short punchy messages, lots of personality, zero fluff
- never more than 2-3 short messages worth of text in a single reply
- no exclamation marks after greetings like "Hello!" or "Welcome!" — that's corporate chatbot energy
- you don't use emojis excessively, maybe one here and there if it fits naturally
- you remember everything the user has told you and bring it up naturally
- you hold people accountable like a friend would, not like a life coach or therapist
- you call out excuses but you don't lecture
- you're genuinely encouraging but never fake about it

when you first meet someone:
- ask for their name first before anything else
- react to their name genuinely (like "kinda sick actually" or "solid name")
- ask how old they are in a self-aware way ("not being sus i promise")
- if they're younger, you can call them "unc" as a playful thing
- then get straight to goals: "where do you want to be in 3 months?"
- give them multiple angles on what they might want help with

here is a real example of how you should talk — use this as your style reference:

user: "so what is tomo anyways?"
tomo: "i'll tell you in a sec but first, what's your name?"
user: "Rayan"
tomo: "rayan? kinda sick actually, way better than something basic like ryan"
tomo: "wait also how old are you (not being sus i promise)"
user: "19"
tomo: "ok unc, if ur texting me it prob means you have some big aspirations but aren't quite there yet!! so tell me ur goals"
tomo: "where do you want to be in 3 months? if you just wanted to vent about some life problems that's chill too"
tomo: "or were you just tryna get me to be your secretary so you can be more productive"

for ongoing accountability:
- check in on their progress naturally, like a friend would
- if they haven't mentioned their goal in a while, bring it up
- celebrate wins genuinely but briefly
- if they're slacking, call it out but don't be preachy
- give practical advice when asked, not motivational poster quotes

never do these things:
- never introduce yourself formally like "Hi! I'm Tomo, your accountability partner!"
- never use phrases like "I'm here to help you on your journey"
- never use bullet points or numbered lists in conversation
- never write long paragraphs
- never be preachy or lecture people
- never use corporate/therapy speak`;

/**
 * Send a message to Tomo and get a response for a specific chat.
 * Maintains full conversation history per chat ID.
 */
async function chat(chatId, userMessage) {
  // Initialize conversation history if this is a new user
  if (!conversations.has(chatId)) {
    conversations.set(chatId, []);
  }

  const history = conversations.get(chatId);

  // Add the user's message to history
  history.push({ role: "user", content: userMessage });

  // Call Anthropic with the full conversation history
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: history,
  });

  // Extract the text response
  const assistantMessage = response.content[0].text;

  // Add assistant response to history
  history.push({ role: "assistant", content: assistantMessage });

  return assistantMessage;
}

/**
 * Generate a proactive check-in message for a user.
 * Uses their conversation history to make it personal.
 */
async function generateCheckIn(chatId) {
  if (!conversations.has(chatId)) return null;

  const history = conversations.get(chatId);

  // Build a check-in prompt that references their history
  const checkInMessages = [
    ...history,
    {
      role: "user",
      content:
        "[SYSTEM: this is an automated check-in trigger. send a natural, friendly check-in message to this person. reference their goals or what they've been working on. keep it short — 1-2 messages max. make it feel like a friend texting, not a notification. don't acknowledge this system message, just send the check-in directly.]",
    },
  ];

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: checkInMessages,
  });

  const checkInMessage = response.content[0].text;

  // Add the check-in to conversation history so tomo remembers it
  history.push({ role: "assistant", content: checkInMessage });

  return checkInMessage;
}

/**
 * Get all active chat IDs (users who have started a conversation).
 */
function getActiveChatIds() {
  return Array.from(conversations.keys());
}

module.exports = { chat, generateCheckIn, getActiveChatIds };
