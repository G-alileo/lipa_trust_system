import React, { useState, useEffect } from "react";
import { Button } from "./base";

export function ProgressCelebration({
  milestone,
  campaignTitle,
  isVisible,
  onClose,
  confetti = true
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const handleClose = () => {
    setShow(false);
    if (onClose) {
      setTimeout(onClose, 300); 
    }
  };

  const getMilestoneEmoji = (milestone) => {
    if (milestone >= 100) return "🎉";
    if (milestone >= 75) return "🚀";
    if (milestone >= 50) return "📈";
    if (milestone >= 25) return "⭐";
    return "🎯";
  };

  const getMilestoneMessage = (milestone) => {
    if (milestone >= 100) return "Campaign Fully Funded!";
    if (milestone >= 75) return "Almost There!";
    if (milestone >= 50) return "Halfway Milestone Reached!";
    if (milestone >= 25) return "Great Progress!";
    return "Milestone Achieved!";
  };

  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
        onClick={handleClose}
      >
        {/* Celebration Modal */}
        <div
          className="progress-celebration animate-bounce-in"
          onClick={(e) => e.stopPropagation()}
          style={{
            animation: show ? "slideUp 0.3s ease-out" : "fadeOut 0.3s ease-in",
          }}
        >
          <div className="text-center">
            <div className="text-6xl mb-4 animate-pulse">
              {getMilestoneEmoji(milestone)}
            </div>

            <h2 className="text-2xl font-bold text-ink-900 mb-2">
              {getMilestoneMessage(milestone)}
            </h2>

            <p className="text-ink-600 mb-2">
              <strong>{campaignTitle}</strong> just hit {milestone}% funding!
            </p>

            <div className="milestone-badge mb-6">
              <span>{milestone}% Complete</span>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="primary" onClick={handleClose}>
                Awesome!
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  const shareText = `🎉 ${campaignTitle} just reached ${milestone}% funding on LipaTrust! Join the movement:`;
                  if (navigator.share) {
                    navigator.share({
                      title: "Campaign Milestone",
                      text: shareText,
                      url: window.location.href
                    });
                  } else {
                    navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
                  }
                }}
              >
                Share Progress
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Confetti Effect */}
      {confetti && <ConfettiEffect />}
    </>
  );
}

export function ConfettiEffect() {
  useEffect(() => {
    const colors = ['#10b981', '#f43f5e', '#f59e0b', '#3b82f6', '#8b5cf6'];
    const confettiCount = 100;

    const createConfetti = () => {
      for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.cssText = `
          position: fixed;
          width: 8px;
          height: 8px;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          left: ${Math.random() * 100}vw;
          top: -10px;
          z-index: 1000;
          pointer-events: none;
          animation: confetti-fall ${2 + Math.random() * 3}s linear forwards;
          transform: rotate(${Math.random() * 360}deg);
        `;
        document.body.appendChild(confetti);

        setTimeout(() => {
          if (confetti.parentNode) {
            confetti.parentNode.removeChild(confetti);
          }
        }, 5000);
      }
    };

    createConfetti();

    if (!document.getElementById('confetti-styles')) {
      const style = document.createElement('style');
      style.id = 'confetti-styles';
      style.textContent = `
        @keyframes confetti-fall {
          to {
            transform: translateY(100vh) rotate(720deg);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return null;
}

export function AchievementBadge({
  title,
  description,
  icon,
  unlocked = false,
  progress = 0,
  total = 100,
  onClick
}) {
  return (
    <div
      className={`achievement-badge-container ${unlocked ? 'unlocked' : 'locked'} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="achievement-content p-4 text-center">
        <div className={`achievement-icon text-3xl mb-2 ${unlocked ? '' : 'grayscale opacity-50'}`}>
          {unlocked ? icon : '🔒'}
        </div>

        <h4 className={`font-semibold text-sm ${unlocked ? 'text-ink-900' : 'text-ink-500'}`}>
          {title}
        </h4>

        {description && (
          <p className={`text-xs mt-1 ${unlocked ? 'text-ink-600' : 'text-ink-400'}`}>
            {description}
          </p>
        )}

        {!unlocked && progress > 0 && (
          <div className="mt-3">
            <div className="progress-wrap h-1">
              <div
                className="progress-bar h-1"
                style={{ width: `${(progress / total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted mt-1">
              {progress} / {total}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function MilestoneTracker({
  current,
  target,
  milestones = [25, 50, 75, 100],
  onMilestone
}) {
  const percentage = Math.min(100, (current / target) * 100);

  useEffect(() => {
    const reachedMilestone = milestones.find(
      milestone => percentage >= milestone && percentage < milestone + 5
    );

    if (reachedMilestone && onMilestone) {
      onMilestone(reachedMilestone);
    }
  }, [percentage, milestones, onMilestone]);

  return (
    <div className="milestone-tracker">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">Progress</span>
        <span className="text-sm font-bold text-primary">{percentage.toFixed(1)}%</span>
      </div>

      <div className="relative">
        <div className="progress-wrap h-3">
          <div
            className="progress-bar h-3 transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Milestone markers */}
        <div className="flex justify-between mt-1">
          {milestones.map(milestone => (
            <div
              key={milestone}
              className={`text-xs ${
                percentage >= milestone
                  ? 'text-success font-semibold'
                  : 'text-muted'
              }`}
              style={{ marginLeft: milestone === 0 ? '0' : '-5px' }}
            >
              {milestone}%
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}