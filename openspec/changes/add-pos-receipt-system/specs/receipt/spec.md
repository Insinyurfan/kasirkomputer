## Purpose

Renders the printable nota for a sale with an editable shop header, and gives the admin a preview plus three actions — download PDF, download JPG, and print — before anything is sent to the printer.

## ADDED Requirements

### Requirement: Receipt layout and content

The system SHALL render a receipt (nota) for a given sale containing, in order:

1. A header block with the shop name "Shinzi Computer" (fixed, not editable) followed by the editable address, phone, and an optional header note from shop settings.
2. The receipt number and the sale date/time.
3. A table of line items showing item name, quantity, unit price, and line total.
4. The subtotal, the discount (if any), and the grand total.
5. The payment method, amount paid (if recorded), and change (if applicable).
6. An editable footer note from shop settings (for example a thank-you line).

Monetary values SHALL be formatted as Indonesian Rupiah with thousands separators and no decimals (for example "Rp 700.000"). A voided sale's receipt SHALL show a prominent "VOID" mark.

#### Scenario: Receipt shows editable header

- **WHEN** the admin has set the shop address to "Jl. Merdeka No. 10, Bandung" in settings and previews a receipt
- **THEN** the receipt header shows "Shinzi Computer" on top and "Jl. Merdeka No. 10, Bandung" below it

#### Scenario: Receipt reflects sale contents

- **WHEN** a sale has 2x "SSD 512GB" at 700000 and a 10 percent discount
- **THEN** the receipt shows the line total 1.400.000, discount 140.000, and grand total 1.260.000, formatted as Rupiah

#### Scenario: Void marking

- **WHEN** the previewed sale is voided
- **THEN** the receipt renders with a clear "VOID" mark

### Requirement: Receipt preview before printing

The system SHALL show an on-screen preview of the receipt after a sale is completed and whenever a receipt is opened from history. The browser print dialog SHALL NOT open automatically; it SHALL open only when the admin chooses the print action.

#### Scenario: Preview after completing a sale

- **WHEN** the admin completes a sale
- **THEN** the receipt preview is shown with the actions "Download PDF", "Download JPG", and "Print Nota", and no print dialog has opened

#### Scenario: Preview from history

- **WHEN** the admin opens a past sale and chooses to view its nota
- **THEN** the same preview and three actions are shown

### Requirement: Print the receipt

The system SHALL provide a "Print Nota" action that opens the browser's print dialog with only the receipt content visible (application chrome, navigation, and buttons excluded via print styles). The printed output SHALL match the preview layout.

#### Scenario: Print action opens dialog

- **WHEN** the admin clicks "Print Nota" on the preview
- **THEN** the browser print dialog opens showing only the nota

#### Scenario: Print styles hide app UI

- **WHEN** the receipt is printed
- **THEN** navigation, buttons, and other app UI do not appear on the printed page

### Requirement: Download the receipt as PDF

The system SHALL provide a "Download PDF" action that produces a PDF file of the receipt matching the preview layout. The file name SHALL include the receipt number (for example "nota-1042.pdf").

#### Scenario: Download PDF

- **WHEN** the admin clicks "Download PDF" on a receipt with number 1042
- **THEN** a PDF file named with "1042" is downloaded and its content matches the on-screen receipt

### Requirement: Download the receipt as JPG

The system SHALL provide a "Download JPG" action that produces a JPG image of the receipt matching the preview layout. The file name SHALL include the receipt number (for example "nota-1042.jpg").

#### Scenario: Download JPG

- **WHEN** the admin clicks "Download JPG" on a receipt with number 1042
- **THEN** a JPG image file named with "1042" is downloaded and its content matches the on-screen receipt
