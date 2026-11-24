/**
 * Centralized backend API endpoint paths.
 */
export const ENDPOINTS = {
  users: "/users",
  user: (id: number) => `/users/${id}`,
  userStatus: (id: number) => `/users/${id}/status`,
  roles: "/roles",
  reportsSummary: "/reports/summary",
  reportsGeneral: "/reports/general",
  reportsAppointmentsEvolution: "/reports/appointments-evolution",
  reportsAttendance: "/reports/attendance",
  reportsDonationsHistory: "/reports/donations-history",
  reportsDonationsEvolution: "/reports/donations-evolution",

  // Public consultation request endpoints.
  consultationRequests: "/appointments/request",
  consultationRequest: (id: number) => `/consultation-requests/${id}`,
  residenceZones: "/residence-zones",
  availableSlots: "/consultation-requests/available-slots",

  // Consultant endpoints.
  consultants: "/consultants",
  consultantSummary: (id: number) => `/consultants/${id}`,
  consultantFullRecord: (id: number) => `/consultants/${id}/full`,
  consultantsForPsychologist: "/consultants/mine",
  consultantAccessLog: (id: number) => `/consultants/${id}/access-log`,
  clinicalNotesForAppointment: (id: number) =>
    `/clinical-notes/appointment/${id}`,

  // Care record endpoints.
  psychologistAppointments: "/appointments/mine",
  careRecords: "/care-records",

  // Secretary appointment inbox endpoints.
  appointments: "/appointments",
  appointment: (id: number) => `/appointments/${id}`,
  appointmentPsychologists: "/appointments/psychologists",
  appointmentAssign: (id: number) => `/appointments/${id}/assign`,
  appointmentConfirm: (id: number) => `/appointments/${id}/confirm`,
  appointmentDiscard: (id: number) => `/appointments/${id}/discard`,
  appointmentComplete: (id: number) => `/appointments/${id}/complete`,
  appointmentStatus: (id: number) => `/appointments/${id}/status`,
  appointmentPsychologistHistory: (id: number) =>
    `/appointments/${id}/psychologist-history`,
  scheduleAvailability: "/schedule/availability",
  carePackages: "/care-packages",
  carePackageSuggest: "/care-packages/suggest",
  carePackageSuggestions: "/care-packages/suggestions",
  carePackageApprove: (id: number) => `/care-packages/${id}/approve`,
  carePackageReject: (id: number) => `/care-packages/${id}/reject`,
  carePackagesMine: "/care-packages/my-packages",
  carePackage: (id: number) => `/care-packages/${id}`,
  carePackageAvailability: (id: number) =>
    `/care-packages/${id}/availability`,
  carePackageAppointments: (id: number) =>
    `/care-packages/${id}/my-appointments`,

  contentItems: "/content-items",
  contentCards: "/content-cards",
  contentCard: (id: number) => `/content-cards/${id}`,
  publicContent: "/public/content",
  news: "/news",
  newsItem: (id: number) => `/news/${id}`,
  newsStatus: (id: number) => `/news/${id}/status`,
  newsPin: (id: number) => `/news/${id}/pin`,
  galleryImages: "/gallery-images",
  galleryImage: (id: number) => `/gallery-images/${id}`,
  galleryImageStatus: (id: number) => `/gallery-images/${id}/status`,
  imageUploadSignatures: "/image-upload-signatures",
  publicNews: "/public/news",
  publicNewsItem: (id: number) => `/public/news/${id}`,
  publicGalleryImages: "/public/gallery-images",
  banners: "/banners",
  banner: (id: number) => `/banners/${id}`,
  bannerActivation: (id: number) => `/banners/${id}/activation`,
  publicBanners: "/public/banners",

  // Public availability endpoint for evaluation appointments.
  consultantAvailability: "/appointments/availability",

  // Referral endpoints (psychologist).
  appointmentReferralPsychologists: (id: number) =>
    `/appointments/${id}/referral-psychologists`,
  appointmentRefer: (id: number) => `/appointments/${id}/refer`,

  // Referral inbox endpoint (secretary).
  appointmentReferrals: "/appointments/referrals",

  // Donation endpoints.
  donations: "/donations",
  donationByTransactionId: (transactionId: string) => `/donations/${transactionId}`,
} as const;