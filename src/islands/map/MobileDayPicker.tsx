import { event } from '../../lib/data';
import { useMapStore } from '../../stores/mapStore';
import { cn } from '../../lib/utils/cn';

/**
 * Compact mobile day switch (28 / 29 staircase) for the chrome's top-right,
 * under the ICD lockup + open hours. Same store action as the desktop picker;
 * no countdown chip here.
 */
export default function MobileDayPicker() {
  const selectedDayId = useMapStore((s) => s.selectedDayId);
  const setSelectedDay = useMapStore((s) => s.setSelectedDay);

  return (
    <div className="grid grid-cols-2" role="group" aria-label="Pilih hari">
      {event.days.map((day, index) => (
        <div
          key={day.id}
          className={index === 0 ? 'col-start-1 row-start-1' : 'col-start-2 row-start-2'}
        >
          <button
            type="button"
            onClick={() => setSelectedDay(day.id)}
            aria-pressed={selectedDayId === day.id}
            className={cn(
              'flex size-5 items-center justify-center font-heading text-[12px] font-bold leading-none transition-colors',
              selectedDayId === day.id
                ? 'bg-[var(--accent-pink)] text-white'
                : 'text-ink-muted hover:text-white',
            )}
          >
            {day.label}
          </button>
        </div>
      ))}
    </div>
  );
}
