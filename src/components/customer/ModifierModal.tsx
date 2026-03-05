import { useState } from 'react';
import type { Menu } from '../../types';

interface ModifierModalProps {
  menu: Menu;
  hasAycePass: boolean;
  onClose: () => void;
  onAdd: (metadata: Record<string, unknown>) => void;
}

const DONENESS_OPTIONS = ['Rare', 'Medium', 'Well-done'] as const;
const MEAT_CATEGORIES = ['고기류', '해산물'];

const QUICK_REQUESTS: Record<string, string[]> = {
  '고기류': ['Extra crispy', 'Lean cuts only', 'No sauce', 'Extra sauce', 'Cut in half'],
  '해산물': ['No shell', 'Extra lemon', 'No sauce', 'Extra garlic', 'Light salt'],
  '식사':   ['Less spicy', 'Extra spicy', 'No onions', 'Extra broth', 'No MSG'],
  '주류':   ['Extra ice', 'No ice', 'Extra glass', 'Chilled'],
  '음료':   ['No ice', 'Extra ice', 'Less sugar', 'Room temp'],
  '사리':   ['Double portion', 'Less noodles', 'Extra chewy'],
  _default: ['No onions', 'Extra spicy', 'Less salt', 'Allergy: peanut', 'Extra napkins'],
};

export default function ModifierModal({ menu, hasAycePass, onClose, onAdd }: ModifierModalProps) {
  const showDoneness = MEAT_CATEGORIES.includes(menu.categoryName);
  const [doneness, setDoneness] = useState<string>('Medium');
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const quickOptions = QUICK_REQUESTS[menu.categoryName] ?? QUICK_REQUESTS._default;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const handleAdd = () => {
    const metadata: Record<string, unknown> = {};
    if (showDoneness) metadata.doneness = doneness;
    const parts = [...selectedTags];
    if (notes.trim()) parts.push(notes.trim());
    if (parts.length > 0) metadata.notes = parts.join(', ');
    onAdd(metadata);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-xl">
        {/* Header with emoji */}
        <div className="bg-gradient-to-br from-brand-light to-[#FFE8DF] p-6 text-center">
          <span className="text-6xl">{menu.img || '🍽️'}</span>
          <h2 className="font-display text-xl text-brand-dark mt-3">
            {menu.name}
            {menu.nameKo && menu.nameKo !== menu.name && (
              <span className="text-brand-muted font-body text-base"> ({menu.nameKo})</span>
            )}
          </h2>
          <p className="text-sm text-brand-muted mt-1 font-body">
            {hasAycePass && menu.isAyce ? 'Included in AYCE' : `$${(menu.price / 1000).toFixed(0)}`}
            {menu.cal != null && ` · ${menu.cal} cal`}
          </p>
        </div>

        <div className="p-5 space-y-5">
          {/* Doneness selector — meat/seafood only */}
          {showDoneness && (
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-2">
                Doneness
              </label>
              <div className="flex gap-2">
                {DONENESS_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setDoneness(opt)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      doneness === opt
                        ? 'bg-brand-red text-white'
                        : 'bg-brand-cream text-brand-warm hover:bg-brand-light'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Special requests — quick tags + freetext */}
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-2">
              Special Requests
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {quickOptions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedTags.has(tag)
                      ? 'bg-brand-red text-white'
                      : 'bg-brand-cream text-brand-warm hover:bg-brand-light'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Other requests..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-medium text-brand-warm bg-brand-cream hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-brand-red hover:bg-brand-red-light transition-colors"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
