import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";

interface LoadingOverlayProps {
  open: boolean;
  images: string[]; // Array of image preview URLs
}

export default function LoadingOverlay({ open, images }: LoadingOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!open || images.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 2000); // Change image every 2000ms

    return () => clearInterval(interval);
  }, [open, images.length]);

  if (!open) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        bgcolor: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(10px)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box sx={{ position: "relative", width: 300, height: 400, perspective: 1000 }}>
        <AnimatePresence mode="popLayout">
          {images.map((src, index) => {
            // Calculate relative position for coverflow effect
            // We only show current, previous, and next for simplicity in animation
            // But for a loading screen, just cycling the center one with a nice transition is often cleaner.
            // Let's try a stack/coverflow feel where they slide in.
            
            if (index !== currentIndex) return null;

            return (
              <motion.div
                key={`${src}-${index}`}
                initial={{ opacity: 0, scale: 0.8, x: 100, rotateY: -45 }}
                animate={{ opacity: 1, scale: 1, x: 0, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: -100, rotateY: 45 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                  border: "2px solid rgba(255,255,255,0.1)",
                }}
              >
                <img
                  src={src}
                  alt="Analyzing"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </Box>

      <Typography
        variant="h5"
        sx={{
          mt: 4,
          color: "white",
          fontWeight: "bold",
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        <motion.span
          initial={{ opacity: 0.3 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
        >
          Analyzing...
        </motion.span>
      </Typography>
      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", mt: 1 }}>
        잠시만 기다려 주세요
      </Typography>
    </Box>
  );
}
