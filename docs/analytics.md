# Analytics

## Interactive IDL Feature Funnel

The Interactive IDL (Anchor) feature tracks user engagement through the following funnel:

```
tab_opened → [wallet_connected ↔ sections_expanded] → transaction_submitted → transaction_confirmed/failed
```

> **Note:** `wallet_connected` and `sections_expanded` may occur in any order - user can expand sections before connecting wallet or vice versa.

### Events

| Event | Parameters |
|-------|------------|
| `tab_opened` | `program_id` |
| `wallet_connected` | `program_id`, `wallet_type` |
| `sections_expanded` | `program_id`, `expanded_sections`, `expanded_sections_count` |
| `transaction_submitted` | `program_id`, `instruction_name` |
| `transaction_confirmed` | `program_id`, `instruction_name`, `transaction_signature` |
| `transaction_failed` | `program_id`, `instruction_name`, `error_message` |

All events are prefixed with `iidl_anchor_`.

> GA4 event names must be <= 40 characters. This is enforced at compile time via the `GA4EventName` type in ../app/shared/lib/analytics/types.d.ts
