// Browser-side configuration. Nothing secret lives here.
// The PRICE is intentionally NOT in the browser bundle: it is only returned by the
// server on the paywall screen (spec Rule 2.2).

export const TERMS_VERSION = '2026-10-19';
export const LEGAL_EFFECTIVE_DATE = 'October 19, 2026';
export const RULES_EFFECTIVE_DATE = 'October 19, 2026';
export const RETENTION_DAYS_TEXT = '90'; // must match DRAFT_RETENTION_DAYS in Netlify
export const ACCESS_DAYS_TEXT = '90'; // must match ACCESS_DAYS in Netlify
export const REFUND_DAYS_TEXT = '7'; // must match REFUND_DAYS in Netlify

export const ATTORNEY = {
  name: 'Ettrick Campbell',
  firm: '', // set if the practice uses a firm name different from the attorney's name
  address: '10308 Avenue K, Brooklyn, NY 11236',
};

export const AD_LABEL =
  `Attorney Advertising. ${ATTORNEY.name}, Attorney at Law, ${ATTORNEY.address}. ` +
  'Prior results do not guarantee a similar outcome. This tool provides general legal information, not legal advice.';

export const SUPPORT_EMAIL = 'ettrickc@gmail.com';

// Where Quick Exit sends people. A neutral, everyday page.
export const QUICK_EXIT_URL = 'https://www.google.com/search?q=weather';

export const FREE_HELP_URL = 'https://www.nycourts.gov/courthelp/';
// Attorney consultation: WhatsApp chat (opens the WhatsApp app or WhatsApp Web) or a phone call.
// No pre-filled message, so nothing about the person's case is sent automatically.
export const ATTORNEY_CONSULT_URL = 'https://wa.me/17186756729';
export const ATTORNEY_PHONE_TEL = 'tel:+17186756729';
export const ATTORNEY_PHONE_TEXT = '718-675-6729';

export const NY_COUNTIES = [
  'Albany','Allegany','Bronx','Broome','Cattaraugus','Cayuga','Chautauqua','Chemung','Chenango',
  'Clinton','Columbia','Cortland','Delaware','Dutchess','Erie','Essex','Franklin','Fulton',
  'Genesee','Greene','Hamilton','Herkimer','Jefferson','Kings (Brooklyn)','Lewis','Livingston',
  'Madison','Monroe','Montgomery','Nassau','New York (Manhattan)','Niagara','Oneida','Onondaga',
  'Ontario','Orange','Orleans','Oswego','Otsego','Putnam','Queens','Rensselaer','Richmond (Staten Island)',
  'Rockland','St. Lawrence','Saratoga','Schenectady','Schoharie','Schuyler','Seneca','Steuben',
  'Suffolk','Sullivan','Tioga','Tompkins','Ulster','Warren','Washington','Wayne','Westchester',
  'Wyoming','Yates',
];
