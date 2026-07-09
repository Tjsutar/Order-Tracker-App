# System Design Review: Order Tracker App

As a System Design Expert, I have reviewed the current architecture of the Order Tracker application. While the application achieves its functional MVP requirements, there are significant architectural, security, and scalability gaps that must be addressed before this can be considered production-ready.

Below is a detailed breakdown of the critical gaps and recommended remediations.

---

## 1. Security & Authentication (Critical Priority)

> [!CAUTION]
> The application currently possesses critical security vulnerabilities that could lead to complete system compromise and data exfiltration.

* **Client-Side Authorization:** The application relies on `localStorage.setItem('userRole', role)` to determine user permissions. Any user can open their browser's Developer Tools, change their role to `ADMIN` or `VENDOR`, and instantly gain unauthorized access to other portals.
* **Unprotected APIs:** The backend API routes (e.g., `/api/pos`, `/api/shipments`) do not validate JWTs, session cookies, or API keys. They implicitly trust the client requests.
* **Directory Traversal Vulnerability:** The `/api/files?path=...` endpoint blindly accepts file paths from the client and reads them using `fs.promises`. An attacker could pass paths like `../../../../etc/shadow` or `C:\Windows\System32\config\SAM` to read sensitive server files.

**Recommendation:** Implement robust session management (e.g., NextAuth.js or Clerk). Validate user identity and roles on **every** API request. Switch to serving files via pre-signed URLs or strictly validate file IDs against a database rather than accepting raw paths.

## 2. File Storage & Architecture

> [!WARNING]
> Storing files on the local filesystem prevents the application from scaling horizontally.

* **Stateful Servers:** The app reads and writes uploaded PDFs directly to the local disk (with assumptions about local OneDrive syncing). If this app is deployed to a modern cloud environment (like Vercel, AWS ECS, or Kubernetes), the local filesystem is ephemeral. Files uploaded to Server A will not be accessible from Server B.
* **Blocking I/O:** Serving large PDFs directly through Next.js API routes forces the Node.js event loop to handle heavy I/O, reducing the throughput for other API requests.

**Recommendation:** Migrate file storage to a dedicated object storage service (e.g., Amazon S3, Google Cloud Storage, Azure Blob Storage). Use Content Delivery Networks (CDNs) to serve these files directly to the client, entirely bypassing the Node.js server.

## 3. Database & Data Modeling

> [!NOTE]
> The current schema lacks the constraints and tracking necessary for an enterprise workflow system.

* **String-based Statuses:** In `schema.prisma`, fields like `overallStatus` and `status` are defined as plain `String` types instead of `enum`. This can lead to database corruption if a typo is introduced in the code (e.g., saving `"COMPLETE"` instead of `"COMPLETED"`).
* **Missing Audit Trails:** Enterprise tracking systems require strict auditing. While there is a `TrashItem` table, there is no `AuditLog` tracking *who* changed a PO status, *when* it happened, and *what* the previous value was.
* **Indexing Gaps:** As the `PurchaseOrder` and `Shipment` tables grow, queries filtering by `overallStatus` or `customerId` will become severely degraded because these foreign keys and frequently filtered columns lack explicit database indexes.

**Recommendation:** Convert status fields to PostgreSQL Enums. Implement an event-sourcing pattern or an `AuditLog` table. Add `@@index` to frequently queried fields in Prisma.

## 4. Frontend Architecture & State Management

> [!TIP]
> Refactoring the frontend will dramatically improve maintainability and performance.

* **Monolithic Components:** Pages like `vendor/page.tsx` are massive "God Components" (handling API fetching, local state, tab navigation, rendering multiple modals, and file uploading all in one file). This tightly coupled logic is prone to regression bugs.
* **Primitive Data Fetching:** The app uses raw `useEffect` and `fetch` calls for state. This leads to race conditions, poor cache invalidation, and UI flickering. There is no optimistic UI updating when a user changes a status.

**Recommendation:** Break down pages into smaller, single-responsibility React components. Introduce a robust data-fetching library like **React Query (@tanstack/react-query)** or **SWR** to handle caching, background refetching, and optimistic mutations.

## 5. Scalability & Resilience

* **Synchronous Heavy Processing:** If the vendor uploads multiple large PDFs to be merged, this processing happens synchronously in the API route. Next.js API routes (especially on serverless platforms) have strict timeout limits (e.g., 10 to 60 seconds). A heavy merge operation will time out, leaving the user with a broken experience and orphaned data.

**Recommendation:** Offload heavy tasks (PDF merging, email notifications) to a background worker queue (e.g., Redis + BullMQ, or AWS SQS). Return an immediate `202 Accepted` to the client, and use WebSockets or polling to notify the client when the processing is complete.
