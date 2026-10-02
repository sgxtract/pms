## Password Change and Idle Timeout

### Questions & Answers

1. How the forced password change is enforced everywhere, and why the change-password page needs an exception?

+ The `forced password change` is enforced everywhere because every protected page calls `requireUser()`, to make it smoother without changing it in the future. Every existing and future pages will enforce it automatically.

2. Why the current password is required, even for the forced change?

+ If the computer is left unattended with an open session, they couldn't change the password **without knowing** the current password.

3. Why other sessions are signed out when a password changes?

+ If the password was changed because someone else knew it. They should be automatically logged out to `remove access` from them.

4. How the idle warning decides when to appear, and why it measures from the last server confirmation instead of the last mouse movement?

+ The idle warning timeout will appear **2 minutes** before the **15 minutes** `idle time`. 
+ It measures from the last server confirmation instead of the last mouse movement to keep the `browser's clock conservative`, it may warn slightly early but never too late.

5. Why tabs need to share session updates?

+ Tabs need to share session updates so that you won't get logout if there are other browser `opened` and `untouch`.
