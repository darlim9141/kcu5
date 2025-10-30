import { Box } from "@mui/material";
import { useBackgroundImages } from "../hooks/useBackgroundImages";

export default function BackgroundImages() {
    const images = useBackgroundImages();
    
    return (
        <Box sx={{ position: "absolute", inset: 0, overflow: "hidden" }}>
            <Box sx={{ position: "absolute", top: "50%", left: 16, transform: "translateY(-50%)", display: "flex", gap: 2 }}>
                {images.map((src, i) => (
                    <Box component="img" key={i} src={src} alt=""
                        sx={{ height: "56vh", objectFit: "cover" }} />
                ))}
            </Box>
        </Box>
    )
}