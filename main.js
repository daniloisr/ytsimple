async function withCache(key, fn) {
  let cache = localStorage.getItem(key)
  if (cache)
    return JSON.parse(res)

  let res = await fn()
  localStorage.setItem(key, JSON.stringify(res))
  return res
}

function addVideo(item) {
  if (!item.id.videoId) return
  const embedEl = `<div class="video">
    <div class="embeded-video" data-plyr-provider="youtube" data-plyr-embed-id="${item.id.videoId}">
      <img src="${item.snippet.thumbnails.medium.url}">
    </div>
  </div>`
  document.querySelector('#videos').innerHTML += embedEl
}

const channels = [
  ['UC3n0qf54OPWei0bVF4W60Gw', 'science-gadgets'],
  ['UCKHhA5hN2UohhFDfNXB_cvQ', 'manual-do-mundo'],
]

function cleanLS() {
  const urlParams = new URLSearchParams(window.location.search)
  const refresh = urlParams.get('refresh')

  if (refresh !== undefined) localStorage.clear()
}

window.main = async function main() {
  cleanLS()

  await Promise.all(channels.map(async ([channelId, channelName]) => {
    const url = new URL('https://www.googleapis.com/youtube/v3/search')
    url.search = new URLSearchParams({
      // safe key for my github page :)
      key: 'AIzaSyCtlQ5JH_RlPQrAkZHPqz0PQVwYpI-MIvE',
      channelId,
      part: 'snippet',
      maxResults: 50,
      order: 'date'
    }).toString()

    const res = await withCache(channelName, () => fetch(url).then(res => res.json()))

    res.items.forEach(item => addVideo(item))
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
