import QuoteWheel from 'components/QuoteWheel'
import SpotifyPlaylist from 'components/SpotifyPlaylist'
import type { ReactElement } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo-wip3.svg'

export default function HomePage(): ReactElement {
	const [showPlaylist, setShowPlaylist] = useState(false)
	const navigate = useNavigate()
	const { t } = useTranslation()

	const onClick = (): void => {
		navigate('about/why')
	}

	const onToggleShowPlaylist = (): void => {
		setShowPlaylist(previousShowPlaylist => !previousShowPlaylist)
	}

	return (
		<div className='bg-gradient-radial from-violet-700 to-teal-300 text-center'>
			<header className='flex min-h-screen flex-col items-center justify-center'>
				<h1 className='text-5xl font-semibold text-primary-orange'>
					{t('home.title')}
				</h1>
				<img src={logo} className='h-80' alt='logo' />
				<h2 className='mb-8 text-4xl font-semibold text-primary-orange'>
					{t('home.subtitle')}
				</h2>
				<QuoteWheel />
				<button
					className='mt-8 w-1/5 rounded-lg bg-primary-orange py-4 text-white'
					type='button'
					onClick={onClick}
				>
					{t('home.cta')}
				</button>
				<button
					className='mt-8 w-1/5 rounded-lg bg-primary-orange py-4 text-white'
					type='button'
					onClick={onToggleShowPlaylist}
				>
					{showPlaylist ? t('home.hidePlaylist') : t('home.showPlaylist')}
				</button>
				<div className='w-2/5 rounded-lg pt-8'>
					{showPlaylist ? <SpotifyPlaylist /> : undefined}
				</div>
			</header>
		</div>
	)
}
