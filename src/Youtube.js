class Channel {
  constructor(args) {
    Object.assign(this, args)
  }

  async videos() {
    await this.syncNewVideos()
    return JSON.parse(localStorage.getItem(`${this.id}.videos`))
  }

  async syncNewVideos() {
    const i = localStorage.getItem(`${this.id}.lastLoad`)
    const lastLoad = i ? parseInt(i) : undefined
    if (!lastLoad || (Date.now() - lastLoad) > 24 * 60 * 60 * 1000) {
      const res = await request('/search', {
        channelId: this.id,
        order: 'date',
        type: 'video',
        maxResults: 50,
        publishedAfter: new Date(lastLoad || 0).toISOString(),
      })

      if (res.error) throw res.error.message

      localStorage.setItem(`${this.id}.lastLoad`, Date.now())
      if (res.pageInfo.totalResults < 50) localStorage.setItem(`${this.id}.loadMore`, false)

      this.updateVideos(this.loadVideos().concat(res.items))
    }
  }

  async loadMore() {
    const lastVideo = this.loadVideos().slice(-1)[0]
    const res = await request('/search', {
      channelId: this.id,
      order: 'date',
      type: 'video',
      maxResults: 50,
      // use `- 1e4` to fetch videos older than 10s of the current last video
      publishedBefore: new Date(new Date(lastVideo.snippet.publishedAt).valueOf() - 1e4).toISOString(),
    })

    if (res.error) throw res.error.message

    if (res.pageInfo.totalResults < 50) localStorage.setItem(`${this.id}.loadMore`, false)
    this.updateVideos(this.loadVideos().concat(res.items))

    return this.loadVideos()
  }

  canLoadMore() {
    return localStorage.getItem(`${this.id}.loadMore`) !== 'false'
  }

  updateVideos(videos) {
    localStorage.setItem(`${this.id}.videos`, JSON.stringify(videos))
  }

  loadVideos() {
    return JSON.parse(localStorage.getItem(`${this.id}.videos`) || '[]')
  }
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

export async function fetchChannels() {
  const channels = await fetch(process.env.REACT_APP_CHANNELS_FILE).then(res => res.json())
  const promises = channels.map(([id, _channelName]) => fetchChannel(id))
  return Promise.all(promises)
}

async function fetchChannel(id) {
  let cached = localStorage.getItem(id)
  if (cached) return Promise.resolve(new Channel(JSON.parse(cached)))

  return request('/channels', { id }).then(res => {
    if (res.error) throw res.error.message

    const channel = res.items[0]
    localStorage.setItem(id, JSON.stringify(channel))
    return new Channel(channel)
  })
}
