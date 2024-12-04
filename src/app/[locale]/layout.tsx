import '../globals.css';
import { Flex } from '@/once-ui/components';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { unstable_setRequestLocale } from 'next-intl/server';

export default function RootLayout({
	children,
	params: { locale }
}: {
	children: React.ReactNode;
	params: { locale: string };
}) {
	unstable_setRequestLocale(locale);

	return (
		<html lang={locale}>
			<body>
				<Flex
					fillWidth
					direction="column"
					alignItems="center">
					<Header />
					<main>
						{children}
					</main>
					<Footer />
				</Flex>
			</body>
		</html>
	);
}