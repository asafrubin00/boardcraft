import { describe, it, expect } from 'vitest';
import { directorShortLabel } from '../boardConstants';

describe('directorShortLabel', () => {
  it('uses displayName when present', () => {
    expect(directorShortLabel({ name: 'Lee Siew Geok', displayName: 'Lee' })).toBe('Lee');
    expect(directorShortLabel({ name: 'Anwar bin Hamzah', displayName: 'Anwar' })).toBe('Anwar');
  });

  it('falls back to the last word of name when displayName is absent', () => {
    expect(directorShortLabel({ name: 'Dr. Eleanor Voss' })).toBe('Voss');
  });

  it('falls back correctly for a single-word name', () => {
    expect(directorShortLabel({ name: 'Cher' })).toBe('Cher');
  });
});
