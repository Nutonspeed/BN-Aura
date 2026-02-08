# Thai Localization Expansion Plan

This plan outlines the steps to fully localize the dashboard into Thai, covering UI, notifications, and technical terms for Clinic and Sales teams.

## Analysis
- [x] Review existing `th.json` and `en.json`
- [ ] Scan `app/[locale]/(dashboard)` for hardcoded strings
- [ ] Scan `components` for hardcoded strings

## Implementation
- [ ] Update `th.json` with missing translations
- [ ] Improve existing Thai translations for natural flow and correct terminology
- [ ] Refactor React components to use `next-intl`
- [ ] Ensure date/time and currency formatting follows Thai standards (part of component logic/i18n config)

## Verification
- [ ] Manual review of key pages (Sales Dashboard, Clinic Dashboard)
- [ ] Verify no placeholder keys are displayed
