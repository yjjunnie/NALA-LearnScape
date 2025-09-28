import React, { useMemo } from "react";
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from "@mui/material";
import {
  HomeRounded as HomeIcon,
  SchoolRounded as CourseIcon,
  CloseRounded as CloseIcon,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";

interface SideNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const SideNav: React.FC<SideNavProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = useMemo(
    () => [
      { 
        label: "Home", 
        path: "/", 
        icon: <HomeIcon />,
        description: "View your dashboard" 
      },
      { 
        label: "Modules", 
        path: "/Modules", 
        icon: <CourseIcon />,
        description: "Browse your modules" 
      },
    ],
    []
  );

  const handleNavigate = (path: string): void => {
    navigate(path);
    onClose();
  };

  return (
    <Drawer
      anchor="left"
      open={isOpen}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '85vw', sm: 320 },
          maxWidth: 400,
          backgroundColor: "#ffffff",
          borderTopRightRadius: 24,
          borderBottomRightRadius: 24,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        },
      }}
      ModalProps={{
        BackdropProps: {
          sx: {
            backgroundColor: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(4px)',
          }
        }
      }}
    >
      <Box sx={{ p: 3 }}>
        {/* Drawer Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              color: "#1A2C5E",
              fontWeight: 700,
              fontFamily: 'Fredoka',
            }}
          >
            Navigation
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'rgba(76,115,255,0.05)',
              }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Navigation Items */}
        <List sx={{ p: 0 }}>
          {navigationItems.map((item, index) => (
            <ListItemButton
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                mb: 1,
                borderRadius: 3,
                py: 1.5,
                px: 2,
                transition: 'all 0.2s ease-in-out',
                backgroundColor: location.pathname === item.path
                  ? "rgba(76,115,255,0.1)"
                  : "transparent",
                "&:hover": {
                  backgroundColor: location.pathname === item.path
                    ? "rgba(76,115,255,0.15)"
                    : "rgba(76,115,255,0.05)",
                  transform: 'translateX(4px)',
                },
                "&.Mui-selected": {
                  "&:hover": {
                    backgroundColor: "rgba(76,115,255,0.15)",
                  }
                }
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path
                    ? "primary.main"
                    : "text.secondary",
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                secondary={item.description}
                primaryTypographyProps={{
                  fontWeight: location.pathname === item.path ? 600 : 500,
                  sx: {
                    color: location.pathname === item.path
                      ? "primary.main"
                      : "text.primary",
                    fontFamily: 'Fredoka',
                  },
                }}
                secondaryTypographyProps={{
                  variant: 'caption',
                  sx: { mt: 0.5 }
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default SideNav;