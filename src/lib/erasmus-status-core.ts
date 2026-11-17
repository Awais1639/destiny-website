export type EmStatus = 'open' | 'upcoming' | 'closed' | 'no-scholarship' | 'check';
export const emStatusLabels: Record<EmStatus, string> = {
  open: 'Applications open',
  upcoming: 'Opening soon',
  closed: 'Deadline passed',
  'no-scholarship': 'No EM scholarships',
  check: 'Check official website',
};
