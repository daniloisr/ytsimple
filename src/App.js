import React from 'react'
import * as yt from './Youtube'
import Video from './Video'
import './App.css'

function App() {
  const [activeVideo, setActiveVideo] = React.useState({ video: undefined, player: undefined })
  const [error, setError] = React.useState('')
  const [channel, setChannel] = React.useState()
  const [videos, setVideos] = React.useState([])
  const [channels, setChannels] = React.useState([])

  function stopPlayer() { if (activeVideo.player) activeVideo.player.destroy() }

  function playVideo(video, player) {
    stopPlayer()
    setActiveVideo({ video, player })
  }

  function selectChannel(channel) {
    stopPlayer()
    setChannel(channel)
    setVideos(channel.videos)
  }

  async function loadMore() {
    const res = await yt.getChannelVideos(channel.id, videos[videos.length - 1].snippet.publishedAt)
    setVideos(videos.concat(res.items.slice(1)))
  }

  React.useEffect(() => {
    async function boot() {
      try {
        const channels = await yt.fetchChannels()
        if (channels.length) {
          setChannel(channels[0])
          setVideos(channels[0].videos)
        }
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

        {videos.map(video =>
          <Video
            key={video.id.videoId}
            video={video}
            isActive={video === activeVideo.video}
            playVideo={playVideo} />
          )}
      </div>

      <button onClick={loadMore} className="load-more">Load more</button>
    </div>
  )
}

export default App
