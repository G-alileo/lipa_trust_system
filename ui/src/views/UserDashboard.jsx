import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Button, Card, ProgressBar, Badge } from "../components/base";
import { SkeletonDashboard, SkeletonCampaignCard } from "../components/Skeleton";
import { useNavigate } from "react-router-dom";

export function UserDashboard() {
    const { apiFetch, showToast } = useAuth();
    const [myCampaigns, setMyCampaigns] = useState([]);
    const [myContributions, setMyContributions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [campaignsLoading, setCampaignsLoading] = useState(false);
    const navigate = useNavigate();

    const loadData = async () => {
        setLoading(true);
        try {
            const campaigns = await apiFetch("/campaigns/my", "GET", null, true);
            const contributions = await apiFetch("/contributions/my", "GET", null, true);
            setMyCampaigns(campaigns.data || []);
            setMyContributions(contributions.data || []);
        } catch (err) {
            showToast(`Error loading dashboard: ${err.message}`, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const money = (value) => {
        return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(value || 0);
    };

    const getProgressColor = (percentage) => {
        if (percentage >= 100) return "text-success";
        if (percentage >= 75) return "text-primary";
        if (percentage >= 50) return "text-warning";
        return "text-muted";
    };

    if (loading) {
        return (
            <div className="layout">
                <SkeletonDashboard />
            </div>
        );
    }

    return (
        <div className="dashboard-view">
            <header className="flex justify-between items-center mb-12">
                <div>
                    <span className="eyebrow">Personal Dashboard</span>
                    <h2 className="text-3xl font-bold text-ink-900 mt-2">Manage Your Impact</h2>
                    <p className="text-muted mt-2">Track your campaigns and contributions in one place</p>
                </div>
                <Button
                    variant="primary"
                    size="lg"
                    onClick={() => navigate("/create-campaign")}
                    className="font-semibold"
                >
                    Start a New Campaign
                </Button>
            </header>

            <div className="dashboard-grid grid grid-cols-1 gap-12">
                {/* My Campaigns Section */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-2xl font-bold text-ink-900">My Campaigns</h3>
                            <p className="text-muted mt-1">
                                Campaigns you are currently running or have completed.
                            </p>
                        </div>
                        {myCampaigns.length > 0 && (
                            <div className="flex items-center gap-4 text-sm text-muted">
                                <span>{myCampaigns.length} total</span>
                                <span>•</span>
                                <span>{myCampaigns.filter(c => c.status === 'active').length} active</span>
                            </div>
                        )}
                    </div>

                    <div className="campaign-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {campaignsLoading ? (
                            Array.from({ length: 3 }).map((_, index) => (
                                <SkeletonCampaignCard key={index} />
                            ))
                        ) : myCampaigns.length === 0 ? (
                            <Card className="glass text-center p-12 md:col-span-2 lg:col-span-3">
                                <div className="empty-state">
                                    <h3 className="text-lg font-semibold mb-2">Ready to make an impact?</h3>
                                    <p className="mb-6">You haven't created any campaigns yet. Start your first campaign and begin making a difference!</p>
                                    <Button
                                        variant="primary"
                                        onClick={() => navigate("/create-campaign")}
                                        className="font-semibold"
                                    >
                                        Launch Your First Campaign
                                    </Button>
                                </div>
                            </Card>
                        ) : (
                            myCampaigns.map((campaign) => {
                                const percentage = Math.round((Number(campaign.current_amount) / Number(campaign.target_amount)) * 100);
                                const isCompleted = percentage >= 100;

                                return (
                                    <Card key={campaign.id} className="glass transition-all hover:shadow-lg">
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="text-lg font-semibold text-ink-900 line-clamp-2 flex-1 mr-3">
                                                {campaign.title}
                                            </h4>
                                            <Badge status={campaign.status}>{campaign.status}</Badge>
                                        </div>

                                        <div className="space-y-3 mb-6">
                                            <ProgressBar progress={percentage} />
                                            <div className="flex justify-between items-center text-sm">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-ink-900">
                                                        {money(campaign.current_amount)}
                                                    </span>
                                                    <span className="text-muted">
                                                        of {money(campaign.target_amount)}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`font-bold text-lg ${getProgressColor(percentage)}`}>
                                                        {percentage}%
                                                    </span>
                                                </div>
                                            </div>
                                            {isCompleted && (
                                                <div className="text-xs text-success font-medium bg-success-50 px-2 py-1 rounded-md">
                                                    Goal achieved!
                                                </div>
                                            )}
                                        </div>

                                        <Button
                                            variant="ghost"
                                            className="w-full font-medium"
                                            onClick={() => navigate(`/campaign/${campaign.id}`)}
                                        >
                                            View Details
                                        </Button>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </section>

                {/* My Contributions Section */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-2xl font-bold text-ink-900">My Contributions</h3>
                            <p className="text-muted mt-1">
                                Your history of supporting others on LipaTrust.
                            </p>
                        </div>
                        {myContributions.length > 0 && (
                            <div className="text-sm text-muted">
                                {myContributions.length} contributions
                            </div>
                        )}
                    </div>

                    <Card className="p-0 overflow-hidden">
                        {myContributions.length === 0 ? (
                            <div className="empty-state p-12">
                                <h3 className="text-lg font-semibold mb-2">Start supporting others</h3>
                                <p className="mb-6">You haven't made any contributions yet. Explore active campaigns and make your first contribution!</p>
                                <Button
                                    variant="primary"
                                    onClick={() => navigate("/")}
                                    className="font-semibold"
                                >
                                    Explore Campaigns
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead className="bg-ink-100 text-left">
                                        <tr>
                                            <th className="p-4 font-semibold text-sm text-ink-700">Campaign</th>
                                            <th className="p-4 font-semibold text-sm text-ink-700">Amount</th>
                                            <th className="p-4 font-semibold text-sm text-ink-700">Status</th>
                                            <th className="p-4 font-semibold text-sm text-ink-700">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {myContributions.map((contribution) => (
                                            <tr
                                                key={contribution.id}
                                                className="border-b border-ink-200 cursor-pointer hover:bg-ink-50 transition-colors"
                                                onClick={() => navigate(`/contribution/${contribution.id}`)}
                                            >
                                                <td className="p-4 font-medium text-ink-900">
                                                    {contribution.campaign_title || `Campaign #${contribution.campaign_id}`}
                                                </td>
                                                <td className="p-4 font-semibold text-ink-900">
                                                    {money(contribution.amount)}
                                                </td>
                                                <td className="p-4">
                                                    <Badge status={contribution.status}>{contribution.status}</Badge>
                                                </td>
                                                <td className="p-4 text-muted text-sm">
                                                    {new Date(contribution.created_at).toLocaleDateString('en-KE', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </section>
            </div>
        </div>
    );
}
