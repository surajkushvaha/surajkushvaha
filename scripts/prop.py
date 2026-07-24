"""
Turn a generated prop (Meshy, or anything else) into a maquette-ready GLB.

Run headless:

    blender --background --factory-startup --python scripts/prop.py -- \
        --in art/raw/workbench/model.fbx --out assets/props/workbench.glb --height 2.2

Why this exists rather than loading the raw file directly:

* Meshy ships FBX with a full PBR texture set. Ours is a white-card model lit
  by one sun, so photoreal albedo and normal maps actively fight the look, and
  they are the entire download weight. Geometry is the only part we want.
* Generated meshes arrive at arbitrary scale and sitting anywhere relative to
  the origin. Normalising here means the scene code can place a prop by its
  footprint without a magic number per asset.
* A triangle budget is enforced rather than trusted.
"""

import argparse
import math
import os
import sys

import bpy


def argv_after_ddash():
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


ap = argparse.ArgumentParser()
ap.add_argument("--in", dest="src", required=True)
ap.add_argument("--out", dest="dst", required=True)
ap.add_argument("--height", type=float, default=2.2, help="target height in world units")
ap.add_argument("--tris", type=int, default=4000, help="triangle budget")
ap.add_argument("--colour", default="#EAE6DF", help="card colour, hex")
args = ap.parse_args(argv_after_ddash())


def hex_to_linear(h):
    """sRGB hex -> linear RGB. Blender's colour inputs are linear, so pasting
    an sRGB hex straight in renders noticeably too light."""
    h = h.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i : i + 2], 16) / 255.0
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, 1.0)


# ---- clean slate -----------------------------------------------------------
bpy.ops.wm.read_factory_settings(use_empty=True)

ext = os.path.splitext(args.src)[1].lower()
if ext == ".fbx":
    bpy.ops.import_scene.fbx(filepath=args.src)
elif ext in (".glb", ".gltf"):
    bpy.ops.import_scene.gltf(filepath=args.src)
elif ext == ".obj":
    bpy.ops.wm.obj_import(filepath=args.src)
else:
    raise SystemExit(f"unsupported input: {ext}")

meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
if not meshes:
    raise SystemExit("no mesh in input")

# ---- join into one object so the prop is a single draw call ----------------
bpy.ops.object.select_all(action="DESELECT")
for o in meshes:
    o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1:
    bpy.ops.object.join()
obj = bpy.context.view_layer.objects.active
obj.name = os.path.splitext(os.path.basename(args.dst))[0]

# bake any import rotation/scale into the mesh before measuring it
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

# ---- triangulate, then decimate to budget ---------------------------------
tri = obj.modifiers.new("tri", "TRIANGULATE")
tri.keep_custom_normals = False
bpy.ops.object.modifier_apply(modifier=tri.name)

n_tris = len(obj.data.polygons)
if n_tris > args.tris:
    dec = obj.modifiers.new("dec", "DECIMATE")
    dec.ratio = args.tris / n_tris
    bpy.ops.object.modifier_apply(modifier=dec.name)
    print(f"decimated {n_tris} -> {len(obj.data.polygons)} tris")

# ---- normalise: sit on the origin, scale to target height ------------------
bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
obj.location = (0, 0, 0)
bpy.context.view_layer.update()

dims = obj.dimensions
tallest = max(dims.x, dims.y, dims.z)
# Blender is Z-up; the glTF exporter converts to Y-up, so height is Z here
if dims.z < 1e-6:
    raise SystemExit("degenerate mesh")
obj.scale = [args.height / dims.z] * 3
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

# drop it so its base sits exactly on y=0 once exported
lowest = min((obj.matrix_world @ v.co).z for v in obj.data.vertices)
obj.location.z -= lowest
bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)

# ---- strip every generated material, apply one card material ---------------
obj.data.materials.clear()
mat = bpy.data.materials.new("Card")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = hex_to_linear(args.colour)
bsdf.inputs["Roughness"].default_value = 0.9
bsdf.inputs["Metallic"].default_value = 0.0
obj.data.materials.append(mat)

# flat-shaded, to match the rest of the model
for p in obj.data.polygons:
    p.use_smooth = False

# ---- export ----------------------------------------------------------------
os.makedirs(os.path.dirname(args.dst), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=args.dst,
    export_format="GLB",
    export_materials="EXPORT",
    export_image_format="NONE",  # there are no textures left, and we want none
    export_apply=True,
    export_yup=True,
    export_cameras=False,
    export_lights=False,
)

size_kb = os.path.getsize(args.dst) / 1024
print(f"wrote {args.dst}  {len(obj.data.polygons)} tris  {size_kb:.0f} KB")
