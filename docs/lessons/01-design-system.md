# Design System

## Questions

1. What design tokens are, and why dark mode needed no changes to any component
2. How the fonts are loaded, and why self-hosting matters for an LGU network
3. What the four Button variants are for
4. Why the theme toggle needs the mounted check
5. Any problem you hit, and how you fixed it.

## Answers

1. Design tokens are named variables that store visual design decision. For example, you have hex-color code you can change it to a readable format instead.
2. Fonts are loaded locally, so it doesn't need to contact google fonts to get the font design.
3. The four button variants are:
    - `primary`: it is for the main actions.
    - `secondary`: it is for the supporting actions. (Print or Export)
    - `ghost`: it is for the quiet actions inside tables and toolbars.
    - `danger`: usually this is color red, and this is for destructive actions.
4. `Mounted Check` is to identify the current user's saved theme.
5. The problem I encountered is when running the `npm run format` it says there is a missing script. I fixed when I added a script on package.json under `"scripts"` section.

```json
"format": "prettier --write .",
"format:check": "prettier --check .",
