'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/app/context/AppContext';

interface StarRatingProps {
  rating: number;           // valor actual 0-5
  cocktailId: string;
  onRate: (cocktailId: string, stars: number) => Promise<void>;
  size?: 'sm' | 'md';
}

export default function StarRating({ rating, cocktailId, onRate, size = 'sm' }: StarRatingProps) {
  const { isDark } = useApp();
  const [hovered, setHovered] = useState(0);
  const [saving, setSaving] = useState(false);

  const starSize = size === 'sm' ? 'text-sm' : 'text-xl';

  const handleClick = async (stars: number) => {
    if (saving) return;
    // Si hace clic en la misma estrella que ya tiene → reset a 0
    const newRating = stars === rating ? 0 : stars;
    setSaving(true);
    await onRate(cocktailId, newRating);
    setSaving(false);
  };

  const displayed = hovered || rating;

  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button
          key={star}
          type="button"
          disabled={saving}
          whileHover={{ scale: 1.25 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleClick(star)}
          onMouseEnter={() => setHovered(star)}
          className={`transition-colors disabled:cursor-wait ${starSize} ${
            star <= displayed
              ? isDark ? 'text-[#f5c842]' : 'text-[#c9a227]'
              : isDark ? 'text-[#f5c842]/20' : 'text-[#8B6914]/20'
          }`}
          title={`${star} estrella${star !== 1 ? 's' : ''}`}
        >
          ★
        </motion.button>
      ))}
    </div>
  );
}
