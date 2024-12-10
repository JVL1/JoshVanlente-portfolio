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

export interface WorkExperience {
    company: string;
    timeframe: string;
    role: string;
    achievements: ReactNode[];
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
    work: {
        display: boolean;
        title: string;
        experiences: WorkExperience[];
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