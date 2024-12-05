'use client';

import { Heading, Text } from '@/once-ui/components';
import Link from 'next/link';
import styles from './CaseStudyCard.module.scss';

interface CaseStudyCardProps {
    title: string;
    description: string;
    href: string;
    image: string;
}

export function CaseStudyCard({
    title,
    description,
    href,
    image,
}: CaseStudyCardProps) {
    return (
        <Link 
            href={href} 
            className={styles.card}>
            <div className={styles.imageContainer}>
                <div className={styles.overlay} />
                <img
                    src={image}
                    alt={title}
                    className={styles.image}
                />
            </div>
            <div style={{ padding: '0 4px' }}>
                <Heading
                    variant="heading-strong-xl"
                    style={{ 
                        marginBottom: '12px',
                        fontSize: '24px',
                        lineHeight: '1.3',
                        letterSpacing: '-0.02em'
                    }}>
                    {title}
                </Heading>
                <Text
                    onBackground="neutral-weak"
                    variant="body-default-l"
                    style={{
                        opacity: 0.7,
                        fontSize: '16px',
                        lineHeight: '1.5'
                    }}>
                    {description}
                </Text>
            </div>
        </Link>
    );
} 