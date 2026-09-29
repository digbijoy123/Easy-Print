# Easy Print — Fixed Architecture

## Purpose

This document is the architectural source of truth for Easy Print. Future development must work around this architecture unless the architecture is explicitly changed by the product owner.

## Core Dependency

The Windows desktop application is the origin of a shop.

A customer does not enter a generic Easy Print ordering website. The customer reaches the shop-specific customer website by scanning the unique QR generated during shop setup.

## Canonical Flow

SHOP OWNER
1. Install Easy Print Desktop on the Windows shop PC.
2. Set up store details.
3. Create/register the shop.
4. Easy Print creates a unique Shop ID.
5. Easy Print creates the shop's permanent customer URL.
6. Easy Print generates the shop's unique QR.
7. The shop owner displays/prints that QR.

CUSTOMER
1. Customer scans the shop QR.
2. The QR opens only that shop's customer endpoint.
3. Customer uploads photos/documents.
4. Customer optionally edits photos.
5. Customer selects print service, paper, copies, etc.
6. Website calculates/displays the price.
7. Customer selects payment method.
8. Customer submits the order.
9. Order is associated with the scanned shop.
10. Files are held in private temporary storage.
11. The shop desktop/agent later receives the order.
12. Printing is performed by the shop's printer.
13. After printing and payment completion, customer files are deleted.

## Customer Entry Rule

There must be no generic customer ordering flow such as:

easyprint.example.com -> choose a shop -> place order

The intended flow is:

physical shop QR -> unique shop URL -> that shop's customer ordering page

The generic root domain may exist for informational/product purposes, but it must not be an alternate customer ordering entry point.

## Shop Isolation

Every shop has its own:
- Shop ID
- customer URL
- QR
- services
- pricing
- orders
- agent credentials
- configuration

Shop A must never be able to access Shop B's customer files, orders, pricing, or configuration.

## QR Rule

The QR is permanent for the shop unless the owner explicitly regenerates/reissues it.

Changing:
- shop name
- service prices
- active services
- other shop configuration

must not require changing the QR.

## Storage Rule

Customer files are temporary.

Lifecycle:

customer upload
-> private Blob storage
-> order
-> desktop receives/downloads files
-> printing
-> payment completion
-> delete customer files

If printing or payment has not completed, files must remain available for the required retry/processing flow.

Local temporary copies should also be deleted after processing.

## Current Development Boundary

The current development work may focus on the website/cloud side, but all interfaces must be designed for the future Windows desktop origin and agent.

Current website/cloud work includes:
- shop identity data model
- shop-specific customer route
- private Blob storage
- customer upload
- image editing
- services/pricing
- order creation
- payment state
- order queue
- secure shop-scoped file access
- cleanup lifecycle

The desktop application is a later implementation phase, not a replacement for this architecture.

## Build Phases

### Phase 1 — Shop/Cloud Foundation
Prepare the cloud model that the future desktop setup will use:
- unique Shop ID
- permanent shop identity
- shop-specific URL
- shop configuration
- private storage
- shop isolation

### Phase 2 — Customer Website
Build the QR-target customer experience:
- shop-specific branding/name
- services
- prices
- upload
- image editing
- print settings
- dynamic total
- payment selection
- order submission

### Phase 3 — Order and File Lifecycle
Implement:
- order manifests
- private file access
- shop-scoped order queue
- payment state
- printing state
- failure/retry state
- deletion after successful print/payment
- abandoned-order cleanup

### Phase 4 — Desktop Origin
Build Easy Print Desktop:
- installation
- store setup
- shop registration
- Shop ID creation
- QR generation
- QR display/printing
- shop configuration
- secure agent pairing

### Phase 5 — Desktop Agent
Connect the desktop to the cloud:
- receive shop-scoped orders
- securely download files
- process print jobs
- report status
- handle failures/retries
- confirm payment
- trigger cloud cleanup

### Phase 6 — Physical Printer
Replace development/virtual printing with:
- Windows printer discovery
- printer selection
- paper size
- copies
- colour/B&W
- printer-specific settings
- printer error handling

### Phase 7 — Production Hardening
Add:
- authentication/security hardening
- rate limiting/abuse protection
- monitoring/logging
- reliable cleanup
- shop onboarding
- licensing/subscription if required

## Important Product Constraints

- No shared shop QR.
- No global customer ordering link.
- No global agent token.
- No permanent customer photo storage.
- No cross-shop access.
- Do not design the website as a standalone marketplace.
- Do not make the customer responsible for knowing a Shop ID manually; the QR supplies the shop identity.
- The future desktop application must be capable of creating the shop and its QR before customer ordering begins.

## Development Principle

Build the website/cloud side now, but build its APIs, routes, storage, authentication boundaries, and data model around the future desktop-created shop and QR flow.

Do not reverse the dependency by making the website create the shop first.
