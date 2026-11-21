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
    console.log('❌ Groq Fail:', (e.response?.data?.error?.message |සම්පූර්ණ final `index.js` එක — quality menu (HD/SD/WM/MP3), retry + fallback, resolution probe සියල්ල එකට:

```js
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

// ================== 🔍 INTERNET SEARCH ==================
async function searchInternet(query) {
  try {
    const res = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`, { timeout: 3000 }).catch(() => null)
    return res?.data?.AbstractText || res?.data?.RelatedTopics?.[0]?.Text || null
  } catch (e) { return null }
}

// ================== ⚡ GROQ (Main AI) ==================
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

// ================== 🧠 GEMINI (Backup) ==================
async function askGemini(userMsg, searchData) {
  if (!GEMINI_KEY) return null
  const models = ['gemini-3.8-flash', 'gemini-4-hydrogen', 'gemini-3.7-flash']
  for (let m of models) {
    try {
      const res = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${GEMINI_KEY}`, {
        contents: [{ parts: [{ text: `ඔයා HANSAKA MD, HANSAKA ගේ යාළුවා. සිංහල+English මිශ්‍රව, fun විදියට, කෙටියෙන් උත්තර දෙන්න.\nUser: ${userMsg}` + (searchData ? `\nSearch: ${searchData}` : '') }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
      }, { headers: { 'Content-Type': 'application/json' }, timeout: 30000 })
      console.log(`✅ Working: Gemini ${m}`)
      return res.data.candidates[0].content.parts[0].text
    } catch (e) {
      console.log(`❌ Gemini ${m} Fail:`, (e.response?.data?.error?.message || e.message).slice(0, 90))
      continue
    }
  }
  return null
}

// ================== 🌐 POLLINATIONS (Last Resort) ==================
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

// ================== 🧠 MAIN AI ==================
async function askAI(userMsg) {
  const needInternet = /මිල|price|latest|news|කීයද|weather|score|result/i.test(userMsg)
  let searchData = null
  if (needInternet) searchData = await searchInternet(userMsg)

  let reply = await askGroq(userMsg, searchData)
  if (reply) return reply

  reply = await askGemini(userMsg, searchData)
  if (reply) return reply

  reply = await askPollinations(userMsg)
  if (reply) return reply

  if (searchData) return `Internet එකෙන් හොයාගත්තේ මචං 👇\n\n${searchData}`
  return 'අඩෝ ටිකක් Busy මචං 😅 විනාඩි 1කින් ආයෙත් දාන්න!'
}

// ================== 🔥 ALIVE ==================
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
│  │  🎵 TikTok   : ONLINE 🟢
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
  bot.sendMessage(msg.chat.id, `🤖 *HANSAKA MD - Commands*\n\n/start - Alive\n/alive - Status\n/help - මේක\n\n🎵 *.tt <tiktok link>* - Video quality select කරලා download\n🎧 *.tta <tiktok link>* - MP3 only\n\nTikTok link එකක් command නැතුව එව්වත් quality menu එක එනවා!\n\nඕනම දෙයක් අහන්න! 🔥`, { parse_mode: 'Markdown' })
})

// ================== 🎵 TIKTOK DOWNLOADER ==================
const TIKWM_API = 'https://tikwm.com/api/'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const TIKTOK_URL_RE = /(https?:\/\/)?(?:www\.|vm\.|vt\.|m\.)?tiktok\.com\/[^\s]+/i
const TG_LIMIT = 49 * 1024 * 1024 // Telegram Bot API upload limit ~50MB

// tikwm free tier ~1 req/sec — simple queue
let ttQueue = Promise.resolve()
const queueTask = (fn) => {
  const p = ttQueue.then(fn, fn)
  ttQueue = p.catch(() => {})
  return p
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

function fixUrl(u) {
  if (!u) return null
  if (u.startsWith('//')) return 'https:' + u
  if (u.startsWith('/')) return 'https://www.tikwm.com' + u
  return u
}

function extractTikTokUrl(text = '') {
  const m = text.match(TIKTOK_URL_RE)
  if (!m) return null
  let url = m[0].replace(/[),.]+$/, '')
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url
  return url
}

// 🔄 Retry + Fallback fetch (GitHub Actions datacenter IPs වලට tikwm slow/block වෙන නිසා)
async function tikwmOnce(baseUrl, tiktokUrl, params) {
  const { data } = await axios.get(baseUrl, {
    params: { url: tiktokUrl, ...params },
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    timeout: 60000
  })
  if (!data || data.code !== 0 || !data.data) {
    throw new Error(data?.msg || 'Video එක හොයාගන්න බැරි වුනා')
  }
  return data.data
}

async function tikwmFetch(tiktokUrl) {
  const attempts = [
    { base: 'https://tikwm.com/api/', params: { hd: 1 } },
    { base: 'https://www.tikwm.com/api/', params: { hd: 1 } },
    { base: 'https://tikwm.com/api/', params: {} }
  ]
  let lastErr
  for (let i = 0; i < 3; i++) {
    for (const a of attempts) {
      try {
        return await tikwmOnce(a.base, tiktokUrl, a.params)
      } catch (e) {
        const msg = e.message || ''
        if (!/timeout|network|ECONN|403|429|5\d\d/i.test(msg)) throw e
        lastErr = e
        console.log(`🔁 TikWM retry (${a.base}):`, msg.slice(0, 80))
      }
    }
    await sleep(3000 * (i + 1))
  }
  throw lastErr || new Error('TikTok API එකට connect වෙන්න බැරි වුනා')
}

async function toBuffer(url, maxMB = TG_LIMIT / 1024 / 1024) {
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 180000,
    maxContentLength: maxMB * 1024 * 1024,
    headers: { 'User-Agent': UA, Referer: 'https://www.tiktok.com/' }
  })
  return Buffer.from(res.data)
}

// 🔍 Actual resolution read (mp4 avc1/hvc1 box eken)
async function probeResolution(url) {
  try {
    const res = await axios.get(url, {
      responseType: 'stream',
      headers: { 'User-Agent': UA, Referer: 'https://www.tiktok.com/', Range: 'bytes=0-65535' },
      timeout: 15000
    })
    return await new Promise((resolve) => {
      let buf = Buffer.alloc(0)
      res.data.on('data', (c) => {
        buf = Buffer.concat([buf, c])
        const idx = buf.indexOf(Buffer.from('avc1')) !== -1 ? buf.indexOf(Buffer.from('avc1')) : buf.indexOf(Buffer.from('hvc1'))
        if (idx !== -1 && buf.length >= idx + 28) {
          const w = buf.readUInt16BE(idx + 24)
          const h = buf.readUInt16BE(idx + 26)
          res.data.destroy()
          resolve({ w, h })
        }
      })
      res.data.on('end', () => resolve(null))
      res.data.on('error', () => resolve(null))
      setTimeout(() => { res.data.destroy(); resolve(null) }, 8000)
    })
  } catch { return null }
}

function labelForRes(w, h) {
  if (!w || !h) return null
  const short = Math.min(w, h)
  if (short >= 2000) return '4K'
  if (short >= 1300) return '2K'
  if (short >= 1000) return '1080p'
  if (short >= 680) return '720p'
  if (short >= 400) return '480p'
  return 'SD'
}

// 🎯 Quality menu - inline keyboard
const PENDING = new Map()

async function sendQualityMenu(chatId, tiktokUrl) {
  const status = await bot.sendMessage(chatId, '⏳ TikTok info ගේනවා මචං...')
  try {
    const d = await tikwmFetch(tiktokUrl)
    const author = d.author?.unique_id || d.author?.nickname || 'unknown'
    const title = (d.title || 'TikTok Video').replace(/\s+/g, ' ').trim() || 'TikTok Video'
    const hd = fixUrl(d.hdplay), sd = fixUrl(d.play), wm = fixUrl(d.wmplay)
    if (!hd && !sd && !wm) throw new Error('Download links හමුවුනේ නෑ')

    const rows = []
    if (hd) {
      const hdLabel = (d.hd_size || 0) > 50 * 1024 * 1024 ? `🟣 HD Max ⚠️>50MB` : '🟣 HD Max (4K/2K/1080p)'
      rows.push([{ text: hdLabel, callback_data: `ttq|hd|${chatId}` }])
    }
    if (sd) rows.push([{ text: `🔵 720p SD${d.size >= 50 * 1024 * 1024 ? ' ⚠️>50MB' : ''}`, callback_data: `ttq|sd|${chatId}` }])
    if (wm) rows.push([{ text: '💧 Watermark', callback_data: `ttq|wm|${chatId}` }])
    rows.push([{ text: '🎧 MP3 Audio', callback_data: `ttq|audio|${chatId}` }])

    const caption = `🎵 ${title.slice(0, 150)}\n👤 @${author}${d.duration ? `\n⏱ ${d.duration}s` : ''}\n\n📊 Quality select කරන්න:\n(TikTok upload එක 4K/2K නම් HD Max = ඒ quality, නැත්නම් 1080p/720p)`
    await bot.editMessageText(caption, {
      chat_id: chatId, message_id: status.message_id,
      reply_markup: { inline_keyboard: rows }
    })
    PENDING.set(chatId, { d, ts: Date.now() })
    for (const [k, v] of PENDING) if (Date.now() - v.ts > 5 * 60 * 1000) PENDING.delete(k)
  } catch (e) {
    await bot.editMessageText(`❌ Fail: ${e.message.slice(0, 150)}`, { chat_id: chatId, message_id: status.message_id }).catch(() => {})
  }
}

bot.on('callback_query', async (q) => {
  const chatId = q.message?.chat?.id
  if (!chatId) return
  const [tag, kind] = (q.data || '').split('|')
  if (tag !== 'ttq') return
  await bot.answerCallbackQuery(q.id).catch(() => {})

  if (kind === 'audio') {
    const cache = PENDING.get(chatId)
    if (!cache) return bot.sendMessage(chatId, '⏰ Expired! ආයෙ link එක එවන්න.')
    const audioUrl = fixUrl(cache.d.music_info?.play || cache.d.music)
    if (!audioUrl) return bot.sendMessage(chatId, '❌ Music track එකක් නෑ')
    await bot.sendMessage(chatId, '🎧 MP3 ගේනවා...').catch(() => {})
    try {
      await bot.sendAudio(chatId, audioUrl, { caption: `🎵 ${cache.d.title || 'TikTok Audio'}\n👤 @${cache.d.author?.unique_id || 'unknown'}`.slice(0, 1000) })
    } catch {
      const buf = await toBuffer(audioUrl, 45)
      await bot.sendAudio(chatId, buf, { filename: 'tiktok.mp3', title: (cache.d.title || 'TikTok').slice(0, 60), performer: cache.d.author?.unique_id })
    }
    return
  }

  const cache = PENDING.get(chatId)
  if (!cache) return bot.sendMessage(chatId, '⏰ Expired! ආයෙ link එක එවන්න.')
  const d = cache.d
  PENDING.delete(chatId)

  const wantUrl = kind === 'hd' ? fixUrl(d.hdplay) : kind === 'sd' ? fixUrl(d.play) : fixUrl(d.wmplay)
  const fallbackUrl = kind === 'hd' ? (fixUrl(d.play) || fixUrl(d.hdplay)) : kind === 'sd' ? (fixUrl(d.hdplay) || fixUrl(d.play)) : fixUrl(d.wmplay)
  if (!wantUrl) return bot.sendMessage(chatId, '❌ මේ quality එක මේ video එකට නෑ')

  const status = await bot.sendMessage(chatId, '🎬 Video ගේනවා...')
  try {
    let resLabel = ''
    const r = await probeResolution(wantUrl)
    if (r) resLabel = `\n📐 Resolution: ${r.w}x${r.h} (${labelForRes(r.w, r.h)})`
    const opts = { caption: `🎵 ${(d.title || 'TikTok Video').slice(0, 200)}\n👤 @${d.author?.unique_id || 'unknown'}${resLabel}`, supports_streaming: true }

    let sent = false
    if ((kind === 'hd' ? (d.hd_size || 0) : (d.size || 0)) <= 49 * 1024 * 1024) {
      try {
        await bot.sendVideo(chatId, wantUrl, opts)
        sent = true
      } catch (e1) { console.log('TT direct fail:', e1.message) }
    }
    if (!sent) {
      const buf = await toBuffer(wantUrl, 49).catch(async () => await toBuffer(fallbackUrl, 49))
      await bot.sendVideo(chatId, buf, { ...opts, filename: 'tiktok.mp4', contentType: 'video/mp4' })
    }
    await bot.deleteMessage(chatId, status.message_id).catch(() => {})
  } catch (e) {
    console.log('❌ TT download fail:', e.message.slice(0, 120))
    await bot.editMessageText(`❌ Download fail: ${e.message.slice(0, 150)}`, { chat_id: chatId, message_id: status.message_id }).catch(() => {})
  }
})

async function tiktokHandle(chatId, tiktokUrl, wantAudio = false) {
  if (wantAudio) {
    const status = await bot.sendMessage(chatId, '⏳ TikTok info ගේනවා...')
    try {
      const d = await tikwmFetch(tiktokUrl)
      const audioUrl = fixUrl(d.music_info?.play || d.music)
      if (!audioUrl) throw new Error('Music track එකක් නෑ')
      await bot.editMessageText('🎧 MP3 ගේනවා...', { chat_id: chatId, message_id: status.message_id }).catch(() => {})
      try {
        await bot.sendAudio(chatId, audioUrl, { caption: `🎵 ${(d.title || 'TikTok Audio').slice(0, 200)}\n👤 @${d.author?.unique_id || 'unknown'}`.slice(0, 1000) })
      } catch {
        const buf = await toBuffer(audioUrl, 45)
        await bot.sendAudio(chatId, buf, { filename: 'tiktok.mp3', title: (d.title || 'TikTok').slice(0, 60), performer: d.author?.unique_id })
      }
      await bot.deleteMessage(chatId, status.message_id).catch(() => {})
    } catch (e) {
      await bot.editMessageText(`❌ Fail: ${e.message.slice(0, 150)}`, { chat_id: chatId, message_id: status.message_id }).catch(() => {})
    }
  } else {
    await sendQualityMenu(chatId, tiktokUrl)
  }
}

// 🎵 TikTok commands
bot.onText(/^[./](tt|tiktok|td|tta|ttmp3|tiktokmp3)(?:@\w+)?\s*(.*)$/i, (msg, match) => {
  const cmd = (match[1] || '').toLowerCase()
  const wantAudio = /ta|mp3/.test(cmd)
  const url = extractTikTokUrl(match[2] || '')
  if (!url) {
    return bot.sendMessage(msg.chat.id, `📌 Usage:\n\`.tt <tiktok link>\` - Quality menu\n\`.tta <tiktok link>\` - MP3 only`)
  }
  queueTask(() => tiktokHandle(msg.chat.id, url, wantAudio))
})

bot.on('message', async (msg) => {
  if (!msg.text) return
  const autoTt = extractTikTokUrl(msg.text)
  if (autoTt && !/^[./]/.test(msg.text)) {
    return queueTask(() => tiktokHandle(msg.chat.id, autoTt, /mp3|audio/i.test(msg.text)))
  }
  if (msg.text.startsWith('/') || msg.text.startsWith('.')) return
  console.log(`Msg: ${msg.text}`)
  bot.sendChatAction(msg.chat.id, 'typing')
  const reply = await askAI(msg.text)
  bot.sendMessage(msg.chat.id, reply)
})

bot.on('polling_error', (e) => console.log('Polling Error:', e.message))
