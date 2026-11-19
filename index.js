import TelegramBot from 'node-telegram-bot-api'
import axios from 'axios'
import fs from 'fs'

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const GEMINI_KEY = process.env.GEMINI_API_KEY

const bot = new TelegramBot(TOKEN, { 
  polling: { interval: 1000, autoStart: true, params: { timeout: 10 } } 
})
console.log('✅ HANSAKA MD - Gemini 4 Connected! 🔥')

// 🔍 INTERNET SEARCH
async function searchInternet(query) {
  try {
    const [wiki, ddg] = await Promise.all([
      axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`, { timeout: 5000 }).catch(() => null),
      axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`, { timeout: 5000 }).catch(() => null)
    ])
    let result = ''
    if (wiki?.data?.extract) result += `Wikipedia: ${wiki.data.extract}\n\n`
    if (ddg?.data?.AbstractText) result += `Search: ${ddg.data.AbstractText}\n\n`
    if (ddg?.data?.RelatedTopics) {
      ddg.data.RelatedTopics.slice(0, 3).forEach(t => { if (t.Text) result += `- ${t.Text}\n` })
    }
    return result || null
  } catch (e) { return null }
}

// 🧠 ඔයාගේ Key එකට වැඩ කරන Model එක Auto හොයනවා
let CACHED_MODEL = null
async function getWorkingModel() {
  if (CACHED_MODEL) return CACHED_MODEL
  try {
    const res = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_KEY}`, { timeout: 10000 })
    const models = res.data.models || []
    console.log('📋 Available Models:', models.map(m => m.name).join(', '))
    // Gemini 4 එකට Priority දෙනවා
    const g4 = models.find(m => m.name.includes('gemini-4') && m.supportedGenerationMethods?.includes('generateContent'))
    const flash = models.find(m => m.name.includes('flash') && m.supportedGenerationMethods?.includes('generateContent'))
    const anyModel = models.find(m => m.supportedGenerationMethods?.includes('generateContent'))
    const picked = g4 || flash || anyModel
    if (picked) {
      CACHED_MODEL = picked.name.replace('models/', '')
      console.log(`✅ Auto Picked Model: ${CACHED_MODEL}`)
      return CACHED_MODEL
    }
  } catch (e) {
    console.log('Model List Error:', e.response?.data?.error?.message || e.message)
  }
  // List එක ගන්න බැරි වුනොත් මේවා Try කරනවා
  return 'gemini-4-hydrogen'
}

// 🧠 GEMINI AI - Gemini 4 එක්ක
async function askAI(userMsg) {
  const needInternet = /අද|මිල|price|latest|news|කීයද|2026|2025|weather|score|result|කවුද|who is|what is/i.test(userMsg)
  let searchData = null
  if (needInternet) {
    searchData = await searchInternet(userMsg)
  }

  let prompt = `ඔයා HANSAKA MD. HANSAKA හදපු AI Bot එකක්. A/L IT කරන කොල්ලෙක්ගේ හොඳම යාළුවා වගේ කතා කරන්න. සිංහල + English මිශ්‍ර කරලා, fun විදියට, Emoticon දාලා, කෙටියෙන් පැහැදිලිව උත්තර දෙන්න. Owner: HANSAKA.\n\nUser: ${userMsg}`
  
  if (searchData) {
    prompt += `\n\nINTERNET SEARCH RESULT (මේක පදනම් කරගෙන උත්තර දෙන්න):\n${searchData}`
  }

  const model = await getWorkingModel()
  const tryModels = [model, 'gemini-4-hydrogen', 'gemini-4-neon', 'gemini-2.5-flash', 'gemini-2.0-flash']

  for (let m of [...new Set(tryModels)]) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${GEMINI_KEY}`
      const res = await axios.post(url, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
      }, { headers: { 'Content-Type': 'application/json' }, timeout: 15000 })
      
      console.log(`✅ Working Model: ${m}`)
      CACHED_MODEL = m
      return res.data.candidates[0].content.parts[0].text
    } catch (e) {
      console.log(`❌ Fail Model ${m}:`, e.response?.data?.error?.message || e.message)
      continue
    }
  }
  return 'අඩෝ Gemini එකට ටිකක් අවුල් වුනා මචං 😅 Log එකේ Available Models කියලා තියෙන එක Screenshot කරලා එවපන්!'
}

// 🔥 ALIVE - Gemini 4 Version
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
│  │  🧠 AI       : Gemini 4 Hydrogen 🟢
│  │  🌐 Internet : ONLINE 🟢
│  │  📱 Platform : ANDROID
│  │  ⚡ Speed    : Super Fast 2.5x
│  │
│  └───〔 ─────────── 〕───┘
│
│  🫶 ඔයාලට HANSAKA MD BOT වෙත
│  සාදරයෙන් පිළිගන්නවා... 🧡
│
╰───〔 DEPLOYED BY HANSAKA 〕───╯`

  try {
    if (fs.existsSync('alive.jpg')) {
      await bot.sendPhoto(chatId, 'alive.jpg', { caption: caption })
    } else {
      await bot.sendMessage(chatId, caption)
    }
  } catch (e) { 
    await bot.sendMessage(chatId, caption) 
  }
}

bot.onText(/\/start/, (msg) => sendAlive(msg.chat.id, msg.from.first_name || 'User'))
bot.onText(/^\.alive/, (msg) => sendAlive(msg.chat.id, msg.from.first_name || 'User'))
bot.onText(/\/alive/, (msg) => sendAlive(msg.chat.id, msg.from.first_name || 'User'))

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, `🤖 *HANSAKA MD - Gemini 4 AI Bot*\n\n/start - Alive\n/alive - Status\n/help - මේක\n\nඕනම දෙයක් අහන්න! Gemini 4 එක Internet එකෙන් හොයලා උත්තර දෙනවා! 🔥`)
})

bot.on('message', async (msg) => {
  if (!msg.text || msg.text.startsWith('/') || msg.text.startsWith('.')) return
  console.log(`Msg: ${msg.text}`)
  bot.sendChatAction(msg.chat.id, 'typing')
  const reply = await askAI(msg.text)
  bot.sendMessage(msg.chat.id, reply)
})

bot.on('polling_error', (e) => console.log('Polling Error:', e.message))
