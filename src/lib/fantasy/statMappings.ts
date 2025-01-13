export interface StatMapping {
    id: string;
    name: string;
    display: string;
    category: 'passing' | 'rushing' | 'receiving' | 'kicking' | 'defense' | 'returns' | 'misc';
}

export const NFL_STAT_MAPPINGS: Record<string, StatMapping> = {
    '0': { id: '0', name: 'games_played', display: 'Games Played', category: 'misc' },
    '1': { id: '1', name: 'passing_attempts', display: 'Pass Attempts', category: 'passing' },
    '2': { id: '2', name: 'passing_completions', display: 'Pass Completions', category: 'passing' },
    '3': { id: '3', name: 'incomplete_passes', display: 'Incomplete Passes', category: 'passing' },
    '4': { id: '4', name: 'passing_yards', display: 'Passing Yards', category: 'passing' },
    '5': { id: '5', name: 'passing_touchdowns', display: 'Passing TDs', category: 'passing' },
    '6': { id: '6', name: 'interceptions', display: 'Interceptions', category: 'passing' },
    '7': { id: '7', name: 'sacks', display: 'Times Sacked', category: 'passing' },
    '8': { id: '8', name: 'rushing_attempts', display: 'Rush Attempts', category: 'rushing' },
    '9': { id: '9', name: 'rushing_yards', display: 'Rushing Yards', category: 'rushing' },
    '10': { id: '10', name: 'rushing_touchdowns', display: 'Rushing TDs', category: 'rushing' },
    '11': { id: '11', name: 'receptions', display: 'Receptions', category: 'receiving' },
    '12': { id: '12', name: 'receiving_yards', display: 'Receiving Yards', category: 'receiving' },
    '13': { id: '13', name: 'receiving_touchdowns', display: 'Receiving TDs', category: 'receiving' },
    '14': { id: '14', name: 'return_touchdowns', display: 'Return TDs', category: 'returns' },
    '15': { id: '15', name: 'two_point_conversions', display: '2-Point Conversions', category: 'misc' },
    '16': { id: '16', name: 'fumbles', display: 'Fumbles', category: 'misc' },
    '17': { id: '17', name: 'fumbles_lost', display: 'Fumbles Lost', category: 'misc' },
    '18': { id: '18', name: 'field_goals_made_0_19', display: 'FG Made (0-19)', category: 'kicking' },
    '19': { id: '19', name: 'field_goals_made_20_29', display: 'FG Made (20-29)', category: 'kicking' },
    '20': { id: '20', name: 'field_goals_made_30_39', display: 'FG Made (30-39)', category: 'kicking' },
    '21': { id: '21', name: 'field_goals_made_40_49', display: 'FG Made (40-49)', category: 'kicking' },
    '22': { id: '22', name: 'field_goals_made_50_plus', display: 'FG Made (50+)', category: 'kicking' },
    '57': { id: '57', name: 'field_goals_missed_0_19', display: 'FG Missed (0-19)', category: 'kicking' },
    '58': { id: '58', name: 'field_goals_missed_20_29', display: 'FG Missed (20-29)', category: 'kicking' },
    '59': { id: '59', name: 'field_goals_missed_30_39', display: 'FG Missed (30-39)', category: 'kicking' },
    '60': { id: '60', name: 'field_goals_missed_40_49', display: 'FG Missed (40-49)', category: 'kicking' },
    '61': { id: '61', name: 'field_goals_missed_50_plus', display: 'FG Missed (50+)', category: 'kicking' },
    '62': { id: '62', name: 'pat_made', display: 'PAT Made', category: 'kicking' },
    '63': { id: '63', name: 'pat_missed', display: 'PAT Missed', category: 'kicking' },
    '64': { id: '64', name: 'sacks_made', display: 'Sacks', category: 'defense' },
    '65': { id: '65', name: 'interceptions_made', display: 'Interceptions', category: 'defense' },
    '66': { id: '66', name: 'fumbles_recovered', display: 'Fumbles Recovered', category: 'defense' },
    '67': { id: '67', name: 'safeties', display: 'Safeties', category: 'defense' },
    '68': { id: '68', name: 'defensive_touchdowns', display: 'Defensive TDs', category: 'defense' },
    '69': { id: '69', name: 'special_teams_touchdowns', display: 'Special Teams TDs', category: 'returns' },
    '78': { id: '78', name: 'targets', display: 'Targets', category: 'receiving' }
}; 