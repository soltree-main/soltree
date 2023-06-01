import App from 'App'
import { StrictMode } from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import '../i18n';

registerSW()

ReactDOM.render(
	<StrictMode>
		<BrowserRouter>
			<App />
		</BrowserRouter>
	</StrictMode>,
	document.querySelector('#root')
)
