import { Tooltip } from '@mui/material';

const CustomTooltip = ({ 
  children, 
  content, 
  placement = "top",
  backgroundColor = 'rgba(40,72,209,0.95)',
  textColor = '#ffffff',
  fontSize = '12px',
  fontFamily = '"GlacialIndifference", sans-serif',
  maxWidth = '250px',
  arrow = true,
  ...props 
}) => {
  return (
    <Tooltip
      title={content}
      arrow={arrow}
      placement={placement}
      componentsProps={{
        tooltip: {
          sx: {
            backgroundColor,
            color: textColor,
            fontSize,
            fontFamily,
            maxWidth,
            ...(arrow && {
              '& .MuiTooltip-arrow': {
                color: backgroundColor,
              }
            })
          }
        }
      }}
      {...props}
    >
      {children}
    </Tooltip>
  );
};

export default CustomTooltip;