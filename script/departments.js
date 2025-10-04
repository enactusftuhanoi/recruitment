// departments.js - JavaScript cho trang departments

document.addEventListener('DOMContentLoaded', function() {
  // Tab functionality
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      
      // Remove active class from all buttons and contents
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      btn.classList.add('active');
      document.getElementById(`${tabId}-content`).classList.add('active');
    });
  });

  // Load department content from markdown files
  loadDepartmentContent();
});

async function loadDepartmentContent() {
  const department = getDepartmentFromURL();
  const contentElement = document.getElementById(`${department.toLowerCase()}-content`);
  
  if (!contentElement) return;

  try {
    const response = await fetch(`../content/${department.toUpperCase()}.md`);
    
    if (!response.ok) {
      throw new Error('File not found');
    }
    
    const markdownText = await response.text();
    const htmlContent = convertMarkdownToHTML(markdownText);
    contentElement.innerHTML = htmlContent;
  } catch (error) {
    console.error('Error loading department content:', error);
    contentElement.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <h3>Nội dung đang được cập nhật</h3>
        <p>Chúng mình đang chuẩn bị những thông tin thú vị về ban này. Hãy quay lại sau nhé!</p>
      </div>
    `;
  }
}

function getDepartmentFromURL() {
  const path = window.location.pathname;
  const filename = path.split('/').pop();
  const department = filename.split('.')[0]; // Lấy tên file không có extension
  
  // Map tên file sang department code
  const departmentMap = {
    'PD': 'pd',
    'HR': 'hr', 
    'ER': 'er',
    'MD': 'md'
  };
  
  return departmentMap[department.toUpperCase()] || 'pd';
}

function convertMarkdownToHTML(markdown) {
  // Basic markdown to HTML conversion
  return markdown
    // Headers
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    // Bold
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank">$1</a>')
    // Line breaks
    .replace(/\n$/gim, '<br>')
    // Paragraphs
    .replace(/^(?!<h[1-6]|<br>)(.*)/gim, '<p>$1</p>')
    // Lists
    .replace(/^\* (.*)/gim, '<ul><li>$1</li></ul>')
    .replace(/<\/ul>\s*<ul>/g, '')
    // Clean up multiple paragraphs
    .replace(/<\/p>\s*<p>/g, '<br>');
}