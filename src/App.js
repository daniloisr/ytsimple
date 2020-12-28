import React from 'react'
import Plyr from 'plyr'
import './App.css'
import 'plyr/dist/plyr.css'

// cache
// channel_id, date => cached items

const config = {
  cacheTime: 12 * 60 * 60 * 1000, // 12 hours
  ytKey: process.env.REACT_APP_YT_KEY,
  ytMaxResults: 50,
  channels: [
    ['UC3n0qf54OPWei0bVF4W60Gw', 'science-gadgets'],
    ['UCKHhA5hN2UohhFDfNXB_cvQ', 'manual-do-mundo'],
    ['UCn9Erjy00mpnWeLnRqhsA1g', 'ciencia-todo-dia']
  ]
}

class Youtube {
  static async request(path, args) {
    const url = new URL('https://www.googleapis.com/youtube/v3' + path)
    url.search = new URLSearchParams({
      key: config.ytKey,
      part: 'snippet',
      maxResults: config.ytMaxResults,
      ...args
    }).toString()

    return fetch(url).then(res => res.json())
  }

  static channel(id) { return this.request('/channels', { id }) }
  static channelVideos(channelId) { return this.request('/search', { channelId, order: 'date', type: 'video' }) }
}

async function fetchYoutube() {
  const promises = config.channels.map(async ([id, _channelName]) =>
    Promise.all([
      Youtube.channel(id).then(res => res.items[0]),
      Youtube.channelVideos(id)
        .then(res => { if (res.error) { throw res.error.message } else return res.items })
    ])
  )

  return (await Promise.all(promises))
    .reduce((acc, [channel, videos]) => [...acc, { ...channel, videos: videos }], [])
}

function App() {
  const [activeVideo, setActiveVideo] = React.useState({ video: undefined, player: undefined })
  const [error, setError] = React.useState('')
  const [channel, setChannel] = React.useState()
  const [channels, setChannels] = React.useState([])

  function stopPlayer() {
    if (activeVideo.player) activeVideo.player.destroy()
  }

  function playVideo(video, player) {
    stopPlayer()
    setActiveVideo({ video, player })
  }

  function selectChannel(channel) {
    stopPlayer()
    setChannel(channel)
  }

  React.useEffect(() => {
    async function boot() {
      try {
        const channels = await fetchYoutube()
        if (channels.length) setChannel(channels[0])
        setChannels(channels)
      } catch (exception) {
        setError(exception)
      }
    }

    boot()
  }, [])

  return (
    <div className="App">
      <div>
        <ul>
          {channels.map(channel =>
            <li key={channel.id} onClick={() => selectChannel(channel)}>{channel.snippet.title}</li>
          )}
        </ul>
      </div>
      <div className="Container">
        {channel && channel.videos.map(video =>
          <Video
            key={video.id.videoId}
            video={video}
            isActive={video === activeVideo.video}
            playVideo={playVideo} />
          )}
        {error && <div style={{ color: 'red' }}>{error}</div>}
      </div>
    </div>
  )
}

function Video({ video, isActive, playVideo }) {
  const videoEl = React.useRef(null)

  function initPlayer(e) {
    if (isActive) return
    e.preventDefault()

    const player = new Plyr(videoEl.current.firstChild, {
      youtube: { noCookie: false, rel: 0, showinfo: 0, iv_load_policy: 3, modestbranding: 1 }
    })

    playVideo(video, player)
  }

  return (
    <div
      ref={videoEl}
      className={["Video-container", isActive ? 'Video-container-active' : undefined].filter(i => i).join(' ')}
      onClick={initPlayer}>
      <div className="Video" data-plyr-provider="youtube" data-plyr-embed-id={video.id.videoId}>
        <img className="Video-img" src={video.snippet.thumbnails.medium.url} alt="" />
        <div className="Video-desc">{video.snippet.title}</div>
      </div>
    </div>
  )
}

export default App
