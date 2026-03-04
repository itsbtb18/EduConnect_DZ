/**
 * RankBadge — displays student rank with medals for top 3.
 */
import React from 'react';
import { Tag } from 'antd';

interface RankBadgeProps {
  rank: number;
  total?: number;
}

const MEDALS: Record<number, { emoji: string; color: string }> = {
  1: { emoji: '🥇', color: 'gold' },
  2: { emoji: '🥈', color: 'blue' },
  3: { emoji: '🥉', color: 'orange' },
};

const RankBadge: React.FC<RankBadgeProps> = ({ rank, total }) => {
  const medal = MEDALS[rank];
  const suffix = total ? `/${total}` : '';

  if (medal) {
    return (
      <Tag color={medal.color} style={{ fontWeight: 700, fontSize: 14 }}>
        {medal.emoji} {rank}<sup>{rank === 1 ? 'er' : 'ème'}</sup>{suffix}
      </Tag>
    );
  }

  return (
    <span style={{ fontWeight: 500, color: '#4A5568', fontSize: 13 }}>
      {rank}<sup>ème</sup>{suffix}
    </span>
  );
};

export default RankBadge;
