'use client';

import { Avatar, Button, Flex, Heading, Icon, IconButton, SmartImage, Tag, Text } from '@/once-ui/components';
import { baseURL } from '@/app/resources';
import TableOfContents from '../about/TableOfContents';
import { CaseStudyPreview, SkillCard, WorkCard, EducationCard } from '@/components';
import styles from './about.module.scss'
import { About as AboutType, Institution } from '@/app/resources/types';

interface AboutContentProps {
    person: any;
    about: AboutType;
    social: any[];
    buildingOnceUI: any;
    automateDesign: any;
    productLedGrowth: any;
}

export function AboutContent({
    person,
    about,
    social,
    buildingOnceUI,
    automateDesign,
    productLedGrowth
}: AboutContentProps) {
    const structure = [
        { 
            title: about.intro.title,
            display: about.intro.display,
            items: []
        },
        { 
            title: about.work.title,
            display: about.work.display,
            items: about.work.experiences.map(experience => experience.company)
        },
        { 
            title: about.studies.title,
            display: about.studies.display,
            items: about.studies.institutions.map(institution => institution.name)
        },
        { 
            title: about.technical.title,
            display: about.technical.display,
            items: about.technical.skills.map(skill => skill.title)
        },
    ]

    return (
        <Flex
            fillWidth maxWidth="m"
            direction="column">
            <script
                type="application/ld+json"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'Person',
                        name: person.name,
                        jobTitle: person.role,
                        description: about.intro.description,
                        url: `https://${baseURL}/about`,
                        image: `${baseURL}/images/${person.avatar}`,
                        sameAs: social
                            .filter((item) => item.link && !item.link.startsWith('mailto:'))
                            .map((item) => item.link),
                        worksFor: {
                            '@type': 'Organization',
                            name: about.work.experiences[0].company || ''
                        },
                    }),
                }}
            />
            { about.tableOfContent.display && (
                <Flex
                    style={{ left: '0', top: '50%', transform: 'translateY(-50%)' }}
                    position="fixed"
                    paddingLeft="24" gap="32"
                    direction="column" hide="s">
                    <TableOfContents
                        structure={structure}
                        about={about} />
                </Flex>
            )}
            <Flex
                fillWidth
                mobileDirection="column" justifyContent="center">
                { about.avatar.display && (
                    <Flex
                        minWidth="160" paddingX="l" paddingBottom="xl" gap="m"
                        flex={3} direction="column" alignItems="center">
                        <Avatar
                            src={person.avatar}
                            size="xl"/>
                        <Flex
                            gap="8"
                            alignItems="center">
                            <Icon
                                onBackground="accent-weak"
                                name="globe"/>
                            {person.location}
                        </Flex>
                        { person.languages.length > 0 && (
                            <Flex
                                wrap
                                gap="8">
                                {person.languages.map((language: string, index: number) => (
                                    <Tag
                                        key={index}
                                        size="l">
                                        {language}
                                    </Tag>
                                ))}
                            </Flex>
                        )}
                    </Flex>
                )}
                <Flex
                    className={styles.blockAlign}
                    fillWidth flex={9} maxWidth={40} direction="column">
                    <Flex
                        id={about.intro.title}
                        fillWidth minHeight="160"
                        direction="column" justifyContent="center"
                        marginBottom="32">
                        {about.calendar.display && (
                            <Flex
                                className={styles.blockAlign}
                                style={{
                                    backdropFilter: 'blur(var(--static-space-1))',
                                    border: '1px solid var(--brand-alpha-medium)',
                                    width: 'fit-content'
                                }}
                                alpha="brand-weak" radius="full"
                                fillWidth padding="4" gap="8" marginBottom="m"
                                alignItems="center">
                                <Flex paddingLeft="12">
                                    <Icon
                                        name="calendar"
                                        onBackground="brand-weak"/>
                                </Flex>
                                <Flex
                                    paddingX="8">
                                    Schedule a call
                                </Flex>
                                <IconButton
                                    href={about.calendar.link}
                                    data-border="rounded"
                                    variant="tertiary"
                                    icon="chevronRight"/>
                            </Flex>
                        )}
                        <Heading
                            className={styles.textAlign}
                            variant="display-strong-xl">
                            {person.name}
                        </Heading>
                        <Text
                            className={styles.textAlign}
                            variant="display-default-xs"
                            onBackground="neutral-weak">
                            {person.role}
                        </Text>
                        {social.length > 0 && (
                            <Flex
                                className={styles.blockAlign}
                                paddingTop="20" paddingBottom="8" gap="8" wrap>
                                {social.map((item) => (
                                    item.link && (
                                        <Button
                                            key={item.name}
                                            href={item.link}
                                            prefixIcon={item.icon}
                                            label={item.name}
                                            size="s"
                                            variant="tertiary"/>
                                    )
                                ))}
                            </Flex>
                        )}
                    </Flex>

                    { about.intro.display && (
                        <Flex
                            direction="column"
                            textVariant="body-default-l"
                            fillWidth gap="m" marginBottom="xl">
                            {about.intro.description}
                        </Flex>
                    )}

                    { about.work.display && (
                        <>
                            <Heading
                                as="h2"
                                id={about.work.title}
                                variant="display-strong-s"
                                marginBottom="m">
                                {about.work.title}
                            </Heading>
                            <Flex
                                direction="column"
                                fillWidth gap="l" marginBottom="40">
                                {about.work.experiences.map((experience, index) => (
                                    <Flex
                                        key={`${experience.company}-${experience.role}-${index}`}
                                        fillWidth
                                        direction="column"
                                        gap="l">
                                        <WorkCard
                                            company={experience.company}
                                            timeframe={experience.timeframe}
                                            role={experience.role}
                                            achievements={experience.achievements}
                                        />
                                        {experience.timeframe === '2023 - Present' && buildingOnceUI && (
                                            <CaseStudyPreview
                                                title={buildingOnceUI.metadata.title}
                                                description={buildingOnceUI.metadata.summary}
                                                href={`/work/${buildingOnceUI.slug}`}
                                                image={buildingOnceUI.metadata.images[0]}
                                            />
                                        )}
                                        {experience.timeframe === '2022 - 2023' && productLedGrowth && (
                                            <CaseStudyPreview
                                                title={productLedGrowth.metadata.title}
                                                description={productLedGrowth.metadata.summary}
                                                href={`/work/${productLedGrowth.slug}`}
                                                image={productLedGrowth.metadata.images[0]}
                                                imagePosition="left top"
                                            />
                                        )}
                                    </Flex>
                                ))}
                            </Flex>
                        </>
                    )}

                    { about.studies.display && (
                        <>
                            <Heading
                                as="h2"
                                id={about.studies.title}
                                variant="display-strong-s"
                                marginBottom="m">
                                {about.studies.title}
                            </Heading>
                            <Flex
                                direction="column"
                                fillWidth gap="l" marginBottom="40">
                                {(about.studies.institutions as Institution[]).map((institution, index) => (
                                    <EducationCard
                                        key={`${institution.name}-${index}`}
                                        name={institution.name}
                                        description={institution.description}
                                        bullets={institution.bullets}
                                    />
                                ))}
                            </Flex>
                        </>
                    )}

                    { about.technical.display && (
                        <>
                            <Heading
                                as="h2"
                                id={about.technical.title}
                                variant="display-strong-s" 
                                marginBottom="xl">
                                {about.technical.title}
                            </Heading>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '24px',
                                marginBottom: '64px'
                            }}>
                                <SkillCard
                                    title="Product Strategy"
                                    description="Finding the intersection of user needs and business goals is a passion of mine.  I thrive on what comes next, creating and executing a plan to realize those goals while finding ways derisk assumptions and deliver value sooner."
                                    icon="location"
                                />
                                <SkillCard
                                    title="Decision making"
                                    description={
                                        <>
                                            I like the <a href="https://www.inc.com/jeff-haden/amazon-founder-jeff-bezos-this-is-how-successful-people-make-such-smart-decisions.html" target="_blank" rel="noopener noreferrer">one-way, two-way door</a> framework to guide how much time to spend on decisions. I pride myself in spending the right amount of time on decisions and using the right tool, be that analytics, surveys, interviews, insights from the sales team, or just 'product instincts'.
                                        </>
                                    }
                                    icon="gavel"
                                />
                                <SkillCard
                                    title="Empowerment"
                                    description="I always strive to empower others to work autonomously. If I've shared enough customer insights and business justifications that a designer, engieer or another product manager can make a good descion without me, I feel like I'm doing my job well."
                                    icon="fist"
                                />
                                <SkillCard
                                    title="Communication"
                                    description="Product management is a team sport, so keeping stakeholders aligned and informed is key.  As I've progressed in my career, my apprecaition for effective communication has grown."
                                    icon="bullhorn"
                                />
                            </div>
                        </>
                    )}
                </Flex>
            </Flex>
        </Flex>
    );
} 