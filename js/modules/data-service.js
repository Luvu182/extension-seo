'use strict';

// Data service for SEO AI Assistant

// Mock data for the extension
const mockData = {
  url: 'https://example.com/page',
    title: 'Example Page | Your Brand',
    description: 'This is an example website showing various features and products...',
    seoScore: 78,
    metrics: {
      lcp: 2.4,
      fid: 19,
      cls: 0.08,
      ttfb: 0.6
    },
    canonical: {
      url: 'https://example.com/page',
      valid: true
    },
    hreflang: [
      { lang: 'en-us', url: 'https://example.com/page', valid: true },
      { lang: 'es', url: 'https://example.com/es/page', valid: true },
      { lang: 'fr', url: 'https://example.com/fr/page', valid: false }
    ],
    structured: {
      jsonLd: [
        { type: 'Product', properties: ['name', 'price', 'rating'] },
        { type: 'BreadcrumbList', properties: ['3 items'] }
      ],
      microdata: [
        { type: 'Person', properties: ['name', 'jobTitle'] }
      ]
    },
    links: {
      internal: 24,
      external: 8,
      nofollow: 3
    },
    amp: {
      hasAmp: true,
      url: 'https://example.com/amp/page',
      valid: true
    },
    robots: {
      allowed: true,
      directives: ['index', 'follow']
    },
    issues: {
      critical: [
        { type: 'error', message: 'Images missing alt text (3)' }
      ],
      warnings: [
        { type: 'warning', message: 'Meta description too short' }
      ],
      suggestions: [
        { type: 'info', message: 'Consider adding more internal links' }
      ]
    },
    // Add mock images data for image tab
    images: [
      {
        src: 'https://example.com/images/product1.jpg',
        alt: 'Premium eco-friendly water bottle with bamboo cap',
        width: 800,
        height: 600
      },
      {
        src: 'https://example.com/images/product2.jpg',
        alt: 'Sustainable yoga mat made from natural rubber',
        width: 1200,
        height: 800
      },
      {
        src: 'https://example.com/images/product3.jpg',
        alt: '',  // Missing alt text
        width: 640,
        height: 480
      },
      {
        src: 'https://example.com/images/banner.jpg',
        alt: null,  // Missing alt text
        width: 1920,
        height: 400
      },
      {
        src: 'https://example.com/images/team.jpg',
        alt: 'Our dedicated team of sustainability experts',
        width: 1200,
        height: 800
      },
      {
        src: 'https://example.com/images/logo-small.png',
        alt: '', // Missing alt text
        width: 100,
        height: 100
      }
    ],
    content: {
      headings: [
        { level: 1, text: 'Main Product Category' },
        { level: 2, text: 'Featured Products' },
        { level: 2, text: 'Product Benefits' },
        { level: 3, text: 'Sustainable Materials' },
        { level: 3, text: 'Quality Craftsmanship' },
        { level: 2, text: 'Customer Reviews' },
        { level: 4, text: 'Product Specifications' },
      ],
      wordCount: 1253
    }
  };

  // Bổ sung dữ liệu với các chỉ số phân tích
  function enhanceDataWithAnalytics(data) {
    // Sao chép dữ liệu để tránh thay đổi dữ liệu gốc
    const enhancedData = JSON.parse(JSON.stringify(data || mockData));
    
    // Thêm dữ liệu phân tích SEO nếu chưa có
    if (!enhancedData.seoScore) {
      // Tính điểm SEO dựa trên các yếu tố hiện có
      const contentScore = calculateContentScore(enhancedData);
      const technicalScore = calculateTechnicalScore(enhancedData);
      const onPageScore = calculateOnPageScore(enhancedData);
      const userExperienceScore = calculateUserExperienceScore(enhancedData);
      
      // Tính tổng điểm với trọng số
      enhancedData.seoScore = Math.round(
        (contentScore * 0.35) +
        (technicalScore * 0.25) +
        (onPageScore * 0.25) +
        (userExperienceScore * 0.15)
      );
    }
    
    return enhancedData;
  }

  // Tính điểm chất lượng nội dung
  function calculateContentScore(data) {
    let score = 80; // Điểm mặc định
    
    // Kiểm tra H1
    const h1Count = data.headings && data.headings.h1 ? data.headings.h1.length : 0;
    if (h1Count === 0) score -= 15;
    else if (h1Count > 1) score -= 5;
    
    // Kiểm tra cấu trúc heading
    const hasH2 = data.headings && data.headings.h2 && data.headings.h2.length > 0;
    const hasH3 = data.headings && data.headings.h3 && data.headings.h3.length > 0;
    if (!hasH2) score -= 10;
    if (!hasH3) score -= 5;
    
    // Kiểm tra độ dài tiêu đề
    if (data.title) {
      if (data.title.length < 30) score -= 5;
      else if (data.title.length > 60) score -= 3;
    } else {
      score -= 15;
    }
    
    // Kiểm tra meta description
    if (data.description) {
      if (data.description.length < 120) score -= 5;
      else if (data.description.length > 160) score -= 3;
    } else {
      score -= 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  // Tính điểm kỹ thuật
  function calculateTechnicalScore(data) {
    let score = 80; // Điểm mặc định
    
    // Kiểm tra status code
    const statusCode = data.statusCode || 200;
    if (statusCode !== 200) score -= 20;
    
    // Kiểm tra robots meta
    if (data.robots && data.robots.isNoindex) score -= 15;
    if (data.robots && data.robots.isNofollow) score -= 10;
    
    // Kiểm tra canonical
    if (!data.canonical) score -= 10;
    
    // Kiểm tra structured data
    const hasStructuredData = data.structured && 
      ((data.structured.jsonLd && data.structured.jsonLd.length > 0) || 
      (data.structured.microdata && data.structured.microdata.length > 0) ||
      (data.structured.rdfa && data.structured.rdfa.length > 0));
    
    if (!hasStructuredData) score -= 15;
    
    return Math.max(0, Math.min(100, score));
  }

  // Tính điểm on-page SEO
  function calculateOnPageScore(data) {
    let score = 80; // Điểm mặc định
    
    // Kiểm tra alt text cho hình ảnh
    if (data.images) {
      const totalImages = data.images.total || 0;
      const withoutAlt = data.images.withoutAlt || 0;
      
      if (totalImages > 0 && withoutAlt > 0) {
        const altTextPercentage = (withoutAlt / totalImages) * 100;
        if (altTextPercentage > 50) score -= 15;
        else if (altTextPercentage > 20) score -= 10;
        else if (altTextPercentage > 0) score -= 5;
      }
    }
    
    // Kiểm tra internal links
    if (data.links) {
      const internalLinks = data.links.internal || 0;
      if (internalLinks < 3) score -= 15;
      else if (internalLinks < 5) score -= 10;
      else if (internalLinks < 10) score -= 5;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  // Tính điểm trải nghiệm người dùng
  function calculateUserExperienceScore(data) {
    let score = 80; // Điểm mặc định
    
    // Kiểm tra các metrics nếu có
    if (data.metrics) {
      // LCP (Largest Contentful Paint)
      if (data.metrics.lcp > 4) score -= 20;
      else if (data.metrics.lcp > 2.5) score -= 10;
      
      // FID (First Input Delay)
      if (data.metrics.fid > 300) score -= 20;
      else if (data.metrics.fid > 100) score -= 10;
      
      // CLS (Cumulative Layout Shift)
      if (data.metrics.cls > 0.25) score -= 20;
      else if (data.metrics.cls > 0.1) score -= 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  // Tạo gợi ý từ AI dựa trên dữ liệu
  function getAISuggestions(data) {
    const suggestions = [];
    
    // Title suggestion
    if (!data.title) {
      suggestions.push('Thêm thẻ title cho trang web của bạn. Title giúp người dùng và công cụ tìm kiếm hiểu nội dung trang.');
    } else if (data.title.length < 30) {
      suggestions.push(`Mở rộng thẻ title (hiện tại ${data.title.length} ký tự) lên ít nhất 50 ký tự để tối ưu hóa hiển thị trên trang kết quả tìm kiếm.`);
    } else if (data.title.length > 60) {
      suggestions.push(`Rút ngắn thẻ title (hiện tại ${data.title.length} ký tự) xuống tối đa 60 ký tự để tránh bị cắt trên trang kết quả tìm kiếm.`);
    }
    
    // Meta description suggestion
    if (!data.description) {
      suggestions.push('Thêm meta description cho trang web. Meta description giúp cải thiện tỷ lệ click-through từ trang kết quả tìm kiếm.');
    } else if (data.description.length < 120) {
      suggestions.push(`Mở rộng meta description (hiện tại ${data.description.length} ký tự) lên khoảng 150-160 ký tự để tối ưu hiển thị trên trang kết quả tìm kiếm.`);
    } else if (data.description.length > 160) {
      suggestions.push(`Meta description hiện tại (${data.description.length} ký tự) quá dài. Rút ngắn xuống khoảng 150-160 ký tự để tránh bị cắt trên kết quả tìm kiếm.`);
    }
    
    // Headings suggestions
    const h1Count = data.headings && data.headings.h1 ? data.headings.h1.length : 0;
    if (h1Count === 0) {
      suggestions.push('Thêm thẻ H1 vào trang. Mỗi trang nên có một thẻ H1 để xác định chủ đề chính của trang.');
    } else if (h1Count > 1) {
      suggestions.push(`Trang hiện có ${h1Count} thẻ H1. Tốt nhất mỗi trang chỉ nên có một H1 để tránh nhầm lẫn về chủ đề chính.`);
    }
    
    // Image alt text suggestion
    if (data.images && data.images.total > 0 && data.images.withoutAlt > 0) {
      suggestions.push(`Thêm alt text cho ${data.images.withoutAlt} hình ảnh đang thiếu. Alt text giúp người dùng sử dụng trình đọc màn hình và giúp Google hiểu nội dung hình ảnh.`);
    }
    
    // Structured data suggestion
    const hasStructuredData = data.structured && 
      ((data.structured.jsonLd && data.structured.jsonLd.length > 0) || 
       (data.structured.microdata && data.structured.microdata.length > 0) ||
       (data.structured.rdfa && data.structured.rdfa.length > 0));
    
    if (!hasStructuredData) {
      suggestions.push('Thêm structured data (JSON-LD) để giúp Google hiểu nội dung trang web và hiển thị rich snippets trên trang kết quả tìm kiếm.');
    }
    
    // Links suggestion
    if (data.links && data.links.internal < 3) {
      suggestions.push('Tăng số lượng internal links để cải thiện cấu trúc trang web và phân phối giá trị SEO giữa các trang.');
    }
    
    // Performance suggestion if available
    if (data.metrics && data.metrics.lcp > 2.5) {
      suggestions.push(`Cải thiện tốc độ tải trang. LCP (Largest Contentful Paint) hiện tại là ${data.metrics.lcp}s, cao hơn ngưỡng 2.5s được Google khuyến nghị.`);
    }
    
    // If we don't have enough suggestions, add some general ones
    if (suggestions.length < 5) {
      const generalSuggestions = [
        'Cải thiện nội dung bằng cách bổ sung thông tin chi tiết, dữ liệu, và ví dụ để tăng giá trị cho người dùng.',
        'Tối ưu hóa URL để ngắn gọn, dễ đọc và chứa từ khóa chính.',
        'Thêm FAQ schema để tăng cơ hội xuất hiện trong featured snippets của Google.',
        'Tạo liên kết giữa các bài viết liên quan để người dùng dễ dàng khám phá nội dung trang web.',
        'Kiểm tra và sửa các broken links để cải thiện trải nghiệm người dùng và giảm lỗi crawler.'
      ];
      
      for (let i = 0; i < Math.min(5 - suggestions.length, generalSuggestions.length); i++) {
        suggestions.push(generalSuggestions[i]);
      }
    }
    
    // Return exactly 5 suggestions, or fewer if we couldn't generate 5
    return suggestions.slice(0, 5);
  }

  // Tính toán điểm số cho từng yếu tố SEO
  function calculateFactorScores(data) {
    return {
      'Content Quality': {
        score: calculateContentScore(data),
        maxScore: 100
      },
      'Technical SEO': {
        score: calculateTechnicalScore(data),
        maxScore: 100
      },
      'On-page SEO': {
        score: calculateOnPageScore(data),
        maxScore: 100
      },
      'User Experience': {
        score: calculateUserExperienceScore(data),
        maxScore: 100
      }
    }; // <-- Add missing closing brace here
  }

// Process and validate data
function processData(data) {
  // If data is already processed, return as is
  if (data && typeof data === 'object') {
    return data;
  }
  
  // Otherwise return mock data as fallback
  return mockData;
}

// Export public API
export const dataService = {
  mockData,
  processData,
  enhanceDataWithAnalytics,
  calculateContentScore,
  calculateTechnicalScore,
  calculateOnPageScore,
  calculateUserExperienceScore,
  getAISuggestions,
  calculateFactorScores
};

// No IIFE needed
