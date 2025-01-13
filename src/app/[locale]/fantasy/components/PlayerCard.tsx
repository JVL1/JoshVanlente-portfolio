'use client';

import { Player, StatValue } from '@/lib/fantasy/types';

interface PlayerCardProps {
    player: Player;
    onClose: () => void;
}

export default function PlayerCard({ player, onClose }: PlayerCardProps) {
    const seasonStats = player.stats?.season;
    const weeklyStats = player.stats?.weekly || [];
    const latestWeek = weeklyStats.length > 0 ? weeklyStats[weeklyStats.length - 1] : null;

    return (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold">{player.name.full}</h2>
                        <p className="text-blue-100">
                            {player.team} - {player.position}
                            {player.uniform_number && ` #${player.uniform_number}`}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-blue-100 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    {seasonStats?.fantasyPoints !== undefined && (
                        <span className="bg-green-600 text-white px-3 py-1.5 rounded-lg font-semibold">
                            {seasonStats.fantasyPoints.toFixed(1)} Season Points
                        </span>
                    )}
                    {player.injury_status && (
                        <span className="bg-red-500 text-white px-2 py-1 rounded">
                            {player.injury_status}
                        </span>
                    )}
                    {player.rank_overall && (
                        <span className="bg-blue-700 text-white px-2 py-1 rounded">
                            Overall #{player.rank_overall}
                        </span>
                    )}
                    {player.rank_position && (
                        <span className="bg-blue-700 text-white px-2 py-1 rounded">
                            {player.position} #{player.rank_position}
                        </span>
                    )}
                    {player.percent_owned !== undefined && (
                        <span className="bg-blue-700 text-white px-2 py-1 rounded">
                            {player.percent_owned}% Owned
                        </span>
                    )}
                </div>
            </div>

            {/* Stats Content */}
            <div className="p-6">
                {/* Latest Week Stats */}
                {latestWeek ? (
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">Week {latestWeek.week} Stats</h3>
                            {latestWeek.fantasyPoints !== undefined && (
                                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg font-medium">
                                    {latestWeek.fantasyPoints.toFixed(1)} Points
                                </span>
                            )}
                        </div>
                        {Object.entries(latestWeek.stats.byCategory).map(([category, stats]) => (
                            <div key={category} className="mb-6">
                                <h4 className="text-lg font-medium mb-3 capitalize">{category}</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {Object.values(stats).map((stat: StatValue) => (
                                        <div key={stat.name} className="bg-gray-50 p-3 rounded">
                                            <div className="text-sm text-gray-600">{stat.display}</div>
                                            <div className="text-lg font-semibold">{stat.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-gray-500 text-center py-4">No recent stats available</div>
                )}

                {/* Weekly Points Summary */}
                {weeklyStats.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold mb-4">Weekly Fantasy Points</h3>
                        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                            {weeklyStats.map((week) => (
                                <div key={week.week} className="bg-gray-50 p-3 rounded text-center">
                                    <div className="text-sm text-gray-600">Week {week.week}</div>
                                    <div className="text-lg font-semibold">
                                        {week.fantasyPoints !== undefined ? week.fantasyPoints.toFixed(1) : '-'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Season Stats Summary */}
                {seasonStats && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">Season Totals</h3>
                            {seasonStats.fantasyPoints !== undefined && (
                                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg font-medium">
                                    {seasonStats.fantasyPoints.toFixed(1)} Total Points
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {Object.entries(seasonStats.byCategory)
                                .flatMap(([category, stats]) => 
                                    Object.values(stats)
                                        .filter(stat => stat.value > 0) // Only show non-zero stats
                                        .map((stat: StatValue) => (
                                            <div key={stat.name} className="bg-gray-50 p-3 rounded">
                                                <div className="text-sm text-gray-600">{stat.display}</div>
                                                <div className="text-lg font-semibold">{stat.value}</div>
                                            </div>
                                        ))
                                )
                            }
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 