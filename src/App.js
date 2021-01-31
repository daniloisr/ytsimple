import React from 'react'
import * as yt from './Youtube'
import Video from './Video'
import './App.css'

function App() {
  const [activeVideo, setActiveVideo] = React.useState({ video: undefined, player: undefined })
  const [error, setError] = React.useState('')
  const [channel, setChannel] = React.useState()
  const [channels, setChannels] = React.useState([])

  function stopPlayer() { if (activeVideo.player) activeVideo.player.destroy() }

  function playVideo(video, player) {
    stopPlayer()
    setActiveVideo({ video, player })
  }

  function selectChannel(channel) {
    stopPlayer()
    setChannel(channel)
  }

  async function loadMore() {
    const { id, videos } = channel

    const res = await yt.getChannelVideos(id, videos[videos.length - 1].snippet.publishedAt)
    channel.videos = videos.concat(res.items.slice(1))
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
      <div className="Container">
        {channels.map(channel =>
          <div className="Video" key={channel.id} onClick={() => selectChannel(channel)}>
            <img className="Video-img" src={channel.snippet.thumbnails.medium.url} alt="" />
            <div className="Video-desc">{channel.snippet.title}</div>
          </div>
        )}

        <div class="full-row separator"></div>

        {error && <div style={{ color: 'red' }}>{error}</div>}

        {channel && channel.videos.map(video =>
          <Video
            key={video.id.videoId}
            video={video}
            isActive={video === activeVideo.video}
            playVideo={playVideo} />
          )}

        <button onClick={loadMore}>Load more</button>
      </div>
    </div>
  )
}

export default App
