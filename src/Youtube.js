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

export async function fetchChannels() {
  const channels = await fetch(process.env.REACT_APP_CHANNELS_FILE).then(res => res.json())
  const promises = channels.map(([id, _channelName]) => fetchChannelAndVideos(id))
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

export function getChannelVideos(id, { before = undefined, after = undefined } = {}) {
  return request('/search', {
    channelId: id,
    order: 'date',
    type: 'video',
    maxResults: 50,
    ...(before ? { publishedBefore: before } : {}),
    ...(after ? { publishedAfter: after } : {}),
  })
}
