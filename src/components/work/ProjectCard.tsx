'use client';

import { Heading, Text } from '@/once-ui/components';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface ProjectCardProps {
    title: string;
    description: string;
    href: string;
    images: string[];
}

export function ProjectCard({
    title,
    description,
    href,
    images,
}: ProjectCardProps) {
    const params = useParams();
    const fullHref = `/${params?.locale}${href}`;
    const mainImage = images[0];

    return (
        <Link 
            href={fullHref} 
            style={{ 
                textDecoration: 'none', 
                display: 'block', 
                width: '100%',
                color: 'inherit'
            }}>
            <article>
                <div style={{
                    width: '100%',
                    position: 'relative',
                    paddingBottom: '56.25%', // 16:9 aspect ratio
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: '#000',
                    marginBottom: '1.5rem'
                }}>
                    <img
                        src={mainImage}
                        alt={title}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: 0.8,
                        }}
                    />
                </div>
                <Heading
                    variant="heading-strong-xl"
                    style={{ 
                        marginBottom: '0.75rem',
                        fontSize: '2rem',
                        lineHeight: '1.2'
                    }}>
                    {title}
                </Heading>
                <Text
                    onBackground="neutral-weak"
                    variant="body-default-l"
                    style={{
                        opacity: 0.7,
                        fontSize: '1.125rem',
                        lineHeight: '1.5'
                    }}>
                    {description}
                </Text>
            </article>
        </Link>
    );
} 