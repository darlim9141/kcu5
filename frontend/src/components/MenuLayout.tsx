import { AppBar, Box, Toolbar, IconButton, Typography, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Divider, Link as MLink } from "@mui/material";
import type React from "react";
import { useState } from "react";
import { Settings, Image, Instagram, GitHub, CloseRounded, MenuRounded, BarChart } from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";

export default function MenuLayout({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);

    return (
        <Box sx={{ position: "", height: "100dvh", overflow: "hidden", bgcolor: "background.default" }}>
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
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.5)",
                            border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.2)"}`,
                            backdropFilter: "blur(10px)",
                            WebkitBackdropFilter: "blur(10px)",
                            color: 'text.primary'
                        }}
                    >
                        {open ? <CloseRounded/> : <MenuRounded/>}
                    </IconButton>
                    <Typography sx={{ ml: 2, fontWeight: 1000, color: 'text.primary' }}>모입</Typography>
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
                    sx: (theme) => ({
                        position: "absolute",
                        top: { xs: theme.spacing(9), sm: theme.spacing(10) },
                        // bottom: theme.spacing(2),
                        ml: { xs: 1.5, sm: 2 },
                        mr: 2,
                        width: { xs: 260, sm: 300 },
                        height: "auto",
                        maxHeight: "70vh",
                        borderRadius: 3,
                        paddingTop: "60px",
                        p: 1.5,
                        color: "text.primary",
                        background: theme.palette.mode === 'dark' ? "rgba(44, 44, 46, 0.8)" : "rgba(255,255,255,0.12)",
                        border: "1px solid rgba(255,255,255,0.25)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)"
                    })
                }}
            >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                    <Box sx={{ flex: 1 }}>
                        <List>
                            <ListItemButton component={RouterLink} to ="/gallery" onClick={() => setOpen(false)}>
                                <ListItemIcon sx={{ color: "text.primary" }}><Image /></ListItemIcon>
                                <ListItemText primary="갤러리" />
                            </ListItemButton>
                            <ListItemButton component={RouterLink} to = "/statistic" onClick={() => setOpen(false)}>
                                <ListItemIcon sx={{ color: "text.primary" }}><BarChart /></ListItemIcon>
                                <ListItemText primary="통계" />                             
                            </ListItemButton>
                            <ListItemButton component={RouterLink} to="/settings" onClick={() => setOpen(false)}>
                                <ListItemIcon sx={{ color: "text.primary" }}><Settings /></ListItemIcon>
                                <ListItemText primary="설정" />
                            </ListItemButton>
                        </List>
                    </Box>
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                    <Box sx={{ display: "flex", gap: 1.5, p:2 }}>
                        <MLink href="https://www.instagram.com/kcu_madison/" target="_blank" color="text.primary" underline="none"><Instagram /></MLink>
                        <MLink href="https://github.com/darlim9141/kcu5" target="_blank" color="text.primary" underline="none"><GitHub /></MLink>
                    </Box>
                </Box>
            </Drawer>      

            <Box component="main" sx={{ height: "100%", position: "relative" }}>
                {children}
            </Box>
        </Box>
    )
}
