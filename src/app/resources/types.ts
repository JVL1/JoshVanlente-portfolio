import { ReactNode } from 'react';

export interface Institution {
    name: string;
    description: ReactNode;
    bullets?: string[];
}

export interface Skill {
    title: string;
    description: ReactNode;
    icon?: string;
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
    technical: {
        display: boolean;
        title: string;
        skills: Skill[];
    };
} 