import type { Entry, Task, Ticket } from './domain';

/**
 * Entirely fictional fixtures. DEMO IDs must never be sent to Orbit.
 */
export const tasks: Array<Task> = [
  {
    id: 'DEMO-TASK-PORTAL',
    project: 'Demo Portal',
    title: 'Toegankelijke klantomgeving',
    open: true,
    budget: '12 uur resterend',
  },
  {
    id: 'DEMO-TASK-STUDIO',
    project: 'Demo Studio',
    title: 'Ontwerp & componenten',
    open: true,
    budget: '6 uur resterend',
  },
  {
    id: 'DEMO-TASK-SUPPORT',
    project: 'Demo Support',
    title: 'Onderzoek & ondersteuning',
    open: true,
    budget: 'Op nacalculatie',
  },
  {
    id: 'DEMO-TASK-INTERNAL',
    project: 'Intern',
    title: 'Overleg & kennisdeling',
    open: true,
    budget: 'Niet-declarabel',
  },
  { id: 'DEMO-TASK-CLOSED', project: 'Demo Archief', title: 'Afgeronde migratie', open: false, budget: 'Gesloten' },
];

export const initialEntries: Array<Entry> = [
  {
    id: 'DEMO-E1',
    taskId: tasks[0].id,
    date: '2026-10-12 09:00',
    durationMinutes: 180,
    description: 'Navigatie en keyboard states',
    billable: true,
    kind: 'logged',
  },
  {
    id: 'DEMO-E2',
    taskId: tasks[3].id,
    date: '2026-10-12 13:00',
    durationMinutes: 60,
    description: 'Teamoverleg',
    billable: false,
    kind: 'logged',
  },
  {
    id: 'DEMO-E3',
    taskId: tasks[1].id,
    date: '2026-10-13 09:30',
    durationMinutes: 120,
    description: 'Componenten uitwerken',
    billable: true,
    kind: 'logged',
  },
  {
    id: 'DEMO-E4',
    taskId: tasks[2].id,
    date: '2026-10-13 13:00',
    durationMinutes: 45,
    description: 'Onderzoek ticket #1042',
    billable: true,
    kind: 'logged',
  },
  {
    id: 'DEMO-E5',
    taskId: tasks[0].id,
    date: '2026-10-14 09:00',
    durationMinutes: 240,
    description: 'Implementatie — reservering',
    billable: true,
    kind: 'planned',
  },
  {
    id: 'DEMO-E6',
    taskId: tasks[3].id,
    date: '2026-10-15 09:00',
    durationMinutes: 480,
    description: 'Verlof',
    billable: false,
    kind: 'absence',
    lock: 'Goedgekeurde afwezigheid',
  },
  {
    id: 'DEMO-E7',
    taskId: tasks[1].id,
    date: '2026-10-16 10:00',
    durationMinutes: 90,
    description: 'Overdracht — FINAL week',
    billable: true,
    kind: 'logged',
    lock: 'FINAL / gefactureerd',
  },
];

export const initialTickets: Array<Ticket> = [
  {
    id: 'DEMO-TICKET-1042',
    number: 1042,
    client: 'Demo Portal',
    title: 'Inloggen lukt niet na wachtwoordreset',
    status: 'OPEN',
    priority: 'Hoog · SLA 2 uur',
    taskId: tasks[2].id,
    comments: [
      { note: 'Sinds de reset krijg ik opnieuw het inlogscherm. Kunnen jullie meekijken?', internal: false },
      {
        note: 'Reproductie in demo bevestigd. Cookiepad onderzoeken; nog geen klantantwoord verstuurd.',
        internal: true,
      },
    ],
  },
  {
    id: 'DEMO-TICKET-1043',
    number: 1043,
    client: 'Demo Studio',
    title: 'Vraag over export van rapportages',
    status: 'WAIT',
    priority: 'Normaal · SLA morgen',
    comments: [{ note: 'Is een export per maand mogelijk?', internal: false }],
  },
  {
    id: 'DEMO-TICKET-1044',
    number: 1044,
    client: 'Demo Studio',
    title: 'Afgeronde kleurcorrectie',
    status: 'CLOSED',
    priority: 'Laag',
    comments: [{ note: 'De aanpassing is akkoord, bedankt.', internal: false }],
  },
];
