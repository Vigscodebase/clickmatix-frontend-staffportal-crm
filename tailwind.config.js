/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#0F52BA', // Sapphire Blue
                secondary: '#EEF2F6', // Light Gray-Blue
                success: '#10B981',
                warning: '#F59E0B',
                danger: '#EF4444',
                dark: '#111827',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
