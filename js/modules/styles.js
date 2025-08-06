'use strict';

// Styles for SEO AI Assistant

// Định nghĩa tất cả styles làm một JavaScript object
export const styles = {
  // Hệ thống màu sắc để sử dụng xuyên suốt ứng dụng
  colors: {
    primary: '#2563eb',    // Xanh chính
    secondary: '#9333ea',  // Tím phụ
    success: '#10b981',    // Xanh lá - thành công
    warning: '#f59e0b',    // Cam - cảnh báo  
    error: '#ef4444',      // Đỏ - lỗi
    info: '#3b82f6',       // Xanh dương - thông tin
    muted: '#6b7280',      // Xám - texxt nhạt
    background: '#1a202c'  // Nền tối
  },
  container: {
    width: '768px',
      minHeight: '480px',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(to bottom right, #1a202c, #2a4365, #364fc7)',
      color: 'white'
    },
    header: {
      background: 'linear-gradient(to right, #2563eb, #9333ea)',
      padding: '16px',
      borderTopLeftRadius: '0.5rem',
      borderTopRightRadius: '0.5rem'
    },
    headerFlex: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    logoContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    logoIcon: {
      background: 'white',
      borderRadius: '9999px',
      padding: '4px'
    },
    logoSvg: {
      width: '20px',
      height: '20px',
      color: '#2563eb'
    },
    headerTitle: {
      fontSize: '1.125rem',
      fontWeight: 'bold'
    },
  // SERP Preview styles - Cập nhật theo tiêu chuẩn Google
  serpPreview: {
    padding: '16px',
    backgroundColor: 'rgba(30, 41, 59, 0.7)', // Nền tối, hơi trong suốt để hài hòa
    borderBottom: '1px solid rgba(71, 85, 105, 0.5)',
    color: '#e2e8f0',
    fontFamily: 'Arial, sans-serif' // Google dùng Arial cho SERP
  },
  serpTitle: {
    fontSize: '16px', // Google sử dụng 16px cho title
    fontWeight: '500',
    marginBottom: '4px',
    color: '#8ab4f8', // Màu xanh như Google sử dụng
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    lineHeight: '1.3'
  },
  serpUrl: {
    fontSize: '13px', // Google sử dụng 13px cho URL
    color: '#86efac', // Giữ màu xanh lá nhạt cho URL như cũ
    marginBottom: '8px',
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  serpDescription: {
    fontSize: '13px', // Google sử dụng 13px cho description
    color: '#bdc1c6', // Màu xám nhạt như Google sử dụng
    lineHeight: '1.55',
    display: '-webkit-box',
    WebkitLineClamp: '3',
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  serpWarning: {
    fontSize: '0.75rem',
    color: '#fca5a5', // Màu đỏ nhạt hơn cho cảnh báo
    marginTop: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
    navTabs: {
      display: 'grid',
      gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
      background: 'rgba(0, 0, 0, 0.3)'
    },
    navTab: {
      padding: '8px 4px',
      fontSize: '0.9rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#9ca3af',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer'
    },
    navTabActive: {
      color: '#60a5fa',
      borderBottomWidth: '2px',
      borderBottomColor: '#60a5fa',
      borderBottomStyle: 'solid'
    },
    tabIcon: {
      fontSize: '1rem',
      marginBottom: '4px'
    },
    contentArea: {
      flex: '1',
      overflow: 'auto',
      padding: '16px'
    },
    scoreCircle: {
      width: '8rem',
      height: '8rem',
      borderRadius: '9999px',
      borderWidth: '4px',
      borderColor: '#374151',
      borderStyle: 'solid',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(to bottom right, #1e3a8a, #4c1d95)'
    },
    scoreContainer: {
      display: 'flex',
      justifyContent: 'center',
      margin: '16px 0'
    },
    scoreText: {
      textAlign: 'center'
    },
    scoreValue: {
      display: 'block',
      fontSize: '1.875rem',
      fontWeight: 'bold',
      color: 'white'
    },
    scoreLabel: {
      fontSize: '0.75rem',
      color: '#93c5fd'
    },
    cardSection: {
      background: 'rgba(0, 0, 0, 0.2)',
      padding: '12px',
      borderRadius: '0.5rem',
      marginBottom: '12px'
    },
    cardTitle: {
      fontSize: '0.875rem',
      fontWeight: '500',
      color: 'white',
      marginBottom: '8px'
    },
    metaInfoItem: {
      marginBottom: '8px'
    },
    metaLabel: {
      fontSize: '0.75rem',
      color: '#9ca3af'
    },
    metaValue: {
      fontSize: '0.875rem',
      color: 'white'
    },
    metaSubtext: {
      fontSize: '0.75rem',
      color: '#9ca3af'
    },
    gridStats: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: '8px'
    },
    statItem: {
      display: 'flex',
      flexDirection: 'column'
    },
    statLabel: {
      fontSize: '0.75rem',
      color: '#9ca3af'
    },
    statValue: {
      fontSize: '1.125rem',
      fontWeight: 'bold',
      color: 'white'
    },
    flexRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    flexItems: {
      display: 'flex',
      alignItems: 'center'
    },
    iconSmall: {
      marginRight: '8px',
      color: '#10b981'
    },
    iconWarning: {
      marginRight: '8px',
      color: '#f59e0b'
    },
    issueCard: {
      display: 'flex',
      alignItems: 'flex-start',
      padding: '8px',
      marginBottom: '8px',
      borderRadius: '0.25rem',
      background: 'rgba(0, 0, 0, 0.2)'
    },
    issueIconCritical: {
      color: '#ef4444',
      marginRight: '8px'
    },
    issueIconWarning: {
      color: '#f59e0b',
      marginRight: '8px'
    },
    issueIconInfo: {
      color: '#3b82f6',
      marginRight: '8px'
    },
    issueText: {
      fontSize: '0.875rem',
      color: 'white'
    },
    issueSubtext: {
      fontSize: '0.75rem',
      color: '#9ca3af',
      marginTop: '4px'
    },
    footer: {
      borderTopWidth: '1px',
      borderColor: '#1f2937',
      borderTopStyle: 'solid',
      padding: '12px',
      background: 'rgba(0, 0, 0, 0.3)',
      textAlign: 'center'
    },
    footerText: {
      fontSize: '0.75rem',
      color: '#6b7280'
    },
    progressBar: {
      position: 'relative',
      height: '8px',
      backgroundColor: '#4b5563',
      borderRadius: '0.25rem',
      overflow: 'hidden'
    },
    progressFill: {
      position: 'absolute',
      top: '0',
      left: '0',
      height: '100%'
    },
    buttonPrimary: {
      width: '100%',
      background: 'linear-gradient(to right, #2563eb, #9333ea)',
      padding: '8px 0',
      borderRadius: '0.25rem',
      color: 'white',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      border: 'none'
    },
    spaceY3: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    aiGradient: {
      background: 'linear-gradient(to right, rgba(30, 64, 175, 0.4), rgba(125, 39, 175, 0.4))',
      padding: '16px',
      borderRadius: '0.5rem'
    },
    // Styles mới hoặc được cập nhật để sửa lỗi màu sắc
    lightBackground: {
      backgroundColor: '#f8fafc',
      color: '#1e293b',  // Màu text đậm hơn trên nền sáng
      borderRadius: '6px',
      padding: '12px'
    },
    darkText: {
      color: '#1e293b'  // Màu text tối trên nền sáng
    },
    semiDarkText: {
      color: '#475569'  // Màu text hơi tối một chút trên nền sáng
    },
    contrastText: {
      color: '#f8fafc'  // Màu text sáng trên nền tối
    },
    lightContrastText: {
      color: '#e2e8f0'  // Màu text hơi nhạt hơn trên nền tối
    },
    // Style cho các nút và hành động
    actionButton: {
      padding: '6px 12px',
      backgroundColor: '#2563eb',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: '500'
    },
    // Style cho các block có nền sáng
    lightBlock: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      color: '#1e293b',
      borderRadius: '6px',
      padding: '12px'
  }
};

// No need for window export anymore
