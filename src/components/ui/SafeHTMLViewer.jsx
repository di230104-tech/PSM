import React from 'react';
import DOMPurify from 'dompurify';

const SafeHTMLViewer = ({ htmlContent }) => {
  const sanitizedHtml = DOMPurify.sanitize(htmlContent, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: []
  });

  return (
    <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
  );
};

export default SafeHTMLViewer;
