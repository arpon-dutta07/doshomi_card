# বিজয়ার চিঠি: images to generate

**For whoever generates these (Antigravity or a person):** only make the images. Do not edit any code.
Save every image into this `art/` folder with **exactly** the file name given (PNG or JPG both fine, highest
resolution the tool allows). Claude cuts them out, shrinks them and wires them into the site.

Goal: everything must look like a **real photograph**, not an illustration, cartoon, 3D render or clip art.

Add this to the end of every prompt:

> Photorealistic photograph, natural lighting, true-to-life colours and textures, shot on a full-frame camera,
> sharp focus, subtle natural film grain. No text, no letters, no logo, no watermark, no border, no frame,
> no people, no hands.

---

## 1. `ma-dashami.jpg` (portrait 4:5), required

The default photo inside the letter, under the paan leaves, used when the sender adds no photo.

> Close-up portrait photograph of the face of a traditional Bengali Durga Puja clay idol (protima) on Vijaya
> Dashami, after sindoor khela and boron. Ma Durga's golden-yellow face with large almond-shaped painted eyes, a
> third eye on the forehead, red bindi, gentle smile. Fresh red sindoor smeared on her cheeks, forehead and the
> parting of her hair, a little sindoor dust on her crown. A green betel leaf and a piece of white sandesh
> touched to her lips, as women do in boron. White shola-pith and silver daker saaj crown and earrings. Soft warm
> oil-lamp light from below left, dark softly blurred pandal background with warm bokeh. Face centred, filling
> about 70% of the frame, eyes in the upper third. Vertical 4:5 portrait, 85mm lens, shallow depth of field.

## 2. `paan-leaf-1.png` and `paan-leaf-2.png` (portrait 3:4), required

Two leaves cover the photo and get swiped away. Make two slightly different leaves.

> One single fresh betel leaf (paan pata), photographed straight from above, heart-shaped, the pointed tip at
> the top and the short stem at the bottom, glossy deep green with clearly visible curved veins, slightly
> curled edges. The leaf is centred and fills about 85% of the frame. Isolated on a perfectly flat, pure white
> background (#FFFFFF), even soft studio light, no shadow, no other objects. Vertical 3:4.

For leaf 2 add: "a slightly lighter, younger leaf with a gentle twist".

## 3. Sweets on green screen (square 1:1), required

One sweet per image. All five use the same framing so they sit together in the box.

Base prompt (replace `[SWEET]`):

> A single [SWEET], seen from a 3/4 top-down angle, centred, filling about 70% of the frame. Isolated on a
> perfectly flat, solid chroma-key green background (#00B140), evenly lit with no shadow on the background,
> no plate, no doily, no leaf, nothing else in the frame. Soft studio light from the top left, realistic
> texture and moisture. Square 1:1.

| File | `[SWEET]` |
| --- | --- |
| `sweet-rosogolla.png` | Bengali rosogolla (rasgulla): a soft white spongy ball, glistening with clear sugar syrup, a tiny drop of syrup at its base |
| `sweet-sandesh.png` | Bengali sandesh: a round pale cream sandesh pressed in a wooden mould, with a fine flower pattern on top, slightly crumbly edges |
| `sweet-naru.png` | Bengali narkel naru: a round coconut ladoo made of grated coconut and jaggery, light brown with visible coconut shreds |
| `sweet-langcha.png` | Bengali langcha from Shaktigarh: a long deep-fried dark brown cylindrical sweet, glossy with syrup |
| `sweet-pantua.png` | Bengali pantua: a round deep-fried dark reddish-brown sweet ball, glossy with syrup, slightly cracked skin |

## 4. `box-open.jpg` (square 1:1), required

The inside of the sweet box, seen after the lid opens. The sweets are placed on it by the site.

> Straight top-down photograph of the inside of an empty, open, square white cardboard Bengali sweet box
> (mishtir baksho). The box fills the entire frame edge to edge, so no table or background is visible. A round
> white paper doily lies flat in the middle of the bottom. Soft daylight from the top left, gentle shadows on the
> inner walls, a little cardboard texture. Empty: no sweets, no crumbs, no text. Square 1:1.

## 5. `box-lid.jpg` (square 1:1), required

The closed lid. The shop name and the red-and-white string are added by the site.

> Straight top-down photograph of the closed lid of a square white cardboard Bengali sweet box. The lid fills
> the entire frame edge to edge, so no background is visible. Plain off-white cardboard with subtle texture and
> a thin printed red double-line border running about 8% in from the edges. Nothing printed inside the border,
> no string, no text. Soft even daylight. Square 1:1.

---

## Nice to have (do these after the required ones)

### 6. `cord.png` (wide 3:1)

> A straight piece of thin twisted cotton string with red and white strands (the kind tied around Bengali sweet
> boxes), lying perfectly horizontal across the full width of the frame, on a perfectly flat solid chroma-key
> green background (#00B140), even light, no shadow. Wide 3:1.

### 7. `saree-fabric.jpg` (portrait 2:3)

> Flat top-down close-up of off-white Bengali garad silk saree fabric, fine visible weave, a soft natural silk
> sheen, very gentle folds, evenly lit, no border visible, no pattern. Vertical 2:3.

### 8. `inland-paper.jpg` (portrait 2:3)

> Flat top-down scan of a sheet of pale blue Indian inland letter paper, fine paper fibres, very slightly uneven
> tone, perfectly flat with no folds, no writing, no print, evenly lit. Vertical 2:3.

---

Already have (no need to make): the river ending reuses `bisarjan-1/2/3` and `diya-top` from the chokkhu-daan
project.
