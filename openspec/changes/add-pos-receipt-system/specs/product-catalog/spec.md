## Purpose

Maintains the list of products Shinzi Computer sells, each with a price, so they can be searched and added as line items when creating a sale.

## ADDED Requirements

### Requirement: Create a product

The system SHALL let the admin add a product with a name, unit price, and optional code/SKU. The name MUST be non-empty. The unit price MUST be an integer greater than or equal to 0, representing whole Rupiah. A new product SHALL default to active.

#### Scenario: Add a valid product

- **WHEN** the admin submits a product with name "SSD 512GB" and price 750000
- **THEN** the product is saved, marked active, and appears in the product list and in POS search results

#### Scenario: Reject empty name

- **WHEN** the admin submits a product with a blank name
- **THEN** the system rejects the submission and shows a validation message, and no product is created

#### Scenario: Reject invalid price

- **WHEN** the admin submits a product with a negative price or a non-integer price
- **THEN** the system rejects the submission and shows a validation message, and no product is created

### Requirement: Edit a product

The system SHALL let the admin change a product's name, code, and unit price. Editing a product's price SHALL NOT change the price recorded on sales that already exist.

#### Scenario: Update price

- **WHEN** the admin changes the price of "SSD 512GB" from 750000 to 700000
- **THEN** subsequent sales use 700000 for that product
- **AND** previously completed sales still show 750000 for their line items

### Requirement: Deactivate and reactivate a product

The system SHALL let the admin deactivate a product instead of deleting it, and reactivate it later. Deactivated products SHALL NOT appear in POS search results but SHALL remain visible in the product list (filterable) and on historical sales.

#### Scenario: Deactivate hides from POS

- **WHEN** the admin deactivates "Mouse Wireless"
- **THEN** "Mouse Wireless" no longer appears when searching products on the new-sale screen
- **AND** it still appears in the full product list marked as inactive

#### Scenario: Reactivate restores to POS

- **WHEN** the admin reactivates "Mouse Wireless"
- **THEN** it appears again in POS search results

### Requirement: Search and list products

The system SHALL provide a product list showing name, code, price, and active status, and SHALL support searching products by a text query matching name or code (case-insensitive, partial match).

#### Scenario: Partial name search

- **WHEN** the admin types "ssd" in product search
- **THEN** all products whose name or code contains "ssd" (any case) are listed

#### Scenario: Empty result

- **WHEN** the admin searches for a term that matches no product
- **THEN** the system shows an empty-state message and no rows
