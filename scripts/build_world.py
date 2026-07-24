"""
Build the world's architecture in Blender and export it as a GLB kit.

    blender --background --factory-startup --python scripts/build_world.py

Why this is not `<boxGeometry>` in React any more
-------------------------------------------------
Three things separate a model that reads as architecture from one that reads as
a programmer's placeholder, and none of them are available from a raw box:

1. **Bevels.** A razor 90-degree edge catches no specular highlight, which is
   why untouched cubes look like toys. A small consistent chamfer, ~2cm at this
   scale, gives every edge a sliver of light. This is the single highest-impact
   change in the whole file.

2. **Massing.** Real buildings step back as they rise, have podiums, plant on
   the roof, and vary their proportion. A stack of equal extrusions does not.

3. **Recessed openings.** Windows are holes with depth, not painted rectangles.
   An inset plus a small negative extrude puts a shadow inside every opening,
   and that shadow is what gives a white model its texture.

Everything is exported untextured. The world is white card lit by one sun, so
form and shadow do all the work: the only material is a single Card.
"""

import math
import os

import bpy
import bmesh

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "props")

# ---------------------------------------------------------------- helpers ---


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def card_material():
    """One material for the entire world. Colour lives in the site's palette."""
    mat = bpy.data.materials.get("Card")
    if mat:
        return mat
    mat = bpy.data.materials.new("Card")
    mat.use_nodes = True
    b = mat.node_tree.nodes["Principled BSDF"]
    # linear equivalent of #EAE6DF
    b.inputs["Base Color"].default_value = (0.784, 0.756, 0.714, 1.0)
    b.inputs["Roughness"].default_value = 0.9
    b.inputs["Metallic"].default_value = 0.0
    return mat


