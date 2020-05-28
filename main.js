async function withCache(key, fn) {
  let res = localStorage.getItem(key)
  if (res)
    return JSON.parse(res)

  res = await fn()
  localStorage.setItem(key, JSON.stringify(res))
  return res
}

function addVideo(item) {
  const embedEl = `<div class="video">
    <div class="embeded-video" data-plyr-provider="youtube" data-plyr-embed-id="${item.id.videoId}"></div>
  </div>`
  document.querySelector('#videos').innerHTML += embedEl
}

window.main = async function main() {
  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.search = new URLSearchParams({
    // safe key for my github page :)
    key: 'AIzaSyCtlQ5JH_RlPQrAkZHPqz0PQVwYpI-MIvE',
    // channelId: 'UCKHhA5hN2UohhFDfNXB_cvQ', // manual do mundo
    channelId: 'UC3n0qf54OPWei0bVF4W60Gw', // science gadgets
    part: 'snippet',
    maxResults: 50
  }).toString()

  const res = await withCache('ytsimple-gadgets', () => fetch(url).then(res => res.json()))
  // const res = await withCache('ytsimple-manual-mundo', () => fetch(url).then(res => res.json()))

  res.items.forEach(item => addVideo(item))

  window.document.querySelectorAll('.embeded-video').forEach(el => {
    const player = new Plyr(el, {
      youtube: { noCookie: false, rel: 0, showinfo: 0, iv_load_policy: 3, modestbranding: 1 }
    })
    // player.on('statechange', event => {
    //   if (event.detail.code == 0) { // endeded
    //     el.textContent = 'end'
    //   }
    // })
  })
}
