# Easy Print

Easy Print is being built as a QR-driven printing workflow for local printing and Xerox shops.

## Product direction

Customer:

1. Scan the shop QR code.
2. Upload a photo or document.
3. Optionally edit it.
4. Choose print settings.
5. Review the price.
6. Pay by UPI or choose cash.
7. Submit the order.

Shop:

1. Install the local Print Agent on the shop computer.
2. Connect existing printers.
3. Receive print jobs.
4. Print automatically.

## Architecture

The web application will run on Vercel. A local Print Agent will handle communication with printers on the shop's own computer.

The project is intentionally starting with the web foundation first. Printing, payments, storage, shop configuration, and the local agent will be added in separate phases.
