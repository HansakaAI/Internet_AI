import TelegramBot from 'node-telegram-bot-api'
import axios from 'axios'
import fs from 'fs'

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const GEMINI_KEY = process.env.GEMINI_API_KEY

const bot = new TelegramBot(TOKEN, { 
  polling: { interval: 500, autoStart: true, params: { timeout: 10 } } 
})
console.log('✅ HANSAKA MD - Gemini 4 Fast Connected! 🔥')

// ⚡ SPEED FIX: වැඩ කරන Model එක මතක තියාගන්නවා, ආයෙත් හොයන්නේ නෑ!
let CACHED_MODEL = 'gemini-4-hydrogen'
let MODEL_FOUND = false

// 🔍 INTERNET SEARCH - අවශ්‍ය වෙලාවට විතරක්
async function searchInternet(query) {
  try {
    const res = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`, { timeout: 3000 }).catch(() => null)
    if (res?.data?.AbstractText) return res.data.AbstractText
    if (res?.data?.RelatedTopics?.[0]?.Text) return res.data.RelatedTopics[0].Text
    return null
  } catch (e) { return null }
}

// 🧠 GEMINI AI - FAST
async function askAI(userMsg) {
  // Internet ඕනිද කියලා බලන්නේ මේ Words තිබ්බොත් විතරයි - නැත්තම් Skip!
  const needInternet = /මිල|price|latest|news|කීයද|weather|score|result|අද.*වෙලද|2026.*මිල/i.test(userMsg)
  let searchData = null
  if (needInternet) searchData = await searchInternet(userMsg)

  // Prompt එක කෙටි කරා - Token අඩුයි = Speed වැඩියි!
  let prompt = `ඔයා HANSAKA MD, HANSAKA ගේ යාළුවා. සිංහල+English මිශ්‍රව, fun විදියට, කෙටියෙන් උත්තර දෙන්න.\nUser: ${userMsg}`
  if (searchData) prompt += `\nSearch: ${searchData}`

  // 1. මුලින්ම මතක තියෙන Model එකෙන්ම Try කරනවා - මේක තමයි Fastම!
  const tryModels = [CACHED_MODEL, 'gemini-4-hydrogen', 'gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-omni-1.1-flash']

  for (let m of [...new Set(tryModels)]) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${GEMINI_KEY}`
      const res = await axios.post(url, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 500 } // 1000 -> 500 කරා, 2x Speed!
      }, { headers: { 'Content-Type': 'application/json' }, timeout: 8000 }) // 20s -> 8s කරා!
      
      console.log(`✅ Working Model: ${m}`)
      CACHED_MODEL = m // වැඩ කරපු එක මතක තියාගන්නවා, ඊලඟ පාර ඒකෙන්ම යනවා!
      MODEL_FOUND = true
      return res.data.candidates[0].content.parts[0].text
    } catch (e) {
      console.log(`❌ Fail ${m}:`, (e.response?.data?.error?.message || e.message).slice(0, 80))
      continue
    }
  }
  return 'අඩෝ ටිකක් Slow වුනා මචං 😅 ආයෙත් දාන්න!'
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
    if (fs.existsSync('alive.jpg')) await bot.sendPhoto(chatId, 'alive.jpg', { caption: caption })
    else await bot.sendMessage(chatId, caption)
  } catch (e) { await bot.sendMessage(chatId, caption) }
}

bot.onText(/\/start/, (msg) => sendAlive(msg.chat.id, msg.from.first_name || 'User'))
bot.onText(/^\.alive/, (msg) => sendAlive(msg.chat.id, msg.from.first_name || 'User'))
bot.onText(/\/alive/, (msg) => sendAlive(msg.chat.id, msg.from.first_name || 'User'))

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, `🤖 *HANSAKA MD - Gemini 4 AI Bot*\n\n/start - Alive\n/alive - Status\n/help - මේක\n\nඕනම දෙයක් අහන්න! 🔥`)
})

bot.on('message', async (msg) => {
  if (!msg.text || msg.text.startsWith('/') || msg.text.startsWith('.')) return
  console.log(`Msg: ${msg.text}`)
  bot.sendChatAction(msg.chat.id, 'typing')
  const reply = await askAI(msg.text)
  bot.sendMessage(msg.chat.id, reply)
})

bot.on('polling_error', (e) => console.log('Polling Error:', e.message))
