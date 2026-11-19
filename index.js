import TelegramBot from 'node-telegram-bot-api'
import axios from 'axios'
import fs from 'fs'

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const GEMINI_KEY = process.env.GEMINI_API_KEY
const GROQ_KEY = process.env.GROQ_API_KEY

const bot = new TelegramBot(TOKEN, { 
  polling: { interval: 500, autoStart: true, params: { timeout: 10 } } 
})
console.log('✅ HANSAKA MD - Groq + Gemini Connected! 🔥')

// 🔍 INTERNET SEARCH
async function searchInternet(query) {
  try {
    const res = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`, { timeout: 3000 }).catch(() => null)
    return res?.data?.AbstractText || res?.data?.RelatedTopics?.[0]?.Text || null
  } catch (e) { return null }
}

// ⚡ 1. GROQ - SUPER FAST + FREE (Main AI)
async function askGroq(userMsg, searchData) {
  if (!GROQ_KEY) return null
  try {
    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'ඔයා HANSAKA MD, HANSAKA ගේ යාළුවා. සිංහල+English මිශ්‍රව, fun විදියට, කෙටියෙන් උත්තර දෙන්න. Owner: HANSAKA.' },
        { role: 'user', content: userMsg + (searchData ? `\nSearch: ${searchData}` : '') }
      ],
      temperature: 0.7,
      max_tokens: 500
    }, { headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' }, timeout: 15000 })
    console.log('✅ Working: Groq Llama-3.3')
    return res.data.choices[0].message.content
  } catch (e) {
    console.log('❌ Groq Fail:', (e.response?.data?.error?.message || e.message).slice(0, 100))
    return null
  }
}

// 🧠 2. GEMINI - Backup
async function askGemini(userMsg, searchData) {
  if (!GEMINI_KEY) return null
  const models = ['gemini-3.8-flash', 'gemini-4-hydrogen', 'gemini-3.7-flash']
  for (let m of models) {
    try {
      const res = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${GEMINI_KEY}`, {
        contents: [{ parts: [{ text: `ඔයා HANSAKA MD, HANSAKA ගේ යාළුවා. සිංහල+English මිශ්‍රව, fun විදියට, කෙටියෙන් උත්තර දෙන්න.\nUser: ${userMsg}` + (searchData ? `\nSearch: ${searchData}` : '') }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
      }, { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }) // Timeout 30s කරා!
      console.log(`✅ Working: Gemini ${m}`)
      return res.data.candidates[0].content.parts[0].text
    } catch (e) {
      console.log(`❌ Gemini ${m} Fail:`, (e.response?.data?.error?.message || e.message).slice(0, 90))
      continue
    }
  }
  return null
}

// 🌐 3. POLLINATIONS - Key නැතුව වැඩ කරන Free AI (Last Resort)
async function askPollinations(userMsg) {
  try {
    const res = await axios.get(`https://text.pollinations.ai/${encodeURIComponent('You are HANSAKA MD, answer in Sinhala+English mix, fun and short. User: ' + userMsg)}`, { timeout: 20000 })
    console.log('✅ Working: Pollinations')
    return typeof res.data === 'string' ? res.data : null
  } catch (e) {
    console.log('❌ Pollinations Fail:', e.message.slice(0, 80))
    return null
  }
}

// 🧠 MAIN - 3න් එකක් හරි වැඩ කරනවා!
async function askAI(userMsg) {
  const needInternet = /මිල|price|latest|news|කීයද|weather|score|result/i.test(userMsg)
  let searchData = null
  if (needInternet) searchData = await searchInternet(userMsg)

  // 1. Groq - Fastම එක
  let reply = await askGroq(userMsg, searchData)
  if (reply) return reply

  // 2. Gemini - Backup
  reply = await askGemini(userMsg, searchData)
  if (reply) return reply

  // 3. Pollinations - Key නැතුව
  reply = await askPollinations(userMsg)
  if (reply) return reply

  if (searchData) return `Internet එකෙන් හොයාගත්තේ මචං 👇\n\n${searchData}`
  return 'අඩෝ ටිකක් Busy මචං 😅 විනාඩි 1කින් ආයෙත් දාන්න!'
}

// 🔥 ALIVE
async function sendAlive(chatId, userName) {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' }))
  const time = now.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit', hour12: true })
  const date = now.toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })
  const day = now.toLocaleDateString('en-LK', { weekday: 'long' })

  const caption = `╭───〔 🦊 HANSAKA MD 〕───╮
│
│  👋 Hey, ${userName} !
│  Welcome To HANSAKA MD Bot
│
│  ┌───〔 STATUS PANEL 〕───┐
│  │
│  │  🕒 Time     : ${time}
│  │  📅 Date     : ${date}
│  │  📆 Day      : ${day}
│  │  🤖 Bot      : HANSAKA MD
│  │  👑 Owner    : HANSAKA
│  │  🧠 AI       : Groq Llama 3.3 🟢
│  │  🌐 Internet : ONLINE 🟢
│  │  📱 Platform : ANDROID
│  │  ⚡ Speed    : Super Fast 1s
│  │
│  └───〔 ─────────── 〕───┘
│
│  🫶 ඔයාලට HANSAKA MD BOT වෙත
│  සාදරයෙන් පිළිගන්නවා... 🧡
│
╰───〔 DEPLOYED BY HANSAKA 〕───╯`

  try {
    if (fs.existsSync('alive.jpg')) await bot.sendPhoto(chatId, 'alive.jpg', { caption: caption })
    else await bot.sendMessage(chatId, caption)
  } catch (e) { await bot.sendMessage(chatId, caption) }
}

bot.onText(/\/start/, (msg) => sendAlive(msg.chat.id, msg.from.first_name || 'User'))
bot.onText(/^\.alive/, (msg) => sendAlive(msg.chat.id, msg.from.first_name || 'User'))
bot.onText(/\/alive/, (msg) => sendAlive(msg.chat.id, msg.from.first_name || 'User'))

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, `🤖 *HANSAKA MD - Groq AI Bot*\n\n/start - Alive\n/alive - Status\n/help - මේක\n\nඕනම දෙයක් අහන්න! 🔥`)
})

bot.on('message', async (msg) => {
  if (!msg.text || msg.text.startsWith('/') || msg.text.startsWith('.')) return
  console.log(`Msg: ${msg.text}`)
  bot.sendChatAction(msg.chat.id, 'typing')
  const reply = await askAI(msg.text)
  bot.sendMessage(msg.chat.id, reply)
})

bot.on('polling_error', (e) => console.log('Polling Error:', e.message))
