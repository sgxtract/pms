## Password Reset and Disabling

### Questions & Answers

1. **Why sessions are deleted when disabling, even though is_active is already checked on every request**

- This is because of re-enabling. Without deleting, when an Admin `disabled` someone by mistake and re-enabled them a few minutes later, the old sessions would come back to life, including one on a computer the user may have walked away from. So it means, deleting sessions means a re-enabled user must sign in again, fresh.

2. **Why the password is hashed before the transaction starts**

- Password hashing is deliberately slow. Locked rows make other transactions wait.

3. **Why you can't reset your own password from the user management page**

- This also prevents some unexpected scenario where you left your session open and someone tries to reset your own password. The account can be taken over. The only way to change password is in the password page where it requires your current password.

4. **Which actions need a confirmation step, and why enabling doesn't**

- If every button asked `"Are you sure?"`, people would quickly learn to click `"Yes"` without reading. This is called **`confirmation fatigue`**. Then, when a confirmation really matters, it would be ignored like all the others.

5. **What the tamper tests showed**

- Tamper test shows `"You can't disable or enable your own account"` and when a `Moderator` try to change the status of an `Admin` the server will refuse it and it will show `"You can't change this account's status"`.
