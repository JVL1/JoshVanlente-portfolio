'use client';

import { Text } from '@/once-ui/components';
import styles from './EducationCard.module.scss';

interface EducationCardProps {
    name: string;
    description: React.ReactNode;
    bullets?: string[];
}

export function EducationCard({
    name,
    description,
    bullets,
}: EducationCardProps) {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <Text
                    variant="heading-strong-l">
                    {name}
                </Text>
                <Text
                    className={styles.description}
                    variant="body-default-s">
                    {description}
                </Text>
            </div>
            {bullets && bullets.length > 0 && (
                <ul className={styles.bullets}>
                    {bullets.map((bullet, index) => (
                        <Text
                            as="li"
                            variant="body-default-m"
                            key={`${name}-${index}`}>
                            {bullet}
                        </Text>
                    ))}
                </ul>
            )}
        </div>
    );
} 