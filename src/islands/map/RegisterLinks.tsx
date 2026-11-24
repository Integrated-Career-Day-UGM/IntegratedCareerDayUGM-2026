import { useMemo } from 'react';
import { useMapStore } from '../../stores/mapStore';
import { getCompanyPosterItems } from '../../lib/map/company-posters';
import { ui } from '../../lib/data';
import RegisterCtas from '../../components/map/RegisterCtas';
import PosterFolder from '../../components/map/PosterFolder';

/** Desktop map card: ICD folder + company folder above the Daftar rows. */
export default function RegisterLinks() {
  const selectedDayId = useMapStore((s) => s.selectedDayId);
  const setSidebarTab = useMapStore((s) => s.setSidebarTab);
  const companyPosterItems = useMemo(
    () => getCompanyPosterItems(selectedDayId),
    [selectedDayId],
  );

  const openInfoAt = (id: string) => {
    setSidebarTab('info');
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
  };

  return (
    <div className="w-[330px] max-w-[calc(100vw-2rem)]">
      <PosterFolder
        className="mb-3"
        hint="Open in Info"
        onOpenInfo={() => openInfoAt('icd-poster-carousel')}
      />
      <PosterFolder
        className="mb-3"
        items={companyPosterItems}
        title={ui.posters.companyTitle}
        hint="Open in Info"
        onOpenInfo={() => openInfoAt('company-poster-carousel')}
      />
      <RegisterCtas className="p-3 md:p-4" />
    </div>
  );
}
