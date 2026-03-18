/** @type {import('tailwindcss').Config} */
module.exports = {
content: [
  "./app/**/*.{js,ts,jsx,tsx}", // Thêm dòng này nếu dùng Next.js 13+ App Router
  "./pages/**/*.{js,ts,jsx,tsx}",
  "./components/**/*.{js,ts,jsx,tsx}",
  "./src/**/*.{js,ts,jsx,tsx}", // Thêm dòng này nếu code nằm trong thư mục src
],
  theme: {
    extend: {},
  },
  plugins: [],
}