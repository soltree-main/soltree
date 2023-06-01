import SectionText from 'components/Essay'
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export default function WhatPage(): ReactElement {
	const { t } = useTranslation()
	const navigate = useNavigate()

	const onClick = (): void => {
		navigate('../how')
	}

	// eslint-disable-next-line unicorn/prevent-abbreviations
	const i18Prefix = 'about.pages.what'

	const paragraphs = [
		t(`${i18Prefix}.para1`),
		t(`${i18Prefix}.para2`),
		t(`${i18Prefix}.para3`),
		t(`${i18Prefix}.para4`),
		t(`${i18Prefix}.para5`)
	]

	return (
		<div className='bg-primary-teal text-center'>
			<div className='flex min-h-screen flex-col items-center justify-center'>
				<h1 className='my-8 text-5xl font-semibold text-essay-violet'>
					{t(`${i18Prefix}.title`)}
				</h1>
				<article className='flex max-w-prose flex-col content-center'>
					<SectionText heading={undefined} paragraphs={paragraphs} />
				</article>
				<button
					className='my-8 w-1/5 rounded-lg bg-primary-orange py-4 text-white'
					type='button'
					onClick={onClick}
				>
					{t(`${i18Prefix}.cta`)}
				</button>
			</div>
		</div>
	)
}
