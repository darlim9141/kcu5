import { useState, useEffect, useRef, useCallback } from 'react';
import { Box, CircularProgress } from '@mui/material';
import axios from 'axios';

interface StyleFeedProps {
    style: string;
}

const StyleFeed = ({ style }: StyleFeedProps) => {
    const [images, setImages] = useState<{ image: string, title: string, url: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(1);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    const fetchImages = useCallback(async () => {
        if (loading) return;
        setLoading(true);
        try {
            // Use the backend endpoint
            // We re-fetch to get a new random set
            const response = await axios.get(`http://localhost:8000/crawl/images`, {
                params: { style }
            });
            
            const newImages = response.data.images || [];
            
            setImages(prev => {
                // Filter duplicates based on image URL
                const existingUrls = new Set(prev.map(img => img.image));
                const uniqueNewImages = newImages.filter((img: any) => !existingUrls.has(img.image));
                return [...prev, ...uniqueNewImages];
            });
            
        } catch (error) {
            console.error("Failed to fetch style feed:", error);
        } finally {
            setLoading(false);
        }
    }, [style]); // Remove loading dependency to avoid stale closure issues if managed carefully, but here we guard inside

    // Initial fetch
    useEffect(() => {
        setImages([]); // Reset on style change
        setFailedImages(new Set()); // Reset failed images
        setPage(1);
        fetchImages();
    }, [style]);

    // Infinite Scroll Observer
    useEffect(() => {
        if (loading) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    fetchImages();
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        observerRef.current = observer;

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [fetchImages, loading]);

    if (images.length === 0 && loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    if (images.length === 0) {
        return null; 
    }

    return (
        <Box sx={{ 
            columnCount: { xs: 2, md: 4 }, 
            columnGap: '16px',
            px: 2
        }}>
            {images.map((img, index) => {
                if (failedImages.has(img.image)) return null;

                return (
                <Box key={index} sx={{ 
                    breakInside: 'avoid', 
                    mb: 2, 
                    borderRadius: '16px', 
                    overflow: 'hidden',
                    bgcolor: 'white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    position: 'relative',
                    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                    '&:hover': {
                        transform: 'scale(1.05)',
                        zIndex: 1,
                        boxShadow: '0 12px 24px rgba(0,0,0,0.15)'
                    }
                }}>
                    <a href={img.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                        <img 
                            src={img.image} 
                            alt={img.title} 
                            onError={() => setFailedImages(prev => {
                                const newSet = new Set(prev);
                                newSet.add(img.image);
                                return newSet;
                            })}
                            style={{ 
                                width: '100%', 
                                display: 'block', 
                                height: 'auto'
                            }} 
                            loading="lazy"
                        />
                    </a>
                </Box>
            )})}
            
            {/* Sentinel for Infinite Scroll */}
            <Box ref={loadMoreRef} sx={{ height: '20px', width: '100%', display: 'flex', justifyContent: 'center', mt: 2 }}>
                {loading && <CircularProgress size={20} />}
            </Box>
        </Box>
    );
};

export default StyleFeed;
