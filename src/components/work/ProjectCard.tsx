'use client';

import { Flex, Heading, Text, Button } from '@/once-ui/components';
import { useParams } from 'next/navigation';

interface ProjectCardProps {
    title: string;
    description: string;
    slug: string;
    publishedAt: string;
    thumbnail?: string;
}

export function ProjectCard({
    title,
    description,
    slug,
    publishedAt,
    thumbnail,
}: ProjectCardProps) {
    const params = useParams();

    return (
        <Flex
            fillWidth
            direction="column"
            gap="m">
            {thumbnail && (
                <img
                    src={thumbnail}
                    alt={title}
                    style={{
                        width: '100%',
                        height: 'auto',
                        borderRadius: '8px',
                    }}
                />
            )}
            <Flex
                direction="column"
                gap="s">
                <Heading
                    variant="heading-strong-m">
                    {title}
                </Heading>
                <Text
                    onBackground="neutral-weak"
                    variant="body-default-m">
                    {description}
                </Text>
            </Flex>
            <Button
                href={`/${params?.locale}/work/${slug}`}
                variant="tertiary"
                size="s"
                suffixIcon="arrowRight">
                Read Case Study
            </Button>
        </Flex>
    );
} 