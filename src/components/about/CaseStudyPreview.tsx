'use client';

import { Heading, Text } from '@/once-ui/components';
import Link from 'next/link';
import styles from './CaseStudyPreview.module.scss';

interface CaseStudyPreviewProps {
    title: string;
    description: string;
    href: string;
    image: string;
    imagePosition?: string;
}

export function CaseStudyPreview({
    title,
    description,
    href,
    image,
    imagePosition = 'center center', // default position
}: CaseStudyPreviewProps) {
    return (
        <Link 
            href={href} 
            className={styles.container}>
            <div className={styles.imageContainer}>
                <img
                    src={image}
                    alt={title}
                    className={styles.image}
                    style={{ objectPosition: imagePosition }}
                />
            </div>
            <div className={styles.content}>
                <div className={styles.textContent}>
                    <Heading
                        variant="heading-strong-l"
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
                <div className={styles.cta}>
                    View Case Study
                </div>
            </div>
        </Link>
    );
} 