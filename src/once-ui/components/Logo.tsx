'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import classNames from 'classnames';
import styles from './Logo.module.scss';
import { SpacingToken } from '../types';
import { Flex } from '.';

const sizeMap: Record<string, SpacingToken> = {
    xs: '20',
    s: '24',
    m: '32',
    l: '40',
    xl: '48',
};

interface LogoProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    className?: string;
    size?: 'xs' | 's' | 'm' | 'l' | 'xl';
    style?: React.CSSProperties;
    wordmark?: boolean;
    icon?: boolean;
    iconSrc?: string;
    wordmarkSrc?: string;
    href?: string;
}

const Logo: React.FC<LogoProps> = ({
    size = 'm',
    wordmark = true,
    icon = true,
    href,
    iconSrc,
    wordmarkSrc,
    className,
    style,
    ...props
}) => {
    useEffect(() => {
        if (!icon && !wordmark) {
            console.warn("Both 'icon' and 'wordmark' props are set to false. The logo will not render any content.");
        }
    }, [icon, wordmark]);

    const content = (
        <>
            {icon && !iconSrc && (
                <div
                    style={{ height: `var(--static-space-${sizeMap[size]})` }}
                    className={styles.icon}
                />
            )}
            {iconSrc && (
                <div style={{ position: 'relative', height: `var(--static-space-${sizeMap[size]})`, width: 'auto' }}>
                    <Image
                        src={iconSrc}
                        alt="Logo icon"
                        fill
                        style={{ objectFit: 'contain' }}
                        sizes={`${parseInt(sizeMap[size]) * 4}px`}
                    />
                </div>
            )}
            {wordmark && !wordmarkSrc && (
                <div
                    style={{ height: `var(--static-space-${sizeMap[size]})` }}
                    className={styles.type}
                />
            )}
            {wordmarkSrc && (
                <div style={{ position: 'relative', height: `var(--static-space-${sizeMap[size]})`, width: 'auto' }}>
                    <Image
                        src={wordmarkSrc}
                        alt="Logo wordmark"
                        fill
                        style={{ objectFit: 'contain' }}
                        sizes={`${parseInt(sizeMap[size]) * 4}px`}
                    />
                </div>
            )}
        </>
    );

    return href ? (
        <Link
            className={classNames('radius-l', 'flex', className)}
            style={{ height: 'fit-content', ...style }}
            href={href}
            aria-label="Logo link"
            {...props}>
            {content}
        </Link>
    ) : (
        <Flex
            className={classNames('radius-l', 'flex', className)}
            style={{ height: 'fit-content', ...style }}
            aria-label="Logo">
            {content}
        </Flex>
    );
};

Logo.displayName = 'Logo';
export { Logo };