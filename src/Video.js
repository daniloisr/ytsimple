import React from 'react'
import Plyr from 'plyr'
import 'plyr/dist/plyr.css'

export default function Video({ video, isActive, playVideo }) {
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
      className={["Video-container", isActive ? 'video-active' : undefined].filter(i => i).join(' ')}
      onClick={initPlayer}>
      <div className="Video" data-plyr-provider="youtube" data-plyr-embed-id={video.id.videoId}>
        <img className="Video-img" src={video.snippet.thumbnails.medium.url} alt="" />
        <div className="Video-desc">{video.snippet.title}</div>
      </div>
    </div>
  )
}