def cube(name, size, loc=(0, 0, 0)):
    """A box sitting ON its base at `loc`, not centred through it. Every piece
    of architecture here is placed by its footprint, so this saves a constant
    half-height correction at every call site."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=(loc[0], loc[1], loc[2] + size[2] / 2))
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    return o


def bevel(o, width=0.02, segments=2):
    """The whole point of this file. Small, consistent, angle-limited so it
    only touches genuine corners and never softens a large flat panel."""
    m = o.modifiers.new("bevel", "BEVEL")
    m.width = width
    m.segments = segments
    m.limit_method = "ANGLE"
    m.angle_limit = math.radians(35)
    m.harden_normals = False
    m.miter_outer = "MITER_ARC"


def join(objs, name):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1:
        bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active
    o.name = name
    return o


def punch_windows(o, cuts=3, depth=0.09, inset=0.22, min_area=2.0):
    """Recess a grid of openings into the vertical faces.

    This is the detail pass that makes a white massing model read as a
    building rather than a block: each opening is a real hole with a real
    shadow in it, and on an untextured model those shadows ARE the texture.

    Two things the first attempt got wrong, both worth remembering:

    * `subdivide_edges(use_grid_fill=True)` only grids a face if you hand it
      that face's edges while the face is still a quad. Collecting every wall
      first and subdividing them in one batch re-uses stale edge references
      and silently produces nothing.
    * `inset_individual` already takes a `depth`, and a NEGATIVE depth pushes
      the new face inward along its own normal. Insetting flat and then trying
      to translate the result by hand is both fiddlier and wrong, because the
      face list is invalidated by the inset.
    """
    me = o.data
    bm = bmesh.new()
    bm.from_mesh(me)

    def walls():
        bm.faces.ensure_lookup_table()
        return [
            f
            for f in bm.faces
            if abs(f.normal.z) < 0.35 and len(f.verts) == 4 and f.calc_area() > min_area
        ]

    # subdivide one face at a time, re-querying between each, so every edge
    # reference is live when it is used
    todo = walls()
    for _ in range(len(todo)):
        current = walls()
        if not current:
            break
        f = current[0]
        if f.calc_area() <= min_area:
            break
        bmesh.ops.subdivide_edges(bm, edges=f.edges[:], cuts=cuts, use_grid_fill=True)

    # now recess every small wall panel in one pass
    bm.faces.ensure_lookup_table()
    panels = [
        f for f in bm.faces if abs(f.normal.z) < 0.35 and len(f.verts) == 4 and f.calc_area() > 0.06
    ]
    if panels:
        bmesh.ops.inset_individual(bm, faces=panels, thickness=inset, depth=-depth)

    bm.to_mesh(me)
    bm.free()


def bands(parts, w, d, base, top, step=1.5, out=0.14, thick=0.13):
    """Floor slabs that stand slightly proud of the facade, every `step` up.

    This replaced fine window grids, and the reason is scale. These buildings
    are seen from roughly twenty units away, where a 0.2-unit window recess is
    sub-pixel and vanishes. A horizontal band that projects past the wall casts
    a hard line of shadow across the whole facade, and THAT survives at
    distance. It is also simply how a real massing model is built up.
    """
    y = base + step
    while y < top - 0.35:
        parts.append(cube(f"band{y:.1f}", (w + out, d + out, thick), (0, 0, y)))
        y += step
    return parts


def reveal(parts, w, d, base, height, count=3, depth=0.16, width=0.5):
    """Deep vertical slots down a facade, like expansion joints on a real slab.

    Vertical emphasis against the horizontal bands is what stops a facade
    reading as a stack of pancakes.
    """
    if count <= 0:
        return parts
    spacing = w / (count + 1)
    for i in range(count):
        x = -w / 2 + spacing * (i + 1)
        parts.append(cube(f"rev{i}", (width, d + depth, height), (x, 0, base)))
    return parts


def finish(o, mat):
    o.data.materials.clear()
    o.data.materials.append(mat)
    for p in o.data.polygons:
        p.use_smooth = False


def export(name):
    path = os.path.join(OUT, f"{name}.glb")
    os.makedirs(OUT, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        export_materials="EXPORT",
        export_image_format="NONE",
        export_apply=True,  # bakes the bevel modifiers
        export_yup=True,
        export_cameras=False,
        export_lights=False,
    )
    tris = sum(len(ob.data.polygons) for ob in bpy.context.scene.objects if ob.type == "MESH")
    kb = os.path.getsize(path) / 1024
    print(f"  {name}.glb  ~{tris} faces  {kb:.0f} KB")


# ------------------------------------------------------------- the pieces ---


def build_tower():
    """The Signal Tower: a tapering mast on a stepped podium, with a crown.
    It is the tallest thing in the world and the one you navigate by."""
    reset()
    mat = card_material()
    parts = []

    parts.append(cube("podium", (14, 14, 1.0)))
    parts.append(cube("podium2", (10.5, 10.5, 1.1), (0, 0, 1.0)))
    parts.append(cube("podium3", (7.6, 7.6, 0.9), (0, 0, 2.1)))

    # the shaft steps inward as it rises, which is what stops it reading as a
    # single extruded column
    h = 3.0
    w = 3.4
    for i in range(6):
        seg = 2.6 - i * 0.12
        parts.append(cube(f"shaft{i}", (w, w, seg), (0, 0, h)))
        h += seg
        w *= 0.9

    # service galleries: horizontal breaks read as floors and give the eye scale
    for gy in (6.2, 11.4):
        parts.append(cube(f"gallery{gy}", (5.2, 5.2, 0.42), (0, 0, gy)))

    parts.append(cube("crown", (5.6, 5.6, 0.9), (0, 0, h)))
    parts.append(cube("mast", (0.5, 0.5, 3.2), (0, 0, h + 0.9)))

    # guy struts
    for sx, sy in ((-1, -1), (1, -1), (-1, 1), (1, 1)):
        parts.append(cube("strut", (0.42, 0.42, 4.6), (sx * 4.4, sy * 4.4, 1.0)))

    o = join(parts, "tower")
    bevel(o, 0.035, 2)
    finish(o, mat)
    export("tower")


def build_monolith():
    """One career monolith. Instanced four times at different scales, so it
    carries a little asymmetry to stop the row looking stamped."""
    reset()
    mat = card_material()
    parts = [
        cube("base", (4.6, 4.6, 0.5)),
        cube("body", (4.0, 4.0, 8.0), (0, 0, 0.5)),
        cube("shoulder", (4.4, 4.4, 0.5), (0, 0, 8.5)),
    ]
    bands(parts, 4.0, 4.0, 0.5, 8.5, step=1.6, out=0.16, thick=0.14)
    reveal(parts, 4.0, 4.0, 0.5, 8.0, count=1, depth=0.14, width=0.62)
    o = join(parts, "monolith")
    bevel(o, 0.03, 2)
    finish(o, mat)
    export("monolith")


def build_plinth():
    """Gallery plinth: a chamfered base with a recessed reveal under the top,
    the way a real display plinth is built so the top appears to float."""
    reset()
    mat = card_material()
    parts = [
        cube("foot", (7.2, 7.2, 0.18)),
        cube("reveal", (6.6, 6.6, 0.22), (0, 0, 0.18)),
        cube("body", (7.0, 7.0, 0.62), (0, 0, 0.40)),
        cube("cap", (7.4, 7.4, 0.14), (0, 0, 1.02)),
    ]
    o = join(parts, "plinth")
    bevel(o, 0.025, 3)
    finish(o, mat)
    export("plinth")


def build_projectarch():
    """The Gallery's showpiece: twin shafts of unequal height split by an open
    atrium, joined near the top by a sky bridge.

    ProjectArch extrudes 2D floor plans into 3D buildings, so its exhibit is
    the one object in the world that has to look like the output of the thing
    it represents. Two attempts are worth recording, because the first one
    failed for a reason that is easy to repeat:

    The first version was a four-level terrace stepping back on all sides with
    a hole down the middle. It did not work, twice over. A void inside a closed
    box is invisible from the ground - the rear wall sits directly behind it
    and you read one solid facade - so the entire concept was inert. And
    stepping back on all four sides is a ziggurat, which `block_step` in the
    kit already is, so the showpiece looked like scenery.

    The fix is that the atrium has to be a slot you can see SKY through, not a
    courtyard. Splitting the mass into two shafts does that: the gap is
    unambiguous from any angle, the unequal heights make the silhouette
    asymmetric, and the bridge landing on the lower shaft's roof gives the gap
    a top edge so it reads as a considered opening rather than a missing part.

    The floor plates are wider than the shafts they belong to, so each one
    cantilevers a little way into the atrium from both sides. That is what
    keeps the slot from being an empty rectangle: looking through it, you see
    layered plate edges receding, and their shadows do the work that a texture
    would otherwise have to.
    """
    reset()
    mat = card_material()
    parts = []

    parts.append(cube("base", (7.4, 6.2, 0.30)))
    parts.append(cube("podium", (6.8, 5.6, 1.10), (0, 0, 0.30)))
    parts.append(cube("pslab", (7.2, 6.0, 0.18), (0, 0, 1.40)))

    Z0 = 1.58  # shafts spring from the podium slab
    # (x, height, floor-plate heights). The 2.2-wide gap between them is the
    # atrium; unequal heights are the point, not an accident.
    #
    # The two plate sets are deliberately OUT of step with each other. Matching
    # them looked like one shelving unit sawn down the middle: the eye joined
    # each pair across the gap into a single line and the two shafts stopped
    # being two buildings.
    shafts = [
        (-2.2, 6.60, (2.9, 4.2, 5.5, 6.9)),
        (2.2, 4.20, (3.5, 4.8)),
    ]
    for i, (x, h, plates) in enumerate(shafts):
        parts.append(cube(f"shaft{i}", (2.2, 4.8, h), (x, 0, Z0)))
        parts.append(cube(f"cap{i}", (2.6, 5.2, 0.18), (x, 0, Z0 + h)))
        for j, pz in enumerate(plates):
            parts.append(cube(f"plate{i}{j}", (3.0, 5.4, 0.14), (x, 0, pz)))

    # The sky bridge, landing on the short shaft's roof and running into the
    # tall one. Full depth and shallow: the first pass was thick and set back
    # at partial depth, which read as a lump wedged in the gap rather than as
    # something spanning it, and it left the top of the atrium looking broken
    # instead of deliberately capped.
    parts.append(cube("bridge", (6.8, 4.8, 0.55), (0, 0, 5.96)))

    o = join(parts, "projectarch")
    bevel(o, 0.025, 2)
    finish(o, mat)
    export("projectarch")


def build_blocks():
    """A kit of six city masses for the skyline and for ProjectArch's exhibit.

    Deliberately varied: podium-and-tower, stepped ziggurat, slab, L-plan,
    twin-shaft and a low warehouse. Six shapes is enough that a scattered field
    of them never reads as one shape repeated.
    """
    mat = card_material()
    recipes = {
        "block_tower": [
            ((10, 10, 1.4), (0, 0, 0)),
            ((7.2, 7.2, 9.0), (0, 0, 1.4)),
            ((5.8, 5.8, 6.0), (0, 0, 10.4)),
            ((6.2, 6.2, 0.5), (0, 0, 16.4)),
        ],
        "block_step": [
            ((12, 12, 3.2), (0, 0, 0)),
            ((9.2, 9.2, 3.0), (0, 0, 3.2)),
            ((6.4, 6.4, 2.8), (0, 0, 6.2)),
            ((3.6, 3.6, 2.4), (0, 0, 9.0)),
        ],
        "block_slab": [
            ((16, 6, 1.0), (0, 0, 0)),
            ((14.4, 5.0, 8.4), (0, 0, 1.0)),
            ((15.0, 5.6, 0.45), (0, 0, 9.4)),
        ],
        "block_ell": [
            ((13, 5.2, 6.4), (0, 0, 0)),
            ((5.2, 11, 6.4), (-3.9, 2.9, 0)),
            ((13.4, 5.6, 0.4), (0, 0, 6.4)),
        ],
        "block_twin": [
            ((11, 7, 1.2), (0, 0, 0)),
            ((3.6, 5.4, 11.0), (-3.0, 0, 1.2)),
            ((3.6, 5.4, 8.2), (3.0, 0, 1.2)),
            ((11, 7, 0.4), (0, 0, 1.2)),
        ],
        "block_low": [
            ((14, 10, 2.6), (0, 0, 0)),
            ((14.6, 10.6, 0.4), (0, 0, 2.6)),
            ((2.4, 2.4, 1.6), (4.0, -2.6, 3.0)),
        ],
    }

    for name, parts in recipes.items():
        reset()
        mat = card_material()
        objs = [cube(f"p{i}", s, l) for i, (s, l) in enumerate(parts)]
        # band the tallest mass, which is the one the eye reads as the facade
        tall = max(parts, key=lambda pl: pl[0][2])
        (bw, bd, bh), (_, _, bz) = tall
        if bh > 3.0:
            objs = bands(objs, bw, bd, bz, bz + bh, step=1.7, out=0.16, thick=0.14)
            objs = reveal(objs, bw, bd, bz, bh, count=2, depth=0.15, width=0.55)
        o = join(objs, name)
        bevel(o, 0.028, 2)
        finish(o, mat)
        export(name)


if __name__ == "__main__":
    print("building world kit ->", OUT)
    build_tower()
    build_monolith()
    build_plinth()
    build_projectarch()
    build_blocks()
    print("done")
