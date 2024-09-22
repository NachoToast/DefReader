# DefReader

An XML parser and generator for converting RimWorld Defs into typed JavaScript objects.

## Current Features

- Fairly lenient XML parsing - Works with comments, random whitespace, and arbitrary line wrapping.
- Basic validation - Alerts for missing values or unexpected value types.
- Respects XML inheritance - Attributes like Abstract, Name, and ParentName are considered when constructing objects.
- Smart parsing order independent of file location - Parent XML nodes can be defined after their children or even in different files and will still be correctly parsed.

## Not Yet Supported

- Inherit="False" attributes on nested XML nodes.
- Array presets.

## Why This Was Made

I had previously planned out a tech tree for my [NachoToastium](https://github.com/NachoToast/NachoToastium) mod using draw.io, however I was running into limitations using the tool so I started looking for alternatives, ideally ones with reusable components so the research project defs can be easily copied over.

I tried Figma as well but it lacked the tools I wanted, so I figured making a website would be the best way to go. Given the nature of a website, I could include a lot more information (in things like tooltips and dropdowns) than the usual draw.io or Figma diagram, but manually typing out all the research labels, icons, descriptions, etc would be too much work, especially if I changed some XML later down the line. 

## Setup

Requires [Node.js](https://nodejs.org/en), with Corepack or [pnpm](https://pnpm.io/).

```sh
git clone https://github.com/NachoToast/DefReader
cd DefReader
corepack enable
pnpm install
cp config.example.json config.json
pnpm start
```
