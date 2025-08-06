'use strict';

// AI tab module for SEO AI Assistant

// Import dependencies
// React is global
import { styles } from '../styles.js';
import { dataService } from '../data-service.js';

// Main Component
export const AiTab = ({ pageData }) => {
    const data = pageData || dataService.mockData;
    const [aiResponse, setAiResponse] = React.useState('');
    const [isAiLoading, setIsAiLoading] = React.useState(false);
    const aiInputRef = React.useRef(null); // Ref for the input field

    const handleAskAIQuestion = () => {
        const userQuestion = aiInputRef.current ? aiInputRef.current.value.trim() : '';
        if (!userQuestion) {
            setAiResponse('Vui lòng nhập câu hỏi.');
            return;
        }

        setIsAiLoading(true);
        setAiResponse('Claude AI đang xử lý câu hỏi của bạn...');

        // Mock AI response
        setTimeout(() => {
            const lowerQuestion = userQuestion.toLowerCase();
            let answer = '';
            if (lowerQuestion.includes('meta description')) answer = 'Meta description lý tưởng nên có độ dài từ 140-160 ký tự, bao gồm từ khóa chính và mô tả hấp dẫn về nội dung trang. Mỗi trang nên có meta description duy nhất và tập trung vào nội dung cụ thể của trang đó.';
            else if (lowerQuestion.includes('title') || lowerQuestion.includes('tiêu đề')) answer = 'Thẻ title nên có độ dài 50-60 ký tự, với từ khóa chính ở đầu. Title nên hấp dẫn, mô tả chính xác nội dung trang và tạo động lực cho người dùng click vào kết quả tìm kiếm.';
            else if (lowerQuestion.includes('alt text') || lowerQuestion.includes('hình ảnh')) answer = 'Alt text cho hình ảnh nên mô tả chính xác nội dung của hình, có độ dài vừa phải và bao gồm từ khóa khi phù hợp. Alt text giúp công cụ tìm kiếm hiểu nội dung hình ảnh và cải thiện trải nghiệm người dùng với trình đọc màn hình.';
            else if (lowerQuestion.includes('structured data') || lowerQuestion.includes('schema')) answer = 'Structured data (JSON-LD, Microdata) giúp Google hiểu nội dung của trang web và hiển thị rich snippets trong kết quả tìm kiếm. Các schema phổ biến bao gồm Article, Product, LocalBusiness, FAQ, và Review. Sử dụng công cụ Schema Markup Generator và kiểm tra với Schema Validator.';
            else if (lowerQuestion.includes('internal link') || lowerQuestion.includes('liên kết nội bộ')) answer = 'Liên kết nội bộ giúp phân phối giá trị SEO trong trang web, thiết lập cấu trúc thông tin và cải thiện trải nghiệm người dùng. Nên sử dụng anchor text liên quan, tạo hệ thống phân cấp rõ ràng, và đảm bảo người dùng có thể dễ dàng điều hướng giữa các trang liên quan.';
            else answer = `Câu hỏi về "${userQuestion}" là một chủ đề SEO quan trọng. Để tối ưu hóa trang web của bạn, tôi khuyên bạn nên tập trung vào nội dung chất lượng cao, cấu trúc URL thân thiện, tối ưu hóa meta tags, và xây dựng backlinks chất lượng. Bạn có thể tìm hiểu thêm tại các nguồn uy tín như Google Search Central hoặc Moz.`;

            setAiResponse(answer);
            setIsAiLoading(false);
        }, 1500);
    };

    const handleGenerateReport = () => {
        setIsAiLoading(true); // Use the same loading state
        setAiResponse('Đang tạo báo cáo SEO đầy đủ... (mô phỏng)');
        setTimeout(() => {
            const report = `<strong>Báo cáo SEO đầy đủ cho ${data.url || 'trang web'}</strong><br><br>
            <strong>Điểm SEO tổng thể:</strong> ${data.seoScore || 78}/100<br><br>
            <strong>Tóm tắt phân tích:</strong><br>
            Website của bạn đang thực hiện tốt về cấu trúc cơ bản, tuy nhiên cần cải thiện meta description và alt text cho hình ảnh để tối ưu hóa SEO.<br><br>
            <strong>Các vấn đề chính cần khắc phục:</strong><br>
            1. Thêm meta description phù hợp (140-160 ký tự)<br>
            2. Bổ sung alt text cho tất cả hình ảnh<br>
            3. Tăng số lượng liên kết nội bộ<br>
            4. Thêm schema markup để cải thiện Rich Snippets<br><br>
            <strong>Chi tiết báo cáo đầy đủ đã được lưu vào clipboard.</strong>`; // Mock clipboard action
            setAiResponse(report);
            setIsAiLoading(false);
            // Mock clipboard action - In real app, use navigator.clipboard
            console.log("Mock: Report generated and copied to clipboard.");
        }, 2000);
    };

    const suggestions = dataService.getAISuggestions(data);
    const factorScores = dataService.calculateFactorScores(data);

    // Use React.createElement
    return React.createElement('div', { style: styles.spaceY3 },
        // AI Insights Section
        React.createElement('div', { style: { ...styles.aiGradient, position: 'relative', overflow: 'hidden' } },
            React.createElement('div', { style: { position: 'absolute', top: '-20px', left: '-20px', right: '-20px', bottom: '-20px', background: 'radial-gradient(circle at top right, rgba(125, 39, 175, 0.2), transparent 70%), radial-gradient(circle at bottom left, rgba(30, 64, 175, 0.2), transparent 70%)', filter: 'blur(20px)', zIndex: '0' } }),
            React.createElement('div', { style: { position: 'relative', zIndex: '1', padding: '16px' } },
                React.createElement('div', { style: { display: 'flex', alignItems: 'center', marginBottom: '16px' } },
                    React.createElement('div', { style: { width: '32px', height: '32px', backgroundColor: 'rgba(59, 130, 246, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px' } },
                         React.createElement('div', { style: { fontSize: '18px' } }, '🧠')
                    ),
                    React.createElement('div', { style: { fontSize: '1.25rem', fontWeight: '600', color: 'white' } }, 'AI SEO Assistant')
                ),
                React.createElement('p', { style: { marginBottom: '16px', color: 'white', fontSize: '0.875rem', lineHeight: '1.5' } }, 'Dựa trên phân tích trang web của bạn, đây là những gợi ý để cải thiện SEO:'),
                React.createElement('div', { style: { backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px', padding: '12px', marginBottom: '16px' } },
                    suggestions.map((suggestion, index) =>
                        React.createElement('div', { key: index, style: { display: 'flex', padding: '8px 0', borderBottom: index < suggestions.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none' } },
                            React.createElement('div', { style: { color: '#60a5fa', marginRight: '12px', fontSize: '1rem', flexShrink: '0', paddingTop: '2px' } }, index === 0 ? '🔍' : index === 1 ? '📝' : index === 2 ? '🔗' : index === 3 ? '⚡' : '📊'),
                            React.createElement('div', { style: { flex: '1', fontSize: '0.875rem', color: 'white', lineHeight: '1.5' } }, suggestion)
                        )
                    )
                ),
                 // AI Interaction Section
                 React.createElement('div', { style: { backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px', padding: '16px', marginBottom: '16px' } },
                     React.createElement('div', { style: { fontSize: '0.875rem', fontWeight: '600', color: 'white', marginBottom: '12px' } }, 'Hỏi Claude AI'),
                     React.createElement('div', { style: { fontSize: '0.75rem', color: '#94a3b8', marginBottom: '16px' } }, 'Nhập câu hỏi về SEO của bạn...'),
                     React.createElement('div', { style: { display: 'flex', gap: '8px' } },
                         React.createElement('input', {
                             ref: aiInputRef, // Assign ref
                             style: { flex: '1', backgroundColor: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white', padding: '8px 12px', borderRadius: '4px', fontSize: '0.875rem' },
                             type: 'text',
                             placeholder: 'Ví dụ: Làm thế nào để cải thiện meta description?',
                             disabled: isAiLoading // Disable input while loading
                         }),
                         React.createElement('button', {
                             style: { backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', padding: '0 16px', cursor: 'pointer', fontWeight: '500', transition: 'background-color 0.2s ease', opacity: isAiLoading ? 0.6 : 1 },
                             onClick: handleAskAIQuestion,
                             disabled: isAiLoading
                         }, isAiLoading ? '...' : 'Hỏi')
                     ),
                     aiResponse && React.createElement('div', { style: { marginTop: '16px', backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: '4px', padding: '12px', fontSize: '0.875rem', color: 'white', lineHeight: '1.6', maxHeight: '200px', overflow: 'auto' } },
                         // Use dangerouslySetInnerHTML if the response might contain HTML, otherwise use textContent
                         React.createElement('div', { dangerouslySetInnerHTML: { __html: aiResponse } })
                     )
                 ),
                React.createElement('div', { style: { fontSize: '0.75rem', color: '#93c5fd', textAlign: 'center' } }, 'Phân tích bởi Claude AI • Dữ liệu từ trang hiện tại')
            )
        ),
        // Score Analysis Section
        React.createElement('div', { style: styles.cardSection },
            React.createElement('div', { style: styles.cardTitle }, 'Phân tích SEO Score'),
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' } },
                Object.entries(factorScores).map(([factor, factorData]) =>
                    React.createElement('div', { key: factor },
                        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px' } },
                            React.createElement('div', { style: { fontSize: '0.75rem', color: '#94a3b8' } }, factor),
                            // Corrected: Access getScoreColor via utils or handle fallback
                            React.createElement('div', { style: { fontSize: '0.75rem', fontWeight: '500', color: typeof getScoreColor === 'function' ? getScoreColor(factorData.score) : '#ffffff' } }, `${factorData.score}/100`)
                        ),
                        React.createElement('div', { style: styles.progressBar },
                            // Corrected: Access getScoreColor via utils or handle fallback
                            React.createElement('div', { style: { ...styles.progressFill, width: `${factorData.score}%`, backgroundColor: typeof getScoreColor === 'function' ? getScoreColor(factorData.score) : '#3b82f6' } })
                        )
                    )
                )
            )
        ),
        // Action Button
        React.createElement('button', { style: styles.buttonPrimary, onClick: handleGenerateReport, disabled: isAiLoading }, 'Tạo báo cáo SEO đầy đủ')
    );
};

// No IIFE needed
