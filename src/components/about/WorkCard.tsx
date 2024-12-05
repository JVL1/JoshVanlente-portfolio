'use client';

import { Heading, Text } from '@/once-ui/components';
import styles from './WorkCard.module.scss';

interface WorkCardProps {
    company: string;
    timeframe: string;
    role: string;
    achievements: React.ReactNode[];
}

export function WorkCard({
    company,
    timeframe,
    role,
    achievements,
}: WorkCardProps) {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Text
                    variant="heading-strong-l">
                    {company}
                </Text>
                <Text
                    variant="heading-default-xs"
                    onBackground="neutral-weak">
                    {timeframe}
                </Text>
            </div>
            <Text
                className={styles.role}
                variant="body-default-s"
                onBackground="brand-weak">
                {role}
            </Text>
            <ul className={styles.achievements}>
                {achievements.map((achievement, index) => (
                    <Text
                        as="li"
                        variant="body-default-m"
                        key={`${company}-${index}`}>
                        {achievement}
                    </Text>
                ))}
            </ul>
        </div>
    );
} 