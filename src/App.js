import React from 'react'
import Plyr from 'plyr'
import * as yt from './Youtube'
import './App.css'
import 'plyr/dist/plyr.css'

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
        const channels = await yt.fetchChannels()
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
