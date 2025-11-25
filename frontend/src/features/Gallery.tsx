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
            paddingTop: "64px" // AppBar 높이 고려해서 해당 박스가 상단바와 겹치지 않도록 조정

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
                flippingTime={800} // 속도 수정 (1000ms -> 800ms)
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