# Add the walkthrough to your website

This package contains the current interactive walkthrough for Levels 0–3, matching floor-plan PDFs, and the bundled 3D library. Design revision: **2026-09-17-east-entry-314**.

## For your website administrator

1. Unzip the package and upload the complete `building-walkthrough` folder to your website's public files. Keep its internal folders intact.
2. Check `https://YOUR-WEBSITE/building-walkthrough/levels/0/` in a browser. This opens the ground floor; visitors can switch to all four levels.
3. Copy `embed-snippet.html` into the HTML of the page where you want the walkthrough. It creates an interactive panel and a link to open a larger view. Adjust its height to suit your page.

`embed-example.html` is a complete sample page. Upload it beside the folder to preview the embedding. Your existing website's styling stays separate from the walkthrough inside the frame.

If the upload is inside another folder, change both URLs in the snippet to that location. For example, `/projects/building-walkthrough/levels/0/`. For hosting on a different domain, use its full HTTPS URL in both places.

## What visitors can do

- Switch between Levels 0, 1, 2 and 3.
- Rotate and zoom the models, use viewpoints, and walk through the rooms.
- Use the existing doors, furniture, display and lighting controls.
- Open the current floor drawings and the full plan set.

This is a website package presented through an iframe. The interactive behaviours live in the included web application; a mesh-only 3D file would need a separate viewer and interaction code. No database, build step, external CDN or paid viewer service is needed. The Three.js licence is retained in `building-walkthrough/vendor/LICENSE`.

## Hosting details

Serve the files through your normal HTTPS website. Opening a downloaded HTML file directly from disk is not a supported preview method because it uses JavaScript modules. Serve `.js` files with a JavaScript MIME type, such as `text/javascript`, and preserve directory index handling for `index.html`.

The iframe includes fullscreen permission. If your university CMS applies a restrictive content-security policy or a sandbox to embeds, its administrator may need to permit this frame, the walkthrough's JavaScript modules and inline import maps. For a different hosting domain, the walkthrough's frame policy must permit your website. The new-tab link also gives visitors a direct way to open the walkthrough.

Browsers need JavaScript and WebGL enabled. Narrow screens use the walkthrough's existing stacked layout; controls below the model can be reached by scrolling inside the panel.

Reference: [MDN iframe documentation](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe) and [JavaScript module hosting](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules).

## Starting on a different floor

| Floor | URL within the uploaded folder |
| --- | --- |
| Ground / Level 0 | `levels/0/` |
| Level 1 | `./` |
| Level 2 | `levels/2/` |
| Level 3 | `levels/3/` |

## Future updates

This is a snapshot of the current design. After further design changes, rebuild the export and replace the whole uploaded folder. The authoring workspace provides `output/reconciliation/export_website.py` to recreate this package. The current plans and design notes remain inside the walkthrough; `plans/VERIFY.md` records the remaining design assumptions.
