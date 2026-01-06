import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    bg: '#e0e7ff',
                }
            },
            borderWidth: {
                3: '3px',
            },
            boxShadow: {
                'hard-sm': '2px 2px 0px #000000',
                'hard-md': '3px 3px 0px #000000',
                'hard-lg': '4px 4px 0px #000000',
                'hard-xl': '6px 6px 0px #000000',
            },
        },
    },
    plugins: [],
};
export default config;
