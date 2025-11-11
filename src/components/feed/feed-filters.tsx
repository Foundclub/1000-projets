"use client";
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Space } from '@prisma/client';
import { cn } from '@/lib/utils';

type SpaceFilter = 'ALL' | 'PRO' | 'SOLIDAIRE';

interface FeedFiltersProps {
  space: SpaceFilter;
  onlyFollowed: boolean;
  onSpaceChange: (space: SpaceFilter) => void;
  onOnlyFollowedChange: (onlyFollowed: boolean) => void;
  isAuthenticated: boolean;
}

export function FeedFilters({
  space,
  onlyFollowed,
  onSpaceChange,
  onOnlyFollowedChange,
  isAuthenticated,
}: FeedFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-card rounded-lg border border-border/50 shadow-sm">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={space === 'ALL' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSpaceChange('ALL')}
          className={cn(
            "transition-all duration-200",
            space === 'ALL' && "shadow-md"
          )}
        >
          Tous
        </Button>
        <Button
          variant={space === 'PRO' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSpaceChange('PRO')}
          className={cn(
            "transition-all duration-200",
            space === 'PRO' && "shadow-md"
          )}
        >
          PRO
        </Button>
        <Button
          variant={space === 'SOLIDAIRE' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSpaceChange('SOLIDAIRE')}
          className={cn(
            "transition-all duration-200",
            space === 'SOLIDAIRE' && "shadow-md"
          )}
        >
          SOLIDAIRE
        </Button>
      </div>
      
      {isAuthenticated && (
        <div className="flex items-center gap-2">
          <Switch
            id="only-followed"
            checked={onlyFollowed}
            onCheckedChange={onOnlyFollowedChange}
          />
          <Label htmlFor="only-followed" className="text-sm font-medium cursor-pointer">
            Abonnements
          </Label>
        </div>
      )}
    </div>
  );
}

