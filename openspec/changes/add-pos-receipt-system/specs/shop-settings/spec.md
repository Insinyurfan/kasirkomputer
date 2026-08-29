## Purpose

Stores the editable parts of the receipt header and footer and the receipt-numbering configuration, so the nota can be adjusted without code changes.

## ADDED Requirements

### Requirement: Edit receipt header and footer fields

The system SHALL persist and let the admin edit the following fields used on the receipt: address, phone, header note (optional), and footer note (optional). The shop name is fixed as "Shinzi Computer" and SHALL NOT be editable. Saved values SHALL take effect on subsequently rendered receipts, including reprints of past sales.

#### Scenario: Update address

- **WHEN** the admin changes the address to "Jl. Merdeka No. 10, Bandung" and saves
- **THEN** newly previewed receipts and reprinted past receipts show the new address

#### Scenario: Optional fields blank

- **WHEN** the admin leaves the header note and footer note empty
- **THEN** receipts render without those lines and without empty gaps

#### Scenario: Shop name is fixed

- **WHEN** the admin views settings
- **THEN** there is no field to change the shop name and receipts always show "Shinzi Computer"

### Requirement: Configure receipt numbering

The system SHALL let the admin set a starting receipt number. New sales SHALL be numbered continuing from the highest number used so far, or from the starting number if no sale has been numbered yet. Lowering the starting number below numbers already used SHALL NOT cause a previously used number to repeat.

#### Scenario: Set starting number on a fresh system

- **WHEN** no sales exist and the admin sets the starting receipt number to 1000
- **THEN** the first completed sale is numbered 1000 and the next is 1001

#### Scenario: Starting number cannot cause collisions

- **WHEN** sales up to number 1050 exist and the admin sets the starting number to 1

- **THEN** the next sale is numbered 1051, not 1

### Requirement: Settings are available on first run

The system SHALL provide default settings when none have been saved, so receipts render before the admin visits the settings screen.

#### Scenario: Defaults present

- **WHEN** the admin completes a sale before ever opening settings
- **THEN** the receipt renders with "Shinzi Computer", placeholder/blank editable fields, and a valid receipt number
