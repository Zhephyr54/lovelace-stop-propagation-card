# stop-propagation-card

HA Lovelace Stop Propagation Card

Container for a clickable card that stops its interactions from bubbling to
a parent, specifically created to be used inside the title-card of
[lovelace-expander-card](https://github.com/MelleD/lovelace-expander-card)
with `title-card-clickable`, so tapping the child doesn't also toggle the
expander.

```yaml
type: custom:expander-card
title-card-clickable: true
title-card:
  type: custom:stop-propagation-card
  card:
    type: custom:stack-in-card
    mode: horizontal
    cards:
      - type: custom:stop-propagation-card
        card:
          type: custom:button-card
```

## Config

| Option    | Default | Description |
|-----------|---------|-------------|
| `card`    | —       | required, the wrapped card config |
| `actions` | none    | opt into selective blocking (see below) |
| `grow`    | `false` | let this card grow in a flex row (e.g. `stack-in-card`) instead of staying its natural size |

### `actions` (selective blocking)

Without `actions`, **all** clicks/taps/holds are blocked from reaching the
parent.

With `actions`, only the listed action types are blocked, anything
else propagates normally.  
Fully supported: `tap_action`, `hold_action`,
`double_tap_action`.  
`press_action`/`release_action` are partially
supported: the semantic action is blocked from reaching an ancestor's own
action-handler, but the native `mousedown`/`touchstart` behind `press` (and
`touchcancel` behind `release`) isn't intercepted, so use default full-block
mode if you need those fully contained.

Limitations: a child with double-tap enabled delays its `tap` action ~250ms,
so its native click can reach the parent before we know it was a tap (use
default full-block mode instead in that case). `touchstart` is never
selectively blocked, since tap vs. hold isn't known yet at that point.

### `grow`

Some containers (e.g. `stack-in-card` horizontal) force all direct children
to share space equally via their own CSS. Default keeps the wrapped card at
its natural size. Set `grow: true` for cards that should expand.
