# Scoped Re-review

Use after a review finding has been fixed.

Inputs:
- previous findings;
- fix base and current candidate;
- fix diff/review package;
- new focused evidence.

For every previous Critical/Important finding, return one of:
- RESOLVED — cite the changed evidence;
- PARTIAL — explain what remains;
- NOT_RESOLVED — cite why;
- CANNOT_VERIFY — state the exact missing evidence.

Then inspect only the fix diff for newly introduced breakage. Do not reopen unrelated parts of the original review unless the fix changes their risk surface.

The re-review does not upgrade missing deterministic/real-run evidence to PASS.
