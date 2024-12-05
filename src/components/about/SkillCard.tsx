'use client';

import { Heading, Text, Icon } from '@/once-ui/components';
import { ReactNode } from 'react';
import styles from './SkillCard.module.scss';

interface SkillCardProps {
    title: string;
    description: ReactNode;
    icon: string;
}

export function SkillCard({
    title,
    description,
    icon,
}: SkillCardProps) {
    return (
        <div className={styles.container}>
            <div className={styles.iconContainer}>
                <Icon
                    name={icon}
                    size="xl"
                    onBackground="accent-weak"
                />
            </div>
            <div className={styles.content}>
                <Heading
                    variant="heading-strong-l"
                    style={{ 
                        marginBottom: '12px',
                        fontSize: '24px',
                        lineHeight: '1.3',
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
        </div>
    );
} 