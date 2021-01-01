const cacheKey = 'ytsimple-channels'
const cache = JSON.parse(localStorage.getItem(cacheKey) || '{}')
function cacheAdd(entry) {
  localStorage.setItem(cacheKey, JSON.stringify(Object.assign(cache, entry)))
}

async function request(path, args) {
  const url = new URL('https://www.googleapis.com/youtube/v3' + path)
  url.search = new URLSearchParams({
    key: process.env.REACT_APP_YT_KEY,
    part: 'snippet',
    ...args
  }).toString()

  return fetch(url).then(res => res.json())
}

const enabledChannels = [
  ['UCKHhA5hN2UohhFDfNXB_cvQ', 'manual-do-mundo'],
  ['UCn9Erjy00mpnWeLnRqhsA1g', 'ciencia-todo-dia'],
  ['UCcXhhVwCT6_WqjkEniejRJQ', 'wintergatan'],
  ['UC-adUJnjdrRnRlOJGoDtTqw', 'show-da-luna'],
  ['UC-adUJnjdrRnRlOJGoDtTqw', 'kukis-trains'],
  ['UC3n0qf54OPWei0bVF4W60Gw', 'science-gadgets'],
]

export function fetchChannels() {
  const promises = enabledChannels.map(([id, _channelName]) => fetchChannelAndVideos(id))
  return Promise.all(promises)
}

async function fetchChannelAndVideos(id) {
  let cached = cache[id]
  if (cached) return Promise.resolve(cached)

  const [channel, videos] = await Promise.all([
    getChannel(id)
      .then(res => { if (res.error) { throw res.error.message } else return res.items[0] }),
    getChannelVideos(id)
      .then(res => { if (res.error) { throw res.error.message } else return res.items })
  ])

  channel.videos = videos
  cacheAdd({ [id]: channel })

  return channel
}

export function getChannel(id) {
  return request('/channels', { id })
}

export function getChannelVideos(id) {
  return request('/search', { channelId: id, order: 'date', type: 'video', maxResults: 50 })
}