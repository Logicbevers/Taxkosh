/**
 * Throwaway/disposable inbox providers, blocked at registration.
 *
 * Why block them: a filing platform holds PAN, Aadhaar and bank documents, and the
 * email address is the account's only recovery channel. A mailbox that evaporates in
 * ten minutes means an unrecoverable account holding real tax documents — and it's
 * the cheapest way to mass-create junk accounts.
 *
 * A curated list, not a dependency: the npm blocklists carry tens of thousands of
 * dead domains, and this covers the providers that actually show up. Add to it when
 * a new one appears — that is the intended maintenance, not a shortcoming.
 *
 * Note `.test` addresses are deliberately NOT blocked: the e2e suite registers
 * @taxkosh.test users, and `.test` is a reserved TLD that can never receive mail
 * from the public internet anyway.
 */
const DISPOSABLE_DOMAINS = new Set([
    "yopmail.com", "yopmail.fr", "yopmail.net",
    "mailinator.com", "mailinator.net",
    "guerrillamail.com", "guerrillamailblock.com", "sharklasers.com", "grr.la", "spam4.me",
    "10minutemail.com", "10minutemail.net",
    "tempmail.com", "temp-mail.org", "tempr.email", "tempinbox.com",
    "throwawaymail.com", "trashmail.com", "trashmail.de", "discard.email",
    "getnada.com", "dispostable.com", "maildrop.cc", "fakeinbox.com",
    "mailnesia.com", "mintemail.com", "spamgourmet.com", "emailondeck.com",
    "mohmal.com", "moakt.com", "inboxkitten.com", "harakirimail.com",
    "pokemail.net", "byom.de", "luxusmail.org", "mailcatch.com",
    "fake-mail.net", "burnermail.io", "anonaddy.com", "mailsac.com",
]);

/**
 * True when the address belongs to a known throwaway provider.
 * Case- and whitespace-insensitive; matches the domain exactly, so a lookalike like
 * "notyopmail.com" is left alone.
 */
export function isDisposableEmail(email: string): boolean {
    const domain = email.trim().toLowerCase().split("@")[1];
    if (!domain) return false;
    return DISPOSABLE_DOMAINS.has(domain);
}
