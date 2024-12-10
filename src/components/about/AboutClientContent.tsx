'use client';

import { Avatar, Button, Flex, Heading, Icon, IconButton, SmartImage, Tag, Text } from '@/once-ui/components';
import TableOfContents from './TableOfContents';
import { CaseStudyPreview, SkillCard, WorkCard, EducationCard } from '@/components';
import styles from './about.module.scss';
import { About as AboutType } from '@/app/resources/types';

interface AboutClientContentProps {
    person: any;
    about: AboutType;
    social: any;
    structure: {
        title: string;
        display: boolean;
        items: string[];
    }[];
    buildingOnceUI?: any;
    automateDesign?: any;
}

export function AboutClientContent({
    person,
    about,
    social,
    structure,
    buildingOnceUI,
    automateDesign
}: AboutClientContentProps) {
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
                        description: about.description,
                        image: person.avatar,
                        sameAs: social.map((profile: any) => profile.link).filter(Boolean),
                        worksFor: {
                            '@type': 'Organization',
                            name: about.work.experiences[0].company || ''
                        },
                    }),
                }}
            />
            <Flex
                fillWidth
                direction="column"
                gap="xl">
                {about.avatar.display && (
                    <Avatar
                        className={styles.blockAlign}
                        size="xl"
                        src={person.avatar}/>
                )}
                <Flex
                    fillWidth
                    direction="column"
                    gap="m">
                    <Heading
                        className={styles.textAlign}
                        variant="display-strong-m">
                        {about.title}
                    </Heading>
                    <Text
                        className={styles.textAlign}
                        variant="heading-default-l"
                        onBackground="neutral-weak">
                        {about.description}
                    </Text>
                </Flex>
                {about.calendar.display && (
                    <Button
                        className={styles.blockAlign}
                        href={about.calendar.link}
                        variant="primary"
                        prefixIcon="calendar">
                        Schedule a call
                    </Button>
                )}
                {about.tableOfContent.display && (
                    <TableOfContents
                        structure={structure}
                        about={about}/>
                )}
                {about.intro.display && (
                    <Flex
                        fillWidth
                        direction="column"
                        gap="m">
                        <Heading
                            id={about.intro.title}
                            variant="heading-strong-l">
                            {about.intro.title}
                        </Heading>
                        <Text
                            variant="body-default-l">
                            {about.intro.description}
                        </Text>
                    </Flex>
                )}
                {about.work.display && (
                    <Flex
                        fillWidth
                        direction="column"
                        gap="m">
                        <Heading
                            id={about.work.title}
                            variant="heading-strong-l">
                            {about.work.title}
                        </Heading>
                        <Flex
                            fillWidth
                            direction="column"
                            gap="m">
                            {about.work.experiences.map((experience, index) => (
                                <WorkCard
                                    key={index}
                                    company={experience.company}
                                    timeframe={experience.timeframe}
                                    role={experience.role}
                                    achievements={experience.achievements}/>
                            ))}
                        </Flex>
                    </Flex>
                )}
                {about.studies.display && (
                    <Flex
                        fillWidth
                        direction="column"
                        gap="m">
                        <Heading
                            id={about.studies.title}
                            variant="heading-strong-l">
                            {about.studies.title}
                        </Heading>
                        <Flex
                            fillWidth
                            direction="column"
                            gap="m">
                            {about.studies.institutions.map((institution, index) => (
                                <EducationCard
                                    key={index}
                                    name={institution.name}
                                    description={institution.description}
                                    bullets={institution.bullets}/>
                            ))}
                        </Flex>
                    </Flex>
                )}
                {about.technical.display && (
                    <Flex
                        fillWidth
                        direction="column"
                        gap="m">
                        <Heading
                            id={about.technical.title}
                            variant="heading-strong-l">
                            {about.technical.title}
                        </Heading>
                        <Flex
                            fillWidth
                            direction="column"
                            gap="m">
                            {about.technical.skills.map((skill, index) => (
                                <SkillCard
                                    key={index}
                                    title={skill.title}
                                    description={skill.description}
                                    icon={skill.icon}/>
                            ))}
                        </Flex>
                    </Flex>
                )}
                {about.caseStudies.display && (
                    <Flex
                        fillWidth
                        direction="column"
                        gap="m">
                        <Heading
                            id={about.caseStudies.title}
                            variant="heading-strong-l">
                            {about.caseStudies.title}
                        </Heading>
                        <Flex
                            fillWidth
                            direction="column"
                            gap="m">
                            {buildingOnceUI && (
                                <CaseStudyPreview
                                    title={buildingOnceUI.metadata.title}
                                    description={buildingOnceUI.metadata.summary}
                                    href={`/work/${buildingOnceUI.slug}`}
                                    image={buildingOnceUI.metadata.image}/>
                            )}
                            {automateDesign && (
                                <CaseStudyPreview
                                    title={automateDesign.metadata.title}
                                    description={automateDesign.metadata.summary}
                                    href={`/work/${automateDesign.slug}`}
                                    image={automateDesign.metadata.image}/>
                            )}
                        </Flex>
                    </Flex>
                )}
            </Flex>
        </Flex>
    );
} 