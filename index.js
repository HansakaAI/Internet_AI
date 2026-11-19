import TelegramBot from 'node-telegram-bot-api'
import axios from 'axios'
import fs from 'fs'

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const GEMINI_KEY = process.env.GEMINI_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`

const bot = new TelegramBot(TOKEN, { 
  polling: { interval: 1000, autoStart: true, params: { timeout: 10 } } 
})
console.log('✅ HANSAKA MD - Gemini AI Connected! 🔥')

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

// 🧠 GEMINI AI
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

  try {
    const res = await axios.post(GEMINI_URL, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
    }, { headers: { 'Content-Type': 'application/json' }, timeout: 15000 })
    
    return res.data.candidates[0].content.parts[0].text
  } catch (e) {
    console.log('Gemini Error:', e.response?.data?.error?.message || e.message)
    return 'අඩෝ Gemini එකට ටිකක් අවුල් වුනා මචං 😅 API Key එක හරිද කියලා බලලා ආයෙත් Message එකක් දාන්න!'
  }
}

// 🔥 ALIVE
async function sendAlive(chatId, userName) {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' }))
  const time = now.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit', hour12: true })
  const date = now.toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })
  const caption = `⭐ Hey , ${userName}\n👋 welcome to HANSAKA MD 🦊\n┌ 「 STATUS PANEL 」\n│ 🕒 Time : ${time}\n│ 📅 Date : ${date}\n│ 🤖 Bot Name: HANSAKA MD\n│ 👑 Owner : HANSAKA\n│ 🧠 AI: Google Gemini 2.0 🟢\n│ 🌐 Internet: ON\n│ 📱 Platform: ANDROID\n└\n🫶 කොහොමද ඔයාලට HANSAKA MD BOT වෙත සාදරයෙන් පිළිගන්නවා... 🧡\n\nDEPLOYED BY HANSAKA`
  try {
    if (fs.existsSync('alive.jpg')) await bot.sendPhoto(chatId, 'alive.jpg', { caption: caption })
    else await bot.sendMessage(chatId, caption)
  } catch (e) { await bot.sendMessage(chatId, caption) }
}

bot.onText(/\/start/, (msg) => sendAlive(msg.chat.id, msg.from.first_name || 'User'))
bot.onText(/^\.alive/, (msg) => sendAlive(msg.chat.id, msg.from.first_name || 'User'))
bot.onText(/\/alive/, (msg) => sendAlive(msg.chat.id, msg.from.first_name || 'User'))

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, `🤖 *HANSAKA MD - Gemini AI Bot*\n\n/start - Alive\n/alive - Status\n/help - මේක\n\nඕනම දෙයක් අහන්න! Gemini AI එක Internet එකෙන් හොයලා උත්තර දෙනවා! 🔥`)
})

bot.on('message', async (msg) => {
  if (!msg.text || msg.text.startsWith('/') || msg.text.startsWith('.')) return
  console.log(`Msg: ${msg.text}`)
  bot.sendChatAction(msg.chat.id, 'typing')
  const reply = await askAI(msg.text)
  bot.sendMessage(msg.chat.id, reply)
})

bot.on('polling_error', (e) => console.log('Polling Error:', e.message))
