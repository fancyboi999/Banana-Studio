import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import '../globals.css';
import { ModalProvider } from '@/context/ModalContext';

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    // Providing all messages to the client
    // side is the easiest way to get started
    const messages = await getMessages();

    return (
        <html lang={locale} suppressHydrationWarning>
            <body suppressHydrationWarning>
                <NextIntlClientProvider messages={messages}>
                    <ModalProvider>
                        {children}
                    </ModalProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
