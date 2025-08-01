import React, { useState } from 'react';
import { 
  Share2, 
  Twitter, 
  Linkedin, 
  Facebook, 
  Copy, 
  Link as LinkIcon,
  Mail,
  MessageCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { logUserAction } from '../utils/logger';

interface SocialShareProps {
  url: string;
  title: string;
  description: string;
  username: string;
  compact?: boolean;
  className?: string;
}

const SocialShare: React.FC<SocialShareProps> = ({
  url,
  title,
  description,
  username,
  compact = false,
  className = ''
}) => {
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  
  const traceId = React.useMemo(() => 
    `social-share-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
    []
  );

  const shareData = {
    title,
    text: description,
    url
  };

  const handleNativeShare = async () => {
    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        logUserAction('profile_shared_native', { 
          username, 
          platform: 'native',
          traceId 
        });
      } else {
        setShowShareMenu(true);
      }
    } catch (error) {
      console.error('Native share failed:', error);
      setShowShareMenu(true);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      logUserAction('profile_url_copied', { 
        username, 
        source: 'share_menu',
        traceId 
      });
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const shareToSocial = (platform: string, shareUrl: string) => {
    window.open(shareUrl, '_blank', 'width=600,height=400');
    logUserAction('profile_shared_social', { 
      username, 
      platform,
      traceId 
    });
    setShowShareMenu(false);
  };

  const socialPlatforms = [
    {
      name: 'Twitter',
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      color: 'text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      color: 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      color: 'text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20'
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      url: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
      color: 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
    },
    {
      name: 'Email',
      icon: Mail,
      url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description}\n\n${url}`)}`,
      color: 'text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/20'
    }
  ];

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <Button
          onClick={handleNativeShare}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </Button>
        
        {showShareMenu && (
          <Card className="absolute top-full right-0 mt-2 w-48 z-50 shadow-lg">
            <CardContent className="p-2">
              <div className="space-y-1">
                {socialPlatforms.map((platform) => (
                  <button
                    key={platform.name}
                    onClick={() => shareToSocial(platform.name, platform.url)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors ${platform.color}`}
                  >
                    <platform.icon className="w-4 h-4" />
                    <span>{platform.name}</span>
                  </button>
                ))}
                
                <button
                  onClick={copyToClipboard}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900/20 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {showShareMenu && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowShareMenu(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Share Profile
        </h3>
        <Button
          onClick={handleNativeShare}
          variant="outline"
          size="sm"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {socialPlatforms.map((platform) => (
          <button
            key={platform.name}
            onClick={() => shareToSocial(platform.name, platform.url)}
            className={`flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors ${platform.color}`}
          >
            <platform.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{platform.name}</span>
          </button>
        ))}
      </div>
      
      <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <LinkIcon className="w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={url}
          readOnly
          className="flex-1 bg-transparent text-sm text-gray-600 dark:text-gray-400 outline-none"
        />
        <Button
          onClick={copyToClipboard}
          variant="outline"
          size="sm"
        >
          <Copy className="w-4 h-4 mr-2" />
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      
      <div className="text-xs text-gray-500 text-center">
        Share your profile to help others discover your skills and projects
      </div>
    </div>
  );
};

export default SocialShare;