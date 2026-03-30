import React, { useState } from "react";
import { Button } from "./base";

export function SocialShareButton({
  platform,
  url,
  title,
  description,
  hashtags = [],
  className = "",
  size = "base"
}) {
  const [clicked, setClicked] = useState(false);

  const shareUrls = {
    whatsapp: (url, text) =>
      `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,

    twitter: (url, text, hashtags) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=${hashtags.join(',')}`,

    facebook: (url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,

    linkedin: (url, title, description) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(description)}`,

    telegram: (url, text) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,

    email: (url, title, description) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(description + '\n\n' + url)}`
  };

  const platformIcons = {
    whatsapp: "📱",
    twitter: "🐦",
    facebook: "👥",
    linkedin: "💼",
    telegram: "✈️",
    email: "📧"
  };

  const platformNames = {
    whatsapp: "WhatsApp",
    twitter: "Twitter",
    facebook: "Facebook",
    linkedin: "LinkedIn",
    telegram: "Telegram",
    email: "Email"
  };

  const platformColors = {
    whatsapp: "hover:bg-green-500",
    twitter: "hover:bg-blue-400",
    facebook: "hover:bg-blue-600",
    linkedin: "hover:bg-blue-700",
    telegram: "hover:bg-blue-500",
    email: "hover:bg-gray-600"
  };

  const handleShare = () => {
    const shareText = description || `Check out: ${title}`;
    const shareUrl = shareUrls[platform]?.(url, shareText, hashtags);

    if (shareUrl) {
      if (navigator.share && platform === 'whatsapp') {
        navigator.share({
          title,
          text: shareText,
          url
        }).catch(() => {
          window.open(shareUrl, '_blank', 'width=600,height=400');
        });
      } else {
        window.open(shareUrl, '_blank', 'width=600,height=400');
      }

      setClicked(true);
      setTimeout(() => setClicked(false), 200);
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`share-button ${platform} ${className} ${clicked ? 'animate-pulse' : ''}
        transition-all duration-200 ${platformColors[platform]} hover:text-white`}
    >
      <span className="text-lg">{platformIcons[platform]}</span>
      <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>
        {platformNames[platform]}
      </span>
    </button>
  );
}

export function SocialShareMenu({
  url,
  title,
  description,
  hashtags = ["LipaTrust"],
  className = "",
  trigger,
  platforms = ['whatsapp', 'twitter', 'facebook', 'email']
}) {
  const [isOpen, setIsOpen] = useState(false);

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="gap-2">
      <span>🔗</span>
      Share
    </Button>
  );

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger || defaultTrigger}
      </div>

      {/* Share Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu Content */}
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-ink-200 z-20 overflow-hidden">
            <div className="p-3 border-b border-ink-100">
              <h3 className="font-semibold text-sm text-ink-900">Share this campaign</h3>
              <p className="text-xs text-muted mt-1">{title}</p>
            </div>

            <div className="p-2 space-y-1">
              {platforms.map(platform => (
                <SocialShareButton
                  key={platform}
                  platform={platform}
                  url={url}
                  title={title}
                  description={description}
                  hashtags={hashtags}
                  size="sm"
                  className="w-full justify-start text-left p-3 rounded-lg border-0"
                />
              ))}
            </div>

            <div className="p-3 border-t border-ink-100 bg-ink-50">
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(url);
                    setIsOpen(false);
                    // Could show a toast here
                  } catch (err) {
                    console.error('Failed to copy:', err);
                  }
                }}
                className="w-full text-left p-2 text-sm text-ink-600 hover:text-ink-900 hover:bg-ink-100 rounded-md transition-colors flex items-center gap-2"
              >
                <span>📋</span>
                Copy link
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function ShareButton({
  campaignId,
  campaignTitle,
  campaignDescription,
  currentAmount,
  targetAmount,
  className = ""
}) {
  const shareUrl = `${window.location.origin}/campaign/${campaignId}`;
  const progress = Math.round((currentAmount / targetAmount) * 100);

  const shareTitle = `Help support: ${campaignTitle}`;
  const shareDescription = `${campaignTitle} has raised ${progress}% of its goal! Every contribution makes a difference. Join us in making an impact! 🎯`;

  const hashtags = ['LipaTrust', 'Crowdfunding', 'MakeADifference', 'Community'];

  return (
    <SocialShareMenu
      url={shareUrl}
      title={shareTitle}
      description={shareDescription}
      hashtags={hashtags}
      className={className}
      trigger={
        <Button variant="ghost" className="gap-2 engagement-pulse">
          <span>🚀</span>
          Share Campaign
        </Button>
      }
      platforms={['whatsapp', 'twitter', 'facebook', 'telegram', 'email']}
    />
  );
}

export function ProgressShareButton({
  campaignId,
  campaignTitle,
  milestone,
  className = ""
}) {
  const shareUrl = `${window.location.origin}/campaign/${campaignId}`;
  const shareTitle = `🎉 Milestone Reached!`;
  const shareDescription = `Amazing news! ${campaignTitle} just reached ${milestone}% funding! The community support is incredible. Check it out and join the movement! 📈`;

  const hashtags = ['LipaTrust', 'Milestone', 'Success', 'Community'];

  return (
    <SocialShareMenu
      url={shareUrl}
      title={shareTitle}
      description={shareDescription}
      hashtags={hashtags}
      className={className}
      trigger={
        <Button variant="primary" size="sm" className="gap-2">
          <span>🎉</span>
          Share Progress
        </Button>
      }
    />
  );
}

export function QuickShareButton({ platform, campaignId, className = "" }) {
  const shareUrl = `${window.location.origin}/campaign/${campaignId}`;
  const shareText = "Check out this amazing campaign on LipaTrust!";

  return (
    <SocialShareButton
      platform={platform}
      url={shareUrl}
      title="LipaTrust Campaign"
      description={shareText}
      hashtags={['LipaTrust']}
      className={className}
      size="sm"
    />
  );
}