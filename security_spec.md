# Security Specification - Neon Trade

## Data Invariants
1. Users can only read and write their own profile data.
2. Wingo History is a global read-only resource for users (only the system/admin can write).
3. Wingo Bets are owned by the user who created them; they can read their own bets but cannot modify them once created (locked).
4. Balance updates must be atomic or handled via secure server-side logic (though currently the client handles it, we should harden it).

## The "Dirty Dozen" Payloads (Examples of blocked attacks)
1. Someone else's UID in user profile: `{ "uid": "victim_uid", ... }` (Blocked by isOwner check)
2. Excessive balance update: `{ "balance": 9999999 }` (Blocked by schema validation)
3. Modifying game history: `{ "period": "20260527", "number": 7 }` (Blocked by read-only permission for non-admins)
4. Deleting bets: `delete /wingo_bets/bet_id` (Blocked)
5. ID Poisoning: `create /users/VERYLongStringJunkCharacters` (Blocked by isValidId)
6. State Shortcut: Updating a bet status from 'pending' to 'won' directly (Blocked by update restrictions)
7. Shadow Keys: Adding `isAdmin: true` to a user profile (Blocked by hasOnly check)
8. Orphaned Bet: Creating a bet for a period that doesn't exist (Blocked by system logic, though hard to enforce purely in rules without get())
9. Resource Exhaustion: Sending 1MB string in `nickname` (Blocked by size constraint)
10. Spoofing Time: Setting `registeredAt` to 2010 (Blocked by server timestamp check)
11. PII Leak: Reading all users collection (Blocked by allow list owner check)
12. Admin Elevation: Manually creating an `admin` doc (Blocked by default deny)

## Test Runner Plan
Use `firebase-rules-generator` or similar logic to verify.
