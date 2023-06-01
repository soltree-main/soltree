import type { ReactElement } from 'react'

export default function SpotifyPlaylist(): ReactElement {
	return (
		<iframe
			title='Playlist'
			sandbox='allow-scripts'
			src='https://open.spotify.com/embed/playlist/7gFXppXRHRscIwKm13urvt?utm_source=generator'
			frameBorder='0'
			allowFullScreen={false}
			className='h-44 w-full'
		/>
	)
}
