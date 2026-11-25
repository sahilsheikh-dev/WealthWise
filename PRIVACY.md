# WealthWise Privacy Statement

WealthWise is designed with privacy and data ownership as foundational principles. The application is **100% offline-first**. We do not collect, process, host, track, or share your financial data.

---

## 1. Local-Only Storage

- **Device Sandboxing:** All financial records—including transactions, accounts, assets, liabilities, budgets, goals, and personal notes—are stored exclusively on your device within the application's private sandbox storage.
- **Persistence Technologies:** WealthWise stores state locally using an embedded SQLite database (`wealthwise-state.db`) and local key-value storage (`wealthwise.app.v1` via AsyncStorage).
- **No Cloud Accounts or Sync:** WealthWise does not provide cloud accounts, remote synchronization servers, or backend databases. Your data never leaves your physical device unless you choose to export a backup manually.

---

## 2. Zero Network Calls and No Telemetry

- **No Remote Telemetry:** WealthWise contains **no analytics frameworks, crash reporting beacons, tracking scripts, or advertising SDKs**.
- **No Network Requests:** The application runtime makes **zero network requests** (no `fetch`, `XMLHttpRequest`, or `WebSocket` connections). The app functions completely without internet connectivity.

---

## 3. Data at Rest and Security Boundary

- **Application-Level Storage at Rest:** Local SQLite and AsyncStorage files stored inside the app sandbox are **unencrypted at rest** at the application layer.
- **Operating System Protection:** Data confidentiality relies upon your device's operating system security sandbox and hardware-backed device encryption (such as Android File-Based Encryption or Apple Data Protection).
- **Security Limitation:** If your device is rooted, jailbroken, or physically compromised without a strong device passcode, the operating system sandbox may be bypassed, exposing local application files. We strongly recommend using a secure device passcode or screen lock.

---

## 4. Backups and Encryption

- **Manual Exports:** WealthWise allows you to create manual backup files of your data.
- **Encrypted Backups:** You can optionally protect exported backup files with a password. Encrypted backups use industry-standard **AES-256-GCM** authenticated encryption with keys derived using **PBKDF2** (100,000 iterations and a unique 16-byte cryptographic salt).
- **Unencrypted Backups:** If you choose to export a backup without a password, the exported JSON file is unencrypted. You are responsible for the secure storage and transmission of unencrypted backup files.
- **Android Auto-Backup Disabled:** The application explicitly configures `android:allowBackup="false"` in its manifest. This prevents operating system automated cloud backups from copying unencrypted local databases to remote cloud storage without your knowledge.

---

## 5. Device Permissions

WealthWise requests only the minimum permissions necessary for offline functionality:

- **Notifications:** Used solely for local reminder notifications scheduled directly on the device (notification channel `'reminders'`). No push notification tokens, APNs, or Firebase Cloud Messaging (FCM) servers are used.
- **Biometric Authentication:** When enabled in Settings, the app uses your device's biometric sensor (Face ID, Touch ID, or Android BiometricPrompt) to lock and unlock the application interface. Biometric verification is performed locally by the device's Secure Enclave or Trusted Execution Environment. WealthWise never accesses, captures, or stores your biometric data. A fallback to your system passcode is provided.
- **File and Document Access:** Backup import and export actions use scoped system pickers (`expo-document-picker`) and the native share sheet (`expo-sharing`). WealthWise does not request broad storage permissions (such as `READ_EXTERNAL_STORAGE` or `MANAGE_EXTERNAL_STORAGE`).
- **Notification-Based Transaction Detection (Android-only, Opt-In):** When you explicitly accept the in-app prominent disclosure and grant Android Notification Access (`BIND_NOTIFICATION_LISTENER_SERVICE`), WealthWise inspects incoming notifications from your selected payment/banking apps locally in memory to create reviewable transaction drafts. Raw notification text is never saved or transmitted, historical SMS messages are never scanned, no SMS permissions (`READ_SMS` / `RECEIVE_SMS`) are requested, and no financial record is ever created without your confirmation. On iOS, automatic SMS/notification detection is not supported due to platform restrictions.

---

## 6. Children's Privacy

WealthWise does not knowingly collect or solicit any personal information from children or any other users, as the application has no network connection or registration mechanism.

---

## 7. Changes to This Privacy Statement

Any revisions to this privacy statement will be reflected directly in this document within the application repository. Because WealthWise has no network communication, privacy terms do not change remotely without an application update.

---

## 8. Contact and Inquiries

If you have questions or concerns about this privacy statement or WealthWise's offline data architecture, please contact the maintainers through our [GitHub repository](https://github.com/sahilsheikh-dev/WealthWise).
