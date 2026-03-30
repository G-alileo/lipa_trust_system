import { DataTable } from "../components/DataTable";
import { Badge, Button, Card } from "../components/base";
import { ProgressCelebration, AchievementBadge } from "../components/Gamification";
import { useState } from "react";

export function EnhancedFeaturesDemo() {
  const [celebrationVisible, setCelebrationVisible] = useState(false);

  const sampleCampaigns = [
    {
      id: 1,
      title: "Help Sarah's Medical Treatment",
      status: "active",
      target_amount: 100000,
      current_amount: 75000,
      category: "medical",
      created_at: "2024-01-15",
      contributor_count: 45,
      creator: "Sarah Johnson"
    },
    {
      id: 2,
      title: "Community Clean Water Project",
      status: "pending",
      target_amount: 250000,
      current_amount: 25000,
      category: "community",
      created_at: "2024-01-10",
      contributor_count: 12,
      creator: "Green Initiative"
    },
    {
      id: 3,
      title: "Education Fund for Orphans",
      status: "approved",
      target_amount: 150000,
      current_amount: 120000,
      category: "education",
      created_at: "2024-01-08",
      contributor_count: 67,
      creator: "Hope Foundation"
    },
    {
      id: 4,
      title: "Small Business Recovery Fund",
      status: "completed",
      target_amount: 80000,
      current_amount: 85000,
      category: "business",
      created_at: "2024-01-05",
      contributor_count: 34,
      creator: "Local Entrepreneur"
    },
    {
      id: 5,
      title: "Animal Shelter Renovation",
      status: "rejected",
      target_amount: 60000,
      current_amount: 15000,
      category: "animals",
      created_at: "2024-01-03",
      contributor_count: 8,
      creator: "Pet Care Society"
    }
  ];

  const tableColumns = [
    {
      key: "title",
      header: "Campaign Title",
      sortable: true,
      render: (value, row) => (
        <div className="max-w-xs">
          <div className="font-semibold text-ink-900 truncate" title={value}>
            {value}
          </div>
          <div className="text-xs text-muted">by {row.creator}</div>
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      filterable: true,
      render: (value) => <Badge status={value}>{value}</Badge>
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className="text-sm text-ink-600 capitalize">{value}</span>
      )
    },
    {
      key: "current_amount",
      header: "Progress",
      sortable: true,
      render: (value, row) => {
        const percentage = Math.round((value / row.target_amount) * 100);
        return (
          <div className="min-w-32">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold">
                KES {(value / 1000).toFixed(0)}K
              </span>
              <span className="text-muted">{percentage}%</span>
            </div>
            <div className="progress-wrap h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  percentage >= 100 ? 'progress-bar-gradient' : 'bg-brand-primary'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      key: "contributor_count",
      header: "Contributors",
      sortable: true,
      render: (value) => (
        <div className="contribution-counter">
          <span>❤️</span>
          <span>{value}</span>
        </div>
      )
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      render: (value) => (
        <span className="text-sm text-muted">
          {new Date(value).toLocaleDateString('en-KE', {
            month: 'short',
            day: 'numeric'
          })}
        </span>
      )
    }
  ];

  const achievements = [
    {
      title: "Campaign Creator",
      description: "Created your first campaign",
      icon: "🚀",
      unlocked: true
    },
    {
      title: "Community Helper",
      description: "Made 5 contributions",
      icon: "❤️",
      unlocked: true
    },
    {
      title: "Milestone Master",
      description: "Reach 50% funding on any campaign",
      icon: "📈",
      unlocked: false,
      progress: 35,
      total: 50
    },
    {
      title: "Super Supporter",
      description: "Contribute to 10 different campaigns",
      icon: "⭐",
      unlocked: false,
      progress: 3,
      total: 10
    }
  ];

  return (
    <div className="enhanced-demo p-6 space-y-8">
      {/* Header */}
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-ink-900 mb-4">
          ✨ Enhanced LipaTrust Features Demo
        </h1>
        <p className="text-lg text-muted max-w-2xl mx-auto">
          Experience the transformed frontend with advanced DataTable, gamification,
          enhanced forms, and modern UI patterns.
        </p>
      </header>

      {/* Enhanced DataTable Demo */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-ink-900">Enhanced DataTable</h2>
            <p className="text-muted">
              Try searching, filtering by status/category, and sorting columns
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCelebrationVisible(true)}
            >
              Trigger Celebration
            </Button>
          </div>
        </div>

        <DataTable
          columns={tableColumns}
          data={sampleCampaigns}
          sortable
          searchable
          filterable
          searchPlaceholder="Search campaigns by title, creator, or category..."
          emptyMessage="No campaigns found matching your criteria"
        />
      </section>

      {/* Achievement System Demo */}
      <section>
        <h2 className="text-2xl font-bold text-ink-900 mb-6">Achievement System</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {achievements.map((achievement, index) => (
            <AchievementBadge
              key={index}
              title={achievement.title}
              description={achievement.description}
              icon={achievement.icon}
              unlocked={achievement.unlocked}
              progress={achievement.progress}
              total={achievement.total}
            />
          ))}
        </div>
      </section>

      {/* Design System Showcase */}
      <section>
        <h2 className="text-2xl font-bold text-ink-900 mb-6">Design System</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Typography Sample */}
          <Card className="glass p-6">
            <h3 className="text-lg font-semibold mb-4">Typography Scale</h3>
            <div className="space-y-2">
              <p className="text-xs text-muted">Text XS - Supporting text</p>
              <p className="text-sm text-muted">Text SM - Helper text</p>
              <p className="text-base">Text Base - Body text</p>
              <p className="text-lg font-medium">Text LG - Emphasized</p>
              <p className="text-xl font-semibold">Text XL - Headings</p>
              <p className="text-2xl font-bold">Text 2XL - Titles</p>
            </div>
          </Card>

          {/* Button Variants */}
          <Card className="glass p-6">
            <h3 className="text-lg font-semibold mb-4">Button Variants</h3>
            <div className="space-y-3">
              <Button variant="primary" size="sm" className="w-full">
                Primary Small
              </Button>
              <Button variant="secondary" className="w-full">
                Secondary Base
              </Button>
              <Button variant="ghost" size="lg" className="w-full">
                Ghost Large
              </Button>
              <Button variant="primary" loading className="w-full">
                Loading State
              </Button>
            </div>
          </Card>

          {/* Badge Variants */}
          <Card className="glass p-6">
            <h3 className="text-lg font-semibold mb-4">Status Badges</h3>
            <div className="space-y-2">
              <div className="flex gap-2 flex-wrap">
                <Badge status="active">Active</Badge>
                <Badge status="pending">Pending</Badge>
                <Badge status="approved">Approved</Badge>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge status="completed">Completed</Badge>
                <Badge status="rejected">Rejected</Badge>
                <Badge status="processing">Processing</Badge>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Interactive Elements */}
      <section>
        <h2 className="text-2xl font-bold text-ink-900 mb-6">Interactive Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Progress with Milestones */}
          <Card className="glass p-6 space-y-4">
            <h3 className="text-lg font-semibold">Progress Tracking</h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Campaign Progress</span>
                  <span className="font-semibold text-primary">75%</span>
                </div>
                <div className="progress-wrap h-3">
                  <div
                    className="progress-bar-gradient h-3"
                    style={{ width: "75%" }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted mt-1">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span className="text-primary font-semibold">75%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="milestone-badge">
                <span>📈 Milestone: 75% Reached!</span>
              </div>
            </div>
          </Card>

          {/* Social Features */}
          <Card className="glass p-6 space-y-4">
            <h3 className="text-lg font-semibold">Social Engagement</h3>

            <div className="space-y-3">
              <button className="share-button whatsapp w-full justify-center">
                <span>📱</span>
                Share on WhatsApp
              </button>

              <button className="share-button twitter w-full justify-center">
                <span>🐦</span>
                Share on Twitter
              </button>

              <button className="share-button facebook w-full justify-center">
                <span>👥</span>
                Share on Facebook
              </button>
            </div>
          </Card>
        </div>
      </section>

      {/* Progress Celebration */}
      <ProgressCelebration
        milestone={75}
        campaignTitle="Help Sarah's Medical Treatment"
        isVisible={celebrationVisible}
        onClose={() => setCelebrationVisible(false)}
      />
    </div>
  );
}