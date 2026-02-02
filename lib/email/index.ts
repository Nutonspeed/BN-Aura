// Email Service Exports
export { resendService, sendEmail, sendTemplateEmail } from './resendService';
export { emailTemplates, generateFollowUpEmail } from './templates/followUpEmail';
export { sendInvitationEmail } from './emailService';
export type { SendEmailOptions, EmailResponse } from './resendService';
export type { FollowUpEmailData } from './templates/followUpEmail';
