import { Box } from "@mui/material";
import { Add } from "@mui/icons-material";
import HTMLFlipBook from "react-pageflip";
import Upload, { type UploadHandle } from "./Upload";
import "../styles/flipbook.css"
import { useEffect, useRef, useState, forwardRef, useCallback } from "react";
import { getResults, deleteResult, type StoredResult } from "../utils/storage";
import ResultsModal, { type AnalysisResult } from "./Results";
import LoadingOverlay from "../components/LoadingOverlay";
import paperTexture from "../assets/paper_texture.jpg";
import spiralTexture from "../assets/spirals.jpg";

interface PageProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    number?: number;
}

const Page = forwardRef<HTMLDivElement, PageProps>((props, ref) => {
    const { children, number, style, className, ...rest } = props;
    const isEven = number ? number % 2 === 0 : false;
    const spiralWidth = '25px'; // Reduced width

    return (
        <div
            className={`demoPage ${className || ''}`}
            style={style}
            ref={ref}
            {...rest}
        >
            <Box sx={{
                position: "relative",
                height: "100%",
                p: 2,
                // Add padding to content to avoid spiral overlap
                [isEven ? 'pl' : 'pr']: `calc(16px + ${spiralWidth})`
            }}>
                {children}
            </Box>
            {/* Texture Overlay */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(${paperTexture})`,
                    backgroundSize: 'cover',
                    // mixBlendMode: 'multiply', // Removed to prevent 3D rendering issues
                    pointerEvents: 'none',
                    opacity: 0.1, // Reduced opacity since we're not blending
                    zIndex: 2
                }}
            />
            {/* Spiral Binding Overlay */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    [isEven ? 'left' : 'right']: 0,
                    width: spiralWidth,
                    height: '100%',
                    backgroundImage: `url(${spiralTexture})`,
                    backgroundSize: '100% 100%', // Stretch to fit the narrow width (effectively cropping/squashing slightly but maintaining look)
                    transform: isEven ? 'scaleX(-1)' : 'none',
                    zIndex: 20,
                    pointerEvents: 'none',
                    mixBlendMode: 'multiply' // Make white background transparent
                }}
            />
        </div>
    );
});

// Helper component to stop native event propagation
const StopPropagationWrapper = ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const stopEvent = (e: Event) => {
            e.stopPropagation();
        };

        const handleClick = (e: Event) => {
            e.stopPropagation();
            if (onClick) onClick();
        };

        // Stop all possible events that might trigger the flipbook
        element.addEventListener('mousedown', stopEvent);
        element.addEventListener('mouseup', stopEvent);
        element.addEventListener('touchstart', stopEvent);
        element.addEventListener('touchend', stopEvent);
        element.addEventListener('pointerdown', stopEvent);
        element.addEventListener('pointerup', stopEvent);
        element.addEventListener('click', handleClick);

        return () => {
            element.removeEventListener('mousedown', stopEvent);
            element.removeEventListener('mouseup', stopEvent);
            element.removeEventListener('touchstart', stopEvent);
            element.removeEventListener('touchend', stopEvent);
            element.removeEventListener('pointerdown', stopEvent);
            element.removeEventListener('pointerup', stopEvent);
            element.removeEventListener('click', handleClick);
        };
    }, [onClick]);

    return <div ref={ref} style={{ width: '100%', height: '100%', cursor: 'pointer', position: 'relative', zIndex: 10 }}>{children}</div>;
};



export default function Gallery() {
    // const isMobile = useMediaQuery(theme.breakpoints.down('md')); // Removed dependency on breakpoint for layout
    const [results, setResults] = useState<StoredResult[]>([]);
    const uploadRef = useRef<UploadHandle>(null);

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedResults, setSelectedResults] = useState<AnalysisResult[]>([]);
    const [selectedRawResults, setSelectedRawResults] = useState<any[]>([]);

    // Loading Overlay State
    const [loadingOverlayOpen, setLoadingOverlayOpen] = useState(false);
    const [uploadingImages, setUploadingImages] = useState<string[]>([]);

    // Book Dimensions State
    // We now track scale instead of raw width/height for the book itself
    const [layoutState, setLayoutState] = useState({
        scale: 1,
        isPortrait: false
    });
    const [page, setPage] = useState(0); // Track current page

    const loadResults = async () => {
        const data = await getResults();
        setResults(data);
    };

    useEffect(() => {
        loadResults();
    }, []);

    // Responsive Resize Logic
    const calculateLayout = useCallback(() => {
        // Reduced padding to maximize screen usage
        const paddingX = 32; // 16px * 2
        // Increased top padding to avoid menu overlap (approx 64px for AppBar + extra)
        const paddingY = 32;
        const topOffset = 80; // Space for menu

        const availableWidth = window.innerWidth - paddingX;
        const availableHeight = window.innerHeight - paddingY - topOffset;

        // Determine mode based on aspect ratio
        // User request: Height > Width -> 1 Page (Portrait)
        // Width >= Height -> 2 Pages (Landscape/Square)
        const isPortraitMode = availableHeight > availableWidth;

        // Base dimensions for calculation (High resolution)
        const BASE_PAGE_WIDTH = 800;
        const BASE_PAGE_HEIGHT = 850;

        // Calculate required width based on mode
        // Portrait: 1 Page (800)
        // Landscape: 2 Pages (1600)
        const targetBaseWidth = isPortraitMode ? BASE_PAGE_WIDTH : BASE_PAGE_WIDTH * 2;

        // Calculate Scale
        // We need to fit targetBaseWidth x BASE_PAGE_HEIGHT into availableWidth x availableHeight
        const scaleX = availableWidth / targetBaseWidth;
        const scaleY = availableHeight / BASE_PAGE_HEIGHT;

        // Use the smaller scale to ensure it fits entirely
        const scale = Math.min(scaleX, scaleY);

        setLayoutState({
            scale: scale,
            isPortrait: isPortraitMode
        });
    }, []);

    useEffect(() => {
        calculateLayout();
        window.addEventListener('resize', calculateLayout);
        return () => window.removeEventListener('resize', calculateLayout);
    }, [calculateLayout]);


    const handleItemClick = (item: StoredResult) => {
        setSelectedResults([{
            id: item.id,
            imageUrl: item.imageUrl,
            label: item.label,
            confidence: item.confidence,
            description: item.timestamp ? new Date(item.timestamp).toLocaleString() : undefined,
            accessories: item.accessories
        }]);
        setSelectedRawResults([item.rawResult]);
        setModalOpen(true);
    };

    const handleUploadStart = (files: { file: File, preview: string }[]) => {
        setUploadingImages(files.map(f => f.preview));
        setLoadingOverlayOpen(true);
        // Clear previous selection for new batch
        setSelectedResults([]);
        setSelectedRawResults([]);
    };

    const handleUploadResult = (result: StoredResult, rawResult: any) => {
        // Add to results list immediately
        setResults(prev => [...prev, result]);

        // Add to modal selection (accumulate results)
        const mappedResult = {
            id: result.id,
            imageUrl: result.imageUrl,
            label: result.label,
            confidence: result.confidence,
            description: result.timestamp ? new Date(result.timestamp).toLocaleString() : undefined,

            accessories: result.accessories
        };

        setSelectedResults(prev => [...prev, mappedResult]);
        setSelectedRawResults(prev => [...prev, rawResult]);
    };

    const handleUploadComplete = () => {
        // Hide overlay and show results modal
        setLoadingOverlayOpen(false);
        setModalOpen(true);
    };

    const handleDeleteResult = async (id: string) => {
        await deleteResult(id);
        await loadResults();
        setModalOpen(false);
        setSelectedResults([]);
        setSelectedRawResults([]);
    };

    const handleAddClick = () => {
        if (uploadRef.current) {
            uploadRef.current.open();
        }
    };

    const handleModalClose = () => {
        setModalOpen(false);
        setSelectedResults([]);
        setSelectedRawResults([]);
    };

    const ITEMS_PER_PAGE = 20;

    // Grid Logic:
    // Slot 0: Add Button (Fixed)
    // Slot 1: "Add Photos" Label (Fixed)
    // Slot 2, 4, 6...: Metadata (Date/Time)
    // Slot 3, 5, 7...: Photo

    // Each result takes 2 slots.
    // Total slots needed = 2 (Fixed) + (Results.length * 2)
    const totalSlots = 2 + (results.length * 2);
    const totalPages = Math.ceil(totalSlots / ITEMS_PER_PAGE);
    const pagesToRender = Math.max(totalPages, 1);

    // Base dimensions constants
    const BASE_WIDTH = 800;
    const BASE_HEIGHT = 850;

    return (
        <Box sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            width: "100vw",
            pt: "80px", // Increased top padding for menu
            pb: 2,
            px: 2,
            boxSizing: "border-box",
            overflow: "hidden" // Prevent scrollbars
        }}>
            {/* Hidden Upload Component to handle dialog */}
            <Upload
                ref={uploadRef}
                onUploadStart={handleUploadStart}
                onResult={handleUploadResult}
                onComplete={handleUploadComplete}
            />

            <LoadingOverlay open={loadingOverlayOpen} images={uploadingImages} />

            <ResultsModal
                open={modalOpen}
                onClose={handleModalClose}
                onDelete={handleDeleteResult}
                results={selectedResults}
                rawResults={selectedRawResults}
            />

            {/* Wrapper for responsive resizing */}
            <div style={{
                // The wrapper needs to be the size of the SCALED book to take up correct space in the flex container
                width: (layoutState.isPortrait ? BASE_WIDTH : BASE_WIDTH * 2) * layoutState.scale,
                height: BASE_HEIGHT * layoutState.scale,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative' // For absolute positioning of the scaled child if needed, though flex handles it here
            }}>
                {/* Inner container that gets scaled */}
                <div style={{
                    transform: `scale(${layoutState.scale})`,
                    transformOrigin: 'center center',
                    // We set the size to the BASE size here
                    width: layoutState.isPortrait ? BASE_WIDTH : BASE_WIDTH * 2,
                    height: BASE_HEIGHT,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <HTMLFlipBook
                        key={layoutState.isPortrait ? 'portrait' : 'landscape'} // Force re-render on mode change
                        className="gallery-book"
                        style={{}}
                        startPage={page} // Preserve page
                        onFlip={(e) => setPage(e.data)} // Track page
                        size="fixed" // Use fixed size for robust rendering
                        width={BASE_WIDTH}
                        height={BASE_HEIGHT}
                        minWidth={BASE_WIDTH}
                        maxWidth={BASE_WIDTH}
                        minHeight={BASE_HEIGHT}
                        maxHeight={BASE_HEIGHT}
                        drawShadow
                        flippingTime={900}
                        usePortrait={layoutState.isPortrait}
                        startZIndex={0}
                        autoSize={true}
                        maxShadowOpacity={0.5}
                        showCover={false}
                        mobileScrollSupport
                        clickEventForward={!modalOpen}
                        useMouseEvents={!modalOpen}
                        swipeDistance={30}
                        showPageCorners={false} // Disable hover animation (peeling)
                        disableFlipByClick={modalOpen}
                    >
                        {Array.from({ length: pagesToRender }).map((_, pageIndex) => (
                            <Page key={pageIndex} number={pageIndex + 1}>
                                <div className="grid-page">
                                    {Array.from({ length: ITEMS_PER_PAGE }).map((_, itemIndex) => {
                                        const globalIndex = pageIndex * ITEMS_PER_PAGE + itemIndex;
                                        let content;
                                        let onClick = undefined;
                                        let style: React.CSSProperties = {};

                                        if (globalIndex === 0) {
                                            // Slot 0: Add Button
                                            content = <Add sx={{ fontSize: 40, color: "#ccc" }} />;
                                            onClick = handleAddClick;
                                            style = { cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' };
                                        } else if (globalIndex === 1) {
                                            // Slot 1: Label
                                            content = "Add Photos";
                                            style = { display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#666' };
                                        } else {
                                            // Results start from index 2
                                            // Result Index = (Global Index - 2) / 2
                                            // If even (2, 4, 6...), it's Metadata (Result Index = (2-2)/2 = 0, (4-2)/2 = 1)
                                            // If odd (3, 5, 7...), it's Photo (Result Index = (3-2)/2 = 0.5 -> same result)

                                            const adjustedIndex = globalIndex - 2;
                                            const resultIndex = Math.floor(adjustedIndex / 2);
                                            // User wants Photo first, then Metadata.
                                            // Slot 2 (Adj 0): Photo
                                            // Slot 3 (Adj 1): Metadata
                                            const isMeta = adjustedIndex % 2 !== 0;

                                            if (resultIndex < results.length) {
                                                const item = results[resultIndex];

                                                if (isMeta) {
                                                    // Metadata Slot
                                                    const date = item.timestamp ? new Date(item.timestamp) : new Date();
                                                    content = (
                                                        <div style={{ fontSize: "12px", textAlign: "center", padding: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                                                            <div style={{ fontWeight: 'bold' }}>{date.toLocaleDateString()}</div>
                                                            <div style={{ color: '#666' }}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                        </div>
                                                    );
                                                } else {
                                                    // Photo Slot
                                                    const storedItem = item as StoredResult;
                                                    content = (
                                                        <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
                                                            <img
                                                                src={storedItem.imageUrl}
                                                                alt={storedItem.label}
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            />
                                                        </div>
                                                    );

                                                    // Use the wrapper to handle click and stop propagation natively
                                                    content = (
                                                        <StopPropagationWrapper onClick={() => handleItemClick(storedItem)}>
                                                            {content}
                                                        </StopPropagationWrapper>
                                                    );

                                                    style = {};
                                                }
                                            } else {
                                                // Empty slot
                                                content = null;
                                            }
                                        }

                                        return (
                                            <div
                                                className="grid-item"
                                                key={itemIndex}
                                                // onClick is handled inside content for photos
                                                onClick={globalIndex === 0 ? onClick : undefined}
                                                style={style}
                                            >
                                                {content}
                                            </div>
                                        );
                                    })}
                                </div>
                            </Page>
                        ))}
                    </HTMLFlipBook>
                </div>
            </div>
        </Box>
    )
}