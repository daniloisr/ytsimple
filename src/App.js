import { useEffect, useState } from 'react';
import './App.css';
import sampleResponse from './sampleResponse.json';

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
  const [error, setError] = useState('')
  const [videos, setVideos] = useState([])

  useEffect(() => {
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
          <div key={i} class="Video">
            <img class="Video-img" src={video.snippet.thumbnails.medium.url} alt="" />
            {/* <div class="Video-desc">{video.snippet.title}</div> */}
          </div>)}
        {error && <div style={{ color: 'red' }}>{error}</div>}
      </div>
    </div>
  );
}

export default App;
