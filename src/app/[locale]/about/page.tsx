import { Flex } from '@/once-ui/components';
import { baseURL, renderContent } from '@/app/resources';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { getPosts } from '@/app/utils/utils';
import { AboutContent } from '../../../components/about/AboutContent';

export async function generateMetadata(
    {params: {locale}}: { params: { locale: string }}
) {
    const t = await getTranslations();
    const {person, about } = renderContent(t);
    const title = about.title;
    const description = about.description;
    const ogImage = `https://${baseURL}/og?title=${encodeURIComponent(title)}`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'website',
            url: `https://${baseURL}/${locale}/about`,
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

export default async function About({
    params: {locale}
}: {
    params: { locale: string }
}) {
    unstable_setRequestLocale(locale);
    const t = await getTranslations();
    const {person, about, social } = renderContent(t);
    const allProjects = getPosts(['src', 'app', '[locale]', 'work', 'projects', locale]);
    
    const buildingOnceUI = allProjects.find(project => project.slug === 'building-once-ui-a-customizable-design-system');
    const automateDesign = allProjects.find(project => project.slug === 'automate-design-handovers-with-a-figma-to-code-pipeline');
    const productLedGrowth = allProjects.find(project => project.slug === 'a-unique-product-led-growth-strategy');

    return (
        <Flex
            fillWidth maxWidth="m"
            direction="column">
            <AboutContent
                person={person}
                about={about}
                social={social}
                buildingOnceUI={buildingOnceUI}
                automateDesign={automateDesign}
                productLedGrowth={productLedGrowth}
            />
        </Flex>
    );
}