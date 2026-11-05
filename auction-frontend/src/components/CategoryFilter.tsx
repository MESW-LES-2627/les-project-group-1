import { Button } from '@/components/ui/button';
import type { Category } from '@/catalogue/types';

/**
 * CategoryFilter Component
 *
 * Category buttons used to filter the catalogue. The search box is in the navigation bar.
 */

interface CategoryFilterProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (slug: string) => void;
}

const chip = 'h-auto rounded-full px-5 py-2 text-[0.95rem] font-bold';

export function CategoryFilter({ categories, activeCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="mb-8 flex flex-wrap gap-2">
      <Button className={chip} variant={activeCategory === '' ? 'default' : 'outline'} onClick={() => onCategoryChange('')}>
        All
      </Button>
      {categories.map((category) => (
        <Button
          key={category.slug}
          className={chip}
          variant={activeCategory === category.slug ? 'default' : 'outline'}
          onClick={() => onCategoryChange(category.slug)}
        >
          {category.name}
        </Button>
      ))}
    </div>
  );
}