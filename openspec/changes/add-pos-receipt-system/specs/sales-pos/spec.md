## Purpose

Lets the admin build a sale from catalog products, compute totals, discount, and change, and persist each completed sale with a unique sequential receipt number for later reference and reprinting.

## ADDED Requirements

### Requirement: Build a sale from catalog items

The system SHALL let the admin add products to an in-progress sale by searching the active catalog and selecting a product. Adding a product already on the sale SHALL increase its quantity rather than create a duplicate line. Each line SHALL have a quantity that is an integer greater than or equal to 1.

#### Scenario: Add a product

- **WHEN** the admin selects "SSD 512GB" (price 700000) from search
- **THEN** a line item is added with quantity 1 and line total 700000

#### Scenario: Add same product again

- **WHEN** the admin selects "SSD 512GB" a second time
- **THEN** the existing line's quantity becomes 2 and its line total becomes 1400000

#### Scenario: Change quantity

- **WHEN** the admin sets a line's quantity to 3
- **THEN** that line total becomes unit price times 3 and the sale subtotal updates

#### Scenario: Remove a line

- **WHEN** the admin removes a line item
- **THEN** it no longer appears and the subtotal updates

#### Scenario: Set quantity below one

- **WHEN** the admin sets a line quantity to 0 or a negative number
- **THEN** the system rejects the value and keeps the last valid quantity

### Requirement: Compute sale totals

The system SHALL compute a subtotal as the sum of all line totals. The system SHALL support an optional per-sale discount entered either as a whole-Rupiah amount or a percentage, and SHALL compute the grand total as subtotal minus discount, never below 0. All monetary values SHALL be whole Rupiah.

#### Scenario: Subtotal with no discount

- **WHEN** a sale has line totals 700000 and 150000 and no discount
- **THEN** the subtotal and grand total are both 850000

#### Scenario: Amount discount

- **WHEN** the subtotal is 850000 and the admin enters a discount amount of 50000
- **THEN** the grand total is 800000

#### Scenario: Percentage discount

- **WHEN** the subtotal is 850000 and the admin enters a discount of 10 percent
- **THEN** the discount is 85000 and the grand total is 765000

#### Scenario: Discount cannot make total negative

- **WHEN** the subtotal is 100000 and the admin enters a discount amount of 150000
- **THEN** the discount is capped so the grand total is 0

### Requirement: Record payment and compute change

The system SHALL let the admin select a payment method (at minimum: Cash, Transfer, QRIS) and, for Cash, enter an amount paid. When an amount paid is entered, the system SHALL compute change as amount paid minus grand total. The system SHALL warn when amount paid is less than the grand total but SHALL still allow the sale to be completed.

#### Scenario: Cash with change

- **WHEN** the grand total is 765000 and the admin enters amount paid 800000
- **THEN** the displayed change is 35000

#### Scenario: Underpayment warning

- **WHEN** the grand total is 765000 and the admin enters amount paid 700000
- **THEN** the system shows an underpayment warning and still allows completing the sale

#### Scenario: Non-cash payment

- **WHEN** the admin selects Transfer as the payment method
- **THEN** the amount-paid field is optional and no change is computed

### Requirement: Complete a sale and assign a receipt number

The system SHALL require at least one line item to complete a sale. On completion the system SHALL persist the sale with a timestamp, the payment method, amount paid, discount, subtotal, grand total, and change, plus a snapshot of each line item's product name, unit price, and quantity. The system SHALL assign a receipt number that is unique and strictly increasing, derived from the configured starting number in shop settings.

#### Scenario: Complete a valid sale

- **WHEN** the admin completes a sale with two line items
- **THEN** the sale is saved with the next receipt number and the admin is taken to the receipt preview for that sale

#### Scenario: Cannot complete an empty sale

- **WHEN** the admin tries to complete a sale with no line items
- **THEN** the system blocks completion and shows a message

#### Scenario: Receipt numbers do not repeat

- **WHEN** two sales are completed in sequence
- **THEN** the second sale's receipt number is greater than the first's, and no number is reused even if a later sale is voided

#### Scenario: Line items are snapshotted

- **WHEN** a product's catalog price changes after a sale is completed
- **THEN** the completed sale's stored line item still shows the price and name captured at completion time

### Requirement: View sale history

The system SHALL provide a list of completed sales showing receipt number, date/time, grand total, payment method, and void status, ordered newest first, and SHALL support filtering by a date or date range. The system SHALL show a total of grand totals for the currently filtered, non-voided sales.

#### Scenario: Filter by day

- **WHEN** the admin filters sale history to a single date
- **THEN** only sales completed on that date are listed and the shown daily total is the sum of their grand totals excluding voided sales

#### Scenario: Open a past sale

- **WHEN** the admin opens a sale from history
- **THEN** the sale's line items, totals, and payment are shown and its receipt can be previewed, printed, and exported

### Requirement: Void a sale

The system SHALL let the admin mark a completed sale as voided, with an optional reason. Voiding SHALL NOT delete the sale or its receipt number. Voided sales SHALL be excluded from sales totals and SHALL be visually marked wherever they appear.

#### Scenario: Void a sale

- **WHEN** the admin voids receipt number 1042 with reason "wrong item"
- **THEN** receipt 1042 remains in history marked "VOID", is excluded from daily totals, and its receipt number is not reassigned

#### Scenario: Voided receipt still viewable

- **WHEN** the admin opens a voided sale
- **THEN** its receipt preview renders with a clear VOID marking
