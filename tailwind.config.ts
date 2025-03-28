/** @type {import('tailwindcss').Config} */
export default {
    content: ['./app/**/*.{ts,tsx}'],
    theme: {
        extend: {},
    },
    layers: {
        theme: false,
        base: false,
        utilities: true,
        components: true
    },
    plugins: [],
    prefix: 'e'
};
