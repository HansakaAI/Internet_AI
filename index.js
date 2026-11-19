import TelegramBot from 'node-telegram-bot-api'
import axios from 'axios'
import fs from 'fs'

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const bot = new TelegramBot(TOKEN, { polling: true })
console.log('✅ HANSAKA MD - Own AI Started! 🔥')

// 🧠 ඔයාගේම AI BRAIN එක
const BRAIN = {
  greetings: ['hi', 'hello', 'hey', 'ayubowan', 'ආයුබෝවන්', 'කොහොමද', 'kohomada'],
  who: ['oya kawda', 'oya kauda', 'ඔයා කවුද', 'who are you', 'ඔයාගේ නම'],
  owner: ['owner', 'haduwe kawda', 'හැදුවේ කවුද', 'අයිතිකරු'],
  help: ['help', 'menu', 'උදව්', 'commands'],
}

// 🔍 INTERNET එකෙන් හොයනවා - Groq නැතුවම
async function searchInternet(query) {
  try {
    const [wiki, ddg] = await Promise.all([
      axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`, { timeout: 5000 }).catch(() => null),
      axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`, { timeout: 5000 }).catch(() => null)
    ])
    let result = ''
    if (wiki?.data?.extract) result += wiki.data.extract + '\n\n'
    if (ddg?.data?.AbstractText) result += ddg.data.AbstractText + '\n\n'
    if (ddg?.data?.RelatedTopics) {
      ddg.data.RelatedTopics.slice(0, 3).forEach(t => { if (t.Text) result += `• ${t.Text}\n` })
    }
    return result || null
  } catch (e) { return null }
}

// 🧠 ඔයාගේ AI එක උත්තර හදන හැටි
async function myOwnAI(userMsg, userName) {
  const msg = userMsg.toLowerCase()

  // 1. Greeting
  if (BRAIN.greetings.some(w => msg.includes(w))) {
    return `ආයුබෝවන් ${userName}! 😎🔥\n\nකොහොමද මචං? මම තමයි HANSAKA MD!\n\nමට ඕන දෙයක් අහන්න, මම Internet එකෙන් හොයලා උත්තර දෙන්නම්!\n\nඋදා: "Python කියන්නේ මොකක්ද?" / "Elon Musk කවුද?"`
  }

  // 2. Who are you
  if (BRAIN.who.some(w => msg.includes(w))) {
    return `මම තමයි HANSAKA MD! 🦊🔥\n\nHANSAKA හදපු Super AI Bot එක!\nInternet එකෙන් Latest Info හොයලා උත්තර දෙනවා!\n\nGroq / Grok නෙවෙයි, මේක මගේම AI එක! 😎`
  }

  // 3. Owner
  if (BRAIN.owner.some(w => msg.includes(w))) {
    return `මගේ Owner තමයි 👑 HANSAKA!\n\nඑයා තමයි මාව හැදුවේ! 🔥`
  }

  // 4. Time / Date
  if (msg.includes('time') || msg.includes('වෙලාව') || msg.includes('කීයද')) {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' }))
    return `🕒 දැන් වෙලාව: ${now.toLocaleTimeString('en-LK')}\n📅 අද දවස: ${now.toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })}`
  }

  // 5. Internet එකෙන් හොයනවා
  const searchData = await searchInternet(userMsg)
  if (searchData) {
    // Internet එකෙන් හම්බුන දේ ලස්සනට සිංහලෙන් දෙනවා
    return `🔍 *Internet එකෙන් හම්බුනා:*\n\n${searchData.substring(0, 1500)}\n\n---\n💡 HANSAKA MD AI - Powered by HANSAKA`
  }

  // 6. දන්නේ නැත්තම්
  return `හ්ම්ම්... "${userMsg}" ගැන Internet එකේ හරියට Info එකක් හම්බුනේ නෑ මචං 😅\n\nවෙන විදියකට අහලා බලන්න, උදා: "What is Python?"\n\nනැත්තම් /help ගහන්න!`
}

// 🔥 /start - Alive
async function sendAlive(chatId, userName) {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' }))
  const time = now.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit', hour12: true })
  const date = now.toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })
  const caption = `⭐ Hey , ${userName}\n👋 welcome to HANSAKA MD 🦊\n┌ 「 STATUS PANEL 」\n│ 🕒 Time : ${time}\n│ 📅 Date : ${date}\n│ 🤖 Bot Name: HANSAKA MD\n│ 👑 Owner : HANSAKA\n│ 🧠 AI: HANSAKA OWN AI (No Groq)\n│ 📱 Platform: ANDROID\n└\n🫶 කොහොමද ඔයාලට HANSAKA MD BOT වෙත සාදරයෙන් පිළිගන්නවා... 🧡\n\nDEPLOYED BY HANSAKA`
  try {
    if (fs.existsSync('alive.jpg')) await bot.sendPhoto(chatId, 'alive.jpg', { caption: caption })
    else await bot.sendMessage(chatId, caption)
  } catch (e) { await bot.sendMessage(chatId, caption) }
}

bot.onText(/\/start/, (msg) => sendAlive(msg.chat.id, msg.from.first_name || 'User'))
bot.onText(/^\.alive/, (msg) => sendAlive(msg.chat.id, msg.from.first_name || 'User'))
bot.onText(/\/alive/, (msg) => sendAlive(msg.chat.id, msg.from.first_name || 'User'))

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, `🤖 HANSAKA MD - Own AI\n\n/start - Alive\n/alive - Status\n/help - මේක\n\nඕනම දෙයක් Type කරන්න, මම Internet එකෙන් හොයලා උත්තර දෙන්නම්!\n\nමේක Groq / Grok නෙවෙයි, HANSAKA ගේම AI එක! 🔥`)
})

bot.onText(/\/search (.+)/, async (msg, match) => {
  const q = match[1]
  bot.sendChatAction(msg.chat.id, 'typing')
  const reply = await myOwnAI(q, msg.from.first_name)
  bot.sendMessage(msg.chat.id, reply)
})

bot.on('message', async (msg) => {
  if (!msg.text || msg.text.startsWith('/') || msg.text.startsWith('.')) return
  bot.sendChatAction(msg.chat.id, 'typing')
  const reply = await myOwnAI(msg.text, msg.from.first_name || 'User')
  bot.sendMessage(msg.chat.id, reply)
})

bot.on('polling_error', (e) => console.log('Polling Error:', e.message))
