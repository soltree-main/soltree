import type { ReactElement } from 'react'
import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

export default function AboutPage(): ReactElement {
	const location = useLocation()

	useEffect(() => {
		window.scrollTo(0, 0)
	}, [location])

	return <Outlet />
}
