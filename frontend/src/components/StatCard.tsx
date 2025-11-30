import React from 'react';
import { Card, CardContent, Typography, Box, Avatar } from '@mui/material';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, gradient, iconBg }) => {
  return (
    <Card
      sx={{
        borderRadius: 3,
        background: gradient,
        color: 'white',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
        }
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight={600} sx={{ opacity: 0.95 }}>
            {title}
          </Typography>
          <Avatar sx={{ bgcolor: iconBg || 'rgba(255,255,255,0.3)' }}>
            {icon}
          </Avatar>
        </Box>
        <Typography variant="h3" fontWeight={700}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
