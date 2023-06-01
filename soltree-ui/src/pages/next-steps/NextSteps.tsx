import SectionText from 'components/Essay'
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export default function NextStepsPage(): ReactElement {
	const { t } = useTranslation()
	const navigate = useNavigate()

	const onClick = (): void => {
		navigate('/')
	}

	// eslint-disable-next-line unicorn/prevent-abbreviations
	const i18Prefix = 'nextSteps'

	return (
		<div className='bg-primary-teal text-center'>
			<div className='flex min-h-screen flex-col items-center justify-center'>
				<h1 className='my-8 text-5xl font-semibold text-essay-violet'>
					{t(`${i18Prefix}.title`)}
				</h1>
				<h4 className='mb-8 text-4xl font-semibold text-essay-violet'>
					{t(`${i18Prefix}.subtitle`)}
				</h4>
				<article className='flex max-w-prose flex-col content-center'>
					<SectionText
						heading={t(`${i18Prefix}.part1.heading`)}
						paragraphs={[t(`${i18Prefix}.part1.para1`)]}
					/>
					<SectionText
						heading={t(`${i18Prefix}.part2.heading`)}
						paragraphs={[t(`${i18Prefix}.part2.para1`)]}
					/>
					<ul className='mb-8 list-disc text-left text-essay-violet'>
						<li>{t(`${i18Prefix}.part2.reasons.impact`)}</li>
						<li>{t(`${i18Prefix}.part2.reasons.purpose`)}</li>
						<li>{t(`${i18Prefix}.part2.reasons.friends`)}</li>
						<li>{t(`${i18Prefix}.part2.reasons.freedom`)}</li>
						<li>{t(`${i18Prefix}.part2.reasons.esteem`)}</li>
						<li>{t(`${i18Prefix}.part2.reasons.skills`)}</li>
						<li>{t(`${i18Prefix}.part2.reasons.protection`)}</li>
					</ul>
					<SectionText
						heading={t(`${i18Prefix}.part3.heading`)}
						paragraphs={[
							t(`${i18Prefix}.part3.para1`),
							t(`${i18Prefix}.part3.para2`)
						]}
					/>
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
