# CSV Format

This project supports **two-file mode**:

## 1) RO headers CSV (required)

Required columns (minimum):
- `ro_number`
- `ro_date` (ISO date recommended)

Optional columns:
- `advisor`
- `vin`
- `mileage`
- `customer_name`
- `phone`
- `email`

## 2) Declined line items CSV (required)

Required columns (minimum):
- `ro_number`
- `line_desc`
- `declined_amount` (number)

Optional columns:
- `declined_category` (e.g., brakes/tires/battery)

## Notes

- The join key is `ro_number`.
- `declined_amount` can be formatted like `123.45` or `$123.45`.
