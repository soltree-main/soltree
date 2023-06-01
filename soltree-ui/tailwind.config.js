const defaultConfig = require('tailwindcss/defaultConfig')
const formsPlugin = require('@tailwindcss/forms')

/** @type {import('tailwindcss/types').Config} */
const config = {
	content: ['index.html', 'src/**/*.tsx'],
	theme: {
		extend: {
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))'
			},
			colors: {
				'primary-orange': '#c9770a',
				'primary-teal': '#5EEAD4',
				'primary-violet': '#6D28D9',
				'essay-violet': '#22094a'
			}
		}
	},
	experimental: { optimizeUniversalDefaults: true },
	plugins: [formsPlugin]
}
module.exports = config
