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
  const [loading, setLoading] = React.useState(false)

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
    if (loading) return
    setLoading(true)

    const res = await yt.getChannelVideos(channel.id, videos[videos.length - 1].snippet.publishedAt)
    if (res.error) {
      setError(res.error.message)
      setLoading(false)
      return
    }

    channel.videos = videos.concat(res.items.slice(1))
    setVideos(channel.videos)
    yt.cacheAdd({ [channel.id]: channel })
    setLoading(false)
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

        <div className="full-row separator"></div>

        {videos.map(video =>
          <Video
          key={video.id.videoId}
          video={video}
          isActive={video === activeVideo.video}
          playVideo={playVideo} />
          )}
      </div>

      <div style={ { textAlign: 'center' } }>
        {error && <p><div style={{ color: 'red' }} dangerouslySetInnerHTML={ { __html: error } }></div></p>}

        <button onClick={loadMore} className="load-more">{ loading ? 'Loading...' : 'Load more' }</button>
      </div>
    </div>
  )
}

export default App
