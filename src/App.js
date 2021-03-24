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
  const [canLoadMore, setCanLoadMore] = React.useState(false)

  function stopPlayer() { if (activeVideo.player) activeVideo.player.destroy() }

  function playVideo(video, player) {
    stopPlayer()
    setActiveVideo({ video, player })
  }

  async function selectChannel(channel) {
    stopPlayer()
    setChannel(channel)
    setVideos(await channel.videos())
    setCanLoadMore(channel.canLoadMore())
  }

  async function loadMore() {
    if (loading) return
    setLoading(true)

    try {
      const videos = await channel.loadMore()
      setVideos(videos)
      setCanLoadMore(channel.canLoadMore())
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    yt.fetchChannels().then(setChannels).catch(setError)
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
        {error && <p style={{ color: 'red' }} dangerouslySetInnerHTML={ { __html: error } }></p>}

        {canLoadMore && <button onClick={loadMore} className="load-more">{ loading ? 'Loading...' : 'Load more' }</button>}
      </div>
    </div>
  )
}

export default App
