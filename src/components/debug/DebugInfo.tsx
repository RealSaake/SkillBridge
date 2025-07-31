import React from 'react';

export const DebugInfo: React.FC = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const debugInfo = {
    currentUrl: window.location.href,
    pathname: window.location.pathname,
    search: window.location.search,
    token: urlParams.get('token'),
    refresh: urlParams.get('refresh'),
    githubUser: urlParams.get('github_user'),
    error: urlParams.get('error'),
    apiUrl: process.env.REACT_APP_API_URL,
    environment: process.env.REACT_APP_ENVIRONMENT,
    nodeEnv: process.env.NODE_ENV
  };

  console.log('🐛 Debug Info:', debugInfo);

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-md z-50">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <pre className="whitespace-pre-wrap">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
};