// https://developers-dot-devsite-v2-prod.appspot.com/youtube/v3/docs/search/list
const config = {
  cacheTime: 12 * 60 * 60 * 1000, // 12 hours
  ytKey: 'AIzaSyCtlQ5JH_RlPQrAkZHPqz0PQVwYpI-MIvE',
  ytMaxResults: 50,
  channels: [
    ['UC3n0qf54OPWei0bVF4W60Gw', 'science-gadgets'],
    ['UCKHhA5hN2UohhFDfNXB_cvQ', 'manual-do-mundo'],
  ]
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

    JSON.parse(localStorage.get(key))
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
  static add(item) {
    if (!item.id.videoId) return
    const embedEl = `<div class="video">
      <div class="embeded-video" data-plyr-provider="youtube" data-plyr-embed-id="${item.id.videoId}">
        <img src="${item.snippet.thumbnails.medium.url}">
      </div>
    </div>`
    document.querySelector('#videos').innerHTML += embedEl
  }
}

class Youtube {
  static get url() { return new URL('https://www.googleapis.com/youtube/v3/search') }
  static channelVideos(channelName) {
    const url = this.url
    url.search = new URLSearchParams({
      // safe key for my github page :)
      key: config.ytKey,
      channelId,
      part: 'snippet',
      maxResults: config.ytMaxResults,
      order: 'date'
    }).toString()
    return await Storage.getSet(channelName, () => fetch(url).then(res => res.json()))
  }
}

window.main = async function main() {
  await Promise.all(config.channels.map(async ([channelId, channelName]) => {
    const res = Youtube.channelVideos(channelName)
    res.items.forEach(item => Video.add(item))
  }))

  let active = { player: undefined, el: undefined }

  const clickFn = el => {
    return () => {
      if (active.el == el) return

      if (active.player) {
        active.player.destroy()
        active.player = undefined
      }

      el.setAttribute('test', 'test')
      active.el = el
      active.player = new Plyr(el.querySelector('.embeded-video'), {
        youtube: { noCookie: false, rel: 0, showinfo: 0, iv_load_policy: 3, modestbranding: 1 }
      })

      // active.player.on('statechange', event => {
      //   if (event.detail.code == 0) { // endeded
      //     el.textContent = 'end'
      //   }
      // })
    }
  }

  document.querySelectorAll('.video').forEach(el => {
    el.addEventListener('click', clickFn(el))
  })
}
