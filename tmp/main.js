// https://developers-dot-devsite-v2-prod.appspot.com/youtube/v3/docs/search/list
const config = {
  cacheTime: 12 * 60 * 60 * 1000, // 12 hours
  ytKey: 'AIzaSyCtlQ5JH_RlPQrAkZHPqz0PQVwYpI-MIvE',
  ytMaxResults: 50,
  channels: [
    ['UC3n0qf54OPWei0bVF4W60Gw', 'science-gadgets'],
    ['UCKHhA5hN2UohhFDfNXB_cvQ', 'manual-do-mundo'],
    ['UCn9Erjy00mpnWeLnRqhsA1g', 'ciencia-todo-dia']
  ]
}

const state = {
  set videos(videos) {
    Video.addAll(videos)
    Video.refreshPlayer()
  },

  set channels(channels) {
    channels.forEach(channel => Channel.add(channel))
  }
}

class Storage {
  // get a valor from storage
  // if cache is valid the value isn't calculated
  static async getSet(key, value) {
    if (this.isCacheExpired)
      localStorage.setItem(
        key,
        JSON.stringify(typeof value === "function" ? await value() : value)
      )

    return this.get(key)
  }

  static get(key) {
    return JSON.parse(localStorage.getItem(key))
  }

  static get isCacheExpired() {
    delete this.isCacheExpired // memoized getter https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get

    // check if "_refresh" param is present
    if (new URLSearchParams(window.location.search).get('_refresh'))
      return this.isCacheExpired = true

    // if cache was set half day ago
    if (new Date(localStorage.getItem('cache-date')) < new Date() - config.cacheTime)
      return this.isCacheExpired = true

    return this.isCacheExpired = false
  }
}

class Video {
  static get container() { delete this.container; return this.container = document.querySelector('.videos') }

  static addAll(videos) {
    this.container.innerHTML = ''
    videos.forEach(v => this.add(v))
  }

  static add(video) {
    if (!video.id.videoId) return
    const embedEl = `<div class="video">
      <div class="embeded-video" data-plyr-provider="youtube" data-plyr-embed-id="${video.id.videoId}">
        <img src="${video.snippet.thumbnails.medium.url}">
      </div>
    </div>`
    this.container.innerHTML += embedEl
  }

  static get state() {
    if (!this._state) this._state = { player: undefined, el: undefined }
    return this._state
  }

  static videoClickHandler(el) {
    return () => {
      if (this.state.el == el) return

      if (this.state.player) {
        this.state.player.destroy()
        this.state.player = undefined
      }

      el.setAttribute('test', 'test')
      this.state.el = el
      this.state.player = new Plyr(el.querySelector('.embeded-video'), {
        youtube: { noCookie: false, rel: 0, showinfo: 0, iv_load_policy: 3, modestbranding: 1 }
      })

      // this.state.player.on('statechange', event => {
      //   if (event.detail.code == 0) { // endeded
      //     el.textContent = 'end'
      //   }
      // })
    }
  }

  static refreshPlayer() {
    document.querySelectorAll('.video').forEach(el => {
      el.addEventListener('click', this.videoClickHandler(el))
    })
  }
}

class Channel {
  static add(channel) {
    const embedEl = `<div class="channel" onclick="videosForChannel('${channel.id}')">
      <img src="${channel.snippet.thumbnails.default.url}">
    </div>`
    document.querySelector('.channels').innerHTML += embedEl
  }
}

class Youtube {
  static async request(path, args) {
    const url = new URL('https://www.googleapis.com/youtube/v3' + path)
    url.search = new URLSearchParams({
      // safe key for my github page :)
      key: config.ytKey,
      part: 'snippet',
      maxResults: config.ytMaxResults,
      ...args
    }).toString()

    return fetch(url).then(res => res.json())
  }

  static channelVideos(channelId) {
    return this.request('/search', { channelId, order: 'date' })
  }

  static channel(id) {
    return this.request('/channels', { id })
  }
}

window.main = async function main() {
  const data = await Promise.all(config.channels.map(async ([id, _channelName]) => {
    return Storage.getSet(
      id,
      () => {
        return Promise.all([
          Youtube.channel(id).then(res => res.items[0]),
          Youtube.channelVideos(id).then(res => res.items)
        ])
      })
  }))
  const { channels, videos } = data.reduce((acc, [channel, videos]) => {
    return {
      channels: acc.channels.concat(channel),
      videos: acc.videos.concat(videos)
    }
  },
  { channels: [], videos: [] })

  state.channels = channels
  state.videos = videos
}

window.videosForChannel = function videosForChannel(id) {
  const [_channel, videos] = Storage.get(id)
  state.videos = videos
}
