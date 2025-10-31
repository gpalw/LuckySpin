/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}", // <-- 告诉 v4 去哪里扫描
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}