# Narrow comparison: explicit batch preflight

## Fixed comparator

[Lumio Design Studio](https://github.com/vipinyadav01/lumio-design-studio), MIT, commit **3a8034c037d61f5d91dbdce70c456ee403195e84**.

Relevant source:
- [bulk-panel.tsx](https://github.com/vipinyadav01/lumio-design-studio/blob/3a8034c037d61f5d91dbdce70c456ee403195e84/components/editor/bulk-panel.tsx)
- [bulk-export.ts](https://github.com/vipinyadav01/lumio-design-studio/blob/3a8034c037d61f5d91dbdce70c456ee403195e84/components/editor/bulk-export.ts)
- [fabric-setup.ts](https://github.com/vipinyadav01/lumio-design-studio/blob/3a8034c037d61f5d91dbdce70c456ee403195e84/components/editor/fabric-setup.ts)

The reviewed CSV bulk panel advises checking long values manually, then invokes the bulk export path. That path fills a template and calls renderPage with strict enabled. The reviewed strict checks concern loaded objects/assets and group completeness, not automatic per-row text/background contrast or template text-capacity checks.

This is source-path inspection, **not a full installed Lumio end-to-end benchmark**. It makes no claim that all other Lumio editing features lack validation. Lumio offers a much broader editor and batch PNG export; Brand Kit Lite does not replace it.

## Reproduce this tool's narrow safeguard

Set background to #777777 and accent to #888888. Import:

```csv
id,title,date,time,venue,performer,cta
short,海风与磁带,2026-12-06,19:30,北岸音乐空间,The Quiet Lines,现场见
long,长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长,2026-12-06,19:30,北岸音乐空间,The Quiet Lines,现场见
```

Expected:
- Both rows show a low-contrast accent warning. Exported text uses the selected higher-contrast black/white color instead.
- The short row remains exportable.
- The 40-character CJK title fails template geometry; the long row and batch ZIP are blocked rather than silently clipping it.
- The JSON preflight report states that layout checks are character-width estimates, not Canvas-measured font overflow.
- Shorten the second title and the batch becomes exportable.

The specific advantage is an explicit, automated and actionable row-level gate in this constrained event-template workflow versus the reviewed manual-check CSV export path. It is **not** better overall design capability, proof of universally accurate typography, or evidence of customer demand.

Internal test `two row competitor fixture blocks long title and warns each row` runs the corresponding inputs. Independent source review and real browser acceptance remain release gates.
