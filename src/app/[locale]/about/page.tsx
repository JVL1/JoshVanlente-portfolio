import { Avatar, Button, Flex, Heading, Icon, IconButton, SmartImage, Tag, Text } from '@/once-ui/components';
import { baseURL, renderContent } from '@/app/resources';
import TableOfContents from '../../../components/about/TableOfContents';
import { CaseStudyPreview, SkillCard, WorkCard, EducationCard } from '../../../components';
import styles from '../../../components/about/about.module.scss'
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { getPosts } from '@/app/utils/utils';
import { About as AboutType, Institution } from '@/app/resources/types';
import { AboutContent } from '../../../components/about/AboutContent';

export async function generateMetadata(
    {params: {locale}}: { params: { locale: string }}
) {
    const t = await getTranslations();
    const {person, about, social } = renderContent(t);
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

export default function About(
    { params: {locale}}: { params: { locale: string }}
) {
    unstable_setRequestLocale(locale);
    const t = useTranslations();
    const {person, about, social } = renderContent(t);
    const allProjects = getPosts(['src', 'app', '[locale]', 'work', 'projects', locale]);
    
    // Find the specific case studies
    const buildingOnceUI = allProjects.find(project => project.slug === 'building-once-ui-a-customizable-design-system');
    const automateDesign = allProjects.find(project => project.slug === 'automate-design-handovers-with-a-figma-to-code-pipeline');
    const productLedGrowth = allProjects.find(project => project.slug === 'a-unique-product-led-growth-strategy');

    const structure = [
        { 
            title: about.intro.title,
            display: about.intro.display,
            items: []
        },
        { 
            title: about.work.title,
            display: about.work.display,
            items: []
        },
        { 
            title: about.studies.title,
            display: about.studies.display,
            items: []
        },
        { 
            title: about.technical.title,
            display: about.technical.display,
            items: []
        },
        {
            title: about.caseStudies.title,
            display: about.caseStudies.display,
            items: []
        }
    ]
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