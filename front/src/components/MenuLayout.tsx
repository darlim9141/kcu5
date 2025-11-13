import { AppBar, Box, Toolbar, IconButton, Typography, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Divider, Link as MLink } from "@mui/material";
import type React from "react";
import { useState } from "react";
import { Settings, Image, Instagram, GitHub, CloseRounded, MenuRounded } from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";

export default function MenuLayout({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);

    return (
        <Box sx={{ position: "relative", height: "100dvh", overflow: "hidden" }}>
            <AppBar color="transparent" elevation={0} position="fixed" sx={{ 
                    zIndex: (t) => t.zIndex.drawer + 1,
                    backdropFilter: "none",
                    background: "transparent",
                }}>
                <Toolbar>
                    <IconButton
                        onClick={() => setOpen(v => !v)}
                        aria-label={open ? "close menu" : "open menu"}
                        sx={{
                            position: "relative",
                            zIndex: (t) => t.zIndex.drawer + 2,
                            width: 44, height: 44, borderRadius: "50%",
                            bgcolor: "rgba(255, 255, 255, 0.5)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            backdropFilter: "blur(10px)",
                            WebkitBackdropFilter: "blur(10px)",
                            // boxShadow: "0 8px 24px rgba(0,0,0,.25)",
                        }}
                    >
                        {open ? <CloseRounded/> : <MenuRounded/>}
                    </IconButton>
                    <Typography sx={{ ml: 1, fontWeight: 800 }}>T</Typography>
                </Toolbar>
            </AppBar>

            <Drawer anchor="left" open={open} onClose={() => setOpen(false)}
                ModalProps={{
                    keepMounted: true,
                    BackdropProps: {
                        sx: {
                            backgroundColor: "rgba(0,0,0,0.3)",
                            backdropFilter: "blur(3px)",
                            WebkitBackdropFilter: "blur(3px)",
                        },
                    },
                }}
                PaperProps={{
                    sx: {
                        ml: { xs: 1.5, sm: 2 },
                        mt: 2, mb: 2, mr: 2,
                        width: {xs: 220, sm: 260},
                        height: "auto",
                        maxHeight: "70vh",
                        borderRadius: 3,
                        paddingTop: "100px",
                        p: 1.5,
                        color: "#fff",
                        background: "rgba(255,255,255,0.12)",
                        border: "1px solid rgba(255,255,255,0.25)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)"
                    }
                }}
            >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                    <Box sx={{ flex: 1 }}>
                        <List>
                            <ListItemButton component={RouterLink} to ="/gallery" onClick={() => setOpen(false)}>
                                <ListItemIcon><Image /></ListItemIcon>
                                <ListItemText primary="갤러리" />
                            </ListItemButton>
                            <ListItemButton component={RouterLink} to="/settings" onClick={() => setOpen(false)}>
                                <ListItemIcon><Settings /></ListItemIcon>
                                <ListItemText primary="설정" />
                            </ListItemButton>
                        </List>
                    </Box>
                    <Divider />
                    <Box sx={{ display: "flex", gap: 1.5, p:2 }}>
                        <MLink href="#" color="#666666ff" underline="none"><Instagram /></MLink>
                        <MLink href="#" color="#666666ff" underline="none"><GitHub /></MLink>
                    </Box>
                </Box>
            </Drawer>      

            <Box component="main" sx={{ height: "100%", position: "relative" }}>
                {children}
            </Box>
        </Box>
    )
}