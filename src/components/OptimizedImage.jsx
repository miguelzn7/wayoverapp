import React from 'react';
import PropTypes from 'prop-types';
import { optimizeImage } from '../lib/optimizeImage';

/**
 * OptimizedImage Component
 * Simple image optimization without progressive loading
 */
const OptimizedImage = ({
    src,
    alt,
    size = 'card',
    className = '',
    style = {},
    onClick,
    ...props
}) => {
    // Don't render if no valid src provided
    if (!src || typeof src !== 'string' || src.trim() === '') {
        return null;
    }

    // Get optimized URL
    const optimizedSrc = optimizeImage(src, size);

    // If optimization failed, don't render
    if (!optimizedSrc) {
        return null;
    }

    return (
        <img
            src={optimizedSrc}
            alt={alt}
            className={className}
            style={style}
            onClick={onClick}
            {...props}
        />
    );
};

OptimizedImage.propTypes = {
    src: PropTypes.string.isRequired,
    alt: PropTypes.string.isRequired,
    size: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
    ]),
    className: PropTypes.string,
    style: PropTypes.object,
    onClick: PropTypes.func,
};

export default OptimizedImage;
