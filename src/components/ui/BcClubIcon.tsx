import React from 'react';
import { GolfHole } from './GolfHole';
import { BcClub } from './BcClub';


export type ClubIconType = 'BcClub' | 'GolfClub';

interface BcClubIconProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'color'> {
    type?: ClubIconType;
    className?: string;
    size?: number;
    color?: string;
    strokeWidth?: number;
}

export function BcClubIcon({ type = 'BcClub', className = '', color, size, strokeWidth, ...props }: BcClubIconProps) {

    return (
        <div className="relative">
            {type === 'BcClub' ? (
                <BcClub size={size} color={color} strokeWidth={strokeWidth} />

            ) : (
                <GolfHole size={size} color={color} strokeWidth={strokeWidth} />
            )}
        </div>
    );
}

