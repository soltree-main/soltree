import AboutPage from 'pages/about/About'
import HowPage from 'pages/about/How'
import WhatPage from 'pages/about/What'
import WhyPage from 'pages/about/Why'
import NextStepsPage from 'pages/next-steps/NextSteps'
import type { ReactElement } from 'react'
import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/home/Home'

export default function App(): ReactElement {
	return (
		<div>
			<Routes>
				<Route path='about' element={<AboutPage />}>
					<Route path='why' element={<WhyPage />} />
					<Route path='what' element={<WhatPage />} />
					<Route path='how' element={<HowPage />} />
				</Route>
				<Route path='next-steps' element={<NextStepsPage />} />
				<Route path='/' element={<HomePage />} />
			</Routes>
		</div>
	)
}
