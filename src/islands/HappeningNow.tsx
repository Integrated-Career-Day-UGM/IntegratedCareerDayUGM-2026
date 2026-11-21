import { Clock } from 'lucide-react';
import { sessions, getCompany, getArea, event, ui } from '../lib/data';
import { useMapStore } from '../stores/mapStore';

export default function HappeningNow() {
  const { selectedDayId, setSelectedArea } = useMapStore();

  const nowSession = sessions.find((s) => s.dayId === selectedDayId);
  if (!nowSession) return null;

  const company = getCompany(nowSession.companyId);
  const area = getArea(event.defaultVenueId, nowSession.areaId);
  const track = event.tracks.find((t) => t.id === nowSession.trackId);

  return (
    <button
      type="button"
      onClick={() => setSelectedArea(nowSession.areaId)}
      className="group relative w-[164px] shrink-0 overflow-hidden border-[3px] border-[#f5b400] bg-[#111] p-2 text-left shadow-[4px_4px_0_#ff2d6f] transition-transform active:scale-[0.99]"
    >
      <span className="absolute right-1.5 top-0.5 bg-white px-2.5 py-px font-heading text-[12px] font-semibold text-black">
        {ui.happeningNow.badge}
      </span>
      <Clock size={14} className="absolute right-2 top-7 text-[#ccc] transition-colors group-hover:text-white" />
      <p className="mt-5 w-[100px] text-[15px] font-semibold leading-[0.98] text-white">
        {track?.label} {ui.happeningNow.sessionSuffix}
      </p>
      <small className="block text-[10px] leading-none text-[#ccc]">{company?.name}</small>
      <strong className="mt-2 block text-[17px] font-semibold leading-none text-white">{area?.name}</strong>
    </button>
  );
}
