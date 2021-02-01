const cacheVersion = '1'
const cacheKey = 'ytsimple-channels'
const cache = JSON.parse(localStorage.getItem(cacheKey) || '{}')
export const cacheAdd = entry => setCache(Object.assign(cache, entry, { version: cacheVersion }))
const setCache = cache => localStorage.setItem(cacheKey, JSON.stringify(cache))
// if (cache.version != cacheVersion) setCache(cache = {})

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
  ['UCcXhhVwCT6_WqjkEniejRJQ', 'wintergatan'],
  ['UC-adUJnjdrRnRlOJGoDtTqw', 'show-da-luna'],
  ['UCA6Roeo-qFVk3jvjAdag7Uw', 'cocorico'],
  ['UCtEy9dWyDez3P19XPMEpcaA', 'kukis-trains'],
  ['UCQptNV_pmHU5UNOeX0duOkg', '04clemea'],
  ['UCOJe7abm8byWMR3JUeWk8BQ', 'bidone'],
  ['UCGqm0MpKDERl09nj3YNSEsQ', 'multinaatje'],
  ['UCILHCWW-qkRdwPI7-vOsH_A', 'SouthWestSteam'],
  ['UCUKaCiHSONDkQeUYSg0heMA', 'global-school'],
  ['UClsFdM0HzTdF1JYoraQ0aUw', 'brick-experiment'],
  ['UC3n0qf54OPWei0bVF4W60Gw', 'science-gadgets'],
  ['UCfBeGUOYM23ZQnepxtRqDYw', 'invenções-historicas'],
  ['UCn9Erjy00mpnWeLnRqhsA1g', 'ciencia-todo-dia'],
  ['UCHlP-un62ExatfZlxtXR9tA', 'sprice-machines'],
  ['UCbNvfx3rYYxEopnRGxfu53Q', 'josephs machines'],
  ['UCdSenyHIY-kzhdz21CpBISA', 'blue-marble'],
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

export function getChannelVideos(id, before = undefined) {
  return request('/search', {
    channelId: id,
    order: 'date',
    type: 'video',
    maxResults: 50,
    ...(before ? { publishedBefore: before } : {})
  })
}
