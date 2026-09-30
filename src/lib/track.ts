import {useEffect, useState} from 'react';
import {cancelRender, continueRender, delayRender, staticFile} from 'remotion';

export type TrackPoint = {x: number; y: number; down: boolean};

/** Per-frame cursor track saved alongside a capture (capture viewport CSS px). */
export const useCaptureTrack = (name: string): TrackPoint[] => {
  const [track, setTrack] = useState<TrackPoint[]>([]);
  const [handle] = useState(() => delayRender(`track ${name}`));
  useEffect(() => {
    fetch(staticFile(`captures/${name}.json`))
      .then(r => r.json())
      .then(j => { setTrack(j.track); continueRender(handle); })
      .catch(e => cancelRender(e));
  }, [handle, name]);
  return track;
};
