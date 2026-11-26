import { useEffect, useMemo, useState } from 'react';
import { useMapStore } from '../../stores/mapStore';
import { booths, companyPosters, getCompany, ui } from '../../lib/data';
import RegisterCtas from '../../components/map/RegisterCtas';
import PosterFolder from '../../components/map/PosterFolder';
import PosterGalleryModal from '../../components/map/PosterGalleryModal';
import type { PosterInfo } from '../../types/map';

const shuffle = <T,>(items: T[]) => {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
};

/** Desktop map card: ICD folder + three random company folders. */
export default function RegisterLinks() {
  const setSidebarTab = useMapStore((s) => s.setSidebarTab);
  const selectBooth = useMapStore((s) => s.selectBooth);
  const [galleryCompanyId, setGalleryCompanyId] = useState<string | null>(null);

  const companyCovers = useMemo<PosterInfo[]>(() => {
    const byCompany = new Map<string, PosterInfo>();
    for (const poster of companyPosters) {
      if (byCompany.has(poster.companyId)) continue;
      byCompany.set(poster.companyId, {
        id: poster.companyId,
        title: poster.companyShortName,
        subtitle: poster.companyName,
        src: poster.src,
        thumbUrl: poster.thumbUrl,
        downloadUrl: poster.downloadUrl,
        companyId: poster.companyId,
        accent: '#5b7f3a',
      });
    }
    return [...byCompany.values()];
  }, []);

  const pickFolders = () => shuffle(companyCovers).slice(0, 3);
  const [folders, setFolders] = useState<PosterInfo[]>(() => pickFolders());
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || companyCovers.length <= 3) return;
    const id = window.setInterval(() => setFolders(pickFolders()), 6000);
    return () => window.clearInterval(id);
  }, [companyCovers, paused]);

  const openInfoAt = (id: string) => {
    setSidebarTab('info');
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
  };

  return (
    <div
      className="w-[330px] max-w-[calc(100vw-2rem)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <PosterFolder
        className="mb-3"
        hint="Open in Info"
        onOpenInfo={() => openInfoAt('icd-poster-carousel')}
      />
      <PosterFolder
        className="mb-3"
        items={folders}
        title={ui.posters.companyTitle}
        hint="Open in Info"
        onOpenInfo={() => openInfoAt('company-directory')}
        onOpen={(poster) => {
          if (poster.companyId) setGalleryCompanyId(poster.companyId);
        }}
      />
      <RegisterCtas className="p-3 md:p-4" />

      {galleryCompanyId && (
        <PosterGalleryModal
          items={companyPosters.filter(
            (poster) => poster.companyId === galleryCompanyId,
          )}
          company={getCompany(galleryCompanyId)}
          index={0}
          onOpenBooth={() => {
            const booth = booths.find(
              (item) => item.companyId === galleryCompanyId,
            );
            setGalleryCompanyId(null);
            if (booth) selectBooth(booth.id);
          }}
          onClose={() => setGalleryCompanyId(null)}
        />
      )}
    </div>
  );
}
