'use client';

import React from 'react';
import 'remixicon/fonts/remixicon.css';

interface RemixIconProps {
    name: string;
    size?: 'xs' | 's' | 'm' | 'l' | 'xl';
    className?: string;
}

const sizeMap: Record<string, string> = {
    xs: '16px',
    s: '20px',
    m: '24px',
    l: '32px',
    xl: '40px',
};

export const RemixIcon: React.FC<RemixIconProps> = ({
    name,
    size = 'm',
    className = '',
}) => {
    return (
        <i
            className={`${name} ${className}`}
            style={{
                fontSize: sizeMap[size],
                display: 'flex',
                alignItems: 'center'
            }}
        />
    );
}; 