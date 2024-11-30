import { InlineCode } from "@/once-ui/components";

const person = {
    firstName: 'Josh',
    lastName:  'Van Lente',
    get name() {
        return `${this.firstName} ${this.lastName}`;
    },
    role:      'Product Leader',
    avatar:    '/images/avatar.jpeg',
    location:  'America/Los_Angeles',
    languages: ['English'],
}

const newsletter = {
    display: true,
    title: <>Subscribe to {person.firstName}'s Newsletter</>,
    description: <>I occasionally write about design, technology, and share thoughts on the intersection of creativity and engineering.</>
}

const social = [
    // Links are automatically displayed.
    // Import new icons in /once-ui/icons.ts
    {
        name: 'GitHub',
        icon: 'github',
        link: 'https://github.com/JVL1',
    },
    {
        name: 'LinkedIn',
        icon: 'linkedin',
        link: 'https://www.linkedin.com/in/josh-van-lente/',
    },
    {
        name: 'X',
        icon: 'x',
        link: '',
    },
    {
        name: 'Email',
        icon: 'email',
        link: 'mailto:Josh@vanlente.net',
    },
]

const home = {
    label: 'Home',
    title: `${person.name}'s Portfolio`,
    description: `Portfolio website showcasing my work as a ${person.role}`,
    headline: <>Product Leader and builder</>,
    subline: <>I'm Josh, a product leader at <InlineCode>Azibo</InlineCode>, where I am building the best all-in-one platform for rental property owners.<br/> After hours, I build my own projects.</>
}

const about = {
    label: 'About',
    title: 'About me',
    description: `Meet ${person.name}, ${person.role} from ${person.location}`,
    tableOfContent: {
        display: true,
        subItems: false
    },
    avatar: {
        display: true
    },calendar: {
        display: false,
        link: ''
    },
    intro: {
        display: true,
        title: 'Introduction',
        description: <>Josh is an experienced product leader with a strong track record of delivering impactful results as both a team leader and hands-on contributor. Highly adaptable and skilled at navigating the ambiguity of 0-to-1 innovation, as well as, the complexity of scaling established products. With expertise spanning fintech, proptech, adtech, and both B2C and B2B markets, I bring strategic vision, cross-functional collaboration, and a passion for continuous learning to every challenge.
</>
    },
    work: {
        display: true, // set to false to hide this section
        title: 'Work Experience',
        experiences: [
            {
                company: 'Azibo',
                timeframe: '2023 - Present',
                role: 'Senior Manager, Product Management',
                achievements: [
                    <>Led as a player-coach, a team of PMs and QA and directly drove a 2.8x increase in monetized users and a 3.5x growth in gross margin per user over 2 years at Azibo.</>,
                    <>Developed and executed a vision to expand the product suite from rent collection to a comprehensive offering of 7 products, including accounting, banking, and lease creation.</>,
                    <>Redesigned the payment platform to minimize support-requiring edge cases and add new growth-enabling features; now processes over $300 million in payments annually.</>
                ],
                images: [ // optional: leave the array empty if you don't want to display images
                    {
                        src: '/images/projects/project-01/cover-01.jpg',
                        alt: 'Once UI Project',
                        width: 16,
                        height: 9
                    }
                ]
            },
            {
                company: 'Azibo',
                timeframe: '2022 - 2023',
                role: 'Senior Product Manager',
                achievements: [
                    <>Activated what is now the primary growth channel and most profitable user segment through a unique product led growth initiative; including closing multiple partnerships (<a href="https://www.azibo.com/blog/azibo-partners-with-rentec-north-america">1</a>).</>,
                    <>Led the effort to rebuild the entire UX which now frequently results in kudos from customers and prospects, as well as, won several industry awards (<a href="https://proptechbreakthrough.com/2023-winners/">1</a>, <a href="https://gdusa.com/2024-digital-design-awards-winner?rns=0|4824">2</a>).</>
                ],
                images: [ // optional: leave the array empty if you don't want to display images
                    {
                        src: '/images/projects/project-01/rhawa.jpg',
                        alt: 'RHAWA partnership',
                        width: 16,
                        height: 9
                    }
                ]
            },
            {
                company: 'Upstart',
                timeframe: '2019 - 2022',
                role: 'Prouct Manager',
                achievements: [
                    <>Developed a design system that unified the brand across multiple platforms, improving design consistency by 40%.</>,
                    <>Led a cross-functional team to launch a new product line, contributing to a 15% increase in overall company revenue.</>
                ],
                images: [
                    {
                    src: '/images/projects/project-01/cover-01.jpg',
                    alt: 'Once UI Project',
                    width: 16,
                    height: 9
                    }
                ]
            }
        ]
    },
    studies: {
        display: true, // set to false to hide this section
        title: 'Studies',
        institutions: [
            {
                name: 'University of Jakarta',
                description: <>Studied software engineering.</>,
            },
            {
                name: 'Build the Future',
                description: <>Studied online marketing and personal branding.</>,
            }
        ]
    },
    technical: {
        display: true, // set to false to hide this section
        title: 'Technical skills',
        skills: [
            {
                title: 'Figma',
                description: <>Able to prototype in Figma with Once UI with unnatural speed.</>,
                images: [
                    {
                        src: '/images/projects/project-01/cover-02.jpg',
                        alt: 'Project image',
                        width: 16,
                        height: 9
                    },
                    {
                        src: '/images/projects/project-01/cover-03.jpg',
                        alt: 'Project image',
                        width: 16,
                        height: 9
                    },
                ]
            },
            {
                title: 'Next.js',
                description: <>Building next gen apps with Next.js + Once UI + Supabase.</>,
                images: [
                    {
                        src: '/images/projects/project-01/cover-04.jpg',
                        alt: 'Project image',
                        width: 16,
                        height: 9
                    },
                ]
            }
        ]
    }
}

