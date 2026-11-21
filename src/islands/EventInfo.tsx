import { MapPin, Clock, Briefcase, CircleHelp } from 'lucide-react';
import { ui } from '../lib/data';

export default function EventInfo() {
  const sections = Object.entries(ui.info.sections);

  return (
    <div className="space-y-3">
      <div className="sidebar-section-title">{ui.info.title}</div>
      <div className="space-y-2">
        {sections.map(([key, section], index) => {
          const Icon = [MapPin, Clock, Briefcase, CircleHelp][index] ?? CircleHelp;
          return (
            <div
              key={key}
              className="bg-[#4a4a4a] p-3 transition-colors hover:bg-[#555]"
            >
              <div className="mb-1 flex items-center gap-2">
                <Icon size={14} className="text-[#9b9b9b]" />
                <div className="font-heading text-sm font-semibold text-white">{section.heading}</div>
              </div>
              <p className="text-sm leading-relaxed text-[#bbb]">{section.body}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
