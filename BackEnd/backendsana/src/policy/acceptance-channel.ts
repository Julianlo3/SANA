export const ACCEPTANCE_CHANNELS = ['web', 'telefono', 'whatsapp', 'presencial'] as const;

export type AcceptanceChannel = (typeof ACCEPTANCE_CHANNELS)[number];

export const ASSISTED_ACCEPTANCE_CHANNELS = ['telefono', 'whatsapp', 'presencial'] as const;

export type AssistedAcceptanceChannel = (typeof ASSISTED_ACCEPTANCE_CHANNELS)[number];
