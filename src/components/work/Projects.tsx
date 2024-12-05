import { getPosts } from '@/app/utils/utils';
import { CaseStudyCard } from './CaseStudyCard';

interface ProjectsProps {
    range?: [number, number?];
    locale: string;
}

export function Projects({ range, locale }: ProjectsProps) {
    let allProjects = getPosts(['src', 'app', '[locale]', 'work', 'projects', locale]);

    const sortedProjects = allProjects.sort((a, b) => {
        return new Date(b.metadata.publishedAt).getTime() - new Date(a.metadata.publishedAt).getTime();
    });

    const displayedProjects = range
        ? sortedProjects.slice(range[0] - 1, range[1] ?? sortedProjects.length)
        : sortedProjects;

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '48px',
            marginBottom: '64px'
        }}>
            {displayedProjects.map((post) => (
                <CaseStudyCard
                    key={post.slug}
                    href={`work/${post.slug}`}
                    image={post.metadata.images[0]}
                    title={post.metadata.title}
                    description={post.metadata.summary}
                />
            ))}
        </div>
    );
}