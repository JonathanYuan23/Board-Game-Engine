/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./**/*.{html,js}'],
    theme: {
        extend: {
            colors: {
                primary: '#f5f5f5',
                secondary: '#5a5a5a',
                tertiary: '#3c3c3c',
            },
        },
        fontFamily: {
            sans: ['Inter', 'Montserrat', 'sans-serif'],
        },
    },
    plugins: [],
    corePlugins: {
        preflight: false,
    },
};
