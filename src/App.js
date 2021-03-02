import React from 'react'
import * as yt from './Youtube'
import Video from './Video'
import './App.css'

const loadMoreCache = JSON.parse(localStorage.getItem('loadMoreCache') || '{}')
const lastLoadCache = JSON.parse(localStorage.getItem('lastLoadCache') || '{}')

function App() {
  const [activeVideo, setActiveVideo] = React.useState({ video: undefined, player: undefined })
  const [error, setError] = React.useState('')
  const [channel, setChannel] = React.useState()
  const [videos, setVideos] = React.useState([])
  const [channels, setChannels] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [canLoadMore, setCanLoadMore] = React.useState(false)
  const updateLoadMore = channel => setCanLoadMore(!(loadMoreCache[channel.id] === false) && channel.videos.length >= 50)

  function stopPlayer() { if (activeVideo.player) activeVideo.player.destroy() }

  function playVideo(video, player) {
    stopPlayer()
    setActiveVideo({ video, player })
  }

  async function selectChannel(channel) {
    if (Date.now() - lastLoadCache[channel.id] > 24 * 60 * 60 * 1000) {
      const res = await yt.getChannelVideos(channel.id, { after: channel.videos[0].snippet.publishedAt })
      if (res.error) {
        setError(res.error.message)
        return
      }

      lastLoadCache[channel.id] = Date.now()
      localStorage.setItem('lastLoadCache', JSON.stringify(lastLoadCache))

      if (res.items.length > 1) {
        // ignores the last result, because it's the video used on
        // { after: channel.videos[0].snippet.publishedAt })
        channel.videos.splice(0, 0, res.items.slice(0, -1))
        yt.cacheAdd({ [channel.id]: channel })
      }
    }

    stopPlayer()
    setChannel(channel)
    setVideos(channel.videos)
    updateLoadMore(channel)
  }

  async function loadMore() {
    if (loading) return
    setLoading(true)

    const res = await yt.getChannelVideos(channel.id, { before: videos[videos.length - 1].snippet.publishedAt })
    setLoading(false)
    if (res.error) {
      setError(res.error.message)
      return
    }

    if (res.items.length < 50) {
      setCanLoadMore(false)
      loadMoreCache[channel.id] = false;
      localStorage.setItem('loadMoreCache', JSON.stringify(loadMoreCache))
      return
    }

    channel.videos = videos.concat(res.items.slice(1))
    setVideos(channel.videos)
    yt.cacheAdd({ [channel.id]: channel })
  }

  React.useEffect(() => {
    async function boot() {
      try {
        const channels = await yt.fetchChannels()
        // if (channels.length) {
        //   // TODO: fix duplication with `selectChannel` function
        //   // getting a react error: "include it or remove the dependency array"
        //   const channel = channels[0]
        //   setChannel(channel)
        //   setVideos(channel.videos)
        //   updateLoadMore(channel)
        // }
        setChannels(channels)
        // update "lastLoadCache" to track the last time the channel was fetched
        channels.forEach(channel => {
          if (lastLoadCache[channel.id] === undefined) {
            lastLoadCache[channel.id] = Date.now()
            localStorage.setItem('lastLoadCache', JSON.stringify(lastLoadCache))
          }
        })
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
        {error && <p style={{ color: 'red' }} dangerouslySetInnerHTML={ { __html: error } }></p>}

        {canLoadMore && <button onClick={loadMore} className="load-more">{ loading ? 'Loading...' : 'Load more' }</button>}
      </div>
    </div>
  )
}

export default App
