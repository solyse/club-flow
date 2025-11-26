import { motion } from 'framer-motion';

interface WelcomeHeadingProps {
    title?: string;
    className?: string;
    style?: React.CSSProperties;
    withAnimation?: boolean;
    animationDelay?: number;
    subheading?: string;
}

export function WelcomeHeading({
    title = 'Welcome to BagCaddie Club',
    className = 'mb-4 sm:mb-6',
    style,
    withAnimation = false,
    animationDelay = 0.6,
    subheading,
}: WelcomeHeadingProps) {
    const defaultStyle: React.CSSProperties = {
        fontSize: '36px',
        fontWeight: 500,
        fontFamily: 'Inter, sans-serif',
        ...style,
    };

    const heading = (
        <h2 className={className} style={defaultStyle}>
            {title}
        </h2>
    );

    if (withAnimation) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
            >
                {heading}
                {subheading && <p className="mb-4 px-2" style={{ fontSize: '18px',color: '#666666' }}>{subheading}</p>}
            </motion.div>
        );
    }

    return heading;
}

