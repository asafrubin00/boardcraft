import { describe, it, expect } from 'vitest';
import { companies } from '@/data/company';
import { events } from '@/data/events';
import { EVENT_TOPIC, TOPICS, frameworkFor } from '@/engine/debrief';
import { OPTION_MINUTES } from '@/data/optionMinutes';

describe('governance debrief', () => {
  it('every playable event is mapped to a governance topic', () => {
    for (const co of companies) {
      for (const s of co.eventSchedule) {
        const ev = events.find((e) => e.id === s.eventId)!;
        if (ev.strategies.length <= 1) continue; // report cards
        expect(EVENT_TOPIC[s.eventId], s.eventId).toBeDefined();
      }
    }
  });

  it('every topic has a citation for every framework', () => {
    for (const co of companies) {
      const fw = frameworkFor(co.id);
      for (const t of Object.values(TOPICS)) expect(t.cite[fw].length).toBeGreaterThan(10);
    }
  });

  it('every option of every playable non-AGM event has its own minute line', () => {
    const missing: string[] = [];
    for (const [id, topic] of Object.entries(EVENT_TOPIC)) {
      if (topic === 'agm') continue;
      const ev = events.find((e) => e.id === id)!;
      for (const st of ev.strategies) if (!OPTION_MINUTES[st.id]) missing.push(st.id);
    }
    expect(missing).toEqual([]);
    const lines = Object.values(OPTION_MINUTES);
    expect(new Set(lines).size).toBe(lines.length); // no copy-paste duplicates
  });
});