const blog = {
    label: 'Blog',
    title: 'Writing about design and tech...',
    description: `Read what ${person.name} has been up to recently`
    // Create new blog posts by adding a new .mdx file to app/blog/posts
    // All posts will be listed on the /blog route
}

const work = {
    label: 'Work',
    title: 'My projects',
    description: `Design and dev projects by ${person.name}`
    // Create new project pages by adding a new .mdx file to app/blog/posts
    // All projects will be listed on the /home and /work routes
}

const gallery = {
    label: 'Gallery',
    title: 'My photo gallery',
    description: `A photo collection by ${person.name}`,
    // Images from https://pexels.com
    images: [
        { 
            src: '/images/gallery/img-01.jpg', 
            alt: 'image',
            orientation: 'vertical'
        },
        { 
            src: '/images/gallery/img-02.jpg', 
            alt: 'image',
            orientation: 'horizontal'
        },
        { 
            src: '/images/gallery/img-03.jpg', 
            alt: 'image',
            orientation: 'vertical'
        },
        { 
            src: '/images/gallery/img-04.jpg', 
            alt: 'image',
            orientation: 'horizontal'
        },
        { 
            src: '/images/gallery/img-05.jpg', 
            alt: 'image',
            orientation: 'horizontal'
        },
        { 
            src: '/images/gallery/img-06.jpg', 
            alt: 'image',
            orientation: 'vertical'
        },
        { 
            src: '/images/gallery/img-07.jpg', 
            alt: 'image',
            orientation: 'horizontal'
        },
        { 
            src: '/images/gallery/img-08.jpg', 
            alt: 'image',
            orientation: 'vertical'
        },
        { 
            src: '/images/gallery/img-09.jpg', 
            alt: 'image',
            orientation: 'horizontal'
        },
        { 
            src: '/images/gallery/img-10.jpg', 
            alt: 'image',
            orientation: 'horizontal'
        },
        { 
            src: '/images/gallery/img-11.jpg', 
            alt: 'image',
            orientation: 'vertical'
        },
        { 
            src: '/images/gallery/img-12.jpg', 
            alt: 'image',
            orientation: 'horizontal'
        },
        { 
            src: '/images/gallery/img-13.jpg', 
            alt: 'image',
            orientation: 'horizontal'
        },
        { 
            src: '/images/gallery/img-14.jpg', 
            alt: 'image',
            orientation: 'horizontal'
        },
    ]
}

export { person, social, newsletter, home, about, blog, work, gallery };