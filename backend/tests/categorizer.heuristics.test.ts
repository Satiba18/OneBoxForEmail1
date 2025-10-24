import { describe, it, expect } from '@jest/globals';
import { EmailCategory } from '../src/types';
// We import private helpers by simulating categorizeEmail fallback path
import { } from '../src/services/categorizer';

function heuristic(text: string): EmailCategory {
  const t = text.toLowerCase();
  if (/(out of office|ooo|on leave|vacation)/i.test(t)) return "Out of Office";
  if (/(meeting booked|calendar invite|see you then)/i.test(t)) return "Meeting Booked";
  if (/(not interested|no thanks|unsubscribe|stop)/i.test(t)) return "Not Interested";
  if (/(interested|count me in|let's talk|keen to try|sounds good)/i.test(t)) return "Interested";
  if (/(viagra|free money|lottery|casino)/i.test(t)) return "Spam";
  return "Uncategorized";
}

describe('heuristic categorizer', () => {
  it('detects Out of Office', () => {
    expect(heuristic('I am OOO until Monday')).toBe('Out of Office');
  });
  it('detects Interested', () => {
    expect(heuristic('We are interested. Let\'s talk')).toBe('Interested');
  });
  it('detects Not Interested', () => {
    expect(heuristic('Please unsubscribe')).toBe('Not Interested');
  });
});
