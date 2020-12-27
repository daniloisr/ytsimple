import React from 'react'
import Plyr from 'plyr'
import './App.css'
import 'plyr/dist/plyr.css'
import sampleResponse from './sampleResponse.json'

// cache
// channel_id, date => cached items

const config = {
  cacheTime: 12 * 60 * 60 * 1000, // 12 hours
  ytKey: process.env.REACT_APP_YT_KEY,
  ytMaxResults: 50,
  channels: [
    ['UC3n0qf54OPWei0bVF4W60Gw', 'science-gadgets'],
    // ['UCKHhA5hN2UohhFDfNXB_cvQ', 'manual-do-mundo'],
    // ['UCn9Erjy00mpnWeLnRqhsA1g', 'ciencia-todo-dia']
  ]
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
    return Promise.resolve(sampleResponse)
    // return this.request('/search', { channelId, order: 'date' })
  }

  static channel(id) {
    return this.request('/channels', { id })
  }
}

function App() {
  const [activeVideo, setActiveVideo] = React.useState({ video: undefined, player: undefined })
  const [error, setError] = React.useState('')
  const [videos, setVideos] = React.useState([])

  function playVideo(video, player) {
    if (activeVideo.player) activeVideo.player.destroy()
    setActiveVideo({ video, player })
  }

  React.useEffect(() => {
    async function boot() {
      try {
        const data = await Promise.all(config.channels.map(async ([id, _channelName]) => {
          return Promise.all([
            // Youtube.channel(id).then(res => res.items[0]),
            Promise.resolve([]),
            Youtube.channelVideos(id).then(res => {
              if (res.error) throw res.error.message
              return res.items
            })
          ])
        }))

        // const { _channels, videos } = data.reduce((acc, [channel, videos]) => {
        const { videos } = data.reduce((acc, [_, videos]) => {
          return {
            // channels: acc.channels.concat(channel),
            videos: acc.videos.concat(videos)
          }
        },
          { channels: [], videos: [] })

        setVideos(videos)
      } catch (exception) {
        setError(exception)
      }
    }
    boot()
  }, [])

  return (
    <div className="App">
      <div className="Container">
        {videos.map((video, i) =>
          <Video
            key={i}
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
