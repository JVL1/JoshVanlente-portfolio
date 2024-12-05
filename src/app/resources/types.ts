import { ReactNode } from 'react';

export interface Institution {
    name: string;
    description: ReactNode;
    bullets?: string[];
}

export interface About {
    label: string;
    title: string;
    description: string;
    tableOfContent: {
        display: boolean;
        subItems: boolean;
    };
    avatar: {
        display: boolean;
    };
    calendar: {
        display: boolean;
        link: string;
    };
    intro: {
        display: boolean;
        title: string;
        description: ReactNode;
    };
    studies: {
        display: boolean;
        title: string;
        institutions: Institution[];
    };
    // Add other sections as needed
} 