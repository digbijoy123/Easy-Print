# Easy Print Windows Agent

This is the local shop-computer agent. It connects to the Easy Print web order queue and currently uses a **virtual printer output folder** because no physical printer is connected yet.

## Requirements

- Windows 10/11
- Node.js 20+
- A production Easy Print deployment
- `EASYPRINT_AGENT_TOKEN` configured on both Vercel and this PC

## Setup

1. Copy `.env.example` to `.env`.
2. Put the same strong random token into `EASYPRINT_AGENT_TOKEN` that is configured on the Vercel project.
3. Run:

```bash
npm start
```

The agent polls every 5 seconds.

## Virtual printer

Completed print jobs are written to `virtual-printer-output/<ORDER_ID>/`.

The agent deletes its temporary working copy after each print. The server-side customer files are deleted only after the order is marked **printed** and payment is confirmed.

## Important

`EASYPRINT_AUTO_CONFIRM_CASH=false` is the safe default. When false, a cash order remains in the `printed` state until the shop confirms payment through the future local shop control.

Do not put the agent token into customer-facing code.
