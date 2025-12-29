const config = {
    plugins: {
        autoprefixer: {
            // Suppress color-adjust deprecation warning from Bootstrap 5.1.x
            // Could be removed after upgrading Bootstrap to 5.2+
            ignoreUnknownVersions: true,
        },
        'postcss-import': {},
        tailwindcss: {},
    },
};

export default config;
