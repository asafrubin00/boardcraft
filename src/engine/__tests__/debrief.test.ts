import { describe, it, expect } from 'vitest';
import { companies } from '@/data/company';
import { events } from '@/data/events';
import { EVENT_TOPIC, TOPICS, frameworkFor } from '@/engine/debrief';

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
});
