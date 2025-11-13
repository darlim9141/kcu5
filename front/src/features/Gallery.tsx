import { Box } from "@mui/material";
import HTMLFlipBook from "react-pageflip";
import Upload from "./Upload";
import "../styles/flipbook.css"

export default function Gallery() {
    return (
        <Box sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            
        }}>
            <HTMLFlipBook
                className="gallery-book"
                style={{}}
                startPage={0}
                size="stretch"
                width={320}
                height={480}
                minWidth={300}
                maxWidth={1000}
                minHeight={400}
                maxHeight={1536}
                drawShadow
                flippingTime={1000}
                usePortrait
                startZIndex={1}
                autoSize
                maxShadowOpacity={0.5}
                showCover={false}
                mobileScrollSupport
                clickEventForward
                useMouseEvents
                swipeDistance={30}
                showPageCorners
                disableFlipByClick={false}
            >
                <Upload />
                <div className="demoPage">Page 1</div>
                <div className="demoPage">Page 2</div>
                <div className="demoPage">Page 3</div>
            </HTMLFlipBook>
        </Box>
    )
}