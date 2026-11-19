import TelegramBot from 'node-telegram-bot-api'
import axios from 'axios'
import fs from 'fs'

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
// Key 3ක් - එකක් ඉවර වුනොත් අනිත් එකෙන් යනවා!
const KEYS = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY2, process.env.GEMINI_API_KEY3].filter(Boolean)
let keyIndex = 0
function getKey() {
  const k = KEYS[keyIndex % KEYS.length]
  keyIndex++
  return k
}

const bot = new TelegramBot(TOKEN, { 
  polling: { interval: 500, autoStart: true, params: { timeout: 10 } } 
})
console.log(`✅ HANSAKA MD - ${KEYS.length} Keys Loaded! 🔥`)

// ⚡ වැඩ කරන Model එක මතක තියාගන්නවා
let CACHED_MODEL = 'gemini-3.8-flash'

async function searchInternet(query) {
  try {
    const res = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`, { timeout: 3000 }).catch(() => null)
    return res?.data?.AbstractText || res?.data?.RelatedTopics?.[0]?.Text || null
  } catch (e) { return null }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function askAI(userMsg) {
  const needInternet = /මිල|price|latest|news|කීයද|weather|score|result/i.test(userMsg)
  let searchData = null
  if (needInternet) searchData = await searchInternet(userMsg)

  let prompt = `ඔයා HANSAKA MD, HANSAKA ගේ යාළුවා. සිංහල+English මිශ්‍රව, fun විදියට, කෙටියෙන් උත්තර දෙන්න.\nUser: ${userMsg}`
  if (searchData) prompt += `\nSearch: ${searchData}`

  // Hydrogen High Demand නිසා 3.8 Flash එක මුලින්ම Try කරනවා - මේක Fast + Quota වැඩියි!
  const tryModels = [CACHED_MODEL, 'gemini-3.8-flash', 'gemini-4-hydrogen', 'gemini-3.7-flash', 'gemini-omni-1.1-flash']

  for (let m of [...new Set(tryModels)]) {
    for (let attempt = 0; attempt < KEYS.length; attempt++) {
      const KEY = getKey()
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${KEY}`
        const res = await axios.post(url, {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
        }, { headers: { 'Content-Type': 'application/json' }, timeout: 10000 })
        
        console.log(`✅ Working: ${m} | Key ${attempt+1}`)
        CACHED_MODEL = m
        return res.data.candidates[0].content.parts[0].text
      } catch (e) {
        const msg = e.response?.data?.error?.message || e.message
        console.log(`❌ Fail ${m} Key${attempt+1}:`, msg.slice(0, 90))
        // 429 / Quota නම් තත්පර 2ක් ඉඳලා අනිත් Key එක Try කරනවා
        if (msg.includes('429') || msg.includes('Quota') || msg.includes('exceeded') || msg.includes('high demand')) {
          await sleep(2000)
          continue
        }
        break
      }
    }
  }
  // AI ඔක්කොම Fail වුනොත්, Internet එකෙන් හරි උත්තරයක් දෙනවා - හිස් Message එකක් එන්නේ නෑ!
  if (searchData) return `මේක Internet එකෙන් හොයාගත්තේ මචං 👇\n\n${searchData}\n\n(Gemini ටිකක් Busy නිසා මේ විදියට දුන්නේ 😅)`
  return 'අඩෝ දැන් ටිකක් Busy මචං 😅 විනාඩි 1කින් ආයෙත් දාන්න, එතකොට හරි යනවා!'
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
│  │  🧠 AI       : Gemini 4 + 3.8 🟢
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
  bot.sendMessage(msg.chat.id, `🤖 *HANSAKA MD - Gemini AI Bot*\n\n/start - Alive\n/alive - Status\n/help - මේක\n\nඕනම දෙයක් අහන්න! 🔥`)
})

bot.on('message', async (msg) => {
  if (!msg.text || msg.text.startsWith('/') || msg.text.startsWith('.')) return
  console.log(`Msg: ${msg.text}`)
  bot.sendChatAction(msg.chat.id, 'typing')
  const reply = await askAI(msg.text)
  bot.sendMessage(msg.chat.id, reply)
})

bot.on('polling_error', (e) => console.log('Polling Error:', e.message))
