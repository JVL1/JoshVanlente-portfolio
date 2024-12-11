import { Flex, Heading } from '@/once-ui/components';
import { baseURL, renderContent } from '@/app/resources';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

export async function generateMetadata(
    {params: {locale}}: { params: { locale: string }}
) {
    const t = await getTranslations();
    const { gallery } = renderContent(t);
    const title = gallery.title;
    const description = gallery.description;
    const ogImage = `https://${baseURL}/og?title=${encodeURIComponent(title)}`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'website',
            url: `https://${baseURL}/${locale}/gallery`,
            images: [
                {
                    url: ogImage,
                    alt: title,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImage],
        },
    };
}

export default function Gallery({
    params: {locale}
}: {
    params: { locale: string }
}) {
    unstable_setRequestLocale(locale);
    return (
        <Flex
            fillWidth maxWidth="m"
            direction="column">
            <Heading
                variant="display-strong-s">
                Gallery
            </Heading>
            <Flex
                fillWidth
                direction="column"
                gap="l">
                {/* Gallery content will go here */}
            </Flex>
        </Flex>
    );
}